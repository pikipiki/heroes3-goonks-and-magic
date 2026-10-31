import {test} from 'node:test';import assert from 'node:assert/strict';import {downloadFetch} from '../web/download-fetch.mjs';
test('Transient connection and server failures retry within a bound; permanent errors do not',async()=>{
 let attempts=0;const delays=[];const response=await downloadFetch('/file',{}, {pause:async ms=>delays.push(ms),fetcher:async()=>{attempts++;if(attempts===1)throw TypeError('Failed to fetch');return new Response('data',{status:attempts===2?503:200});}});assert.equal(response.status,200);assert.equal(attempts,3);assert.deepEqual(delays,[400,800]);attempts=0;assert.equal((await downloadFetch('/missing',{}, {fetcher:async()=>{attempts++;return new Response('',{status:404});}})).status,404);assert.equal(attempts,1);
});
