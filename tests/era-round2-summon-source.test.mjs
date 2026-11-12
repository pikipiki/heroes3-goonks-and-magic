import test from'node:test';import fs from'node:fs';import path from'node:path';import os from'node:os';import{execFileSync}from'node:child_process';
test('source Pit Master round2 count rounding and ordered forward positions retain parity/edge rules',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-u217-'));try{fs.writeFileSync(tmp+'/probe.cpp',`#include ${JSON.stringify(path.resolve('work/vcmi-wasm/lib/era/EraSourceRoundTwoSummon.h'))}\n#include <cassert>\nint main(){using namespace era_bridge;assert(sourceRoundTwoSummonCount(5,10)==1);assert(sourceRoundTwoSummonCount(4,10)==0);assert(sourceRoundTwoSummonCount(15,25)==4);assert(sourceRoundTwoSummonCount(0,25)==0);auto a=sourcePitMasterSummonPositions(93,false);assert(a[0]==94&&a[1]==76&&a[2]==110);auto d=sourcePitMasterSummonPositions(93,true);assert(d[0]==92&&d[1]==75&&d[2]==109);assert(sourcePitMasterSummonPositions(15,false)[0]==-1);assert(sourcePitMasterSummonPositions(-1,false)[0]==-1);for(int row=0;row<11;++row)for(int col=1;col<16;++col)for(bool defender:{false,true})for(int h:sourcePitMasterSummonPositions(row*17+col,defender))assert(h==-1||(h>=0&&h<187&&h%17>=1&&h%17<=15));}`);execFileSync(process.env.CXX||'c++',['-std=c++17','-fsanitize=undefined','-fno-sanitize-recover=all',tmp+'/probe.cpp','-o',tmp+'/probe']);execFileSync(tmp+'/probe');}finally{fs.rmSync(tmp,{recursive:true,force:true});}
});

import assert from'node:assert/strict';
import{compileCreatureExperience,parseCreatureExperience}from'../scripts/era-bridge/creatures/crexpbon.mjs';
import{validateRuntimePolicy}from'../scripts/era-bridge/runtime-policy.mjs';
test('source u217 operation is admitted only for exact ranks, canonical identity and explicit contract',()=>{
 const values=[0,0,0,10,10,15,15,20,20,25,25],rows=parseCreatureExperience([[217,'u','#48',...values].join('\t')].join('\n'));
 const args={creatureId:217,installedRows:[],nativeExperienceProfile:true,rankZero:'intrinsic'};
 assert.equal(compileCreatureExperience(rows,args).ok,false);
 const compiled=compileCreatureExperience(rows,{...args,experienceDemonology:'source-demonology-mode2-v1'});assert.equal(compiled.ok,true);assert.equal(compiled.runtimeBindings[0].operation,'sourceRoundTwoDemons');
 assert(validateRuntimePolicy({schemaVersion:1,creatures:{'third-upgrades:tumPitMaster':{sourceRoundTwoDemons:{values}}}}));
 assert.throws(()=>validateRuntimePolicy({schemaVersion:1,creatures:{'tum-era:eraCreature217':{sourceRoundTwoDemons:{values}}}}),/Invalid/);
 assert.throws(()=>validateRuntimePolicy({schemaVersion:1,creatures:{'third-upgrades:tumPitMaster':{sourceRoundTwoDemons:{values:values.map(()=>25)}}}}),/Invalid/);
 assert.equal(compileCreatureExperience([...rows,...rows],{...args,experienceDemonology:'source-demonology-mode2-v1'}).ok,false);
});
