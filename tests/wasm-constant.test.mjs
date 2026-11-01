import{test}from'node:test';import assert from'node:assert/strict';import{exportedI32Constant}from'../scripts/wasm-constant.mjs';
// One () -> i32 function exported as v; this is an actual valid WebAssembly binary.
const moduleFor=v=>Buffer.from([0,97,115,109,1,0,0,0,1,5,1,96,0,1,127,3,2,1,0,7,5,1,1,118,0,0,10,6,1,4,0,65,v,11]);
test('ABI check distinguishes actual compiled versions instead of accepting any matching export',async()=>{for(const version of[1,2]){const bytes=moduleFor(version);assert.equal((await WebAssembly.instantiate(bytes)).instance.exports.v(),version);assert.equal(exportedI32Constant(bytes,'v'),version);}assert.throws(()=>exportedI32Constant(moduleFor(2),'missing'));assert.throws(()=>exportedI32Constant(moduleFor(2).subarray(0,32),'v'));});
