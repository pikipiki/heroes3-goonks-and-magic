import assert from 'node:assert/strict';
import test from 'node:test';
import {requestHostedMatch} from '../web/hosted-match-request.mjs';

test('a dedicated match request survives a cold start with the same creation ID', async t => {
  const requests = [];
  t.mock.method(globalThis, 'setTimeout', callback => queueMicrotask(callback));
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    requests.push(options.body);
    if (requests.length === 1) throw new TypeError('Gateway unavailable');
    return new Response(null, {status: requests.length === 2 ? 503 : 201});
  });
  const body = JSON.stringify({requestId: 'same-id'});
  let waits = 0;
  const response = await requestHostedMatch('https://example.test/hosted/matches', {method: 'POST', body}, () => waits++);
  assert.equal(response.status, 201);
  assert.equal(waits, 2);
  assert.deepEqual(requests, [body, body, body]);
});

test('a dedicated match request returns an application error without retrying', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => new Response(null, {status: 409}));
  const response = await requestHostedMatch('https://example.test/hosted/matches');
  assert.equal(response.status, 409);
  assert.equal(fetch.mock.callCount(), 1);
});
