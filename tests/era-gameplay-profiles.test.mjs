import test from 'node:test';
import assert from 'node:assert/strict';
import {profileAdmission,profileDefinitions} from '../scripts/era-bridge/gameplay/profiles.mjs';

test('Advanced Classes and Reborn are separate profile targets',()=>{
 const ac=profileDefinitions.find(profile=>profile.id==='advanced-classes');
 const reborn=profileDefinitions.find(profile=>profile.id==='reborn');
 assert(!ac.packs.includes('reborn'));
 assert(!reborn.packs.includes('advanced-classes'));
 for(const definition of profileDefinitions){
  const result=profileAdmission(definition.id,{packs:[]});
  assert.equal(result.enabled,false);
  assert.equal(result.blockers.length,definition.packs.length);
 }
});

test('source files and arithmetic tests do not admit a native gameplay profile',()=>{
 const packs=profileDefinitions.find(profile=>profile.id==='wog').packs
  .map(id=>({id,sha256:'source-'+id,files:[{file:'source.erm'}]}));
 const arithmetic=packs.map(pack=>({pack:pack.id,status:'arithmetic-unit-tested',sourceSha256:pack.sha256}));
 assert.equal(profileAdmission('wog',{packs},arithmetic).enabled,false);
 assert.throws(()=>profileAdmission('anything',{packs}),/Unknown/);
});

test('native system proofs are tied to each source pack and require persistence, AI and UI checks',()=>{
 const packs=profileDefinitions.find(profile=>profile.id==='wog').packs
  .map(id=>({id,sha256:'source-'+id,files:[{file:'source.erm'}]}));
 const proofs=packs.map(pack=>({pack:pack.id,status:'validated-native-system',sourceSha256:pack.sha256,
  engineSha256:'engine',saveLoad:true,mobileUI:true,ai:true,completeRules:true}));
 assert.equal(profileAdmission('wog',{packs},proofs).enabled,true);
 for(const key of ['sourceSha256','engineSha256','saveLoad','mobileUI','ai','completeRules']){
  const changed=structuredClone(proofs);changed[0][key]=key==='sourceSha256'?'stale':false;
  assert.equal(profileAdmission('wog',{packs},changed).enabled,false,key);
 }
});
