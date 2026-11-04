import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseCreatureExperience} from '../scripts/era-bridge/creatures/crexpbon.mjs';
import {compileFreshSourceExperienceDefaults,adaptSourceOwnHealthExperience,SOURCE_EXPERIENCE_DEFAULTS_CONTRACT} from '../scripts/era-bridge/creatures/source-experience-defaults.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/tum/experience-corpus.json',import.meta.url)));
const source=parseCreatureExperience(fixture.source),installedRows=parseCreatureExperience(fixture.installed);
const options={contract:SOURCE_EXPERIENCE_DEFAULTS_CONTRACT,freshDefinition:true,nativeDefaultCarrier:'creature-json',healthRoundingContract:'source-health-xp-rounding-v1',sourceLevelZeroBased:6,creatureId:265,installedRows,nativeExperienceProfile:true};
test('fresh defaults retain common health and exact ERA tier, not a guessed native-level inverse',()=>{
 const r=compileFreshSourceExperienceDefaults(source,options);
 assert.equal(r.ok,true);assert.equal(r.sourceTier,-7);assert.deepEqual(r.sourceDefaultRows.map(x=>x.sourceCreature),[-8,-7,-7,-7,-7]);
 const bonuses=r.definition.stackExperience;
 assert.equal(bonuses.find(x=>x.bonus.type==='ERA_EXPERIENCE_HEALTH_PERCENT').values[9],50);
 assert.equal(bonuses.find(x=>x.bonus.subtype==='primarySkill.attack').values[9],10);
 assert.equal(compileFreshSourceExperienceDefaults(source,{...options,sourceLevelZeroBased:1}).definition.stackExperience.find(x=>x.bonus.subtype==='primarySkill.attack').values[9],4);
});
test('existing definitions, unknown tiers/contracts and changed installed defaults fail closed',()=>{
 for(const extra of[{freshDefinition:false},{nativeDefaultCarrier:'global-legacy'},{sourceLevelZeroBased:7},{sourceLevelZeroBased:-1},{nativeExperienceProfile:false},{contract:'unknown'},{creatureId:13}])assert.throws(()=>compileFreshSourceExperienceDefaults(source,{...options,...extra}));
 const changed=structuredClone(installedRows);changed.find(x=>x.creature===-8).values[10]++;
 assert.throws(()=>compileFreshSourceExperienceDefaults(source,{...options,installedRows:changed}),/global-tier-defaults-mismatch/);
});
test('own numeric rows replace defaults by type, including an explicit zero-health row',()=>{
 const own=['A','D','M','m'].map((code,i)=>({creature:265,code,modifier:'+',values:[0,0,0,0,0,0,0,0,0,0,9-i],source:'type-replacement-fixture',line:i+1}));
 const r=compileFreshSourceExperienceDefaults([...source,...own],options);
 assert.deepEqual(r.sourceDefaultRows.map(x=>x.code),['H']);
 assert.deepEqual(r.sourceDefaultsReplacedByOwn.map(x=>x.code),['A','D','M','m']);
 assert.equal(own.find(x=>x.code==='A').values[10],9);
 const zeroHealth={creature:265,code:'H',modifier:'%',values:Array(11).fill(0),source:'explicit-zero',line:1};
 const withoutHealth=compileFreshSourceExperienceDefaults([...source,zeroHealth],options);
 assert(!withoutHealth.definition.stackExperience.some(x=>x.bonus.type==='ERA_EXPERIENCE_HEALTH_PERCENT'));
});
test('health fallback remains an explicit obligation until the native rounding adapter is selected',()=>{
 const r=compileFreshSourceExperienceDefaults(source,{...options,healthRoundingContract:undefined});
 assert.equal(r.ok,false);assert.equal(r.definition,null);assert.equal(r.runtimeObligations[0].code,'source-health-rounding-adapter-required');
 assert(!r.nativePreview.stackExperience.some(x=>x.bonus.type==='STACK_HEALTH'));
});

test('own H replaces common H and must use the source rounding type exactly once',()=>{
 const src={code:'H',modifier:'%',values:[0,2,4,6,8,10,12,14,16,18,20]};
 const unrelated={bonus:{type:'FEARFUL',val:0,valueType:'INDEPENDENT_MIN'},values:Array(10).fill(true)};
 const legacy={bonus:{type:'STACK_HEALTH',valueType:'PERCENT_TO_BASE'},values:src.values.slice(1)};
 const r=adaptSourceOwnHealthExperience([unrelated,legacy],[src],options.healthRoundingContract);
 assert.deepEqual(r.stackExperience[0],unrelated);assert.equal(r.convertedOwnHealth,1);
 assert.equal(r.stackExperience[1].bonus.type,'ERA_EXPERIENCE_HEALTH_PERCENT');
 assert.equal(legacy.bonus.type,'STACK_HEALTH','Input own rows remain unchanged');
 const fallback=adaptSourceOwnHealthExperience([legacy],[],options.healthRoundingContract,src);assert.equal(fallback.verifiedDefaultHealth,1);
 assert.throws(()=>adaptSourceOwnHealthExperience([legacy],[],options.healthRoundingContract),/unexplained/);
 assert.throws(()=>adaptSourceOwnHealthExperience([legacy],[src]),/adapter-required/);
 assert.throws(()=>adaptSourceOwnHealthExperience([legacy,legacy],[src],options.healthRoundingContract),/count-mismatch/);
});
