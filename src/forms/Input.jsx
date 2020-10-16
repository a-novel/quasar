// Created and maintained by Kushuh.
// https://github.com/Kushuh - kuzanisu@gmail.com

import React from 'react';
import {LocalHistory} from '@anovel/records';
import {getRange, setRange, Sequencer, literals as tachyonLiterals} from '@anovel/tachyon';
import {dynamicRef, addPropsToChildren} from '@anovel/reactor';
import css from './Input.module.css';

function createExposer() {
	return { methods: null };
}

/* c8 ignore next 4 */
const literals = {
	WARN_VALUEPROPUPDATE: 'trying to update input records through props : this is forbidden and changes will not be reflected in the component',
	ERROR_NONVALIDCONTENT: content => `value ${content} of type ${content != null ? content.constructor.name : 'undefined'} is not a valid string`,
	ERROR_NONVALIDEXPOSER: exposer => `exposer ${exposer} of type ${exposer != null ? exposer.constructor.name : 'undefined'} is not a valid expose object`
};

/**
 * Represent a caret range within a rendered string. Caret goes from content[start] to content[end].
 *
 * @typedef {{start: number, end: number}} Caret
 */

/**
 * History record with timestamp.
 *
 * @typedef {{
 *   from?: string,
 *	 to?: string,
 *	 caret: Caret,
 *	 active?: boolean,
 *	 timestamp?: number
 * }} InputHistoryRecord
 */

/**
 * Input exposed methods.
 *
 * @typedef {{
 *	value: function(boolean): string,
 *  write: function(string, boolean=): Promise<void>,
 *  focus: function(): void,
 *  undo: function(): Promise<void>,
 *  redo: function(): Promise<void>,
 *  records: function(): InputHistoryRecord[],
 *  getSelectionRange: function(): {absolute: Caret, start: {container: Node, offset: number}, end: {container: Node, offset: number}},
 *  setSelectionRange: function(number, number): void
 * }} InputMethods
 */

/**
 * @typedef {Object} InputBlockProps
 * @property {sequence[]|null} [sequences] - a list of custom sequences of keys to listen to
 * @property {function(methods: InputMethods)|null} [exposer] - return pointers to input instance methods
 * @property {InputHistoryRecord[]|null} [records] - initial records of the input
 * @property {boolean|null} [area] - if set, input will display line breaks
 * @property {function(content: string, value: string): string|null} [filter] - custom filter to trigger when new content is added
 * @property {{current: Node}|function(element: Node): Node|null} [innerRef] - ref to the rendered HTML instance
 * @property {function(Error): void} [onWriteError] - trigger when a writing error occurred
 * @property {{include: string[], exclude: string[]}} [characterSet] - restrict allowed characters inside the input
 * @property {React.ReactElement} [placeholder] - display when the input content is empty
 * @property {string[]} [ignore] - ignore some selectors in range count
 * @property {boolean} [disableAutoScroll]
 */

/**
 * Input is a custom input implementation based on contentEditable elements. It provides roughly the same
 * functionalities as a standard input component, while rendering the content as HTML, making it fully customizable.
 *
 * @extends {React.Component<Props & InputBlockProps, InputState>}
 *
 * @version 1.0.0
 * @author [Kushuh](https://github.com/Kushuh)
 */
class Input extends React.Component {
	constructor(props) {
		super(props);
		dynamicRef.bind(this)(props.innerRef, 'inputRef');
	}

	/**---------------------**/
	/**      variables      **/
	/**---------------------**/

	/**
	 * @typedef {{value: string}} InputState
	 */
	state = {value: this.props.value || ''};

	/**
	 * Record changes within the input.
	 *
	 * @type {LocalHistory}
	 */
	recorder = new LocalHistory(this.props.value, this.props.records);

	/**
	 * Allow our component to listen to key combos (see componentDidMount() method).
	 *
	 * @private
	 */
	sequencer = new Sequencer(50);

	/**
	 * Dynamic ref allows to pass complex ref objects from parent components.
	 *
	 * @type {{current: Node}}
	 * @private
	 */
	inputRef;

	/**
	 * Caret is not directly updated when input is updated, since lags and concurrent modification may lead to visual
	 * inconsistencies. Instead, the new theoretical caret position is saved in a class variable, and only updated after
	 * render.
	 *
	 * @type {Caret|null}
	 * @private
	 */
	holder;

