import{test}from'node:test';import assert from'node:assert/strict';import{compileRegenerationService,validateRuntimePolicy,mergeRuntimePolicies}from'../scripts/era-bridge/runtime-policy.mjs';
test('A 50% ERA regeneration service emits a real native runtime policy without substituting average healing',()=>{const r=compileRegenerationService('RegenerationHitPoints=50\nRegenerationChance=50\nSpell effect=4',{source:'245.cfg',target:'tum-era:nightmareHydra'});assert.deepEqual(r.policy.creatures['tum-era:nightmareHydra'].regeneration,{hitPoints:50,chancePercent:50});assert.deepEqual(r.provenance.otherProperties,[{key:'Spell effect',line:3}]);assert.equal(r.provenance.scope,'regeneration service only');});
test('Native service bridge rejects incomplete, duplicated, unsafe or out-of-range inputs',()=>{for(const text of ['RegenerationChance=50','RegenerationChance=101\nRegenerationHitPoints=50','RegenerationChance=50\nRegenerationChance=100\nRegenerationHitPoints=50'])assert.throws(()=>compileRegenerationService(text,{target:'tum-era:unit'}));assert.throws(()=>compileRegenerationService('RegenerationHitPoints=50\nRegenerationChance=50',{target:'../../bad'}));});

test('Combining service policies preserves other creatures and rejects conflicts or unknown operations',()=>{
 const a=compileRegenerationService('RegenerationHitPoints=50\nRegenerationChance=50',{target:'tum-era:hydra'}).policy,b=compileRegenerationService('RegenerationHitPoints=50\nRegenerationChance=100',{target:'tum-era:red'}).policy;
 assert.equal(Object.keys(mergeRuntimePolicies([a,b]).creatures).length,2);
 const conflict=structuredClone(a);conflict.creatures['tum-era:hydra'].regeneration.chancePercent=100;assert.throws(()=>mergeRuntimePolicies([a,conflict]),/Conflicting/);
 assert.throws(()=>validateRuntimePolicy({schemaVersion:1,creatures:{'tum-era:red':{rebirth:{}}}}),/Unknown/);
 assert.throws(()=>validateRuntimePolicy({schemaVersion:1,creatures:{'tum-era:red':{regeneration:{hitPoints:50,chancePercent:100,extra:true}}}}),/Invalid/);
});
