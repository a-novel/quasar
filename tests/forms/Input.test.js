import React from 'react';
import 'jest-enzyme';
import {mount, configure} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import {describe, it, expect, jest, afterAll, beforeEach} from '@jest/globals';
import * as tachyon from '@anovel/tachyon';
import {literals, Input, createExposer} from '../../src/forms/Input';

configure({ adapter: new Adapter() });

const mockWindowSelection = {start: 0, end: 0};

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
		mount(<Input disableAutoScroll exposer={fn => expose = fn}/>);

		expect(expose.value()).toEqual('');
		expect(expose.getSelectionRange().absolute).toEqual({start: 0, end: 0});

		mount(<Input value='hello world' disableAutoScroll exposer={fn => expose = fn}/>);

		expect(expose.value()).toEqual('hello world');
		expect(expose.getSelectionRange().absolute).toEqual({start: 11, end: 11});
	});

	it('should mount exposers correctly', () => {
		const spyError = jest.spyOn(console, 'error').mockImplementation();

		const exposer = createExposer();
		mount(<Input disableAutoScroll exposer={exposer}/>);

		expect(Object.keys(exposer.methods).length).toEqual(9);
		expect(exposer.methods.value).toBeDefined();
		expect(exposer.methods.value()).toEqual('');
		expect(() => {
			mount(<Input disableAutoScroll exposer={[]}/>);
		}).toThrow(literals.ERROR_NONVALIDEXPOSER([]));

		spyError.mockRestore();
	});

	it('should write normally', async done => {
		const exposer = createExposer();
		const ref = React.createRef();
		mount(<Input disableAutoScroll innerRef={ref} exposer={exposer}/>);

		await exposer.methods.write('h');

		expect(exposer.methods.value()).toEqual('h');
		expect(exposer.methods.getSelectionRange().absolute).toEqual({start: 1, end: 1});

		await exposer.methods.write('e');
		await exposer.methods.write('l');
		await exposer.methods.write('l');
		await exposer.methods.write('o');
		await exposer.methods.write(' ');
		await exposer.methods.write('w');
		await exposer.methods.write('o');
		await exposer.methods.write('r');
		await exposer.methods.write('l');
		await exposer.methods.write('d');

		expect(exposer.methods.value()).toEqual('hello world');
		expect(exposer.methods.getSelectionRange().absolute).toEqual({start: 11, end: 11});

		exposer.methods.setSelectionRange(5, 5);
		expect(exposer.methods.getSelectionRange().absolute).toEqual({start: 5, end: 5});

		await exposer.methods.write(' ', false, {start: 5, end: 5});
		await exposer.methods.write('c', false, {start: 6, end: 6});
		await exposer.methods.write('o', false, {start: 7, end: 7});
		await exposer.methods.write('o', false, {start: 8, end: 8});
		await exposer.methods.write('l', false, {start: 9, end: 9});

		expect(exposer.methods.value()).toEqual('hello cool world');
		expect(exposer.methods.getSelectionRange().absolute).toEqual({start: 5, end: 5});

		await exposer.methods.write('n', false, {start: 6, end: 10});
		await exposer.methods.write('e', false, {start: 7, end: 7});
		await exposer.methods.write('w', false, {start: 8, end: 8});

		expect(exposer.methods.value()).toEqual('hello new world');

		await exposer.methods.write('should not write', true, {start: 9, end: 9});
		await exposer.methods.write('should not write', true, {start: 8, end: 8});
		await exposer.methods.write('should not write', true, {start: 7, end: 7});
		await exposer.methods.write('should not write', true, {start: 6, end: 6});

		expect(exposer.methods.value()).toEqual('hello world');

		await exposer.methods.write(' ', false, {start: 5, end: 5});
		await exposer.methods.write(42, false, {start: 6, end: 6});

		expect(exposer.methods.value()).toEqual('hello 42 world');

		done();
	});

	it('should perform expected undo/redo', async done => {
		const exposer = createExposer();
		mount(<Input disableAutoScroll exposer={exposer}/>);

		// Should not throw error.
		await exposer.methods.undo();
		expect(exposer.methods.value()).toEqual('');
		expect(exposer.methods.getSelectionRange().absolute).toEqual({start: 0, end: 0});

		await exposer.methods.redo();
		expect(exposer.methods.value()).toEqual('');
		expect(exposer.methods.getSelectionRange().absolute).toEqual({start: 0, end: 0});

		await exposer.methods.write('h');
		await exposer.methods.write('e');
		await exposer.methods.write('l');
		await exposer.methods.write('l');
		await exposer.methods.write('o');
		await exposer.methods.write(' ');
		await exposer.methods.write('w');
		await exposer.methods.write('o');
		await exposer.methods.write('r');
		await exposer.methods.write('l');
		await exposer.methods.write('d');
		await exposer.methods.write('c', false, {start: 6, end: 6});
		await exposer.methods.write('o', false, {start: 7, end: 7});
		await exposer.methods.write('o', false, {start: 8, end: 8});
		await exposer.methods.write('l', false, {start: 9, end: 9});
		await exposer.methods.write(' ', false, {start: 10, end: 10});
		// Simulate paste.
		await exposer.methods.write('brand new', false, {start: 6, end: 10});

		expect(exposer.methods.value()).toEqual('hello brand new world');
		exposer.methods.setSelectionRange(15, 15);

		await exposer.methods.undo();

		expect(exposer.methods.value()).toEqual('hello cool world');
		expect(exposer.methods.getSelectionRange().absolute).toEqual({start: 6, end: 6});

		await exposer.methods.undo();

		expect(exposer.methods.value()).toEqual('hello coolworld');
		expect(exposer.methods.getSelectionRange().absolute).toEqual({start: 6, end: 6});

		await exposer.methods.undo();

		expect(exposer.methods.value()).toEqual('hello world');
		expect(exposer.methods.getSelectionRange().absolute).toEqual({start: 6, end: 6});

		await exposer.methods.undo();
		await exposer.methods.undo();

		expect(exposer.methods.value()).toEqual('hello');
		expect(exposer.methods.getSelectionRange().absolute).toEqual({start: 5, end: 5});

		await exposer.methods.redo();
		await exposer.methods.redo();

		expect(exposer.methods.value()).toEqual('hello world');
		expect(exposer.methods.getSelectionRange().absolute).toEqual({start: 11, end: 11});

		await exposer.methods.redo();
		await exposer.methods.redo();

		expect(exposer.methods.value()).toEqual('hello cool world');
		expect(exposer.methods.getSelectionRange().absolute).toEqual({start: 16, end: 16});

		await exposer.methods.undo();
		await exposer.methods.undo();

		expect(exposer.methods.value()).toEqual('hello world');
		expect(exposer.methods.getSelectionRange().absolute).toEqual({start: 11, end: 11});

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

		const exposer = createExposer();
		mount(<Input
			disableAutoScroll
			onWriteError={errorHandler}
			onChange={updateHandler}
			filter={filterHandler}
			exposer={exposer}
		/>);

		expect(updateHandler).not.toHaveBeenCalled();
		expect(filterHandler).not.toHaveBeenCalled();
		expect(errorHandler).not.toHaveBeenCalled();

		await exposer.methods.undo();
		await exposer.methods.redo();

		expect(updateHandler).not.toHaveBeenCalled();
		expect(filterHandler).not.toHaveBeenCalled();
		expect(errorHandler).not.toHaveBeenCalled();

		await exposer.methods.write('hello world');

		expect(updateHandler).toHaveBeenCalledWith(exposer.methods.records().slice(-1)[0], 'hello world');
		expect(filterHandler).toHaveBeenCalledWith('hello world');
		expect(errorHandler).not.toHaveBeenCalled();

		await expect(exposer.methods.write([])).rejects.toBe(literals.ERROR_NONVALIDCONTENT([]));
		expect(exposer.methods.value()).toEqual('hello world');

		done();
	});

	it('should filter correctly', async done => {
		const exposer = createExposer();

		// Only allow one character at a time.
		const filter = jest.fn(/** @type {string} */content => content.slice(0, 1));

		mount(<Input filter={filter} exposer={exposer} disableAutoScroll/>);

		expect(filter).not.toHaveBeenCalled();

		await exposer.methods.write('hello world');

		expect(filter).toHaveBeenCalledWith('hello world');
		expect(exposer.methods.value()).toEqual('h');
		expect(exposer.methods.getSelectionRange().absolute).toEqual({start: 1, end: 1});

		mount(<Input exposer={exposer} disableAutoScroll/>);

		await exposer.methods.write('hello\n\n wor\nld\n');

		expect(exposer.methods.value()).toEqual('hello world');
		expect(exposer.methods.getSelectionRange().absolute).toEqual({start: 11, end: 11});

		mount(<Input area exposer={exposer} disableAutoScroll/>);

		await exposer.methods.write('hello\n\n wor\nld\n');

		expect(exposer.methods.value()).toEqual('hello\n\n wor\nld\n');
		expect(exposer.methods.getSelectionRange().absolute).toEqual({start: 15, end: 15});

		// Only allow numbers.
		mount(<Input area characterSet={{include: '0123456789'}} exposer={exposer} disableAutoScroll/>);

		await exposer.methods.write('01/01/');
		await exposer.methods.write(1970);

		expect(exposer.methods.value()).toEqual('01011970');
		expect(exposer.methods.getSelectionRange().absolute).toEqual({start: 8, end: 8});

		// Disable numbers.
		mount(<Input area characterSet={{exclude: '0123456789'}} exposer={exposer} disableAutoScroll/>);

		await exposer.methods.write('01/01/');
		await exposer.methods.write(1970);

		expect(exposer.methods.value()).toEqual('//');
		expect(exposer.methods.getSelectionRange().absolute).toEqual({start: 2, end: 2});

		// Disable numbers.
		mount(<Input area characterSet={{include: '0123456789', exclude: '0'}} exposer={exposer} disableAutoScroll/>);

		await exposer.methods.write('01/01/');
		await exposer.methods.write(1970);

		expect(exposer.methods.value()).toEqual('11197');
		expect(exposer.methods.getSelectionRange().absolute).toEqual({start: 5, end: 5});

		done();
	});

	it('should respond to DOM events', async done => {
		const errorHandler = jest.fn();
		const exposer = createExposer();

		const component = mount(<Input
			exposer={exposer}
			onWriteError={errorHandler}
			disableAutoScroll
		/>);

		expect(component.instance().inputRef).not.toBeNull();
		expect(component.instance().inputRef.current).not.toBeNull();
		component.instance().inputRef.current.focus();

		const spyBeforeInput = jest.spyOn(component.instance(), 'beforeInput');
		const spyPaste = jest.spyOn(component.instance(), 'paste');
		const spyCut = jest.spyOn(component.instance(), 'cut');
		const spyKeys = jest.spyOn(component.instance(), 'keys');
		const spyFocus = jest.spyOn(component.instance(), 'focus');

		component.instance().forceUpdate();

		expect(exposer.methods.value()).toEqual('');

		exposer.methods.focus();
		expect(spyFocus).toHaveBeenCalled();

		component.find('pre').simulate('beforeInput', {data: 'hello world'});

		expect(exposer.methods.value()).toEqual('hello world');
		expect(spyBeforeInput).toHaveBeenCalled();
		expect(spyPaste).not.toHaveBeenCalled();
		expect(spyCut).not.toHaveBeenCalled();
		expect(spyKeys).not.toHaveBeenCalled();

		component.find('pre').simulate('cut', {clipboardData: {setData: () => {}}, caret: {start: 6, end: 11}});

		expect(exposer.methods.value()).toEqual('hello ');
		expect(spyBeforeInput).toHaveBeenCalled();
		expect(spyPaste).not.toHaveBeenCalled();
		expect(spyCut).toHaveBeenCalled();
		expect(spyKeys).not.toHaveBeenCalled();

		component.find('pre').simulate('paste', {clipboardData: {getData: () => 'world'}, caret: {start: 6, end: 6}});

		expect(exposer.methods.value()).toEqual('hello world');
		expect(spyBeforeInput).toHaveBeenCalled();
		expect(spyPaste).toHaveBeenCalled();
		expect(spyCut).toHaveBeenCalled();
		expect(spyKeys).not.toHaveBeenCalled();

		component.find('pre').simulate('keydown', {key: 'Backspace', caret: {start: 11, end: 11}});

		expect(exposer.methods.value()).toEqual('hello worl');
		expect(spyBeforeInput).toHaveBeenCalled();
		expect(spyPaste).toHaveBeenCalled();
		expect(spyCut).toHaveBeenCalled();
		expect(spyKeys).toHaveBeenCalled();

		component.find('pre').simulate('beforeInput', {data: []});

		expect(exposer.methods.value()).toEqual('hello worl');

		await Promise.resolve();
		expect(errorHandler).toHaveBeenCalledWith(literals.ERROR_NONVALIDCONTENT([]));

		done();
	});

	it('should render placeholder', async done => {
		const exposer = createExposer();
		const component = mount(<Input
			exposer={exposer}
			placeholder={<div className='myPlaceholder'>hello world</div>}
			disableAutoScroll
		/>);

		expect(component.find('.myPlaceholder').length).toEqual(1);
		expect(component.find('.myPlaceholder').text()).toEqual('hello world');

		await exposer.methods.write('hello');
		component.update();

		expect(component.find('.myPlaceholder').length).toEqual(0);

		done();
	});

	it('should render value with render prop', async done => {
		const exposer = createExposer();
		const component = mount(<Input
			exposer={exposer}
			render={content => content.split('').join(' ')}
			disableAutoScroll
		/>);

		expect(exposer.methods.value()).toEqual('');

		await exposer.methods.write('hello');

		expect(exposer.methods.value()).toEqual('hello');
		expect(component.text()).toEqual('h e l l o');

		done();
	});

	it('should cut on maxlength', async done => {
		const exposer = createExposer();
		mount(<Input exposer={exposer} maxLength={5} disableAutoScroll/>);

		await exposer.methods.write('h');
		expect(exposer.methods.value()).toEqual('h');

		await exposer.methods.write('ello world');
		expect(exposer.methods.value()).toEqual('hello');

		done();
	});

	it('should work for date input in docs', async done => {
		const renderDateInput = content => content.split('').map(
			(char, index) => [1,3].includes(index) ?
				<span key={index}>{char}<span className='separator'>/</span></span> :
				<span key={index} children={char}/>
		);

		const exposer = createExposer();
		const component = mount(<Input
			exposer={exposer}
			ignore={['.separator']}
			maxLength={8}
			characterSet={{include: '0123456789'}}
			render={renderDateInput}
		/>);

		expect(exposer.methods.value()).toEqual('');

		await exposer.methods.write(0);
		expect(exposer.methods.value()).toEqual('0');
		expect(component.find('pre').text()).toEqual('0');
		await exposer.methods.write(1);
		expect(exposer.methods.value()).toEqual('01');
		expect(component.find('pre').text()).toEqual('01/');
		await exposer.methods.write(0);
		expect(exposer.methods.value()).toEqual('010');
		expect(component.find('pre').text()).toEqual('01/0');
		await exposer.methods.write(1);
		expect(exposer.methods.value()).toEqual('0101');
		expect(component.find('pre').text()).toEqual('01/01/');
		await exposer.methods.write(1);
		expect(exposer.methods.value()).toEqual('01011');
		expect(component.find('pre').text()).toEqual('01/01/1');
		await exposer.methods.write(9);
		expect(exposer.methods.value()).toEqual('010119');
		expect(component.find('pre').text()).toEqual('01/01/19');
		await exposer.methods.write(7);
		expect(exposer.methods.value()).toEqual('0101197');
		expect(component.find('pre').text()).toEqual('01/01/197');
		await exposer.methods.write(0);
		expect(exposer.methods.value()).toEqual('01011970');
		expect(component.find('pre').text()).toEqual('01/01/1970');
		await exposer.methods.write(0);
		expect(exposer.methods.value()).toEqual('01011970');
		expect(component.find('pre').text()).toEqual('01/01/1970');

		done();
	});
});