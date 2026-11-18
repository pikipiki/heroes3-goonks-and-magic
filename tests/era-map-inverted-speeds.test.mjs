import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {invertedSpeedFixture} from '../work/browser-tests/wog-map-inverted-speeds-cases.mjs';

test('WoG112 speed arithmetic preserves normal ranges, 32-bit wrap and the MA:S write clamp',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-inverted-speeds-'));
 try{
  const binary=path.join(directory,'test');
  execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','tests/native/EraMapInvertedSpeed.test.cpp','-o',binary]);
  execFileSync(binary);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});

test('native WoG112 uses live map attributes while retaining later edits, terrain bonuses and old saves',()=>{
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 const proof=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/map-inverted-speeds-native-validation.json'));
 for(const flag of ['activation','completeRules','profilesAdmitted'])assert.equal(proof[flag],false);
 for(const[file,hash]of Object.entries(proof.sourceBindings))assert.equal(sha(fs.readFileSync(file)),hash,file);
 for(const part of proof.upstreamReference.fragments)assert.equal(sha(part.text),part.sha256);
 assert.equal(proof.upstreamReference.rule,112);assert.equal(proof.nativeBuild.exitCode,0);assert.equal(proof.linuxSanitizers.exitCode,0);
 assert.equal(proof.sourceAudit.trackedFilesChecked,3004);assert.deepEqual(proof.sourceAudit.mismatches,[]);
 assert.deepEqual(proof.serialization.catalogueCounts,[6,7,13,14,15,16,17,18,19]);
 assert.equal(proof.serialization.previousSaveVersion,917);assert.equal(proof.serialization.newSaveVersion,918);
 assert.equal(proof.programFileSha256,sha(JSON.stringify(invertedSpeedFixture(),null,2)));
 assert.deepEqual(Object.values(proof.reports).map(r=>r.scenarios.length),[6,2,2]);
 for(const report of Object.values(proof.reports)){
  assert(report.passed);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,proof.engineSha256);
  for(const s of report.scenarios){
   assert.equal(s.active,s.choice<0?s.configured:s.choice===1);
   assert.deepEqual(s.rawSpeeds,s.active?[2002,2003,1983,3,9999,8888]:[1,2,20,2000,9999,8888]);
   assert.equal(s.message,'SPEED '+s.rawSpeeds.join(' ')+' ATTR 102 18 19 20 21');
   assert.equal(s.battleSpeeds.nativeGrassBonus,1);assert.equal(s.battleSpeeds.actor,s.rawSpeeds[1]+1);assert.equal(s.battleSpeeds.enemy,s.rawSpeeds[2]);
   for(const flag of ['nativeSaveReload','pendingNativeSaveReload','pendingDialogConfirmedByPointer','reversedGlobalDefault','noInversionReplay'])assert(s[flag]);
   assert.equal(s.nativeSaveVersion,918);
  }
 }
 assert.equal(proof.reports.touchPortrait.scenarios[0].viewport.width,390);assert.equal(proof.reports.desktopMouse.scenarios[0].input,'mouse');
 const legacy=proof.legacySave.scenarios[0];assert(legacy.legacyEighteenChoiceSave);assert(!legacy.active);assert.deepEqual(legacy.rawSpeeds,[1,2,20,2000,9999,8888]);
 assert.equal(proof.legacyProducer.scenarios[0].nativeSaveVersion,917);
 const rejected=proof.oldReaderControl;assert.equal(rejected.futureVersion,918);assert.equal(rejected.readerVersion,917);assert(rejected.rejectedBeforeScriptExecution);
 assert.equal(Object.keys(proof.nativeRegressions).length,10);
 for(const r of Object.values(proof.nativeRegressions)){assert(r.passed);assert.deepEqual(r.errors,[]);assert.equal(r.engineSha256,proof.engineSha256);}
 assert(proof.mobileUI.passed);assert.equal(proof.mobileUI.cases.length,16);
});