	/**---------------------**/
	/**   react lifecycle   **/
	/**---------------------**/

	/**
	 * Bind controls and exposers.
	 */
	componentDidMount() {
		// Set caret at the end of content.
		setRange(this.inputRef.current, this.state.value.length, this.state.value.length, this.props.ignore);

		// Launch sequencer.
		this.sequencer.listen(this.inputRef.current);

		// Register controls. We only need two of them : CTRL + Z and CTRL + Shift + Z, for undo and redo - all other
		// special controls will work normally with default implementation.
		this.sequencer.register(tachyonLiterals.COMBOS.UNDO, this.undo);
		this.sequencer.register(tachyonLiterals.COMBOS.REDO, this.redo);

		// Add custom sequences.
		this.sequencer.dynamicKeys(() => this.props.sequences);

		// Add possibility for parent component to access some child methods, and interact with it.
		if (this.props.exposer != null) {
			const exposedMethods = {
				value: (...args) => this.getValue(...args),
				write: (...args) => this.write(...args),
				/* c8 ignore next 1 */
				isFocused: () => document.activeElement === this.inputRef.current,
				focus: () => this.focus(),
				undo: () => this.undo(),
				redo: () => this.redo(),
				records: () => this.recorder.getRecords(),
				getSelectionRange: () => this.getSelectionRange(),
				setSelectionRange: (...args) => this.setSelectionRange(...args)
			};

			switch (this.props.exposer.constructor.name) {
				case 'Function':
					this.props.exposer(exposedMethods);
					break;
				case 'Object':
					this.props.exposer.methods = exposedMethods;
					break;
				default:
					throw new Error(literals.ERROR_NONVALIDEXPOSER(this.props.exposer));
			}
		}
	}

	/**
	 * @param {InputBlockProps} prevProps
	 * @param {InputState} prevState
	 * @param snapshot
	 */
	componentDidUpdate(prevProps, prevState, snapshot) {
		// Below guard don't lead to crashes. It is added to warn the developer about some potential mistakes.
		if (this.props.value !== prevProps.value) {
			console.warn(literals.WARN_VALUEPROPUPDATE);
		}

		// Caret is updated after component update, since rendering with parser (which occurs after state update) might
		// cause caret jump.
		this.replaceCaret();

		/* c8 ignore next 3 */
		if (!this.props.disableAutoScroll) {
			this.scrollIntoView();
		}
	}

	/**---------------------**/
	/**       edition       **/
	/**---------------------**/

	/**
	 * Write content into value.
	 *
	 * @param {string} content
	 * @param {boolean=} remove
	 * @param {Caret=} caret
	 * @return {Promise<void>}
	 */
	write = (content, remove, caret) => {
		if (content != null &&  content.constructor.name === 'Number') {
			content = `${content}`;
		} else if (content == null || content.constructor.name !== 'String') {
			return Promise.reject(literals.ERROR_NONVALIDCONTENT(content));
		}

		const isActive = document.activeElement === this.inputRef.current;

		// Get caret position. We don't use class method since it is useless from inside - it does the same operation for
		// external user who may not have any access to this.inputRef.
		const {start, end} = caret || (
			/* c8 ignore next 2 */
			isActive ?
				this.holder || getRange(this.inputRef.current, this.props.ignore).absolute :
				{start: this.state.value.length, end: this.state.value.length}
			);

		if (remove && start <= 0 && start === end) {
			return Promise.resolve();
		}

		const {onChange} = this.props;

		const updateCaret = (remove && start > 0 && start === end) ? {start: start - 1, end: start} : {start, end}

		// Filter content.
		content = this.filter(content);

		const finalLength = content.length + this.state.value.length - end + start;

		if (
			this.props.maxLength &&
			this.props.maxLength >= 0 &&
			finalLength > this.props.maxLength
		) {
			content = content.slice(0, content.length + this.props.maxLength - finalLength)
		}

		/**
		 * Add record to history.
		 *
		 * @type {InputHistoryRecord}
		 */
		const newRecord = this.recorder.push({
			to: remove ? '' : content,
			// Remove is equivalent to replace previous character with empty string.
			caret: updateCaret,
			timestamp: (new Date()).getTime()
		});

		if (!caret) {
			const diff = newRecord.to.length - newRecord.from.length;
			const newPos = end + diff;

			this.holder = {start: newPos, end: newPos};
		}

		// Resolve async.
		return new Promise(
			resolve => this.setState({value: this.recorder.getValue()}, () => {
				if (onChange != null) {
					onChange(newRecord, this.recorder.getValue());
				}

				resolve();
			})
		);
	}

