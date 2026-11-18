import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {mithrilSourceOptionFixture} from '../work/browser-tests/wog-mithril-source-option-cases.mjs';

test('native Mithril source reads follow saved activation on touch and mouse',()=>{
 const proof=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/mithril-source-option-native-validation.json'));
 assert.equal(proof.activation,false);assert.equal(proof.completeRules,false);assert.equal(proof.profilesAdmitted,false);
 for(const [file,sha]of Object.entries(proof.sourceBindings))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),sha,file);
 assert.equal(proof.nativeBuild.exitCode,0);assert.equal(proof.nativeBuild.warMachinesAdmitted,false);
 const {touchLandscape,touchPortrait,desktopMouse}=proof.reports;
 assert.equal(touchLandscape.scenarios.length,6);assert.equal(touchPortrait.scenarios.length,2);assert.equal(desktopMouse.scenarios.length,2);
 assert.deepEqual(new Set(touchLandscape.scenarios.map(s=>`${s.globalModule}/${s.choice}`)),new Set(['false/-1','true/-1','false/1','true/0','false/0','true/1']));
 for(const report of Object.values(proof.reports)){
  assert.equal(report.passed,true);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,proof.engineSha256);
  const fixtureBytes=JSON.stringify(mithrilSourceOptionFixture(),null,2);
  assert.equal(report.programFileSha256,createHash('sha256').update(fixtureBytes).digest('hex'));
  for(const s of report.scenarios){
   assert.equal(s.active,s.choice===-1?s.globalModule:s.choice===1);
   assert.equal(s.initial,`OPTION36 1 0/${s.active?1:0}`);assert.equal(s.next,`OPTION36 2 0/${s.active?1:0}`);
   assert.equal(s.saveReload,true);assert.equal(s.reversedGlobalDefault,true);
   assert.equal(s.nativePotionOption17,0);assert.equal(s.cost,s.active?7:0);assert.equal(s.purchase,s.active);
  }
 }
 assert(touchPortrait.scenarios.every(s=>s.viewport.width===390&&s.input==='touch'));
 assert(desktopMouse.scenarios.every(s=>s.viewport.width===1440&&s.input==='mouse'));
 const old=proof.oldEngineControl.scenarios[0];
 assert.equal(proof.oldEngineControl.passed,true);assert.notEqual(proof.oldEngineControl.engineSha256,proof.engineSha256);
 assert.equal(old.sourceProgramStopped,true);assert.equal(old.nativePurchase,true);assert.equal(old.cost,7);
 assert.match(old.error,/unvalidated original WoG option access/);
 assert.equal(proof.previousEngineSave.passed,true);
});
