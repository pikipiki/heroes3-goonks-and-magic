import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {runInNewContext} from 'node:vm';

test('A turn push shows a notification without an open game and opens the correct hosting path', async () => {
  const scope = 'https://pikipiki.github.io/heroes3-goonks-and-magic/';
  const listeners = new Map();
  const notifications = [];
  const opened = [];
  const worker = readFileSync(new URL('../web/coi-serviceworker.js', import.meta.url), 'utf8');
  runInNewContext(worker, {
    URL,
    self: {
      addEventListener: (name, listener) => listeners.set(name, listener),
      registration: {
        scope,
        async showNotification(title, options) { notifications.push({title, ...options}); },
      },
      clients: {
        async matchAll() { return []; },
        async openWindow(url) { opened.push(url); },
      },
    },
  });

  async function dispatch(type, event) {
    const pending = [];
    listeners.get(type)({...event, waitUntil: task => pending.push(task)});
    await Promise.all(pending);
  }

  for (const payload of ['invalid JSON', '{}', '{"type":"other"}']) {
    await dispatch('push', {data: {json: () => JSON.parse(payload)}});
  }
  assert.equal(notifications.length, 0);

  const payload = {type: 'goonk.turn-started.v1', language: 'fr', url: 'https://example.org/'};
  await dispatch('push', {data: {json: () => payload}});
  assert.deepEqual(notifications, [{
    title: 'Heroes Goonk',
    body: 'C’est à toi de jouer.',
    icon: scope + 'dosvcmi.png',
    tag: 'heroes-goonk-online-turn',
  }]);

  let closed = false;
  await dispatch('notificationclick', {
    notification: {...notifications[0], close() { closed = true; }},
  });
  assert.equal(closed, true);
  assert.deepEqual(opened, [scope + 'game.html']);

  const matchId = '4b723f1c-987b-4213-b3bb-df22d36f21b1';
  await dispatch('push', {data: {json: () => ({...payload, matchId})}});
  assert.equal(notifications[1].data.match, matchId);
  assert.equal(notifications[1].tag, 'heroes-goonk-online-turn:' + matchId);
  await dispatch('notificationclick', {notification: {...notifications[1], close() {}}});
  assert.deepEqual(opened, [scope + 'game.html', scope + 'game.html?match=' + matchId]);

});
