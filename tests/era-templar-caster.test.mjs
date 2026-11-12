import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {compileSourceTemplarCaster,compileSourceTemplarMorale,SOURCE_TEMPLAR_CASTER_CONTRACT,SOURCE_TEMPLAR_MORALE_CONTRACT} from '../scripts/era-bridge/roster8/templar-caster.mjs';
import {compileCreatureProperties} from '../scripts/era-bridge/creatures/creature-properties.mjs';
import {parseCreatureExperience,compileCreatureExperience} from '../scripts/era-bridge/creatures/crexpbon.mjs';
import {validateRuntimePolicy} from '../scripts/era-bridge/runtime-policy.mjs';
const config=(id,mode)=>`Flags=16\nSpell 1=${mode}\nSpell 2=7\nSpell 3=${mode===8?2:4}\nCastsSpell=${[269,278].includes(id)?25:24}\n`+([269,278].includes(id)?'AlwaysPositiveMorale=1\n':'');
test('original four Templars preserve current-count power and advanced casting',()=>{
 for(const [id,mode]of [[269,8],[278,10],[331,8],[332,10]]){
  const source=config(id,mode),compiled=compileSourceTemplarCaster(source,{sourceId:id,contract:SOURCE_TEMPLAR_CASTER_CONTRACT});
  assert.equal(compiled.mastery,2);assert.equal(compiled.powerPerCreature,1);
  assert.equal(compiled.abilities.sourceActiveSpellPower.val,100);
  assert.equal(compiled.spell,[269,278].includes(id)?'core:destroyUndead':'core:deathRipple');
  const result=compileCreatureProperties(source,{freshDefinition:true,analyseOnly:true,sourceCreatureId:id,nativeBiologyContract:'source-biological-flags-v1',nativeActiveCasterContract:SOURCE_TEMPLAR_CASTER_CONTRACT,...([269,278].includes(id)?{nativePositiveMoraleContract:SOURCE_TEMPLAR_MORALE_CONTRACT}:{})});
  assert.equal(result.policies.length,0);assert.equal(result.definition.abilities.sourceActiveCaster.val,2);
 }
 assert.throws(()=>compileSourceTemplarCaster(config(269,8).replace('CastsSpell=25','CastsSpell=24'),{sourceId:269,contract:SOURCE_TEMPLAR_CASTER_CONTRACT}),/Unreviewed/);
 assert.throws(()=>compileSourceTemplarCaster(config(269,8),{sourceId:270,contract:SOURCE_TEMPLAR_CASTER_CONTRACT}),/Unreviewed/);
});
test('positive source morale is a lower bound, not maximum morale or an additivebonus',()=>{
 assert.deepEqual(compileSourceTemplarMorale(config(269,8),{sourceId:269,contract:SOURCE_TEMPLAR_MORALE_CONTRACT}),{type:'MORALE',val:1,valueType:'INDEPENDENT_MAX'});
 assert.throws(()=>compileSourceTemplarMorale(config(269,8).replace('Flags=16','Flags=131088'),{sourceId:269,contract:SOURCE_TEMPLAR_MORALE_CONTRACT}),/flags/);
 const old=compileCreatureProperties(config(269,8),{freshDefinition:true,analyseOnly:true,sourceCreatureId:269,nativeBiologyContract:'source-biological-flags-v1',resolveSpell:()=> 'core:destroyUndead'});
 assert(old.policies.some(p=>p.kind==='era-positive-morale'));
});
test('new source beforeattack damage spells require exact actor, spell, ranks and opt-in',()=>{
 for(const[id,spell]of [[278,25],[332,24]]){
  const row=parseCreatureExperience([id,'p','#'+spell,...Array.from({length:11},(_,i)=>i*5)].join('\t'));
  const options={creatureId:id,rankZero:'intrinsic',nativeExperienceProfile:true,installedRows:[],resolveSpell:n=>'core:'+(n===25?'destroyUndead':'deathRipple')};
  assert.equal(compileCreatureExperience(row,options).ok,false);
  const compiled=compileCreatureExperience(row,{...options,experienceBeforeAttack:'source-p24-p25-v1'});assert.equal(compiled.ok,true);
  assert.equal(compiled.nativePreview.stackExperience[0].bonus.addInfo,3);assert.equal(compiled.nativePreview.stackExperience[0].values.at(-1),50);
  const corrupt=structuredClone(row);corrupt[0].values[10]=49;assert.equal(compileCreatureExperience(corrupt,{...options,experienceBeforeAttack:'source-p24-p25-v1'}).ok,false);
 }
});
test('real original caster files retain the reviewed modes',{skip:!process.env.TUM_SOURCE},()=>{
 for(const id of[269,278,331,332]){
  const text=fs.readFileSync(process.env.TUM_SOURCE+'/Data/Creatures/'+id+'.cfg','utf8');
  const result=compileSourceTemplarCaster(text,{sourceId:id,contract:SOURCE_TEMPLAR_CASTER_CONTRACT});assert.equal(result.mastery,2);
 }
});

test('Werewolf source regeneration and deflection keep chance separate from rank strength',()=>{
 const rows=parseCreatureExperience([[273,'r','#50',...Array.from({length:11},(_,i)=>i*4)].join('\t'),[273,'L','#125',...Array.from({length:11},(_,i)=>i*6)].join('\t')].join('\n'));
 const options={creatureId:273,rankZero:'intrinsic',nativeExperienceProfile:true,installedRows:[]};
 assert.equal(compileCreatureExperience(rows,options).ok,false);
 const result=compileCreatureExperience(rows,{...options,experienceWerewolf:'source-werewolf-experience-v1'});assert.equal(result.ok,true);
 assert.deepEqual(result.runtimeBindings.map(b=>[b.operation,b.service.chancePercent??b.service.modifier]),[['experienceRegeneration',50],['physicalDeflection',125]]);
 const policy={schemaVersion:1,creatures:{'tum-era:eraCreature273':Object.fromEntries(result.runtimeBindings.map(b=>[b.operation,b.service]))}};
 assert.deepEqual(validateRuntimePolicy(policy),policy);
 const wrong=structuredClone(policy);wrong.creatures['tum-era:eraCreature273'].experienceRegeneration.chancePercent=100;
 assert.throws(()=>validateRuntimePolicy(wrong),/Invalid native/);
 const duplicate=compileCreatureExperience([...rows,rows[0]],{...options,experienceWerewolf:'source-werewolf-experience-v1'});assert.equal(duplicate.ok,false);
});
