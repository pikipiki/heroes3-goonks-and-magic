import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {mapGrailsFixture} from '../work/browser-tests/wog-map-grails-cases.mjs';

test('native WoG130 builds once, preserves initial stock/quota and excludes every Conflux owner',()=>{
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 const proof=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/map-grails-native-validation.json'));
 assert.equal(proof.activation,false);assert.equal(proof.completeRules,false);assert.equal(proof.profilesAdmitted,false);
 for(const [file,hash]of Object.entries(proof.sourceBindings))assert.equal(sha(fs.readFileSync(file)),hash,file);
 for(const fragment of proof.upstreamReference.fragments)assert.equal(sha(fragment.text),fragment.sha256);
 assert.equal(proof.nativeBuild.exitCode,0);assert.equal(proof.nativeBuild.warMachinesAdmitted,false);
 const {touchPortrait,touchLandscape,desktopMouse}=proof.reports;
 assert.equal(touchPortrait.scenarios.length,2);assert.equal(touchLandscape.scenarios.length,9);assert.equal(desktopMouse.scenarios.length,2);
 assert.deepEqual(touchLandscape.scenarios.slice(6).map(s=>s.conflux),['neutral','red','blue']);
 for(const report of Object.values(proof.reports)){
  assert.equal(report.passed,true);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,proof.engineSha256);
  for(const [count,hash]of Object.entries(report.programFileSha256))assert.equal(sha(JSON.stringify(mapGrailsFixture(Number(count)),null,2)),hash);
  for(const s of report.scenarios){
   const count=s.conflux?9:8,requested=s.choice<0?s.configured:s.choice===1;
   assert.equal(s.active,requested&&!s.conflux);assert.deepEqual(s.types,Array.from({length:count},(_,i)=>i));
   assert.deepEqual(s.initial,Array.from({length:count},(_,i)=>i===1||s.active?1:0));
   assert.deepEqual(s.removed,Array.from({length:count},(_,i)=>i===1||s.active&&i!==0?1:0));assert.deepEqual(s.next,s.removed);
   assert.equal(s.nativeSaveReload,true);assert.equal(s.reversedGlobalDefault,true);assert.equal(s.firstStock,14);
   assert.equal(s.freeConstructionPreservesDailyAllowance,true);assert.equal(s.postRemovalNativeSaveReload,s.active);
   const halls=s.conflux==='red'?4:3;
   assert.equal(s.day2Gold-s.startingGold,halls*500+(s.active?15000:0));assert.equal(s.day3Gold-s.day2Gold,halls*500+(s.active?10000:0));
  }
 }
 assert(touchPortrait.scenarios.every(s=>s.viewport.width===390&&s.input==='touch'));
 assert(desktopMouse.scenarios.every(s=>s.viewport.width===1440&&s.input==='mouse'));
 assert.notEqual(proof.historicalControl.engineSha256,proof.engineSha256);
 assert.deepEqual(proof.historicalControl.scenarios[0].initial,[0,1,0,0,0,0,0,0]);
 assert.equal(proof.legacyFourteenChoiceSave.scenarios[0].grailRemainsDisabled,true);
 assert.equal(proof.previousEngineSave.passed,true);
 assert.equal(proof.postMergeValidation.nativeBuild.exitCode,0);
 for(const report of Object.values(proof.postMergeValidation.reports)){
  assert.equal(report.passed,true);assert.deepEqual(report.errors,[]);
  assert.equal(report.engineSha256,proof.postMergeValidation.engineSha256);
  assert.equal(report.scenarios.length,2);
 }
});
