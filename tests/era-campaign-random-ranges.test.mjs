import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {compileErm} from '../scripts/era-bridge/campaigns/parser.mjs';
import {mergePrograms} from '../scripts/era-bridge/campaigns/importer.mjs';
import {randomRangesFixture,randomBounds} from '../work/browser-tests/wog-era3-random-ranges-cases.mjs';

test('ERA3 three-argument VR:R carries an explicit AST capability without changing the classic simple form',()=>{
 const p=compileErm('ZVSE2\n!#VRv1:R999/-12/-1;');
 assert.equal(p.schemaVersion,7);assert.equal(p.randomRanges,'era3-integers');assert.equal(p.functionArguments,'era3-integers');
 assert.deepEqual(p.initializers[0].operations[0].args.map(a=>a.number),[999,-12,-1]);
 const old=compileErm('!#VRv1:R12;');assert.equal(old.schemaVersion,1);assert(!Object.hasOwn(old,'randomRanges'));assert.equal(compileErm('ZVSE2\n!#VRv1:R12;').schemaVersion,7);
});

test('random ranges reject unadmitted seeding, independent-generator forms and non-integer bounds',()=>{
 for(const source of ['!#VRv1:R0/123;','!#VRv1:R0/1/12/99;','!#VRv1:T0/1/12;','!#VRv1:R0/?v2/12;','!#VRv1:R0/d/12;','!#VRz1:R0/1/12;'])
  assert.throws(()=>compileErm('ZVSE2\n'+source),/random|integer/i);
 assert.throws(()=>compileErm('!#VRv1:R0/1/12;'),/ERA3 dialect/);
});

test('merged ERA3 programs retain random, string-local and function-metadata capabilities',()=>{
 const entries=[['random','!#VRv1:R0/1/12;'],['strings','!?FU1;!!VR(name:z):S^name^;'],['metadata','!?FU2;!!FU:A?y1;']].map(([id,body])=>({id,bytes:Buffer.from('ZVSE2\n'+body)}));
 const p=mergePrograms(entries,{source:'combined random probe'});
 assert.equal(p.schemaVersion,7);assert.equal(p.randomRanges,'era3-integers');assert.equal(p.stringLocals,'era3-z-ascii');assert.equal(p.functionMetadata,'era3-integers');
});

const root=path.resolve('work/vcmi-wasm'),boost=process.env.GOONK_BOOST_INCLUDE||'/usr/include';
test('native random range assignment preserves bounds, draw counts and legacy arithmetic',{
 skip:process.platform==='linux'&&fs.existsSync(path.join(boost,'boost/version.hpp'))?false:'Requires Linux compiler and Boost; also verified in the isolated native and WebAssembly builds',
},()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-random-ranges-'));
 try{
  const binary=path.join(directory,'test');
  execFileSync(process.env.CXX||'c++',['-std=c++20','-O0','-g','-ffunction-sections','-fdata-sections','-fsanitize=address,undefined',...[root,path.join(root,'lib'),path.join(root,'include'),boost].map(p=>'-I'+p),'tests/native/EraCampaignRandomRanges.test.cpp',path.join(root,'lib/json/JsonNode.cpp'),'-Wl,--gc-sections','-o',binary],{timeout:180000});
  execFileSync(binary,{timeout:30000});
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});

test('native explicit random ranges survive checkpoint replay and suspended saves on touch and mouse',()=>{
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 const proof=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/era3-random-ranges-native-validation.json'));
 for(const flag of ['activation','completeRules','profilesAdmitted'])assert.equal(proof[flag],false);
 for(const[file,hash]of Object.entries(proof.sourceBindings))assert.equal(sha(fs.readFileSync(file)),hash,file);
 for(const source of proof.upstreamReference.sources)for(const fragment of source.fragments)assert.equal(sha(fragment.text),fragment.sha256);
 assert.equal(proof.nativeBuild.exitCode,0);assert.equal(proof.linuxSanitizers.exitCode,0);assert(proof.linuxSanitizers.regressions.every(r=>r.exitCode===0));
 assert.equal(proof.sourceAudit.trackedFilesChecked,3004);assert.deepEqual(proof.sourceAudit.mismatches,[]);
 assert.equal(proof.serialization.previousSaveVersion,921);assert.equal(proof.serialization.newSaveVersion,922);assert.equal(proof.serialization.choiceCount,19);
 for(const report of Object.values(proof.reports)){
  assert(report.passed);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,proof.engineSha256);
  const s=report.scenarios[0];assert.equal(s.programSha256,randomRangesFixture().sha256);assert.equal(s.nativeSaveVersion,922);
  assert(s.checkpointReplayPreservesNativeRandomSequence&&s.nestedNativeSaveReload&&s.completedNativeSaveReload&&s.assignmentReplacesPreviousValue&&s.signedAndFullInt32Bounds);
  assert.equal(s.fixed,'RANGE FIXED 7/9/-11/-2147483648/2147483647/123');assert.deepEqual(s.bounds,randomBounds);
  for(const values of [s.before,s.after])values.forEach((n,i)=>assert(Number.isInteger(n)&&n>=randomBounds[i][0]&&n<=randomBounds[i][1]));
 }
 assert.equal(proof.reports.touchPortrait.scenarios[0].viewport.width,390);assert.equal(proof.reports.desktopMouse.scenarios[0].input,'mouse');
 assert.deepEqual(proof.legacyAst.differences,[]);assert.deepEqual(proof.legacyAst.mergedDifferences,[]);assert(proof.legacyAst.caveByteIdentical);
 for(const r of Object.values(proof.nativeRegressions)){assert(r.passed);assert.deepEqual(r.errors,[]);assert.equal(r.engineSha256,proof.engineSha256);}
 const reader=proof.oldReaderControl.scenarios[0];assert.equal(reader.futureVersion,922);assert.equal(reader.readerVersion,921);assert(reader.rejectedBeforeScriptExecution);
});
