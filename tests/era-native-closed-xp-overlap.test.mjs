import test from'node:test';import assert from'node:assert/strict';import{intrinsicXPObligations}from'../scripts/era-bridge/creatures/native-closed-xp-overlap.mjs';
const row=(modifier,values)=>({code:'f',modifier,values,line:1});
test('doubleattack XP cannot duplicate an intrinsic flag even after sentinel2',()=>{assert(intrinsicXPObligations(0x8010,[row('D',[2,2,1])]).some(x=>x.code.includes('duplicate')));});
test('XP cannot clear immutable native mind/flying/nature flags',()=>{assert(intrinsicXPObligations(0x410,[row('P',[0,1])]).some(x=>x.code.includes('clears')));assert(intrinsicXPObligations(16,[row('U',[0,1])]).some(x=>x.code.includes('ALIVE')));});
test('new monotonic flags with no conflicting intrinsic source state remain representable',()=>{assert.deepEqual(intrinsicXPObligations(16,[row('D',[0,0,1]),row('P',[0,1])]),[]);});
