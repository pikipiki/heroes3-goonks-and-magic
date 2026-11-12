import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import{parseJsonc}from'../scripts/era-bridge/artifacts/importer.mjs';import{originalRetaliationDefinition,ORIGINAL_RETALIATION_SHIELD,validateOriginalRetaliationShield}from'../scripts/era-bridge/artifacts/original-retaliation157.mjs';
test('Original157 retains the existing identity and Defense2, removes only the alternate damage bonus',()=>{
 const original=parseJsonc(fs.readFileSync('mod/wake-of-gods/Mods/artifacts/content/config/artifacts/crimsonShieldOfRetribution.json','utf8'));
 original.crimsonShieldOfRetribution.bonuses.reduceDamage??={type:'CREATURE_DAMAGE',subtype:'creatureDamageBoth',val:-50,valueType:'PERCENT_TO_BASE',propagator:'BATTLE_WIDE'};
 const copy=structuredClone(original),next=originalRetaliationDefinition(original);
 assert.deepEqual(original,copy);assert.equal(next.crimsonShieldOfRetribution.bonuses.reduceDamage,undefined);assert.deepEqual(next.crimsonShieldOfRetribution.bonuses.defence,original.crimsonShieldOfRetribution.bonuses.defence);assert.deepEqual(next.crimsonShieldOfRetribution.graphics,original.crimsonShieldOfRetribution.graphics);assert.deepEqual(Object.keys(next),['crimsonShieldOfRetribution']);
 assert.deepEqual(validateOriginalRetaliationShield({schemaVersion:1,artifact:ORIGINAL_RETALIATION_SHIELD}),{schemaVersion:1,artifact:ORIGINAL_RETALIATION_SHIELD});
 assert.throws(()=>validateOriginalRetaliationShield({schemaVersion:1,artifact:'tum-era:artifact157'}));assert.throws(()=>validateOriginalRetaliationShield({schemaVersion:1,artifact:ORIGINAL_RETALIATION_SHIELD,preemptive:true}));assert.throws(()=>originalRetaliationDefinition(next));
});
