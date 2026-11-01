import{test}from'node:test';import assert from'node:assert/strict';import{compileRegenerationService,validateRuntimePolicy,mergeRuntimePolicies}from'../scripts/era-bridge/runtime-policy.mjs';
test('A 50% ERA regeneration service emits a real native runtime policy without substituting average healing',()=>{const r=compileRegenerationService('RegenerationHitPoints=50\nRegenerationChance=50\nSpell effect=4',{source:'245.cfg',target:'tum-era:nightmareHydra'});assert.deepEqual(r.policy.creatures['tum-era:nightmareHydra'].regeneration,{hitPoints:50,chancePercent:50});assert.deepEqual(r.provenance.otherProperties,[{key:'Spell effect',line:3}]);assert.equal(r.provenance.scope,'regeneration service only');});
test('Native service bridge rejects incomplete, duplicated, unsafe or out-of-range inputs',()=>{for(const text of ['RegenerationChance=50','RegenerationChance=101\nRegenerationHitPoints=50','RegenerationChance=50\nRegenerationChance=100\nRegenerationHitPoints=50'])assert.throws(()=>compileRegenerationService(text,{target:'tum-era:unit'}));assert.throws(()=>compileRegenerationService('RegenerationHitPoints=50\nRegenerationChance=50',{target:'../../bad'}));});

test('Combining service policies preserves other creatures and rejects conflicts or unknown operations',()=>{
 const a=compileRegenerationService('RegenerationHitPoints=50\nRegenerationChance=50',{target:'tum-era:hydra'}).policy,b=compileRegenerationService('RegenerationHitPoints=50\nRegenerationChance=100',{target:'tum-era:red'}).policy;
 assert.equal(Object.keys(mergeRuntimePolicies([a,b]).creatures).length,2);
 const conflict=structuredClone(a);conflict.creatures['tum-era:hydra'].regeneration.chancePercent=100;assert.throws(()=>mergeRuntimePolicies([a,conflict]),/Conflicting/);
 assert.throws(()=>validateRuntimePolicy({schemaVersion:1,creatures:{'tum-era:red':{unknown:{}}}}),/Unknown/);
 assert.throws(()=>validateRuntimePolicy({schemaVersion:1,creatures:{'tum-era:red':{regeneration:{hitPoints:50,chancePercent:100,extra:true}}}}),/Invalid/);
});

test('Rebirth and melee rage policies merge with regeneration without erasing services',()=>{
 const a={schemaVersion:1,creatures:{'tum-era:phoenix':{regeneration:{hitPoints:200,chancePercent:100}}}};
 const b={schemaVersion:1,creatures:{'tum-era:phoenix':{rebirth:{chance:1,fraction:.3,guaranteedFraction:.2}},'tum-era:antichrist':{meleeRage:{}}}};
 const merged=mergeRuntimePolicies([a,b]);assert.equal(merged.creatures['tum-era:phoenix'].regeneration.hitPoints,200);assert.equal(merged.creatures['tum-era:phoenix'].rebirth.fraction,.3);
 for(const rebirth of [{chance:1,fraction:.3},{chance:NaN,fraction:.3,guaranteedFraction:.2},{chance:2,fraction:.3,guaranteedFraction:.2}])assert.throws(()=>validateRuntimePolicy({schemaVersion:1,creatures:{'tum-era:x':{rebirth}}}));
 assert.throws(()=>validateRuntimePolicy({schemaVersion:1,creatures:{'tum-era:x':{meleeRage:{enabled:true}}}}));
 assert.throws(()=>mergeRuntimePolicies([b,{schemaVersion:1,creatures:{'tum-era:phoenix':{rebirth:{chance:0,fraction:.3,guaranteedFraction:.2}}}}]),/Conflicting/);
});

test('Imposed spells use only verified persistent enchantments, and retain mastery zero',async()=>{
 const {compileImposedSpellsService,compileRebirthService}=await import('../scripts/era-bridge/runtime-policy.mjs');
 const r=compileImposedSpellsService('ImposedSpell1Number=29\nImposedSpell1Level=3\nImposedSpell2Number=55\nImposedSpell2Level=0',{target:'tum-era:phoenix',resolveSpell:id=>({29:'core:fireShield',55:'core:slayer'})[id]});
 assert.deepEqual(r.policy.creatures['tum-era:phoenix'].imposedSpells,[{spell:'core:fireShield',mastery:3},{spell:'core:slayer',mastery:0}]);
 assert.throws(()=>compileImposedSpellsService('ImposedSpell1Number=15\nImposedSpell1Level=3',{target:'tum-era:unit',resolveSpell:()=> 'core:magicArrow'}),/Invalid/);
 assert.throws(()=>compileImposedSpellsService('ImposedSpell1Number=29',{target:'tum-era:unit'}),/incomplete/);
 assert.deepEqual(compileRebirthService('rebirth chance=1\nrebirth fraction=0.3\nrebirth sure=0.2',{target:'tum-era:phoenix'}).policy.creatures['tum-era:phoenix'].rebirth,{chance:1,fraction:.3,guaranteedFraction:.2});
});
test('Artifact conversions preserve pair order and reject malformed or conflicting policies',()=>{
 const a={schemaVersion:1,creatures:{},artifacts:{'tum-era:artifact218':{dailyConversions:[{from:'core:woodElf',to:'third-upgrades:tumSharpshooterElf'},{from:'core:grandElf',to:'third-upgrades:tumSharpshooterElf'}]}}};
 assert.deepEqual(validateRuntimePolicy(a),a);assert.deepEqual(mergeRuntimePolicies([a,a]).artifacts,a.artifacts);
 const b=structuredClone(a);b.artifacts['tum-era:artifact218'].dailyConversions.reverse();assert.throws(()=>mergeRuntimePolicies([a,b]),/Conflicting/);
 for(const change of [[],[{from:'woodElf',to:'core:grandElf'}],[{from:'core:woodElf',to:'core:grandElf',cost:0}]])assert.throws(()=>validateRuntimePolicy({...a,artifacts:{'tum-era:artifact218':{dailyConversions:change}}}),/Invalid/);
});