	/**
	 * @param {InputHistoryRecord} a
	 * @param {InputHistoryRecord} b
	 * @return {boolean}
	 */
	recordChain = (a, b) =>
		Math.abs(a.timestamp - b.timestamp) < 600 &&
		LocalHistory.splitOnBlankSpace(a, b) &&
		LocalHistory.keepContinuity(a, b);

	/**
	 * Undo last action.
	 *
	 * @return {Promise<void>}
	 */
	undo = () => {
		const altered = this.recorder.revertChain(this.recordChain);

		const currentCaret = this.holder || getRange(this.inputRef.current, this.props.ignore).absolute;
		const newCaretPos = altered.reduce((acc, {from, to, caret}) => {
			const diff = from.length - to.length;
			const rCaret = {start: caret.start, end: caret.start + to.length};

			if (rCaret.start < acc) {
				if (rCaret.end < acc) {
					acc += diff;
				} else {
					acc = rCaret.start;
				}
			}

			return acc;
		}, currentCaret.start);

		this.holder = {start: newCaretPos, end: newCaretPos};

		return new Promise(
			resolve =>  this.setState({value: this.recorder.getValue()}, resolve)
		);
	};

	/**
	 * Redo last action.
	 *
	 * @return {Promise<void>}
	 */
	redo = () => {
		const altered = this.recorder.applyChain(this.recordChain);

		const currentCaret = this.holder || getRange(this.inputRef.current, this.props.ignore).absolute;
		const newCaretPos = altered.reduce((acc, {from, to, caret}) => {
			if (caret.start <= acc) {
				if (caret.end < acc) {
					acc += to.length - from.length;
				} else {
					acc = caret.start + to.length;
				}
			}

			return acc;
		}, currentCaret.start);

		this.holder = {start: newCaretPos, end: newCaretPos};

		return new Promise(
			resolve =>  this.setState({value: this.recorder.getValue()}, resolve)
		);
	};

	/**---------------------**/
	/**        caret        **/
	/**---------------------**/

	/**
	 * Update caret position with records in holder, in case of a caret jump.
	 * @private
	 */
	replaceCaret = () => {
		const holder = this.holder;

		// No information about where to put the caret.
		if (holder == null) {
			return;
		}

		// Unset caret holder.
		this.holder = null;

		// Position caret at wanted range.
		setRange(this.inputRef.current, holder.start, holder.start, this.props.ignore);
	};

	/**-----------------------**/
	/** accessors and setters **/
	/**-----------------------**/

	/**
	 * @param {boolean=} includeGhostCharacters
	 * @return {string}
	 * @public
	 */
	getValue = includeGhostCharacters => {
		return includeGhostCharacters ? this.inputRef.current.innerText : this.state.value;
	};

	/**
	 * Get current caret position.
	 *
	 * @return {{absolute: Caret, start: {container: Node, offset: number}, end: {container: Node, offset: number}}}
	 * @public
	 */
	getSelectionRange = () => {
		return getRange(this.inputRef.current, this.props.ignore);
	};

	/**
	 * Set caret position programmatically.
	 *
	 * @param {number} start
	 * @param {number} end
	 * @public
	 */
	setSelectionRange = (start, end) => {
		this.holder = null;
		setRange(this.inputRef.current, start, end, this.props.ignore);
	};

	/**---------------------**/
	/**        utils        **/
	/**---------------------**/

	/**
	 * Filter user content.
	 * @param {string} content
	 * @return {string}
	 * @private
	 */
	filter = content => {
		let {characterSet, filter, area} = this.props;

		// Only area allows line breaks.
		if (!area) {
			characterSet = characterSet || {};
			characterSet.exclude = `${characterSet.exclude || ''}\n`;
		}

		if (characterSet) {
			let {include, exclude} = characterSet;

			content = content
				.split('')
				.filter(x => (include ? include.includes(x) : true) && (exclude ? !exclude.includes(x) : true))
				.join('')
		}

		// If a custom filter is set, it is called after characterSet filtering.
		if (filter != null) {
			content = filter(content);
		}

		return content;
	}

