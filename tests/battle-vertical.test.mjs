import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verticalBattleGeometry} from '../web/battle-vertical.mjs';
test('portrait battle keeps the full checkerboard visible and reverses touch coordinates',()=>{
 for(const [w,h]of [[320,310],[390,500],[768,780]]){
  const g=verticalBattleGeometry(w,h);
  for(const point of [{x:58,y:92},{x:742,y:532},{x:400,y:277}]){
   const screen=g.project(point),native=g.unproject(screen);
   assert(screen.x>=0&&screen.x<=w&&screen.y>=0&&screen.y<=h);
   assert(Math.abs(native.x-point.x)<1e-8&&Math.abs(native.y-point.y)<1e-8);
  }
  assert(g.project({x:58,y:300}).y>g.project({x:742,y:300}).y,'Allied side is at the bottom');
 }
});
test('Native movement positions interpolate smoothly and never overshoot',async()=>{const {animatedBattlePosition}=await import('../web/battle-vertical.mjs');assert.deepEqual(animatedBattlePosition({x:0,y:10},{x:100,y:50},25,50),{x:50,y:30});assert.deepEqual(animatedBattlePosition({x:0,y:10},{x:100,y:50},90,50),{x:100,y:50});assert.deepEqual(animatedBattlePosition({x:0,y:10},{x:100,y:50},-1,50),{x:0,y:10});});
