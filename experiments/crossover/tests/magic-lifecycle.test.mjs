import {test} from 'node:test';
import assert from 'node:assert/strict';
import {magicController} from '../public/magic.js';

function harness(onEffects) {
 const win = new EventTarget(), timers = new Map(), requests = [];
 let nextTimer = 0;
 win.setTimeout = callback => {const id = ++nextTimer; timers.set(id, () => {timers.delete(id); callback();}); return id;};
 win.clearTimeout = id => timers.delete(id);
 win.Module = {
  HEAPU8: new Uint8Array(4096), _malloc: () => 0, _free() {},
  _vcmiCrossoverMagic(ptr, length) {requests.push(JSON.parse(new TextDecoder().decode(this.HEAPU8.subarray(ptr, ptr + length))));}
 };
 const api = {census: () => ({frame: 0, units: []}), camera: () => ({x: 0, y: 0}), battle: () => ({groups: []}), applyMagic() {}, obstacles() {}};
 const controller = magicController(win, api, {battleId: 1, stacks: []}, onEffects);
 const reply = (extra = {}) => win.dispatchEvent(new CustomEvent('goonk-crossover-magic', {detail: {sequence: requests.at(-1).sequence, ok: true, groups: [], catalogue: {spells: []}, ...extra}}));
 return {controller, timers, requests, reply};
}
const turn = () => new Promise(resolve => setImmediate(resolve));

test('a stalled presentation callback keeps the synchronization timeout and releases busy state', async () => {
 let release;
 const h = harness(() => new Promise(resolve => {release = resolve;}));
 const pending = h.controller.sync();
 const rejected = assert.rejects(pending, /ne répond pas/);
 h.reply();
 assert.equal(h.timers.size, 1, 'the native reply must not disable the presentation timeout');
 for (const callback of h.timers.values()) callback();
 await rejected;
 assert.equal(h.controller.busy(), false);
 release(); await turn();
 assert.equal(h.requests.length, 1, 'a late presentation does not restart synchronization');
 h.controller.dispose();
});

test('closing a scene rejects its pending reply and ignores duplicated or late completion', async () => {
 let release, presentations = 0;
 const h = harness(() => {presentations++; return new Promise(resolve => {release = resolve;});});
 const pending = h.controller.sync();
 const rejected = assert.rejects(pending, /Combat fermé/);
 h.reply(); h.reply();
 assert.equal(presentations, 1);
 h.controller.dispose();
 await rejected;
 assert.equal(h.timers.size, 0);
 release(); await turn();
 assert.equal(h.controller.busy(), false);
});

test('a rejected cohort reconciliation rejects the original synchronization instead of leaving it pending', async () => {
 const h = harness(() => {});
 const pending = h.controller.sync();
 const rejected = assert.rejects(pending, /réconciliation refusée/);
 h.reply({groups: [{id: 5, count: 1, creature: 'core:archer', x: 20, y: 30}]});
 await turn();
 assert.equal(h.requests.length, 2);
 h.reply({ok: false, error: 'réconciliation refusée'});
 await rejected;
 assert.equal(h.controller.busy(), false);
 assert.equal(h.timers.size, 0);
 h.controller.dispose();
});
