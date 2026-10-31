import {test} from 'node:test';import assert from 'node:assert/strict';import {configureMobileSource} from '../web/mobile-render.mjs';
test('Only the mobile engine canvas preserves WebGL frames, before the first context is created',()=>{
 const calls=[],canvas={getContext:(...args)=>{calls.push(args);return 'context';}};configureMobileSource(canvas,false);canvas.getContext('webgl',{alpha:false});assert.equal(calls[0][1].preserveDrawingBuffer,undefined);
 configureMobileSource(canvas,true);const method=canvas.getContext;configureMobileSource(canvas,true);assert.equal(canvas.getContext,method);
 for(const type of ['webgl','webgl2','experimental-webgl']){assert.equal(canvas.getContext(type,{alpha:false,preserveDrawingBuffer:false}),'context');assert.deepEqual(calls.at(-1),[type,{alpha:false,preserveDrawingBuffer:true}]);}
 canvas.getContext('2d',{alpha:false});assert.deepEqual(calls.at(-1),['2d',{alpha:false}]);
});
