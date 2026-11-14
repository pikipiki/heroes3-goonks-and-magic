import {test} from 'node:test';import assert from 'node:assert/strict';
import {RenderClock,SimulationTimeline,blendAmount,interpolatedPosition,attackCycle,heroAnimation} from '../public/animation.js';
const unit=(x,y,cooldown=0)=>({id:1,type:0,owner:0,completed:true,hp:40,x,y,cooldown});
test('50 fps pacing retains remainder on 60 Hz and 120 Hz screens, without catch-up bursts',()=>{
 for(const refresh of [60,120]){const clock=new RenderClock();let count=0;for(let i=0;i<refresh*10;i++)if(clock.due(i*1000/refresh))count++;assert(count>=499&&count<=501,`${refresh} Hz: ${count} paints`);}
 const clock=new RenderClock();assert(clock.due(0));assert(!clock.due(0));assert(clock.due(10000));assert(!clock.due(10000));assert(!clock.due(10005));
});
test('render interpolation stays between native positions, snaps teleports and never alters state',()=>{
 const before=unit(10,20),after=unit(20,40),copy=structuredClone([before,after]);
 assert.deepEqual(interpolatedPosition(before,after,.5),{x:15,y:30});
 assert.deepEqual(interpolatedPosition(before,after,2),{x:20,y:40});
 assert.deepEqual(interpolatedPosition(before,unit(1000,2000),.2),{x:1000,y:2000});
 assert.equal(blendAmount(10,20,42),0);assert.equal(blendAmount(1000,20,42),1);
 assert.deepEqual([before,after],copy);
});
test('Heroes attack midpoint follows native weapon resets instead of a global frame loop',()=>{
 const first=attackCycle(unit(0,0,0),unit(0,0,15),100,undefined);assert.deepEqual(first,{shotFrame:100,period:15});
 assert.equal(heroAnimation(100,false,15,first).frame,4);
 assert.equal(attackCycle(unit(0,0,15),unit(0,0,14),101,first),first);
 const next=attackCycle(unit(0,0,0),unit(0,0,15),115,first);assert.equal(heroAnimation(115,false,15,next).frame,4);
 assert(heroAnimation(115.5,false,15,next).mix>0);
 assert.equal(heroAnimation(116,true,14,next).pose,1);assert.equal(heroAnimation(150,false,0,next).pose,0);
});

test('uneven snapshot delivery does not reset the presentation tween, and pauses never extrapolate',()=>{
 const time=new SimulationTimeline();time.receive(0,0,42);time.receive(1,60,42);time.receive(2,100,42);time.receive(3,140,42);time.receive(4,200,42);
 const presented=time.sample(200);assert(presented.frame>3&&presented.frame<4);assert(presented.amount>0);
 assert.equal(time.sample(10000).frame,4);
 time.receive(5,10042,42);assert.equal(time.sample(10042).frame,4);
 time.receive(0,11000,42);assert.equal(time.sample(11000).frame,0);
});
