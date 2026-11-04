import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{createSourceDeathBlowBinding}from'../scripts/era-bridge/creatures/death-blow-contract.mjs';import{compileCreatureProperties}from'../scripts/era-bridge/creatures/creature-properties.mjs';import{parseCreatureExperience,compileCreatureExperience}from'../scripts/era-bridge/creatures/crexpbon.mjs';
const binding=(sourceId,kind)=>createSourceDeathBlowBinding({contract:'source-deathblow-crt-v1',sourceId,nativeId:sourceId===238?'tum-era:ancestralBehemoth':'tum-era:eraCreature'+sourceId,kind,nativeExperienceProfile:true}),fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/tum/experience-corpus.json',import.meta.url))),negative=parseCreatureExperience(fixture.source).filter(r=>r.creature<0),installedRows=parseCreatureExperience(fixture.installed);
test('CFG DeathBlow requires explicit actor/profile/CRT operation binding, not a permissive callback',()=>{
 const opts={freshDefinition:true,sourceBinaryParity:true,sourceCreatureId:318,nativeExperienceProfile:true};
 assert.throws(()=>compileCreatureProperties('DeathBlow=25',opts),/UNBOUND_RUNTIME_POLICY/);
 assert.throws(()=>compileCreatureProperties('DeathBlow=25',{...opts,runtimeBindings:{'era-death-blow-crt':{validate:()=>true,implementation:'fake',evidence:['fake']}}}),/UNBOUND_RUNTIME_POLICY/);
 const r=compileCreatureProperties('DeathBlow=25',{...opts,deathBlowCRT:binding(318,'cfg')});assert(r.ready);assert.equal(r.definition.abilities.amethyst_DeathBlow.type,'DOUBLE_DAMAGE_CHANCE');assert.equal(r.definition.abilities.amethyst_DeathBlow.val,25);assert.equal(r.policies[0].binding.operation,'deathBlowCRT');
 assert.throws(()=>compileCreatureProperties('DeathBlow=25',{...opts,nativeExperienceProfile:false,deathBlowCRT:binding(318,'cfg')}),/INVALID_DEATH_BLOW_BINDING/);
 assert.throws(()=>binding(319,'cfg'),/binding-required/);assert.equal(compileCreatureProperties('DeathBlow=50',{...opts,sourceCreatureId:238,deathBlowCRT:binding(238,'cfg')}).definition.abilities.amethyst_DeathBlow.val,50);
});
test('XP DeathBlow preserves exact319 R0/R10 and361ranks, and returns required runtime enrollment',()=>{
 for(const[id,values]of[[319,[1,1,2,3,4,5,10,15,20,25,30]],[361,[0,2,5,7,10,12,15,17,20,22,25]]]){
 const row={creature:id,code:'e',modifier:'=',values,source:'sourceDeathBlow',line:1},opts={creatureId:id,installedRows,rankZero:'intrinsic',nativeExperienceProfile:true};
 const fail=compileCreatureExperience([...negative,row],opts);assert(!fail.ok);assert.equal(fail.definition,null);
 const r=compileCreatureExperience([...negative,row],{...opts,deathBlowCRT:binding(id,'xp')});assert(r.ok);assert.equal(r.runtimeBindings.length,1);assert.equal(r.runtimeBindings[0].operation,'deathBlowCRT');assert.equal(r.runtimeBindings[0].nativeId,'tum-era:eraCreature'+id);assert.deepEqual(r.runtimeBindings[0].parameters,{});assert.equal(r.requirements.deathBlowCRT,'source-deathblow-crt-v1');assert.equal(r.requirements.experienceStatusSelectors,undefined);
 const intrinsic=Object.values(r.definition.abilities).filter(b=>b.type==='DOUBLE_DAMAGE_CHANCE').reduce((n,b)=>n+b.val,0),xp=r.definition.stackExperience.find(x=>x.bonus.type==='DOUBLE_DAMAGE_CHANCE');assert.equal(intrinsic,values[0]);assert.equal(intrinsic+xp.values[9],values[10]);assert.equal(compileCreatureExperience([...negative,row,row],{...opts,deathBlowCRT:binding(id,'xp')}).ok,false);
 }
});
