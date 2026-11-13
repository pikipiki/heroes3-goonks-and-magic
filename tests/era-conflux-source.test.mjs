import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import os from'node:os';import path from'node:path';import{spawnSync}from'node:child_process';
import{reviewedConflux,reviewedConfluxExperienceRows,sourceConfluxFireWallTrigger,sourceConfluxFeaturePolicy,SOURCE_CONFLUX_SPELL_RESET_IDS,SOURCE_CONFLUX_CONTRACT}from'../scripts/era-bridge/roster8/conflux-source.mjs';
import{compileCreatureExperience}from'../scripts/era-bridge/creatures/crexpbon.mjs';
import{compileCreatureProperties}from'../scripts/era-bridge/creatures/creature-properties.mjs';
const cfg355='isTeleporter=1\nAfterMeleeSpell=15\nAfterDefendSpell=13\nAfterWoundSpell=29\nAfterActionSpellMastery=0\nFlags=17\nLevel=6\nTown=8\nUpgradesTo=356\nisSorceress=1';
const cfg356='isTeleporter=1\nACAST_CUSTOM_Chance=100\nACAST_CUSTOM_Spell=60\nFlags=17\nLevel=6\nTown=8\nSpell 1=8\nSpell 2=7\nSpell 3=2\nMagicChannel=1\nisAimedCaster=1\nisFaerie=1\nCreatureMimicArtifact2=88\nisVulnerabilityCatalyst=1';
const resolveSpell=id=>({15:'core:magicArrow',16:'core:iceBolt',17:'core:lightningBolt',19:'core:chainLightning',20:'core:frostRing',21:'core:fireball',22:'core:inferno',23:'core:meteorShower'})[id];
test('whole Conflux CFG refuses invented charges/selectors/biology and partial opt-ins',()=>{
 for(const[sourceId,text]of[[355,cfg355],[356,cfg356]]){
  const review=reviewedConflux(text,{sourceId,contract:SOURCE_CONFLUX_CONTRACT,resolveSpell});
  assert.deepEqual(review.featurePolicy.creatures,['tum-era:eraCreature355','tum-era:eraCreature356']);
  assert.throws(()=>reviewedConflux(text,{sourceId,resolveSpell}));
  assert.throws(()=>reviewedConflux(text.replace('Flags=17','Flags=19'),{sourceId,contract:SOURCE_CONFLUX_CONTRACT,resolveSpell}));
  assert.throws(()=>reviewedConflux(text+'\nCasts=10',{sourceId,contract:SOURCE_CONFLUX_CONTRACT,resolveSpell}));
 }
 const abilities=reviewedConflux(cfg356,{sourceId:356,contract:SOURCE_CONFLUX_CONTRACT,resolveSpell}).abilities;
 assert.equal(Object.values(abilities).filter(x=>x.type==='SPELLCASTER').reduce((n,x)=>n+x.addInfo,0),100);
 assert.equal(abilities.sourceFaeriePower.val,100);
 assert.equal(Object.values(abilities).some(x=>x.type==='CASTS'),false,'five charges come from source CRTRAITS, not a duplicated bonus');
});
test('Conflux compiler opt-in leaves other actors unresolved and preserves separate cache identity',()=>{
 const options={freshDefinition:true,nativeExperienceProfile:true,analyseOnly:true,nativeBiologyContract:'source-biological-flags-v1',nativeConfluxContract:SOURCE_CONFLUX_CONTRACT,resolveSpell,resolveTown:id=>'core:conflux',resolveCreature:id=>'tum-era:eraCreature'+id};
 const compiled=compileCreatureProperties(cfg356,{...options,sourceCreatureId:356});
 assert.deepEqual(compiled.policies,[]);
 assert.equal(compiled.definition.abilities.sourceMagicChannel.val,20);
 assert.equal(compiled.definition.abilities.sourceTeleport.subtype,'movementTeleporting');
 assert.equal(compiled.definition.abilities.sourceFaeriePower.val,100);
 assert.throws(()=>compileCreatureProperties(cfg356,{...options,sourceCreatureId:357}),undefined,'neighbouring actor cannot inherit whole-family waiver');
});
test('source summon double-width offset and percentage rounding keep original narrow217 unchanged',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-conflux-source-'));
 try{
  const header=path.resolve('work/vcmi-wasm/lib/era/EraSourceRoundTwoSummon.h');
  fs.writeFileSync(dir+'/main.cpp',`#include ${JSON.stringify(header)}\n#include <cassert>\nint main(){using namespace era_bridge;assert((sourcePitMasterSummonPositions(93,false)==std::array<int,3>{94,76,110}));assert((sourcePitMasterSummonPositions(93,false,true)==std::array<int,3>{95,77,111}));assert((sourcePitMasterSummonPositions(93,true,true)==std::array<int,3>{91,74,108}));assert(sourceRoundTwoSummonCount(24,2)==0);assert(sourceRoundTwoSummonCount(25,2)==1);assert(sourceRoundTwoSummonCount(100,25)==25);}\n`);
  const build=spawnSync('clang++',['-std=c++17','-fsanitize=undefined',dir+'/main.cpp','-o',dir+'/test'],{encoding:'utf8'});assert.equal(build.status,0,build.stderr);
  const run=spawnSync(dir+'/test',[],{encoding:'utf8'});assert.equal(run.status,0,run.stderr);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('Conflux XP requires the exact six rows, preserving independent cast/summon order without native duplication',()=>{
 const audit=JSON.parse(fs.readFileSync('outputs/wog-priorities-0.4.147/conflux-source-audit.json'));
 for(const record of audit.records){
  const rows=record.experience,sourceId=record.sourceId,options={creatureId:sourceId,installedRows:[],rankZero:'intrinsic',nativeExperienceProfile:true,experienceConflux:SOURCE_CONFLUX_CONTRACT,resolveSpell,resolveCreature:id=>'core:elemental'+id};
  assert.equal(reviewedConfluxExperienceRows(rows,{sourceId,contract:SOURCE_CONFLUX_CONTRACT}).rows,6);
  const compiled=compileCreatureExperience(rows,options);assert.equal(compiled.ok,true,JSON.stringify(compiled.diagnostics));
  assert.equal(compiled.runtimeBindings.length,4);assert.equal(compiled.requirements.experienceConflux,SOURCE_CONFLUX_CONTRACT);
  assert.equal(compiled.definition.stackExperience.some(x=>['SPELL_BEFORE_ATTACK','SPELL_AFTER_ATTACK'].includes(x.bonus.type)),false,'runtime service owns every individual cast');
  assert.deepEqual(compiled.runtimeBindings.map(x=>x.sourceCode),sourceId===355?['p','a','p','a']:['u','u','u','u']);
  for(const mutate of[r=>r.slice(1),r=>[...r,r[1]],r=>{[r[1],r[2]]=[r[2],r[1]];return r;},r=>{r[1].values[10]++;return r;}]){
   const invalid=mutate(structuredClone(rows));assert.equal(compileCreatureExperience(invalid,options).ok,false,'missing, duplicate, reordered and mutated rows stay closed');
  }
  assert.equal(compileCreatureExperience(rows,{...options,experienceConflux:undefined}).ok,false);
  assert.equal(compileCreatureExperience(rows,{...options,nativeExperienceProfile:false}).ok,false);
 }
});

test('source355 wall trigger remains a private clone; native Firewall and hero bonuses keep their own path',()=>{
 const original={targetType:'CREATURE',power:10,level:2,flags:{damage:true,negative:true,special:true},levels:{none:{power:10},expert:{power:50}}},copy=sourceConfluxFireWallTrigger(original);
 copy.levels.none.power=999;assert.equal(original.levels.none.power,10);assert.throws(()=>sourceConfluxFireWallTrigger({...original,level:3}));
 const review=reviewedConflux(cfg355,{sourceId:355,contract:SOURCE_CONFLUX_CONTRACT,resolveSpell});assert.equal(review.source.afterDefend.name,'Fire Wall');assert.equal(review.source.afterDefend.duration,2);assert.equal(review.source.afterDefend.hexes,2);
});

test('Tome cache reset list matches independently reconstructed original spellflags, including combo136 only',()=>{
 const proof=JSON.parse(fs.readFileSync('outputs/wog-priorities-0.4.147/spell-artifact-cache-source.json'));
 assert.deepEqual(SOURCE_CONFLUX_SPELL_RESET_IDS,proof.finalFlags);
 const policy=sourceConfluxFeaturePolicy();assert.equal(policy.spellArtifactReset.length,20);assert(policy.spellArtifactReset.includes('core:tomeOfWaterMagic'));assert(policy.spellArtifactReset.includes('core:admiralsHat'));assert(!policy.spellArtifactReset.includes('core:centaursAxe'));
});
