import assert from 'node:assert/strict';
import {test} from 'node:test';
import {guardOnlineNameKeyboard} from '../web/online-login.mjs';

test('The mobile name input keeps native typing before game keyboard handlers', () => {
  const window = new EventTarget();
  window.document = {querySelector: () => null, activeElement: {matches: () => true}};
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
  window.document.querySelector = selector => selector === '.campaign-media-viewer[open]' ? {} : null;
  const escape = new Event('keydown', {cancelable: true});window.dispatchEvent(escape);
  assert.equal(escape.defaultPrevented, false);assert.deepEqual(gameEvents, ['keydown']);
});

test('troop deployment keeps keyboard input away from SDL and Escape uses its single back action',()=>{
 const window=new EventTarget();let exits=0,gameKeys=0;
 window.document={querySelector:selector=>selector==='.troop-deployment-page:not([hidden])'?{querySelector:()=>({click:()=>exits++})}:null};
 guardOnlineNameKeyboard(window);window.addEventListener('keydown',()=>gameKeys++);
 const number=new Event('keydown',{cancelable:true});Object.defineProperty(number,'key',{value:'2'});window.dispatchEvent(number);assert.equal(number.defaultPrevented,false);
 for(const type of ['keydown','keypress','keyup']){const e=new Event(type,{cancelable:true});Object.defineProperty(e,'key',{value:'Escape'});window.dispatchEvent(e);assert(e.defaultPrevented);}
 assert.equal(exits,1);assert.equal(gameKeys,0);
});
