import { MethodEnum, Request } from '@algolia/requester-common';
import nock from 'nock';

import { createNodeHttpRequester } from '../..';

const requester = createNodeHttpRequester();

const headers = {
  'content-type': 'application/x-www-form-urlencoded',
};

const timeoutRequest: Request = {
  url: 'https://google.com:81/',
  data: '',
  headers: {},
  method: 'POST',
  timeout: 1,
};

const requestStub = {
  url: 'https://algolia-dns.net/foo?x-algolia-header=foo',
  method: MethodEnum.Post,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  data: JSON.stringify({ foo: 'bar' }),
  timeout: 2,
};

describe('status code handling', () => {
  it('sends requests', async () => {
    const body = JSON.stringify({ foo: 'bar' });

    nock('https://algolia-dns.net', { reqheaders: headers })
      .post('/foo')
      .query({ 'x-algolia-header': 'foo' })
      .reply(200, body);

    const response = await requester.send(requestStub);

    expect(response.content).toEqual(JSON.stringify({ foo: 'bar' }));
  });

  it('resolves status 200', async () => {
    const body = JSON.stringify({ foo: 'bar' });

    nock('https://algolia-dns.net', { reqheaders: headers })
      .post('/foo')
      .query({ 'x-algolia-header': 'foo' })
      .reply(200, body);

    const response = await requester.send(requestStub);

    expect(response.status).toBe(200);
    expect(response.content).toBe(body);
    expect(response.isTimedOut).toBe(false);
  });

  it('resolves status 300', async () => {
    const reason = 'Multiple Choices';

    nock('https://algolia-dns.net', { reqheaders: headers })
      .post('/foo')
      .query({ 'x-algolia-header': 'foo' })
      .reply(300, reason);

    const response = await requester.send(requestStub);

    expect(response.status).toBe(300);
    expect(response.content).toBe(reason);
    expect(response.isTimedOut).toBe(false);
  });

  it('resolves status 400', async () => {
    const body = { message: 'Invalid Application-Id or API-Key' };

    nock('https://algolia-dns.net', { reqheaders: headers })
      .post('/foo')
      .query({ 'x-algolia-header': 'foo' })
      .reply(400, JSON.stringify(body));

    const response = await requester.send(requestStub);

    expect(response.status).toBe(400);
    expect(response.content).toBe(JSON.stringify(body));
    expect(response.isTimedOut).toBe(false);
  });
});

describe('timeout handling', () => {
  it('timouts if response dont appears before the timeout with the given 1 seconds timeout', async () => {
    const before = Date.now();
    await requester.send({
      ...timeoutRequest,
      ...{ timeout: 1 },
    });

    const now = Date.now();

    expect(now - before).toBeGreaterThan(999);
    expect(now - before).toBeLessThan(1200);
  });

  it('timouts if response dont appears before the timeout with the given 2 seconds timeout', async () => {
    const before = Date.now();
    await requester.send({
      ...timeoutRequest,
      ...{ timeout: 2 },
    });

    const now = Date.now();

    expect(now - before).toBeGreaterThan(1999);
    expect(now - before).toBeLessThan(2200);
  });

  it('timouts with a response code 0 and no content', async () => {
    const response = await requester.send(timeoutRequest);

    expect(response.status).toBe(0);
    expect(response.content).toContain('');
    expect(response.isTimedOut).toBe(true);
  });

  it('do not timeouts if response appears before the timeout', async () => {
    const request = Object.assign({}, requestStub);

    request.url = 'https://bh4d9od16a-dsn.algolia.net/1/indexes';
    request.method = 'GET';

    const response = await requester.send(request);

    expect(response.isTimedOut).toBe(false);
    expect(response.status).toBe(403);
    expect(response.content).toBe(
      JSON.stringify({
        message: 'Invalid Application-ID or API key',
        status: 403,
      })
    );
  });
});

describe('error handling', (): void => {
  it('resolves dns not found', async () => {
    const request = {
      url: 'https://this-dont-exist.algolia.com',
      method: MethodEnum.Post,
      headers: {
        'X-Algolia-Application-Id': 'ABCDE',
        'X-Algolia-API-Key': '12345',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: JSON.stringify({ foo: 'bar' }),
      timeout: 2,
    };

    const response = await requester.send(request);

    expect(response.status).toBe(0);
    expect(response.content).toContain('');
    expect(response.isTimedOut).toBe(false);
  });

  it('resolves general network errors', async () => {
    nock('https://algolia-dns.net', { reqheaders: headers })
      .post('/foo')
      .query({ 'x-algolia-header': 'foo' })
      .replyWithError('This is a general error');

    const response = await requester.send(requestStub);

    expect(response.status).toBe(0);
    expect(response.content).toBe('This is a general error');
    expect(response.isTimedOut).toBe(false);
  });
});
