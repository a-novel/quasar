import React from 'react';
import 'jest-enzyme';
import {mount, configure} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import {describe, it, expect, jest, afterAll, beforeEach} from '@jest/globals';
import * as tachyon from '@anovel/tachyon';
import {literals, Input} from '../../src/forms/Input';

configure({ adapter: new Adapter() });

const mockWindowSelection = {start: 0, end: 0};

const pressKey = (el, key) => {
	const keyboardEvent = document.createEvent("KeyboardEvent");
	const initMethod = typeof keyboardEvent.initKeyboardEvent !== 'undefined' ? "initKeyboardEvent" : "initKeyEvent";

	keyboardEvent[initMethod](
		"keydown", // event type: keydown, keyup, keypress
		true,      // bubbles
		true,      // cancelable
		window,    // view: should be window
		false,     // ctrlKey
		false,     // altKey
		false,     // shiftKey
		false,     // metaKey
		key.charCodeAt(0),        // keyCode: unsigned long - the virtual key code, else 0
		0          // charCode: unsigned long - the Unicode character associated with the depressed key, else 0
	);
	document.dispatchEvent(keyboardEvent);
};

// Mock since windows selection functions aren't supported by any jsdom environment.
// The original function have been tested in puppeteer without jest coverage.
tachyon.getRange = () => ({absolute: mockWindowSelection});
tachyon.setRange = (el, start, end) => {
	mockWindowSelection.start = start;
	mockWindowSelection.end = end;
};

