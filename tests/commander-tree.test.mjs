import {test} from 'node:test';import assert from 'node:assert/strict';import {commanderAbilityState} from '../web/commander-tree.mjs';
const tree={masterRank:4,skills:[{id:0,rank:4},{id:4,rank:3}]};
test('A future commander ability becomes ready only when both native prerequisites are met',()=>{
 const a={requires:[0,4]};assert.equal(commanderAbilityState(a,tree),'locked');assert.equal(commanderAbilityState(a,{...tree,skills:[{id:0,rank:4},{id:4,rank:4}]}),'ready');assert.equal(commanderAbilityState({...a,learned:true},tree),'learned');assert.equal(commanderAbilityState({requires:[0,99]},tree),'locked');
});