	/**
	 * Scroll to the caret position, in case of input overflow.
	 */
	/* c8 ignore next 15 */
	scrollIntoView = () => {
		const sel = window.getSelection();
		const {current} = this.inputRef;
		if (sel.anchorNode) {
			const {top, right, bottom, left} = sel.getRangeAt(0).getBoundingClientRect();
			const {top: parentTop, right: parentRight, bottom: parentBottom, left: parentLeft} = current.getBoundingClientRect();

			const topOffset = top < parentTop ? top - parentTop : 0;
			const bottomOffset = bottom > parentBottom ? bottom - parentBottom : 0;
			const leftOffset = left < parentLeft ? left - parentLeft : 0;
			const rightOffset = right > parentRight ? right - parentRight : 0;

			current.scrollBy(leftOffset || rightOffset, topOffset || bottomOffset);
		}
	}

	/**
	 * @param {Error} error
	 */
	/* c8 ignore next 7 */
	handleError = async error => {
		if (this.props.onWriteError != null) {
			await this.props.onWriteError(error);
			return;
		}
		console.error(error);
	};

	/**---------------------**/
	/**   input handlers    **/
	/**---------------------**/

	beforeInput = e => {
		e.preventDefault();

		/* c8 ignore next 4 */
		if (this.props.onBeforeInput != null) {
			this.props.onBeforeInput(e);
		}

		this.write(e.data, false, e.caret).catch(this.handleError);
	}

	paste = e => {
		e.preventDefault();

		/* c8 ignore next 5 */
		if (this.props.onPaste != null) {
			this.props.onPaste(e);
		}

		const data = e.clipboardData.getData('text') || '';
		this.write(data, false, e.caret).catch(this.handleError);
	}

	cut = e => {
		e.preventDefault();

		/* c8 ignore next 4 */
		if (this.props.onCut != null) {
			this.props.onCut(e);
		}

		const selection = document.getSelection();
		e.clipboardData.setData('text/plain', selection.toString());
		this.write('', false, e.caret).catch(this.handleError);
	}

	keys = e => {
		const {key} = e;

		/* c8 ignore next 4 */
		if (this.props.onKeyDown != null) {
			this.props.onKeyDown(e);
		}

		if (key === 'Backspace') {
			e.preventDefault();
			this.write('', true, e.caret).catch(this.handleError);
		}
	}

	focus = () => {
		this.inputRef.current.focus();
	}

	/**---------------------**/
	/**       render        **/
	/**---------------------**/

	render() {
		const {
			innerRef,
			onChange,
			render,
			placeholder,
			maxLength,
			characterSet,
			className,
			area,
			exposer,
			disableAutoScroll,
			onWriteError,
			onBeforeInputCapture,
			onFocusCapture,
			onCopy,
			onCut,
			onPaste,
			onBeforeInput,
			onBlur,
			filter,
			onFocus,
			onSelect,
			onKeyDown,
			...props
		} = this.props;

		const {value} = this.state;

		return (
			<div className={`${css.wrapper} ${area ? '' : css.inlineWrapper} ${className || ''}`} {...props}>
				{
					addPropsToChildren(
						placeholder,
						({className: placeholderClassname, style, ...placeholderProps}) => ({
							className: `${css.placeholder} ${placeholderClassname}`,
							style: Object.assign({opacity: (value == null || value.length === 0) ? 1 : 0}, style || {}),
							...placeholderProps
						})
					)
				}
				<pre
					tabIndex={1}
					ref={this.inputRef}
					onFocus={onFocus}
					onBeforeInputCapture={onBeforeInputCapture}
					onBlur={onBlur}
					onCopy={onCopy}
					onFocusCapture={onFocusCapture}
					onSelect={onSelect}
					className={css.content}
					onBeforeInput={this.beforeInput}
					onKeyDown={this.keys}
					onPaste={this.paste}
					onCut={this.cut}
					suppressContentEditableWarning
					contentEditable
				>
					{render ? render(value) : value}
				</pre>
			</div>
		);
	}
}
/* c8 ignore next 2 */
export default React.forwardRef((props, ref) => <Input {...props} innerRef={ref}/>);
export {literals, Input, createExposer};