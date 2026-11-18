import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

test('WoG dwelling additions preserve the source object, zero-based level and four exclusions',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-extra-dwellings-'));
 try{
  const binary=path.join(directory,'test');
  execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','tests/native/EraMapExtraDwellingRules.test.cpp','-o',binary]);
  execFileSync(binary);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});

import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {extraDwellingsFixture} from '../work/browser-tests/wog-map-extra-dwellings-cases.mjs';

test('native source117 stocks, exclusions and saved choices pass on touch and mouse',()=>{
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 const proof=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/map-extra-dwellings-native-validation.json'));
 for(const flag of ['activation','completeRules','profilesAdmitted'])assert.equal(proof[flag],false);
 for(const[file,hash]of Object.entries(proof.sourceBindings))assert.equal(sha(fs.readFileSync(file)),hash,file);
 for(const part of proof.upstreamReference.fragments)assert.equal(sha(part.text),part.sha256);
 assert.equal(proof.nativeBuild.exitCode,0);assert.equal(proof.nativeBuild.warMachinesAdmitted,false);
 assert.equal(proof.linuxSanitizers.exitCode,0);
 assert.deepEqual(proof.serialization.catalogueCounts,[6,7,13,14,15,16,17]);
 assert.equal(proof.serialization.previousSaveVersion,915);assert.equal(proof.serialization.newSaveVersion,916);
 const program=extraDwellingsFixture();
 assert.deepEqual(Object.values(proof.reports).map(r=>r.scenarios.length),[6,3,3]);
 for(const report of Object.values(proof.reports)){
  assert.equal(report.passed,true);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,proof.engineSha256);
  assert.equal(report.programFileSha256,sha(JSON.stringify(program,null,2)));
  for(const s of report.scenarios){
   assert.equal(s.active,s.choice<0?s.configured:s.choice===1);
   assert.equal(s.first['core:archer'],9);assert.equal(s.restored['core:archer'],9);
   if(s.active){
    const key=s.neutralTown?'core:airElemental':'core:boar';
    assert.equal(s.first[key],12);assert.equal(s.restored[key],11);assert.equal(s.dayTwo[key],11);
    assert.equal(s.first['core:orc'],7);assert.equal(s.restored['core:orc'],7);
    assert.equal(s.oneCreatureRecruitedBySlider,true);
   }
   assert.equal(s.exclusions.length,6);
   for(let i=0;i<5;i++)assert.match(s.exclusions[i],/-1\/0 option [01]$/);
   assert.match(s.exclusions[5],/32\/6 33\/6 option [01]$/);
   for(const flag of ['nativeSaveReload','reversedGlobalDefault','noInitialStockReplay'])assert.equal(s[flag],true);
   assert.equal(s.nativeSaveVersion,916);
  }
 }
 assert.equal(proof.reports.touchPortrait.scenarios[0].viewport.width,390);
 assert.equal(proof.reports.desktopMouse.scenarios[0].input,'mouse');
 const old=proof.legacySave.scenarios[0];assert.equal(old.legacySixteenChoiceSave,true);assert.equal(old.active,false);
 assert.deepEqual(proof.legacySave.errors,[]);assert.equal(proof.legacySave.passed,true);
 const rejection=proof.oldReaderControl.scenarios[0];assert.equal(rejection.futureVersion,916);assert.equal(rejection.readerVersion,915);assert.equal(rejection.rejectedBeforeScriptExecution,true);
 assert.equal(proof.negativeTimingControl.initialStock,8);assert.equal(proof.negativeTimingControl.expectedStock,12);
 for(const regression of Object.values(proof.nativeRegressions)){assert.equal(regression.passed,true);assert.deepEqual(regression.errors,[]);assert.equal(regression.engineSha256,proof.engineSha256);}
});
