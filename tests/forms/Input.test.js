import React from 'react';
import 'jest-enzyme';
import {mount, configure} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import {describe, it, expect, jest, afterAll, beforeEach} from '@jest/globals';
import * as tachyon from '@anovel/tachyon';
import {Input} from '../../src';

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
		mount(<Input disableAutoScroll accessor={fn => expose = fn}/>);

		expect(expose.value()).toEqual('');
		expect(expose.getSelectionRange().absolute).toEqual({start: 0, end: 0});
	});

	it('should write normally', async () => {
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
	});

	it('should perform expected undo/redo', async () => {
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
	});
});