import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {parseCreatureExperience,compileCreatureExperience} from '../scripts/era-bridge/creatures/crexpbon.mjs';
import {compileCreatureProperties} from '../scripts/era-bridge/creatures/creature-properties.mjs';
import {validateRuntimePolicy} from '../scripts/era-bridge/runtime-policy.mjs';

test('Golem original partial physical block keeps the fixed50%strength separate from rank chance',()=>{
 for(const id of[271,280]){
  const rows=parseCreatureExperience([id,'L','#49',...Array.from({length:11},(_,i)=>i*5)].join('\t'));
  const options={creatureId:id,rankZero:'intrinsic',nativeExperienceProfile:true,installedRows:[]};
  assert.equal(compileCreatureExperience(rows,options).ok,false);
  const compiled=compileCreatureExperience(rows,{...options,experienceGolem:'source-golem-experience-v1'});assert.equal(compiled.ok,true);
  assert.deepEqual(compiled.runtimeBindings[0].service,{modifier:49,values:[0,5,10,15,20,25,30,35,40,45,50]});
 }
 assert.deepEqual(validateRuntimePolicy({schemaVersion:1,creatures:{'tum-era:eraCreature280':{preemptiveRetaliation:{}}}}).creatures['tum-era:eraCreature280'],{preemptiveRetaliation:{}});
 assert.throws(()=>validateRuntimePolicy({schemaVersion:1,creatures:{'tum-era:eraCreature271':{preemptiveRetaliation:{}}}}),/Invalid native/);
});

test('source Golem nature retains its explicit mind/morale flags without introducing a broad native category',()=>{
 const compile=contract=>compileCreatureProperties('Flags=-2147351551',{freshDefinition:true,analyseOnly:true,nativeBiologyContract:contract});
 const old=Object.values(compile('source-biological-flags-v1').definition.abilities).map(b=>b.type);
 const source=Object.values(compile('source-biological-flags-inanimate-v1').definition.abilities).map(b=>b.type);
 assert(old.includes('NON_LIVING'));assert(!source.includes('NON_LIVING'));assert(source.includes('ERA_SOURCE_INANIMATE'));assert(source.includes('MIND_IMMUNITY'));assert(source.includes('NO_MORALE'));
});

test('real original Dragon Golem preemptive strike is specific to280',{skip:!process.env.TUM_SOURCE},()=>{
 const root=process.env.TUM_SOURCE;
 assert(!/^PreventiveStrike=/m.test(fs.readFileSync(root+'/Data/Creatures/271.cfg','utf8')));
 assert(/^PreventiveStrike=1\s*$/m.test(fs.readFileSync(root+'/Data/Creatures/280.cfg','utf8')));
});
