import {test} from 'node:test';import assert from 'node:assert/strict';
import {createSaveScheduler,persistSaveFiles} from '../web/runtime-scheduling.mjs';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
test('Save bursts coalesce; writes during a flush trigger exactly one follow-up',async()=>{
 const jobs=[],flushes=[],batches=[];let active=0,maxActive=0;
 const save=createSaveScheduler({schedule:fn=>jobs.push(fn),sync:paths=>{batches.push(paths);const f=deferred();flushes.push(f);maxActive=Math.max(maxActive,++active);return f.promise.finally(()=>active--);}});
 const a=save('A'),b=save('A'),c=save('B');assert.equal(jobs.length,1);
 const first=jobs.shift()();assert.equal(flushes.length,1);
 const d=save('A'),e=save('C');assert.equal(jobs.length,0);
 flushes[0].resolve();await first;await Promise.all([a,b,c]);assert.equal(jobs.length,1);
 const second=jobs.shift()();flushes[1].resolve();await second;await Promise.all([d,e]);assert.equal(flushes.length,2);assert.equal(maxActive,1);assert.deepEqual(batches,[['A','B'],['A','C']]);
});
test('A failed flush rejects its callers and does not block subsequent saves',async()=>{
 const jobs=[];let count=0;const errors=[];
 const save=createSaveScheduler({schedule:fn=>jobs.push(fn),sync:async()=>{if(count++===0)throw Error('disk full');},onError:e=>errors.push(e.message)});
 const failed=save('A');const check=assert.rejects(failed,/disk full/);await jobs.shift()();await check;
 const retry=save('A');await jobs.shift()();await retry;assert.deepEqual(errors,['disk full']);
});

test('Local saves write only the requested file and flush the existing OPFS mount',async()=>{
 const root='/home/web_user/.local/share/vcmi',path=root+'/Saves/Goonk-auto.vsgm1';
 const mount={opts:{root}},entry={contents:new Uint8Array([1,2,3])},calls=[];
 const module={
  FS:{lookupPath:p=>{assert.equal(p,root);return {node:{mount}};},syncfs(){assert.fail('Do not scan the filesystem');}},
  OPFS:{
   loadLocalEntry(p,done){calls.push(['read',p]);done(null,entry);},
   storeRemoteEntry(m,p,e,done){assert.equal(m,mount);assert.equal(e,entry);calls.push(['write',p]);done();},
   callWorker(action,payload,done){calls.push([action,payload.root]);done();}
  }
 };
 await persistSaveFiles(module,[path]);
 assert.deepEqual(calls,[['read',path],['write',path],['flush',root]]);
});

test('Manual saves keep the full-sync compatibility path',async()=>{
 let syncs=0;
 const module={
  FS:{lookupPath(){assert.fail('Do not use the save mount for an unrelated file');},syncfs(populate,done){assert.equal(populate,false);syncs++;done();}},
  OPFS:{loadLocalEntry(){},storeRemoteEntry(){},callWorker(){}}
 };
 await persistSaveFiles(module,['/home/web_user/.local/share/vcmi/Saves/Manual.vsgm1']);
 assert.equal(syncs,1);
});

test('Temporary storage keeps saves in memory without scanning or syncing OPFS',async()=>{
 const module={
  goonkTemporaryStorage:true,
  FS:{lookupPath(){assert.fail('Do not touch OPFS in temporary mode');},syncfs(){assert.fail('Do not syncfs in temporary mode');}},
 };
 await persistSaveFiles(module,['/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1']);
});
