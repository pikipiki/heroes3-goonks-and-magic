import{test}from'node:test';import assert from'node:assert/strict';import{canCancelSpell,createSpellTargetingRecovery,spellTargetCell}from'../web/spell-targeting.mjs';import{battleCapabilities,battleTeamCapabilities}from'../web/battle-phase.mjs';
const targeting={mode:'battle',round:1,spellTargeting:true,canAct:false,canAutoCombat:false,activeStack:7};
const restored={...targeting,spellTargeting:false,canAct:true,canAutoCombat:true};
const setup=()=>{const calls=[],errors=[];let time=0;return{calls,errors,advance:()=>time=6000,recovery:createSpellTargetingRecovery({command:(...args)=>calls.push(args),onError:e=>errors.push(e),clock:()=>time})};};
test('Spell targeting permits target selection and cancellation despite a temporarily absent creature actor',()=>{assert(canCancelSpell(targeting));assert(battleCapabilities(targeting).move);assert(battleTeamCapabilities(targeting).auto);for(const patch of[{mode:'dialog'},{autoCombat:true},{tacticsMode:true},{round:0},{spellTargeting:false}])assert(!canCancelSpell({...targeting,...patch}));});
test('Cancel only sends native cancellation, with no spell, creature order or mana mutation',()=>{const {calls,recovery}=setup();assert(recovery.request(targeting));assert.deepEqual(calls,[[14,2]]);recovery.update(restored);assert.equal(recovery.pending,null);assert.deepEqual(calls,[[14,2]]);});
test('Autocombat waits for native cancellation and permission, then starts exactly once',()=>{const {calls,recovery}=setup();recovery.request(targeting,44,1);assert(!recovery.request(targeting,44,1));recovery.update(targeting);recovery.update({...restored,canAutoCombat:false});assert.deepEqual(calls,[[14,2]]);recovery.update(restored);recovery.update(restored);assert.deepEqual(calls,[[14,2],[44,1]]);});
test('Wait and defend cannot become spell actions while cancellation is pending',()=>{for(const action of[12,13]){const {calls,recovery}=setup();recovery.request(targeting,action);recovery.update(targeting);assert.deepEqual(calls,[[14,2]]);recovery.update(restored);assert.deepEqual(calls,[[14,2],[action,0]]);}});
test('Deferred creature orders never affect another creature or another round',()=>{for(const patch of[{activeStack:8},{round:2},{mode:'map'}]){const {calls,recovery,advance}=setup();recovery.request(targeting,12);recovery.update({...restored,...patch});advance();recovery.update({...restored,...patch});assert.deepEqual(calls,[[14,2]]);}});
test('Unacknowledged cancellations time out without activating autocombat',()=>{const {calls,errors,recovery,advance}=setup();recovery.request(targeting,44,1);advance();recovery.update(targeting);assert.equal(recovery.pending,null);assert.equal(errors.length,1);assert.deepEqual(calls,[[14,2]]);});

test('Spell confirmation rejects the selected hex when the native engine marks it invalid',()=>{
 const state={battleCells:[{hex:1,x:50,y:50,spellTarget:false},{hex:2,x:94,y:50,spellTarget:true}]};
 assert.equal(spellTargetCell(state,{x:52,y:51}),null);
 assert.equal(spellTargetCell(state,{x:96,y:49})?.hex,2);
});
