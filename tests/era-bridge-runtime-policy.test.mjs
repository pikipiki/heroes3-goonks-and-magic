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

test('daily resources retain original resource IDs, maxima and per-creature tax; missing fields keep original zero defaults',async()=>{
 const {compileDailyResourceService}=await import('../scripts/era-bridge/runtime-policy.mjs');const options={target:'core:crystalDragon',resolveResource:id=>['core:wood','core:mercury','core:ore','core:sulfur','core:crystal','core:gems','core:gold','wake-of-gods.mithril:mithril'][id]};
 assert.deepEqual(compileDailyResourceService('ResGen_Type=4\nResGen_Amount=1\nLevel=6',options).policy.creatures['core:crystalDragon'].dailyResources,{resource:'core:crystal',amount:1,goldPerCreature:0});
 assert.deepEqual(compileDailyResourceService('ResGen_Tax=25\nResGen_Type=6',options).policy.creatures['core:crystalDragon'].dailyResources,{resource:'core:gold',amount:0,goldPerCreature:25});
 assert.equal(compileDailyResourceService('ResGen_Type=7\nResGen_Amount=1',options).policy.creatures['core:crystalDragon'].dailyResources.resource,'wake-of-gods.mithril:mithril');
 for(const text of ['ResGen_Amount=1','ResGen_Type=8','ResGen_Type=4\nResGen_Tax=-1','ResGen_Type=4\nResGen_Amount=1.5','ResGen_Type=4\nResGen_Type=5'])assert.throws(()=>compileDailyResourceService(text,options));
 assert.throws(()=>compileDailyResourceService('ResGen_Type=4',{...options,resolveResource:()=>undefined}));
});

test('source post-hit selector is exclusive and strict; artifact mimic admits only its verified contract',()=>{
 const creature='tum-era:test',policy=operations=>({schemaVersion:1,creatures:{[creature]:operations}});
 assert.deepEqual(validateRuntimePolicy(policy({blindness:{},spellDamageInversion:{}})).creatures[creature],{blindness:{},spellDamageInversion:{}});
 assert.throws(()=>validateRuntimePolicy(policy({blindness:{},petrification:{}})),/Conflicting/);
 assert.throws(()=>validateRuntimePolicy(policy({blindness:{chance:20}})),/Invalid/);
 assert.equal(validateRuntimePolicy(policy({artifactMimic:{artifact:129},angelicArmyMorale:{supremeArchangel:'wake-of-gods.level8units:supremeArchangel'}})).creatures[creature].artifactMimic.artifact,129);
 assert.equal(validateRuntimePolicy(policy({artifactMimic:{artifact:135}})).creatures[creature].artifactMimic.artifact,135);
 for(const artifact of [128,130,131,132,133,134,'129'])assert.throws(()=>validateRuntimePolicy(policy({artifactMimic:{artifact}})),/Invalid/);
});

test('Physical deflection retains the signed source modifier and all eleven rank values',()=>{
 const rule={modifier:200,values:[0,5,10,15,20,25,30,35,40,45,50]};
 const p={schemaVersion:1,creatures:{'tum-era:gemDragon':{physicalDeflection:rule}}};
 assert.deepEqual(validateRuntimePolicy(p),p);
 for(const invalid of [{...rule,modifier:256},{...rule,values:[0,5]},{...rule,values:[...rule.values.slice(0,10),.5]}])
  assert.throws(()=>validateRuntimePolicy({schemaVersion:1,creatures:{'tum-era:gemDragon':{physicalDeflection:invalid}}}));
});

test('Defense reduction adapter accepts only its audited ninety-five percent contract',()=>{
 const policy={schemaVersion:1,creatures:{'tum-era:ancestralBehemoth':{defenseReduction:{percent:95}}}};
 assert.deepEqual(validateRuntimePolicy(policy),policy);
 for(const percent of [0,80,94,96,100,'95'])assert.throws(()=>validateRuntimePolicy({schemaVersion:1,creatures:{'tum-era:ancestralBehemoth':{defenseReduction:{percent}}}}));
});

test('source vampire adapter admits only the audited Red Bones Dragon and an empty contract',()=>{
 const policy={schemaVersion:1,creatures:{'tum-era:redBonesDragon':{vampireDrain:{}}}};assert.doesNotThrow(()=>validateRuntimePolicy(policy));
 for(const id of ['core:vampireLord','tum-era:other'])assert.throws(()=>validateRuntimePolicy({schemaVersion:1,creatures:{[id]:{vampireDrain:{}}}}));
 for(const value of [{percent:40},null,[]])assert.throws(()=>validateRuntimePolicy({schemaVersion:1,creatures:{'tum-era:redBonesDragon':{vampireDrain:value}}}));
});
