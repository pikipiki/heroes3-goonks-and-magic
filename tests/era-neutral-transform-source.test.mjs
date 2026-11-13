import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import{execFileSync}from'node:child_process';
import{SOURCE_NEUTRAL_DEPENDENCIES_CONTRACT as contract,DEMILICH_PROC_VALUES,DEMILICH_PERIODIC_VALUES,reviewedNeutralDependency}from'../scripts/era-bridge/roster8/neutral-transform-source.mjs';
import{compileCreatureExperience}from'../scripts/era-bridge/creatures/crexpbon.mjs';
const row=(creature,code,modifier,values)=>({creature,code,modifier,values,source:'owned-source-fixture',line:1});
function compile(rows,enabled=true){return compileCreatureExperience(rows,{creatureId:rows[0].creature,installedRows:[],rankZero:'intrinsic',nativeExperienceProfile:true,experienceNeutralDependencies:enabled?contract:undefined,resolveSpell:id=>'core:spell'+id,resolveCreature:id=>'core:creature'+id});}
test('neutral dependencies admit only exact proven CFG and source rows',()=>{
 for(const[id,flags]of[[286,394242],[294,16403]]){
  assert.equal(reviewedNeutralDependency(`Flags=${flags}\nLevel=${id===286?5:4}`,{sourceId:id,contract}).sourceId,id);
  assert.throws(()=>reviewedNeutralDependency(`Flags=${flags+1}\nLevel=5`,{sourceId:id,contract}));
 }
 const demilich=[row(286,'p','#24',[...DEMILICH_PROC_VALUES]),row(286,'k','#71',[...DEMILICH_PROC_VALUES]),row(286,'U','#60',[...DEMILICH_PERIODIC_VALUES])];
 const bird=[row(294,'r','#100',Array.from({length:11},(_,i)=>i*9)),row(294,'a','#21',Array(11).fill(100))];
 for(const rows of[demilich,bird]){assert.equal(compile(rows).diagnostics.length,0);assert(compile(rows,false).diagnostics.length>0);for(const original of rows){const changed={...original,values:[...original.values]};changed.values[10]--;assert(compile([changed]).diagnostics.length>0);}}
 assert.equal(compile(demilich).definition.abilities.crexp_0_rank0.val,5);assert.equal(compile(bird).definition.abilities.crexp_1_rank0.val,100);
 assert.deepEqual(compile(demilich).runtimeBindings.map(b=>b.operation),['demilichPoison','sourcePeriodicWights']);
 assert.equal(compile(bird).runtimeBindings[0].service.chancePercent,100);
});
test('Demilich periodic summons follow original float32, rank-zero and round2+4n',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-demilich-'));
 try{fs.writeFileSync(tmp+'/probe.cpp',`#include ${JSON.stringify(path.resolve('work/vcmi-wasm/lib/era/EraDemilichSummonRule.h'))}
#include <cassert>
#include <climits>
int main(){using namespace era_bridge;for(int r=0;r<20;r++)assert(demilichSummonRound(r)==(r==2||r==6||r==10||r==14||r==18));assert(demilichSummonCount(10,0)==1);assert(demilichSummonCount(9,0)==0);assert(demilichSummonCount(15,1)==2);assert(demilichSummonCount(3,10)==3);assert(demilichSummonCount(INT_MAX,10)==0);assert(demilichPoisonChance(0)==5);assert(demilichPoisonChance(1)==5);assert(demilichPoisonChance(10)==50);}`);
 execFileSync(process.env.CXX||'c++',['-std=c++17','-fsanitize=undefined','-fno-sanitize-recover=all',tmp+'/probe.cpp','-o',tmp+'/probe']);execFileSync(tmp+'/probe');
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});

test('source FIRE flag uses native tagged fire-school identity, never legacy numeric subtype',async()=>{const{compileCreatureProperties}=await import('../scripts/era-bridge/creatures/creature-properties.mjs');const r=compileCreatureProperties('Flags=16403\nLevel=4',{sourceCreatureId:294,nativeNeutralDependenciesContract:contract,nativeBiologyContract:'source-biological-flags-inanimate-v1',freshDefinition:true,analyseOnly:true});assert.equal(r.definition.abilities.amethyst_flag_14.subtype,'spellSchool.fire');});
