import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fitBattleDetail,battleOverviewPoint,overviewCreature} from '../web/battle-dual-view.mjs';
import {fitNativeBattle} from '../web/battle-scene.mjs';
import {scenePoint} from '../web/mobile-layout.mjs';

test('Portrait detail keeps 44px native hexes, preserves aspect and reaches both armies',()=>{
 for(const [w,h]of [[390,240],[320,110],[430,300]])for(const focus of [{x:102,y:112},{x:718,y:532},{x:400,y:280}]){
  const l=fitBattleDetail(w,h,focus);
  assert(l.scale>=1);assert(l.x>=0&&l.y>=0&&l.x+l.w<=800.001&&l.y+l.h<=555.001);
  const x=l.dx+(focus.x-l.x)*l.scale,y=l.dy+(focus.y-l.y)*l.scale;
  assert(x>=0&&x<=w&&y>=0&&y<=h);
  assert.deepEqual(scenePoint(x,y,l),focus);
 }
});
test('Strategic view retains all rows and both edges; letterbox taps do not target the game',()=>{
 for(const [w,h]of [[390,240],[320,115],[430,290]]){
  const l=fitNativeBattle(w,h,null,'whole');
  assert.equal(l.w,800);assert.equal(l.h,555);
  for(const p of [{x:0,y:0},{x:800,y:555},{x:718,y:532}]){
   assert.deepEqual(battleOverviewPoint(l.dx+p.x*l.scale,l.dy+p.y*l.scale,w,h),p);
  }
  if(l.dy>0)assert.equal(battleOverviewPoint(w/2,l.dy-1,w,h),null);
  if(l.dx>0)assert.equal(battleOverviewPoint(l.dx-1,h/2,w,h),null);
 }
});
test('Small overview taps resolve nearby troop bodies to the closest row without changing native coordinates',()=>{
 const units=[{stackId:0,x:102,y:112},{stackId:1,x:102,y:196}];
 assert.equal(overviewCreature({x:102,y:82},units,.3),units[0]);
 assert.equal(overviewCreature({x:103,y:164},units,.3),units[1]);
 assert.equal(overviewCreature({x:500,y:300},units,.3),null);
 assert.equal(overviewCreature(null,units,.3),null);
});
