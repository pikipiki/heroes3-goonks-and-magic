import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readJsonc} from '../scripts/era-bridge/objects/production-resolvers.mjs';
import {monthlyCalendarFixture} from '../work/browser-tests/wog-map-monthly-visits-cases.mjs';

test('monthly site reset respects the source calendar, ten object families and unrelated visits',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-monthly-visits-'));
 try{
  const binary=path.join(directory,'test');
  execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','tests/native/EraMapMonthlyVisitRules.test.cpp','-o',binary]);
  execFileSync(binary);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});

test('the ten source visitation categories use native per-hero reward states',()=>{
 const reference=JSON.parse(fs.readFileSync('tests/fixtures/era-gameplay/map-monthly-visits-reference.json'));
 const config=readJsonc('work/vcmi-wasm/config/objects/rewardableOncePerHero.json');
 for(const id of reference.visitObjectTypes){
  const object=Object.values(config).find(row=>row.index===id);assert(object,`Source object ${id}`);
  for(const subtype of Object.values(object.types))assert.equal(subtype.visitMode,'hero',`Source object ${id}`);
 }
});

test('native monthly visits persist choices, preserve old saves and reward only in a new month',()=>{
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 const proof=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/map-monthly-visits-native-validation.json'));
 assert.equal(proof.activation,false);assert.equal(proof.completeRules,false);assert.equal(proof.profilesAdmitted,false);
 for(const [file,hash]of Object.entries(proof.sourceBindings))assert.equal(sha(fs.readFileSync(file)),hash,file);
 for(const fragment of proof.upstreamReference.fragments)assert.equal(sha(fragment.text),fragment.sha256);
 assert.equal(proof.nativeBuild.exitCode,0);assert.equal(proof.nativeBuild.warMachinesAdmitted,false);
 assert.deepEqual(proof.serialization.catalogueCounts,[6,7,13,14,15,16]);
 assert.deepEqual(Object.values(proof.reports).map(r=>r.scenarios.length),[6,2,2]);
 for(const report of Object.values(proof.reports)){
  assert.equal(report.passed,true);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,proof.engineSha256);
  assert.equal(report.programFileSha256,sha(JSON.stringify(monthlyCalendarFixture(),null,2)));
  for(const s of report.scenarios){
   assert.equal(s.active,s.choice<0?s.configured:s.choice===1);
   for(let index=0;index<4;index++){
    assert.equal(s.first[index]-s.initial[index],index<2?1:0);
    assert.equal(s.second[index]-s.first[index],index<2?Number(s.active):0);
   }
   for(const field of ['day28NoReset','day30NoReset','nativeSaveReload','reversedGlobalDefault','noResetReplay'])assert.equal(s[field],true,field);
   assert.equal(s.day29Reset,s.active);
  }
 }
 assert(proof.reports.touchPortrait.scenarios.every(s=>s.viewport.width===390&&s.input==='touch'));
 assert(proof.reports.desktopMouse.scenarios.every(s=>s.viewport.width===1440&&s.input==='mouse'));
 assert.equal(proof.historicalControl.passed,true);assert.notEqual(proof.historicalControl.engineSha256,proof.engineSha256);
 assert.equal(proof.historicalControl.scenarios[0].day29Reset,false);
 assert.equal(proof.legacyFifteenChoiceSave.scenarios[0].monthlyRemainsDisabled,true);
 assert.equal(proof.integrationChecks.henchmenRetreat.passed,true);
 assert.equal(proof.integrationChecks.henchmenRetreat.engineSha256,proof.engineSha256);
});