describe('testing Input component', () => {
	afterAll(() => jest.clearAllMocks());

	beforeEach(() => {
		tachyon.setRange(null, 0, 0);
	});

	it('should mount with default values', () => {
		let expose = {};
		mount(<Input disableAutoScroll accessor={fn => expose = fn}/>);

		expect(expose.value()).toEqual('');
		expect(expose.getSelectionRange().absolute).toEqual({start: 0, end: 0});

		mount(<Input value='hello world' disableAutoScroll accessor={fn => expose = fn}/>);

		expect(expose.value()).toEqual('hello world');
		expect(expose.getSelectionRange().absolute).toEqual({start: 11, end: 11});
	});

	it('should write normally', async done => {
		let expose = {};
		mount(<Input disableAutoScroll accessor={fn => expose = fn}/>);

		await expose.write('h');

		expect(expose.value()).toEqual('h');
		expect(expose.getSelectionRange().absolute).toEqual({start: 1, end: 1});

		await expose.write('e');
		await expose.write('l');
		await expose.write('l');
		await expose.write('o');
		await expose.write(' ');
		await expose.write('w');
		await expose.write('o');
		await expose.write('r');
		await expose.write('l');
		await expose.write('d');

		expect(expose.value()).toEqual('hello world');
		expect(expose.getSelectionRange().absolute).toEqual({start: 11, end: 11});

		expose.setSelectionRange(5, 5);
		expect(expose.getSelectionRange().absolute).toEqual({start: 5, end: 5});

		await expose.write(' ');
		await expose.write('c');
		await expose.write('o');
		await expose.write('o');
		await expose.write('l');

		expect(expose.value()).toEqual('hello cool world');
		expect(expose.getSelectionRange().absolute).toEqual({start: 10, end: 10});

		expose.setSelectionRange(6, 10);
		expect(expose.getSelectionRange().absolute).toEqual({start: 6, end: 10});

		await expose.write('n');
		await expose.write('e');
		await expose.write('w');

		expect(expose.value()).toEqual('hello new world');
		expect(expose.getSelectionRange().absolute).toEqual({start: 9, end: 9});

		await expose.write('should not write', true);
		await expose.write('should not write', true);
		await expose.write('should not write', true);
		await expose.write('should not write', true);

		expect(expose.value()).toEqual('hello world');
		expect(expose.getSelectionRange().absolute).toEqual({start: 5, end: 5});

		await expose.write(' ');
		await expose.write(42);

		expect(expose.value()).toEqual('hello 42 world');
		expect(expose.getSelectionRange().absolute).toEqual({start: 8, end: 8});

		done();
	});

	it('should perform expected undo/redo', async done => {
		let expose = {};
		mount(<Input disableAutoScroll accessor={fn => expose = fn}/>);

		// Should not throw error.
		await expose.undo();
		expect(expose.value()).toEqual('');
		expect(expose.getSelectionRange().absolute).toEqual({start: 0, end: 0});

		await expose.redo();
		expect(expose.value()).toEqual('');
		expect(expose.getSelectionRange().absolute).toEqual({start: 0, end: 0});

		await expose.write('h');
		await expose.write('e');
		await expose.write('l');
		await expose.write('l');
		await expose.write('o');
		await expose.write(' ');
		await expose.write('w');
		await expose.write('o');
		await expose.write('r');
		await expose.write('l');
		await expose.write('d');
		await expose.setSelectionRange(6, 6);
		await expose.write('c');
		await expose.write('o');
		await expose.write('o');
		await expose.write('l');
		await expose.write(' ');
		await expose.setSelectionRange(6, 10);
		// Simulate paste.
		await expose.write('brand new');

		expect(expose.value()).toEqual('hello brand new world');
		expect(expose.getSelectionRange().absolute).toEqual({start: 15, end: 15});

		await expose.undo();

		expect(expose.value()).toEqual('hello cool world');
		expect(expose.getSelectionRange().absolute).toEqual({start: 6, end: 6});

		await expose.undo();

		expect(expose.value()).toEqual('hello coolworld');
		expect(expose.getSelectionRange().absolute).toEqual({start: 6, end: 6});

		await expose.undo();

		expect(expose.value()).toEqual('hello world');
		expect(expose.getSelectionRange().absolute).toEqual({start: 6, end: 6});

		await expose.undo();
		await expose.undo();

		expect(expose.value()).toEqual('hello');
		expect(expose.getSelectionRange().absolute).toEqual({start: 5, end: 5});

		await expose.redo();
		await expose.redo();

		expect(expose.value()).toEqual('hello world');
		expect(expose.getSelectionRange().absolute).toEqual({start: 11, end: 11});

		await expose.redo();
		await expose.redo();

		expect(expose.value()).toEqual('hello cool world');
		expect(expose.getSelectionRange().absolute).toEqual({start: 16, end: 16});

		await expose.undo();
		await expose.undo();

		expect(expose.value()).toEqual('hello world');
		expect(expose.getSelectionRange().absolute).toEqual({start: 11, end: 11});

		done();
	});

	it('should warn when mutating value in prop', () => {
		const spyWarn = jest.spyOn(console, 'warn').mockImplementation();

		const component = mount(<Input value='hello world' disableAutoScroll/>);

		component.setProps({value: 'hello brand new world'});
		component.update();

		expect(spyWarn).toHaveBeenCalledWith(literals.WARN_VALUEPROPUPDATE);

		spyWarn.mockRestore();
	});

	it('should call handler', async done => {
		const updateHandler = jest.fn();
		const filterHandler = jest.fn(content => content);
		const errorHandler = jest.fn();

		let expose = {};
		mount(<Input
			disableAutoScroll
			onWriteError={errorHandler}
			onUpdate={updateHandler}
			filter={filterHandler}
			accessor={fn => expose = fn}
		/>);

		expect(updateHandler).not.toHaveBeenCalled();
		expect(filterHandler).not.toHaveBeenCalled();
		expect(errorHandler).not.toHaveBeenCalled();

		await expose.undo();
		await expose.redo();

		expect(updateHandler).not.toHaveBeenCalled();
		expect(filterHandler).not.toHaveBeenCalled();
		expect(errorHandler).not.toHaveBeenCalled();

		await expose.write('hello world');

		expect(updateHandler).toHaveBeenCalledWith(expose.records().slice(-1)[0], 'hello world');
		expect(filterHandler).toHaveBeenCalledWith('hello world');
		expect(errorHandler).not.toHaveBeenCalled();

		await expect(expose.write([])).rejects.toBe(literals.ERROR_NONVALIDCONTENT([]));
		expect(expose.value()).toEqual('hello world');

		done();
	});

	it('should filter correctly', async done => {
		let expose = {};

		// Only allow one character at a time.
		const filter = jest.fn(/** @type {string} */content => content.slice(0, 1));

		mount(<Input filter={filter} accessor={fn => expose = fn} disableAutoScroll/>);

		expect(filter).not.toHaveBeenCalled();

		await expose.write('hello world');

		expect(filter).toHaveBeenCalledWith('hello world');
		expect(expose.value()).toEqual('h');
		expect(expose.getSelectionRange().absolute).toEqual({start: 1, end: 1});

		mount(<Input accessor={fn => expose = fn} disableAutoScroll/>);

		await expose.write('hello\n\n wor\nld\n');

		expect(expose.value()).toEqual('hello world');
		expect(expose.getSelectionRange().absolute).toEqual({start: 11, end: 11});

		mount(<Input area accessor={fn => expose = fn} disableAutoScroll/>);

		await expose.write('hello\n\n wor\nld\n');

		expect(expose.value()).toEqual('hello\n\n wor\nld\n');
		expect(expose.getSelectionRange().absolute).toEqual({start: 15, end: 15});

		// Only allow numbers.
		mount(<Input area characterSet={{include: '0123456789'}} accessor={fn => expose = fn} disableAutoScroll/>);

		await expose.write('01/01/');
		await expose.write(1970);

		expect(expose.value()).toEqual('01011970');
		expect(expose.getSelectionRange().absolute).toEqual({start: 8, end: 8});

		// Disable numbers.
		mount(<Input area characterSet={{exclude: '0123456789'}} accessor={fn => expose = fn} disableAutoScroll/>);

		await expose.write('01/01/');
		await expose.write(1970);

		expect(expose.value()).toEqual('//');
		expect(expose.getSelectionRange().absolute).toEqual({start: 2, end: 2});

		// Disable numbers.
		mount(<Input area characterSet={{include: '0123456789', exclude: '0'}} accessor={fn => expose = fn} disableAutoScroll/>);

		await expose.write('01/01/');
		await expose.write(1970);

		expect(expose.value()).toEqual('11197');
		expect(expose.getSelectionRange().absolute).toEqual({start: 5, end: 5});

		done();
	});

	it('should respond to DOM events', async done => {
		const errorHandler = jest.fn();
		let expose = {};

		const component = mount(<Input
			accessor={fn => expose = fn}
			onWriteError={errorHandler}
			disableAutoScroll
		/>);

		expect(component.instance().inputRef).not.toBeNull();
		expect(component.instance().inputRef.current).not.toBeNull();

		const spyBeforeInput = jest.spyOn(component.instance(), 'beforeInput');
		const spyPaste = jest.spyOn(component.instance(), 'paste');
		const spyCut = jest.spyOn(component.instance(), 'cut');
		const spyKeys = jest.spyOn(component.instance(), 'keys');
		const spyFocus = jest.spyOn(component.instance(), 'focus');

		component.instance().forceUpdate();

		expect(expose.value()).toEqual('');

		expose.focus();
		expect(spyFocus).toHaveBeenCalled();

		component.find('pre').simulate('beforeInput', {data: 'hello world'});

		expect(expose.value()).toEqual('hello world');
		expect(spyBeforeInput).toHaveBeenCalled();
		expect(spyPaste).not.toHaveBeenCalled();
		expect(spyCut).not.toHaveBeenCalled();
		expect(spyKeys).not.toHaveBeenCalled();

		expose.setSelectionRange(6, 11);
		component.find('pre').simulate('cut', {clipboardData: {setData: () => {}}});

		expect(expose.value()).toEqual('hello ');
		expect(spyBeforeInput).toHaveBeenCalled();
		expect(spyPaste).not.toHaveBeenCalled();
		expect(spyCut).toHaveBeenCalled();
		expect(spyKeys).not.toHaveBeenCalled();

		component.find('pre').simulate('paste', {clipboardData: {getData: () => 'world'}});

		expect(expose.value()).toEqual('hello world');
		expect(spyBeforeInput).toHaveBeenCalled();
		expect(spyPaste).toHaveBeenCalled();
		expect(spyCut).toHaveBeenCalled();
		expect(spyKeys).not.toHaveBeenCalled();

		component.find('pre').simulate('keydown', {key: 'Backspace'});

		expect(expose.value()).toEqual('hello worl');
		expect(spyBeforeInput).toHaveBeenCalled();
		expect(spyPaste).toHaveBeenCalled();
		expect(spyCut).toHaveBeenCalled();
		expect(spyKeys).toHaveBeenCalled();

		component.find('pre').simulate('beforeInput', {data: []});

		expect(expose.value()).toEqual('hello worl');

		await Promise.resolve();
		expect(errorHandler).toHaveBeenCalledWith(literals.ERROR_NONVALIDCONTENT([]));

		done();
	});

	it('should render placeholder', async done => {
		let expose = {};
		const component = mount(<Input
			accessor={fn => expose = fn}
			placeholder={<div className='myPlaceholder'>hello world</div>}
			disableAutoScroll
		/>);

		expect(component.find('.myPlaceholder').length).toEqual(1);
		expect(component.find('.myPlaceholder').text()).toEqual('hello world');

		await expose.write('hello');
		component.update();

		expect(component.find('.myPlaceholder').length).toEqual(0);

		done();
	});

	it('should render value with render prop', async done => {
		let expose = {};
		const component = mount(<Input
			accessor={fn => expose = fn}
			render={content => content.split('').join(' ')}
			disableAutoScroll
		/>);

		expect(expose.value()).toEqual('');

		await expose.write('hello');

		expect(expose.value()).toEqual('hello');
		expect(component.text()).toEqual('h e l l o');

		done();
	});
});