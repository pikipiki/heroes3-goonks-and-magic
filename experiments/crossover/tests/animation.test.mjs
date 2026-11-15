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

test('explicit enemy targeting includes the visible Marine head and reaches overlapping bodies',async()=>{
 const {battlePick}=await import('../public/shared-field.js');
 const friendly={...unit(100,90),id:1,owner:0,heroes:true};
 const enemy={...unit(100,100),id:2,owner:1,heroes:false};const positions=new Map(),camera={x:0,y:0};
 assert.equal(battlePick([enemy],positions,{x:100,y:15},camera,true)?.id,2,'head tap targets the enlarged Marine');
 assert.equal(battlePick([friendly,enemy],positions,{x:100,y:90},camera,true)?.id,2,'explicit attack targets the enemy rather than reselecting an overlapping ally');
 assert.equal(battlePick([friendly],positions,{x:100,y:90},camera,false)?.id,1);
 assert.equal(battlePick([friendly,enemy],positions,{x:700,y:450},camera,true),undefined,'empty ground stays a move order');
});


test('upright portrait targets follow the projected body on either native starting side',async()=>{const {battlePick}=await import('../public/shared-field.js');const unit={id:9,owner:1,hp:40,x:300,y:200,heroes:false},positions=new Map([[9,{x:300,y:200}]]),camera={x:0,y:0};assert.equal(battlePick([unit],positions,{x:350,y:200},camera,true,true,false)?.id,9);assert.equal(battlePick([unit],positions,{x:250,y:200},camera,true,true,true)?.id,9);assert.equal(battlePick([unit],positions,{x:350,y:400},camera,true,true,false),undefined);});

test('mobile render resolution matches visible pixels and adapts to sustained slow presentation',async()=>{const {RenderDensity}=await import('../public/animation.js');const density=new RenderDensity();assert.equal(density.sample(100,350,500,2),1.4);for(let i=1;i<=40;i++)density.sample(100+i*50,350,500,2);assert.equal(density.sample(2150,350,500,2),1);const stable=new RenderDensity();for(let i=0;i<120;i++)assert.equal(stable.sample(100+i*16.67,350,500,2),1.4);});
test('normal melee taps reclaim an ally surrounded by twelve enemies, explicit targeting can still attack',async()=>{
 const {battlePick}=await import('../public/shared-field.js');const ally={id:1,stackId:1,owner:0,hp:100,x:400,y:250},enemies=Array.from({length:12},(_,i)=>({id:10+i,stackId:10+i,owner:1,hp:40,x:400+(i%3-1)*3,y:250+(Math.floor(i/3)-2)*3}));const units=[...enemies,ally],camera={x:0,y:0},positions=new Map();
 assert.equal(battlePick(units,positions,{x:400,y:215},camera,false)?.id,1,'normal tap selects the ally despite enemy overlap');assert.equal(battlePick(units,positions,{x:400,y:215},camera,true)?.owner,1,'explicit attack mode still reaches an overlapping enemy');
 assert.equal(battlePick(units,positions,{x:435,y:250},camera,false,true,false)?.id,1,'portrait ally selection');assert.equal(battlePick(units,positions,{x:365,y:250},camera,false,true,true)?.id,1,'mirrored portrait ally selection');
});
test('visible enemy pixels win over a nearby ally transparent sprite margin',async()=>{const {battlePick}=await import('../public/shared-field.js');const ally={id:1,owner:0,hp:100,x:100,y:100},enemy={id:2,owner:1,hp:40,x:103,y:100};assert.equal(battlePick([ally,enemy],new Map(),{x:103,y:70},{x:0,y:0},false,false,false,unit=>unit.id===2)?.id,2);});
