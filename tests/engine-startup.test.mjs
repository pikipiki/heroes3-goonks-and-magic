import test from 'node:test';import assert from 'node:assert/strict';import {fetchEnginePackage} from '../web/engine-startup.mjs';
test('Engine package retries a failed cold request and validates the complete bytes',async()=>{
 let calls=0;const module={};const bytes=await fetchEnginePackage('/engine.data',3,{module,fetcher:async()=>{if(++calls===1)throw Error('Disconnected');return new Response(new Uint8Array([1,2,3]));}});
 assert.deepEqual([...new Uint8Array(bytes)],[1,2,3]);assert.equal(calls,2);assert.equal(module.dataFileDownloads['/engine.data'].loaded,3);
});
test('A stalled package is aborted, retried, and reported instead of leaving the loader hanging',async()=>{
 let attempts=0,failure;globalThis.goonkTemporaryBoot={fail:error=>{failure=error;}};
 try{await assert.rejects(fetchEnginePackage('/engine.data',3,{timeoutMs:10,fetcher:async(url,{signal})=>{attempts++;return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('Timed out'))));}}),/Timed out/);assert.equal(attempts,2);assert.match(failure.message,/Timed out/);}finally{delete globalThis.goonkTemporaryBoot;delete globalThis.goonkEngineStartupError;}
});
test('A truncated successful HTTP response is retried and never installed',async()=>{
 let calls=0;await assert.rejects(fetchEnginePackage('/engine.data',3,{fetcher:async()=>{calls++;return new Response(new Uint8Array([1]));}}),/incomplete/);assert.equal(calls,2);delete globalThis.goonkEngineStartupError;
});
