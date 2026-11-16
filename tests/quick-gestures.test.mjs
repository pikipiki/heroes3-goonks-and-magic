import {test} from 'node:test';import assert from 'node:assert/strict';
import {createDoubleTap} from '../web/quick-gestures.mjs';
test('Only rapid taps on the same destination and actor confirm movement',()=>{
 let now=0;const tap=createDoubleTap(()=>now),p={x:100,y:100};
 assert.equal(tap.tap(p,'hero1'),false);now=200;assert.equal(tap.tap({x:103,y:104},'hero1'),true);
 assert.equal(tap.tap(p,'hero1'),false);now=900;assert.equal(tap.tap(p,'hero1'),false);
 assert.equal(tap.tap(p,'hero2'),false);assert.equal(tap.tap({x:160,y:100},'hero2'),false);
 tap.reset();assert.equal(tap.tap({x:160,y:100},'hero2'),false);
});
