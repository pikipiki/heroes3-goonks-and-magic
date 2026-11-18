import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

test('native retreat rewards follow the source campaign-transfer gate and survive the hero pool',()=>{
 const proof=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/henchmen-battle-outcomes-native-validation.json'));
 assert.equal(proof.activation,false);assert.equal(proof.completeRules,false);assert.equal(proof.profilesAdmitted,false);
 for(const [file,sha]of Object.entries(proof.sourceBindings))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),sha,file);
 assert.equal(proof.nativeBuild.exitCode,0);assert.equal(proof.nativeBuild.warMachinesAdmitted,false);
 assert.equal(proof.source.noWinnerOrDrawGuard,true);assert.equal(proof.source.zeroGainExitOnlyWithCampaignTransfer,true);
 for(const report of Object.values(proof.reports)){
  assert.equal(report.passed,true);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,proof.engineSha256);
  assert.equal(report.scenarios.length,2);
  assert.deepEqual(report.scenarios.map(s=>s.campaignTransfer),[false,true]);
  for(const s of report.scenarios){
   assert.equal(s.outcome,'retreat');assert.equal(s.companionReward,s.campaignTransfer?0:100);
   assert.equal(s.heroExperienceGain,0);assert.equal(s.alive,true);assert.equal(s.nativeSaveReload,true);
   assert.equal(s.inspectedNativeTavernCandidate,true);
  }
 }
 assert(proof.reports.touchPortrait.scenarios.every(s=>s.viewport.width===390&&s.input==='touch'));
 assert(proof.reports.touchLandscape.scenarios.every(s=>s.viewport.width===844&&s.input==='touch'));
 assert(proof.reports.desktopMouse.scenarios.every(s=>s.viewport.width===1440&&s.input==='mouse'));
 const old=proof.historicalControl;
 assert.equal(old.passed,true);assert.notEqual(old.engineSha256,proof.engineSha256);
 assert.equal(old.scenarios[0].campaignTransfer,false);assert.equal(old.scenarios[0].companionReward,0);
 for(const report of Object.values(proof.regressions)){
  assert.equal(report.passed,true);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,proof.engineSha256);
 }
 assert.equal(proof.previousEngineSave.passed,true);
});
