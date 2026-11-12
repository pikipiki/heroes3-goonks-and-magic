import {test} from 'node:test';
import assert from 'node:assert/strict';
import {contextualBattleAction} from '../web/battle-action.mjs';

test('Contextual confirmation uses authoritative native action and spell names',()=>{
 for(const label of ['Move','Attack','Shoot','Cast Cure','Cast Resurrection','Cast random spell','Heal']){
  const state={battleCells:[{hex:42,x:100,y:200,actionLabel:label}]};
  assert.deepEqual(contextualBattleAction(state,{x:100,y:200}),{label,enabled:true,hex:42});
  assert.equal(contextualBattleAction(state,{x:200,y:200}).enabled,false);
 }
});
test('Illegal, missing and unselected cells cannot issue contextual orders',()=>{
 for(const point of [null,{x:100,y:200}])
  assert.equal(contextualBattleAction({battleCells:[{hex:42,x:100,y:200,reachable:true}]},point).enabled,false);
});
test('An unavailable allied spell keeps its name while confirmation stays disabled',()=>{
 const state={creatureCanCast:true,creatureSpellName:'Cure',battleUnits:[{x:100,y:200,enemy:false}],battleCells:[{hex:42,x:100,y:200}]};
 assert.deepEqual(contextualBattleAction(state,{x:100,y:200}),{label:'Cast Cure',enabled:false,hex:42});
});
test('Hero and multi-stage creature spells keep the native target legality and selected name',()=>{
 const state={spellTargeting:true,selectedSpell:'Teleport',battleCells:[{hex:42,x:100,y:200,spellTarget:true},{hex:43,x:144,y:200,spellTarget:false}]};
 assert.deepEqual(contextualBattleAction(state,{x:100,y:200}),{label:'Cast Teleport',enabled:true,hex:42});
 assert.equal(contextualBattleAction(state,{x:144,y:200}).enabled,false);
 assert.equal(contextualBattleAction({...state,battleCells:[{hex:42,x:100,y:200}]},{x:100,y:200}).enabled,false);
});
