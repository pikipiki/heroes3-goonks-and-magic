import {test} from 'node:test';import assert from 'node:assert/strict';import {bulkTransferSummary} from '../web/army-transfer.mjs';
const army=(id,units,needsLastStack=false)=>({id,slots:units.map(([id,count])=>({id,count})),needsLastStack});
test('Full armies accept matching types but retain types that do not fit',()=>{
 const full=army(2,[[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2]]);
 assert.deepEqual(bulkTransferSummary(army(1,[[8,5],[1,6]],true),full),{count:6,blocked:true,keepsOne:false});
 assert.equal(bulkTransferSummary(army(1,[[8,1]],true),full).count,0);
});
test('Destination duplicates free slots, incoming duplicates share one new slot',()=>{
 const to=army(2,[[1,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2]]);
 assert.deepEqual(bulkTransferSummary(army(1,[[8,10],[8,5]],true),to),{count:14,blocked:false,keepsOne:true});
});
test('A hero always retains one creature when all transferable stacks fit',()=>{
 const h=army(1,[[8,10]],true);assert.deepEqual(bulkTransferSummary(h,army(2,[])),{count:9,blocked:false,keepsOne:true});assert.equal(bulkTransferSummary(h,army(2,[[7,2]])).count,9);
});
test('Bulk controls cannot transfer to the same army or to an absent hero',()=>{const a=army(1,[[1,12]]);assert.equal(bulkTransferSummary(a,a).count,0);assert.equal(bulkTransferSummary(a,null).count,0);});
