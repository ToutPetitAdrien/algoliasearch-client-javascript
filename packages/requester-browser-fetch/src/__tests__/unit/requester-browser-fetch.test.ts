import { MethodEnum, Request } from '@algolia/requester-common';
// import mock, { MockRequest, MockResponse } from 'xhr-mock';
import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();

import { createBrowserFetchRequester } from '../..';

const requester = createBrowserFetchRequester();

const requestStub = {
	url: 'https://algolia-dns.net/foo?x-algolia-header=bar',
	method: MethodEnum.Post,
	headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
	},
	data: JSON.stringify({ foo: 'bar' }),
	responseTimeout: 1,
	connectTimeout: 2,
};

describe('status code handling', () => {
	beforeEach(() => fetchMock.resetMocks());
	
	it('sends requests', async () => {
		expect.assertions(3);
		
		fetchMock.mockResponseOnce(JSON.stringify({ foo: 'bar' }));
		
		const res = await requester.send(requestStub);
		expect(res).toEqual({
			content: '{"foo":"bar"}',
			status: 200,
			isTimedOut: false,
		});
		expect(fetchMock.mock.calls[0][0]).toEqual('https://algolia-dns.net/foo?x-algolia-header=bar');
		expect(fetchMock.mock.calls[0][1]).toEqual({
			method: MethodEnum.Post,
			signal: new AbortController().signal,
			headers: new Headers({
				'Content-Type': 'application/x-www-form-urlencoded',
			})
		})
	});
	
	it('resolves status 300', async () => {
		fetchMock.mockResponseOnce("", {
			status: 300,
		});

		const res = await requester.send(requestStub);
		expect(res).toEqual({
			content: '',
			status: 300,
			isTimedOut: false,
		});
	});
	
	it('resolves status 400', async () => {
		const body = { message: 'Invalid Application-Id or API-Key' }
		fetchMock.mockResponseOnce(JSON.stringify(body), {
			status: 400,
		});

		const res = await requester.send(requestStub);
		expect(res).toEqual({
			content: JSON.stringify(body),
			status: 400,
			isTimedOut: false,
		});
	});

	it('handles the protocol', async () => {
		const body = JSON.stringify({ foo: 'bar' });
		fetchMock.mockResponseOnce(JSON.stringify(body), {
			status: 200,
		});

		const res = await requester.send({
			...requestStub,
			url: 'http://localhost',
		});
		expect(res).toEqual({
			content: JSON.stringify(body),
			status: 200,
			isTimedOut: false,
		});
	});
});