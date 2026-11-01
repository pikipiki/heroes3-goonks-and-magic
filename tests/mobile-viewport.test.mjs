import{test}from'node:test';import assert from'node:assert/strict';import{coalesceViewportResize,createMapPan}from'../web/mobile-viewport.mjs';
test('Rotation events settle once and late duplicates leave new gestures alone',()=>{
 const queue=[],applied=[];let size={width:390,height:844};const resize=coalesceViewportResize(()=>size,s=>applied.push(s),{schedule:f=>queue.push(f)});
 resize();queue.shift()();for(let i=0;i<30;i++)resize();assert.equal(queue.length,1);queue.shift()();assert.equal(applied.length,1);
 size={width:844,height:390};resize();size={width:390,height:844};resize();queue.shift()();assert.equal(applied.length,1);
 size={width:844,height:390};resize();queue.shift()();size={width:390,height:844};resize();queue.shift()();assert.equal(applied.length,3);assert.deepEqual(applied.at(-1),size);
});
test('Map pan preserves the combined distance and discards old-orientation commands',()=>{
 const queue=[],sent=[],pan=createMapPan(d=>sent.push(d),{schedule:f=>queue.push(f)});
 pan.add(-4,2);pan.add(-6,5);assert.equal(queue.length,1);queue.shift()();assert.deepEqual(sent,[{x:-10,y:7}]);
 pan.add(100,0);pan.cancel();pan.add(0,-3);queue.shift()();assert.equal(sent.length,1);queue.shift()();assert.deepEqual(sent.at(-1),{x:0,y:-3});
 pan.add(1,2);pan.add(-1,-2);queue.shift()();assert.equal(sent.length,2);
});

// The bridge accepts integer native pixels. Rounding each finger sample made
// a slow drag stop completely once the map was zoomed in.
test('Slow zoomed map drags retain their distance across frames',async()=>{
 const {mapDrag}=await import('../web/mobile-layout.mjs');
 for(const scale of [1.25,2.5,4.875])for(const direction of [-1,1]){
  const queue=[],sent=[],pan=createMapPan(d=>{assert(Number.isInteger(d.x)&&Number.isInteger(d.y));sent.push(d);},{schedule:f=>queue.push(f)});
  for(let i=0;i<160;i++){const d=mapDrag(direction,0.25,scale);pan.add(d.x,d.y);queue.shift()();}
  const total=sent.reduce((a,d)=>({x:a.x+d.x,y:a.y+d.y}),{x:0,y:0});
  assert(sent.length>0);assert(Math.abs(total.x+160*direction/scale)<=.5);assert(Math.abs(total.y+40/scale)<=.5);
 }
});
test('Cancelling a map gesture also discards subpixel remainders',()=>{
 const queue=[],sent=[],pan=createMapPan(d=>sent.push(d),{schedule:f=>queue.push(f)});
 pan.add(.4,.4);queue.shift()();assert.equal(sent.length,0);pan.cancel();
 pan.add(.4,.4);queue.shift()();assert.equal(sent.length,0);
 pan.add(.4,.4);queue.shift()();assert.deepEqual(sent,[{x:1,y:1}]);
});
