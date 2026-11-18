import test from 'node:test';
import assert from 'node:assert/strict';
import {compileErm} from '../scripts/era-bridge/campaigns/parser.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {stringLocalsFixture} from '../work/browser-tests/wog-era3-string-locals-cases.mjs';
import {mergePrograms} from '../scripts/era-bridge/campaigns/importer.mjs';

test('ERA3 named string locals allocate negative z banks and retain source array/freeing rules',()=>{
 const p=compileErm('ZVSE2\n!?FU1;!#VA(items[3]:z) (last:z);!!VR(items):S^first^;!!VR(items[-1]):S^last^;!#VA(-items);!#VA(reused[2]:z);!!IF:M^%(last) %(@reused) %(reused[SIZE])^;');
 assert.equal(p.schemaVersion,6);assert.equal(p.stringLocals,'era3-z-ascii');
 assert.deepEqual(p.blocks[0].commands.slice(0,2).map(c=>c.selectors[0].index.number),[-3,-1]);
 assert.equal(p.blocks[0].commands[2].operations[0].args[0].text,'%Z-4 -2 -1');
 assert.throws(()=>compileErm('ZVSE2\n!?FU1;!#VA(a[11]:z);'),/pool exhausted/);
 assert.throws(()=>compileErm('ZVSE2\n!?FU1;!#VA(a[10]:z) (b:z);'),/pool exhausted/);
});

test('dynamic string-array addresses add indices to the negative base and reject text indices',()=>{
 const p=compileErm('ZVSE2\n!?FU1;!#VA(items[3]:z) (idx:y);!!VR(items[idx]):S^value^;!!IF:M^%(@items[i])^;');
 const c=p.blocks[0].commands;
 assert.equal(c[0].operations[0].args[0].number,-3);
 assert.equal(c[0].operations[1].code,'+');
 assert.deepEqual(c[0].operations[2].args.map(a=>a.number),[-3,-1,0,0]);
 assert.equal(c[1].selectors[0].space,'z');assert.equal(c[1].selectors[0].index.space,'y');
 assert.equal(c.at(-1).operations[0].args[0].text,'%Y2');
 assert.throws(()=>compileErm('ZVSE2\n!?FU1;!#VA(a[2]:z) (idx:z);!!VR(a[idx]):S^x^;'),/string local cannot be an array index/);
 assert.throws(()=>compileErm('ZVSE2\n!?FU1;!#VA(a[2]:z);!!IF:M^%(a[i])^;'),/value interpolation is not admitted/);
});

test('local string feature composes with function metadata while older programs retain their AST contract',()=>{
 const p=compileErm('ZVSE2\n!?FU1;!!VR(text:z):S^hello^;!!FU:A?y1;');
 assert.equal(p.schemaVersion,6);assert.equal(p.functionMetadata,'era3-integers');
 const old=compileErm('ZVSE2\n!?FU1;!!VR(value:y):S1;');
 assert.equal(old.schemaVersion,4);assert(!Object.hasOwn(old,'stringLocals'));
 assert.throws(()=>compileErm('ZVSE2\n!?FU1;!!VR(value:e):S1;'),/Unsupported ERM2 local/);
 const source=(id,code)=>({id,bytes:Buffer.from(code)});
 const sources=[source('strings','ZVSE2\n!?FU1;!!VR(value:z):S^text^;'),source('numeric','ZVSE2\n!?FU2;!!VR(value:y):S3;')];
 const merged=mergePrograms(sources,{source:'merged probe'});
 assert.equal(merged.schemaVersion,6);assert.equal(merged.stringLocals,'era3-z-ascii');assert(!Object.hasOwn(merged,'functionMetadata'));
 const metadata=mergePrograms([...sources,source('metadata','ZVSE2\n!?FU3;!!FU:A?y1;')],{source:'merged metadata'});
 assert.equal(metadata.schemaVersion,6);assert.equal(metadata.stringLocals,'era3-z-ascii');assert.equal(metadata.functionMetadata,'era3-integers');
});

