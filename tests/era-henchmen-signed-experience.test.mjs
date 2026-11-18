import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {signedExperienceProgram} from '../work/browser-tests/wog-henchmen-signed-experience-cases.mjs';

test('signed companion rewards follow native source arithmetic and survive saves on mobile and desktop',()=>{
 const proof=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/henchmen-signed-experience-native-validation.json'));
 const sha=b=>createHash('sha256').update(b).digest('hex');
 for(const flag of ['activation','completeRules','profilesAdmitted'])assert.equal(proof[flag],false);
 for(const [file,hash]of Object.entries(proof.sourceBindings))assert.equal(sha(fs.readFileSync(file)),hash,file);
 assert.equal(proof.nativeBuild.command,'ninja -j32 html5');assert.equal(proof.nativeBuild.exitCode,0);assert.equal(proof.linuxSanitizers.exitCode,0);
 assert.equal(proof.sourceAudit.trackedFilesChecked,3004);assert.deepEqual(proof.sourceAudit.mismatches,[]);
 assert.equal(proof.servedEngineSha256,proof.engineSha256);assert.equal(proof.serialization.saveVersion,922);assert.equal(proof.serialization.choiceCount,19);
 for(const report of Object.values(proof.reports)){
  assert(report.passed);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,proof.engineSha256);assert.equal(report.scenarios.length,4);
  for(const row of report.scenarios){
   const high=row.name==='wrapped-positive';assert.equal(row.sourceSignedGain,high?-1294967295:-400);
   assert.equal(row.programSha256,signedExperienceProgram(high?0:400,high?-1294967296:0).sha256);
   assert.equal(row.heroExperience,high?-1294967295:0);assert.equal(row.companionReward,row.campaignTransfer?0:100);
   assert.equal(row.stackExperience,!row.campaignTransfer&&!high?134750:0);assert(row.nativeSaveReload);
  }
 }
 for(const r of Object.values(proof.nativeRegressions)){assert(r.passed);assert.deepEqual(r.errors,[]);assert.equal(r.engineSha256,proof.engineSha256);}
 assert.equal(proof.oldEngineControl.observedCompanionReward,1000);assert.equal(proof.oldEngineControl.expectedCompanionReward,0);
 assert.equal(proof.loadedEraIntegerObservations,18);assert.equal(proof.fullWindowsEraRuntimeValidated,false);
});
