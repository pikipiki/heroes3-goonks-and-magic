import assert from 'node:assert/strict';
import {test} from 'node:test';
import {guardOnlineNameKeyboard} from '../web/online-login.mjs';

test('The mobile name input keeps native typing before game keyboard handlers', () => {
  const window = new EventTarget();
  window.document = {activeElement: {matches: () => true}};
  guardOnlineNameKeyboard(window);
  const gameEvents = [];
  for (const type of ['keydown', 'keypress', 'keyup']) {
    window.addEventListener(type, event => {
      gameEvents.push(type);
      event.preventDefault();
    }, {capture: true});
    const key = new Event(type, {cancelable: true});
    window.dispatchEvent(key);
    assert.equal(key.defaultPrevented, false);
  }
  assert.deepEqual(gameEvents, []);

  window.document.activeElement = null;
  window.dispatchEvent(new Event('keydown', {cancelable: true}));
  assert.deepEqual(gameEvents, ['keydown']);
});
