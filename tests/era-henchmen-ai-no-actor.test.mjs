import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

test('AI companions accrue source rewards without a deployed actor, including before first selection',()=>{
 const proof=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/henchmen-ai-no-actor-native-validation.json'));
 assert.equal(proof.activation,false);assert.equal(proof.completeRules,false);assert.equal(proof.profilesAdmitted,false);
 for(const [file,sha] of Object.entries(proof.sourceBindings))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),sha,file);
 assert.equal(proof.nativeBuild.exitCode,0);assert.deepEqual(proof.sourceAudit.mismatches,[]);
 for(const report of Object.values(proof.reports)){
  assert.equal(report.passed,true);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,proof.engineSha256);
  assert.equal(report.scenarios.length,4);
  assert.deepEqual(report.scenarios.map(s=>[s.kind,s.campaignTransfer]),[['none',false],['none',true],['dead',false],['dead',true]]);
  for(const s of report.scenarios){
   assert.equal(s.heroExperienceGain,0);assert.equal(s.noEnemyBattlefieldCompanion,true);assert.equal(s.nativeSaveReload,true);
   assert.equal(s.companionReward,s.campaignTransfer?0:100);
   assert.equal(s.experience,(s.kind==='none'?0:100)+s.companionReward);
   assert.equal(s.latentExperienceRevealedBySelection,s.kind==='none');
  }
 }
 assert(proof.reports.touchPortrait.scenarios.every(s=>s.input==='touch'&&s.viewport.width===390));
 assert(proof.reports.touchLandscape.scenarios.every(s=>s.input==='touch'&&s.viewport.width===844));
 assert(proof.reports.desktopMouse.scenarios.every(s=>s.input==='mouse'&&s.viewport.width===1440));
 assert.equal(proof.previousEngineControl.passed,true);assert.notEqual(proof.previousEngineControl.engineSha256,proof.engineSha256);
 assert(proof.previousEngineControl.scenarios.every(s=>s.companionReward===0));
 for(const report of Object.values(proof.regressions)){
  assert.equal(report.passed,true);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,proof.engineSha256);
 }
});
