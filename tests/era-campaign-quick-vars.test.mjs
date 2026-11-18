import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {quickScopeFixture,quickInitial,quickNames} from '../work/browser-tests/wog-era3-quick-scope-cases.mjs';

test('ERA3 FU restores caller quick variables before copy-out while classic and old pending states keep their rules',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-era3-quick-'));
 try{
  const binary=path.join(directory,'test');
  execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','tests/native/Era3QuickVars.test.cpp','-o',binary]);
  execFileSync(binary);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});

test('native ERA3 quick-scope proof covers empty and nested snapshots, output order and migration',()=>{
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 const proof=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/era3-quick-scope-native-validation.json'));
 assert.equal(proof.activation,false);assert.equal(proof.completeRules,false);assert.equal(proof.profilesAdmitted,false);
 for(const [file,hash]of Object.entries(proof.sourceBindings))assert.equal(sha(fs.readFileSync(file)),hash,file);
 for(const fragment of proof.upstreamReference.fragments)assert.equal(sha(fragment.text),fragment.sha256);
 assert.equal(proof.nativeBuild.exitCode,0);assert.equal(proof.nativeBuild.warMachinesAdmitted,false);
 assert.equal(proof.codec.exitCode,0);assert.equal(proof.codec.fullExistingCodecExitCode,0);
 const p=quickScopeFixture();assert.equal(p.schemaVersion,4);
 for(const r of Object.values(proof.reports)){
  assert.equal(r.passed,true);assert.deepEqual(r.errors,[]);assert.equal(r.engineSha256,proof.engineSha256);
  assert.equal(r.programFileSha256,sha(JSON.stringify(p,null,2)));assert.equal(r.scenarios.length,1);
  const s=r.scenarios[0];assert.equal(s.programSha256,p.sha256);assert.equal(s.empty,'QUICK EMPTY RETURN 0');
  assert.deepEqual(s.returned,quickNames.map((_,i)=>i===1?55:1000+i));
  assert.deepEqual(s.root,quickInitial.map((value,i)=>i===0?42:value));
  for(const flag of ['allFifteenQuickRegisters','copyOutAfterRestoration','earlyReturn','emptyScopeNativeSaveReload','nestedNativeSaveReload','completedNativeSaveReload'])assert.equal(s[flag],true,flag);
  assert.equal(s.nativeSaveVersion,proof.serialization.newSaveVersion);
 }
 assert.equal(proof.reports.touchPortrait.scenarios[0].viewport.width,390);
 assert.equal(proof.reports.desktopMouse.scenarios[0].input,'mouse');
 const old=proof.historicalControl.scenarios[0];assert.equal(old.empty,'QUICK EMPTY RETURN 999');
 assert.equal(old.historicalSharedBehavior,true);assert.equal(old.root[2],2002);
 assert.notEqual(proof.historicalControl.engineSha256,proof.engineSha256);
 const migration=proof.legacyPendingSave.scenarios[0];assert.equal(migration.legacyPendingSave,true);assert.equal(migration.historicalSharedBehavior,true);assert.deepEqual(migration.root,old.root);
 const reject=proof.oldReaderControl.scenarios[0];assert.equal(reject.rejectedBeforeScriptExecution,true);
 assert.equal(reject.futureVersion,proof.serialization.newSaveVersion);assert.equal(reject.readerVersion,proof.serialization.previousSaveVersion);
 assert.equal(proof.serialization.newSaveVersion,proof.serialization.previousSaveVersion+1);
 assert.equal(proof.serialization.catalogueCountUnchanged,16);
});

const boost=process.env.GOONK_BOOST_INCLUDE||'/usr/include';
test('production JSON codec persists nested quick-register snapshots and rejects corrupt scopes',{
 skip:process.platform==='linux'&&fs.existsSync(path.join(boost,'boost/version.hpp'))?false:'Requires Linux native compiler and Boost headers; validated in the isolated Linux build',
},()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-era3-quick-codec-'));
 try{
  const binary=path.join(directory,'test'),root=path.resolve('work/vcmi-wasm');
  execFileSync(process.env.CXX||'c++',['-std=c++17','-O0','-g','-ffunction-sections','-fdata-sections','-fsanitize=address,undefined',...['', 'lib','include'].map(p=>'-I'+path.join(root,p)),'-I'+boost,'tests/native/Era3QuickVarsCodec.test.cpp',path.join(root,'lib/json/JsonNode.cpp'),path.join(root,'lib/era/EraCampaignRuntime.cpp'),'-Wl,--gc-sections','-o',binary],{timeout:180000});
  execFileSync(binary,{timeout:30000});
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
