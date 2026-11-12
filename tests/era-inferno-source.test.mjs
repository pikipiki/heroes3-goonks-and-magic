import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import{execFileSync}from'node:child_process';
import{validateRuntimePolicy}from'../scripts/era-bridge/runtime-policy.mjs';
import {readInfernoSourceDefinition,sourceRangedResistanceInput} from '../scripts/era-bridge/roster8/inferno-source.mjs';
test('source ranged resistance truncates float32 input before the downstream partial block',()=>{
 assert.equal(sourceRangedResistanceInput(10),6);assert.equal(sourceRangedResistanceInput(100),69);
 assert.equal(sourceRangedResistanceInput(10,{lastAction:6}),10);
 assert.equal(sourceRangedResistanceInput(10,{stackResistance:-0.3}),10);
 assert.equal(sourceRangedResistanceInput(100,{stackResistance:0.1}),59);
 assert.throws(()=>sourceRangedResistanceInput(2**31),/signed/);
});
test('original Inferno contracts remain incomplete until native arithmetic and demon summoning are validated',{skip:!process.env.TUM_SOURCE},()=>{
 for(const id of[337,338]){const item=readInfernoSourceDefinition(fs.readFileSync(`${process.env.TUM_SOURCE}/Data/Creatures/${id}.cfg`,'utf8'),id);assert.equal(item.complete,false);assert(item.pendingNativeOperations.length);}
 assert.throws(()=>readInfernoSourceDefinition('Flags=272',337),/Unreviewed/);
});

test('native fixed source30 arithmetic matches signed-int source probes without accepting other actors',()=>{
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-inferno-float-'));
 try{const header=path.resolve('work/vcmi-wasm/lib/era/EraSourceRangedResistance.h');fs.writeFileSync(temporary+'/probe.cpp',`#include ${JSON.stringify(header)}\n#include <cassert>\nint main(){using era_bridge::sourceRangedResistance30;assert(sourceRangedResistance30(10)==6);assert(sourceRangedResistance30(100)==69);assert(sourceRangedResistance30(0)==0);assert(sourceRangedResistance30(2147483647)==1503238527);}`);execFileSync(process.env.CXX||'c++',['-std=c++17','-fsanitize=undefined','-fno-sanitize-recover=all',temporary+'/probe.cpp','-o',temporary+'/probe']);execFileSync(temporary+'/probe');}finally{fs.rmSync(temporary,{recursive:true,force:true});}
 for(const id of[337,338])assert(validateRuntimePolicy({schemaVersion:1,creatures:{['tum-era:eraCreature'+id]:{sourceRangedResistance30:{}}}}));
 assert.throws(()=>validateRuntimePolicy({schemaVersion:1,creatures:{'tum-era:eraCreature350':{sourceRangedResistance30:{}}}}),/Invalid/);
 assert.throws(()=>validateRuntimePolicy({schemaVersion:1,creatures:{'tum-era:eraCreature337':{sourceRangedResistance30:{percent:30}}}}),/Invalid/);
});
