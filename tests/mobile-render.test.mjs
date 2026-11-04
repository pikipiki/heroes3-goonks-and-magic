import {test} from 'node:test';import assert from 'node:assert/strict';import {configureMobileSource,createCanvasSizer} from '../web/mobile-render.mjs';
test('Only the mobile engine canvas preserves WebGL frames, before the first context is created',()=>{
 const calls=[],canvas={getContext:(...args)=>{calls.push(args);return 'context';}};configureMobileSource(canvas,false);canvas.getContext('webgl',{alpha:false});assert.equal(calls[0][1].preserveDrawingBuffer,undefined);
 configureMobileSource(canvas,true);const method=canvas.getContext;configureMobileSource(canvas,true);assert.equal(canvas.getContext,method);
 for(const type of ['webgl','webgl2','experimental-webgl']){assert.equal(canvas.getContext(type,{alpha:false,preserveDrawingBuffer:false}),'context');assert.deepEqual(calls.at(-1),[type,{alpha:false,preserveDrawingBuffer:true}]);}
 canvas.getContext('2d',{alpha:false});assert.deepEqual(calls.at(-1),['2d',{alpha:false}]);
});

test('Rotation surfaces settle once while drawing coordinates remain correct',()=>{
 let now=0,changes=0;const values={width:300,height:150},canvas={};for(const key of ['width','height'])Object.defineProperty(canvas,key,{get:()=>values[key],set:value=>{changes++;values[key]=value;}});
 const s=createCanvasSizer({clock:()=>now}),initial=s.fit(canvas,390,700,2);assert.deepEqual(initial,{x:2,y:2});const allocated=changes;
 for(let i=0;i<30;i++){now+=16;const w=400+i*10,h=700-i*10,p=s.fit(canvas,w,h,2);assert(Math.abs(p.x*w-canvas.width)<.0001);assert(Math.abs(p.y*h-canvas.height)<.0001);}
 assert.equal(changes,allocated);now+=150;s.fit(canvas,690,410,2);assert.equal(changes,allocated+2);
 for(let i=0;i<20;i++){now+=16;s.fit(canvas,690,410,2);}assert.equal(changes,allocated+2);
 s.release(canvas);assert.equal(canvas.width*canvas.height,0);s.fit(canvas,390,700,2);assert.deepEqual([canvas.width,canvas.height],[780,1400]);
});
test('Large touch displays keep a bounded canvas pixel budget',()=>{
 const s=createCanvasSizer(),canvas={width:0,height:0};s.fit(canvas,1600,1200,3);assert(canvas.width*canvas.height<=2003000);assert(canvas.width>0&&canvas.height>0);
});

test('Mobile framebuffer preservation is configured even before the translated UI finishes loading',()=>{
 const previous=globalThis.window;try{globalThis.window={location:{search:'?mobile=1'},matchMedia:()=>({matches:true})};let options;const canvas={getContext:(type,value)=>{options=value;return 'context';}};configureMobileSource(canvas,undefined);canvas.getContext('webgl2',{alpha:false});assert.equal(options.preserveDrawingBuffer,true);assert.equal(window.goonkMobileActive,true);}finally{if(previous===undefined)delete globalThis.window;else globalThis.window=previous;}
});
