import test from'node:test';import assert from'node:assert/strict';
import{compileSilenceCape,SILENCE_CAPE_SOURCE_IDS}from'../scripts/era-bridge/artifacts/silence-cape.mjs';
test('Source267 preserves its22 exact spell immunities, not a bilateral level cap',()=>{
 const cfg='Immunities='+SILENCE_CAPE_SOURCE_IDS.join(', '),result=compileSilenceCape({text:cfg,resolveSpell:id=>'core:spell'+id,baseArtifact:{type:['HERO'],class:'RELIC',value:15000,slot:['SHOULDERS'],text:{name:'Cape of Silence',description:'Actual source immunities',event:''}},resolveAssets:()=>({image:'test.png',map:'test.def',scenarioBonus:'scenario.png'})});
 assert(result.ok,JSON.stringify(result.diagnostics));assert.equal(Object.keys(result.definition.bonuses).length,22);
 for(const id of new Set(SILENCE_CAPE_SOURCE_IDS))assert.deepEqual(result.definition.bonuses['immunity'+id],{type:'SPELL_IMMUNITY',subtype:'core:spell'+id});
 for(const omitted of[15,30,35,44])assert.equal(result.definition.bonuses['immunity'+omitted],undefined);
 assert(result.definition.bonuses.immunity18);assert(result.definition.bonuses.immunity36);
 assert.throws(()=>compileSilenceCape({text:cfg.replace(', 18','')}));
 assert.throws(()=>compileSilenceCape({text:cfg+'\nAttack=1'}));
});
