import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HeroesObserver, ReadonlyBridge, StarCraftObserver} from '../public/bridge.js';
const request = (overrides={}) => ({version:1, session:'test-session', id:'request-1', source:'heroes', target:'starcraft', type:'engine.status', ...overrides});
test('contract round trips both directions, without claiming engine execution', () => {
  const bridge = new ReadonlyBridge('test-session');
  bridge.register(new HeroesObserver()); bridge.register(new StarCraftObserver());
  const starcraft = bridge.request(request());
  assert.equal(starcraft.payload.state, 'waiting');
  assert.equal(starcraft.replyTo, 'request-1');
  assert.equal(starcraft.target, 'heroes');
  assert.equal(bridge.request(request({source:'starcraft',target:'heroes'})).payload.state,'waiting');
  bridge.dispose();
  assert.throws(() => bridge.request(request()), /Unknown source/);
});
test('rejects unsupported commands, stale sessions and malformed envelopes', () => {
  const bridge = new ReadonlyBridge('test-session');
  for (const bad of [null, {}, request({version:2}), request({source:'alien'}), request({target:'heroes'}), request({type:'battle.result'}), request({id:'x'.repeat(129)}), request({session:'old-session'})]) {
    assert.throws(() => bridge.request(bad));
  }
  assert.throws(() => new ReadonlyBridge(''), /Invalid session/);
});
test('observation uses only incoming events, detaches and clears stale state', () => {
  // EventTarget is a test fixture, not a VCMI instance.
  const target = new EventTarget();
  const statuses=[];
  const observer = new HeroesObserver(value => statuses.push(value));
  observer.attach(target);
  assert.equal(observer.status().state, 'waiting');
  for (const detail of [null, {}, {mode:42}]) target.dispatchEvent(new CustomEvent('goonk-state',{detail}));
  assert.equal(statuses.length,0);
  target.dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'battle'}}));
  assert.equal(observer.status().observation.mode,'battle');
  assert.equal(observer.status().observation.sequence,1);
  const copy=observer.status(); copy.observation.mode='invalid';
  assert.equal(observer.status().observation.mode,'battle');
  observer.dispose();
  target.dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'town'}}));
  assert.equal(statuses.length,1);
  assert.equal(observer.status().state,'waiting');
  observer.attach(target);
  target.dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'lobby'}}));
  assert.equal(observer.status().observation.sequence,1);
  observer.dispose();
});
test('registration is explicit and ambiguous replacements are refused', () => {
  const bridge = new ReadonlyBridge('test-session');
  bridge.register(new HeroesObserver());
  assert.throws(() => bridge.register(new HeroesObserver()), /already registered/);
  assert.throws(() => bridge.request(request()), /Unknown target/);
  bridge.dispose();
});
