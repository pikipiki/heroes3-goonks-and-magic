import {test} from 'node:test';import assert from 'node:assert/strict';import {createAutosave} from '../web/autosave.mjs';
test('Autosave waits for an allowed engine state, prevents overlapping writes, and confirms persistence only',()=>{let time=0;const requests=[],events=[],s=createAutosave({request:id=>requests.push(id),clock:()=>time,onStatus:e=>events.push(e)});s.tick();assert.deepEqual(requests,[]);s.update({autosaveAllowed:true});s.tick();assert.deepEqual(requests,[1]);time=10000;s.tick();assert.equal(requests.length,1);s.accepted({id:1,accepted:true});assert.equal(events.at(-1).lastSaved,null);s.persisted({path:'/Saves/other.vsgm1',ok:true});assert.equal(events.at(-1).lastSaved,null);s.persisted({path:'/Saves/Goonk-auto.vsgm1',ok:true});assert.equal(events.at(-1).lastSaved,10000);s.tick();assert.deepEqual(requests,[1,2]);s.accepted({id:2,accepted:false});s.tick();assert.deepEqual(requests,[1,2,3]);s.persisted({path:'/Saves/Goonk-auto.vsgm1',ok:false,error:'disk full'});assert.equal(events.at(-1).phase,'error');assert.equal(events.at(-1).lastSaved,10000);});
test('Combat defers periodic writes and checkpoints immediately on returning to the map',async()=>{const requests=[],events=[],s=createAutosave({request:id=>requests.push(id),clock:()=>1000,onStatus:e=>events.push(e)});s.update({mode:'map',autosaveAllowed:true});await Promise.resolve();assert.equal(requests.length,1);s.persisted({path:'/Saves/Goonk-auto.vsgm1',ok:true});s.update({mode:'battle',autosaveAllowed:false});s.tick();assert.equal(requests.length,1);assert.equal(events.at(-1).deferred,true);s.update({mode:'map',autosaveAllowed:true});await Promise.resolve();assert.equal(requests.length,2);s.update({mode:'map',autosaveAllowed:true});await Promise.resolve();assert.equal(requests.length,2);});

test('The online checkpoint waits for its own save to be persisted',()=>{
 const controller=createAutosave({request:()=>{},clock:()=>1000,onStatus:value=>{status=value;}});
 let status;
 controller.update({autosaveAllowed:true,onlineGame:true});
 controller.tick();
 controller.persisted({path:'/Saves/Goonk-auto.vsgm1',ok:true});
 assert.equal(status.phase,'saving');
 controller.persisted({path:'/Saves/Goonk-online-auto.vsgm1',ok:true});
 assert.equal(status.phase,'saved');
});
