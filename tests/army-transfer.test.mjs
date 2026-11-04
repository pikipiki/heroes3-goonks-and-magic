import {test} from 'node:test';import assert from 'node:assert/strict';import {bulkTransferSummary} from '../web/army-transfer.mjs';
const army=(id,units,needsLastStack=false)=>({id,slots:units.map(([id,count])=>({id,count})),needsLastStack});
test('Garrison can transfer every creature; hero retains one when it would be emptied',()=>{
 const g=army(1,[[5,20],[6,12]]),h=army(2,[[8,10]],true);assert.deepEqual(bulkTransferSummary(g,h),{count:32,blocked:false,keepsOne:false});assert.deepEqual(bulkTransferSummary(h,g),{count:9,blocked:false,keepsOne:true});
 assert.equal(bulkTransferSummary(army(3,[[4,1]],true),g).count,0);
});
test('Full destination still accepts matching creatures; incompatible creatures stay at source',()=>{
 const full=army(2,[[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2]]);assert.deepEqual(bulkTransferSummary(army(1,[[1,12],[8,5]],true),full),{count:12,blocked:true,keepsOne:false});assert.equal(bulkTransferSummary(army(1,[[8,5]]),full).count,0);
});
test('Bulk controls cannot transfer to the same army or to an absent hero',()=>{const a=army(1,[[1,12]]);assert.equal(bulkTransferSummary(a,a).count,0);assert.equal(bulkTransferSummary(a,null).count,0);});
