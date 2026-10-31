import {test} from 'node:test';import assert from 'node:assert/strict';
import {createSaveScheduler} from '../web/runtime-scheduling.mjs';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
test('Save bursts coalesce; writes during a flush trigger exactly one follow-up',async()=>{
 const jobs=[],flushes=[];let active=0,maxActive=0;
 const save=createSaveScheduler({schedule:fn=>jobs.push(fn),sync:()=>{const f=deferred();flushes.push(f);maxActive=Math.max(maxActive,++active);return f.promise.finally(()=>active--);}});
 const a=save('A'),b=save('A'),c=save('B');assert.equal(jobs.length,1);
 const first=jobs.shift()();assert.equal(flushes.length,1);
 const d=save('A'),e=save('C');assert.equal(jobs.length,0);
 flushes[0].resolve();await first;await Promise.all([a,b,c]);assert.equal(jobs.length,1);
 const second=jobs.shift()();flushes[1].resolve();await second;await Promise.all([d,e]);assert.equal(flushes.length,2);assert.equal(maxActive,1);
});
test('A failed flush rejects its callers and does not block subsequent saves',async()=>{
 const jobs=[];let count=0;const errors=[];
 const save=createSaveScheduler({schedule:fn=>jobs.push(fn),sync:async()=>{if(count++===0)throw Error('disk full');},onError:e=>errors.push(e.message)});
 const failed=save('A');const check=assert.rejects(failed,/disk full/);await jobs.shift()();await check;
 const retry=save('A');await jobs.shift()();await retry;assert.deepEqual(errors,['disk full']);
});
