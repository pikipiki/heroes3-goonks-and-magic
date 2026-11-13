import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {compileCreatureExperience,parseCreatureExperience} from '../scripts/era-bridge/creatures/crexpbon.mjs';
const contract='source-experience-magic-reduction-v1';
const row=values=>`355\tg\t%\t${values.join('\t')}`;
const compile=text=>compileCreatureExperience(parseCreatureExperience(text),{creatureId:355,installedRows:[],rankZero:'intrinsic',nativeExperienceProfile:true});
test('only source g rows carry explicit metadata, including an observable rank-zero g0',()=>{
 const values=[0,5,10,20,30,40,50,60,70,90,95],result=compile(row(values));
 assert.equal(result.ok,true,JSON.stringify(result.diagnostics));
 const intrinsic=result.definition.abilities.crexp_0_rank0;
 assert.equal(intrinsic.val,0);
 assert.deepEqual(intrinsic.addInfo,{contract,sourceCreatureId:355});
 const xp=result.definition.stackExperience.find(r=>r.bonus.type==='SPELL_DAMAGE_REDUCTION');
 assert.deepEqual(xp.bonus.addInfo,intrinsic.addInfo);
 assert.deepEqual(xp.values,values.slice(1));
 assert.equal(compile(row(values)+'\n'+row(values)).ok,false,'Original14-record scan returns first g: ambiguous duplicate compilation is rejected');
 assert.equal(compile(row(Array(11).fill(256))).ok,false,'Original g values are unsigned bytes');
 const ordinary=compileCreatureExperience(parseCreatureExperience(`355\tW\t+\t${Array(11).fill(5).join('\t')}`),{creatureId:355,installedRows:[],rankZero:'intrinsic'});
 assert(!Object.values(ordinary.definition.abilities).some(x=>x.addInfo?.contract===contract));
});
test('source F32 store and integer truncation precede protection, with defined saturation at Win32 overflow',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'era-g-magic-'));
 try{
  const source=path.join(dir,'test.cpp'),binary=path.join(dir,'test');
  fs.writeFileSync(source,`#include <cassert>\n#include <cstdint>\n#include <limits>\n#include "${path.resolve('work/vcmi-wasm/lib/era/EraExperienceMagicReduction.h')}"\nint main(){using era_bridge::sourceExperienceMagicReduction;assert(sourceExperienceMagicReduction(170,5)==161);assert(sourceExperienceMagicReduction(30,95)==1);assert(sourceExperienceMagicReduction(30,95)*70/100==0);assert((30*70/100)*5/100==1);assert(sourceExperienceMagicReduction(30,100)==0);assert(sourceExperienceMagicReduction(30,255)==0);assert(sourceExperienceMagicReduction(30,0)==30);assert(sourceExperienceMagicReduction(16777217,0)==16777216);assert(sourceExperienceMagicReduction(16777219,0)==16777220);assert(sourceExperienceMagicReduction(INT32_MAX,0)==INT32_MAX);assert(sourceExperienceMagicReduction(INT64_MAX,0)==INT32_MAX);assert(sourceExperienceMagicReduction(-1,95)==0);}\n`);
  const build=spawnSync('clang++',['-std=c++17','-fsanitize=undefined','-fno-sanitize-recover=all',source,'-o',binary],{encoding:'utf8'});
  assert.equal(build.status,0,build.stderr);const run=spawnSync(binary,[],{encoding:'utf8'});assert.equal(run.status,0,run.stderr);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