const root=path.resolve('work/vcmi-wasm'),boost=process.env.GOONK_BOOST_INCLUDE||'/usr/include';
test('native local strings restore nested callers, events and pending JSON saves',{
 skip:process.platform==='linux'&&fs.existsSync(path.join(boost,'boost/version.hpp'))?false:'Requires Linux compiler and Boost; also verified in the isolated native and WebAssembly builds',
},()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-string-locals-'));
 try{
  const binary=path.join(directory,'test');
  execFileSync(process.env.CXX||'c++',['-std=c++20','-O0','-g','-ffunction-sections','-fdata-sections','-fsanitize=address,undefined',... [root,path.join(root,'lib'),path.join(root,'include'),boost].map(p=>'-I'+p),'tests/native/EraCampaignStringLocals.test.cpp',path.join(root,'lib/json/JsonNode.cpp'),'-Wl,--gc-sections','-o',binary],{timeout:180000});
  execFileSync(binary,{timeout:30000});
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});

test('native string scopes pass touch, mouse, legacy saves and existing gameplay regressions',()=>{
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 const proof=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/era3-string-locals-native-validation.json'));
 for(const flag of ['activation','completeRules','profilesAdmitted'])assert.equal(proof[flag],false);
 for(const[file,hash]of Object.entries(proof.sourceBindings))assert.equal(sha(fs.readFileSync(file)),hash,file);
 for(const fragment of proof.upstreamReference.fragments)assert.equal(sha(fragment.text),fragment.sha256);
 assert.equal(proof.nativeBuild.exitCode,0);assert.equal(proof.linuxSanitizers.exitCode,0);
 assert(proof.linuxSanitizers.regressions.every(r=>r.exitCode===0));
 assert.equal(proof.sourceAudit.trackedFilesChecked,3004);assert.deepEqual(proof.sourceAudit.mismatches,[]);
 assert.equal(proof.serialization.previousSaveVersion,919);assert.equal(proof.serialization.newSaveVersion,920);assert.equal(proof.serialization.choiceCount,19);
 assert(Object.values(proof.serialization.headers).every(h=>h.version===920));
 assert.equal(proof.legacyAst.rows,137);assert.equal(proof.legacyAst.unrepairedPrograms,133);assert.deepEqual(proof.legacyAst.differences,[]);
 const program=stringLocalsFixture();
 for(const r of Object.values(proof.reports)){
  assert(r.passed);assert.deepEqual(r.errors,[]);assert.equal(r.engineSha256,proof.engineSha256);assert.equal(r.scenarios.length,1);
  const s=r.scenarios[0];assert.equal(s.programSha256,program.sha256);
  for(const flag of ['nestedNativeSaveReload','completedNativeSaveReload','negativeBankArrayAddresses','sourceNegativePoolSizeQuirk','dynamicWrite','reusedContentsRetained','earlyExitRestoresCaller','matchingHandlersShareBank','initializationBankRestored'])assert(s[flag],flag);
  assert.equal(s.seen.length,10);assert.equal(s.seen[1],'STR PARENT alpha/beta+/gamma size -1 addr -3/-1/-2');assert.equal(s.seen.at(-1),'STR INIT initializer global persisted');
 }
 assert.equal(proof.reports.touchPortrait.scenarios[0].viewport.width,390);assert.equal(proof.reports.desktopMouse.scenarios[0].input,'mouse');
 assert.equal(Object.keys(proof.nativeRegressions).length,14);
 for(const r of Object.values(proof.nativeRegressions)){assert(r.passed);assert.deepEqual(r.errors,[]);assert.equal(r.engineSha256,proof.engineSha256);}
 assert(proof.legacyPendingSave.passed);assert.equal(proof.legacyPendingSave.scenarios[0].historicalSharedBehavior,false);assert.equal(proof.legacyPendingSave.scenarios[0].nativeSaveVersion,920);
 const rejected=proof.oldReaderControl.scenarios[0];assert.equal(rejected.futureVersion,920);assert.equal(rejected.readerVersion,919);assert(rejected.rejectedBeforeScriptExecution);
 assert(proof.archive.runtimeByteIdenticalToTestedCandidate);assert(proof.archive.runtimeFiles.every(r=>r.identical));
});
