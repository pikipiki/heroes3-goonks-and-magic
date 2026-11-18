import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {mithrilDwellingLevelsFixture} from '../work/browser-tests/wog-mithril-dwelling-levels-cases.mjs';

test('native Mithril dwelling prices use source MA:L, preserve stocks and retain saved activation',()=>{
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 const proof=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/mithril-dwelling-levels-native-validation.json'));
 for(const flag of ['activation','completeRules','profilesAdmitted'])assert.equal(proof[flag],false);
 for(const[file,hash]of Object.entries(proof.sourceBindings))assert.equal(sha(fs.readFileSync(file)),hash,file);
 for(const part of proof.upstreamReference.fragments)assert.equal(sha(part.text),part.sha256);
 const cfg=proof.upstreamReference.swordsmanOverride;assert.equal(sha(cfg.text),cfg.sha256);assert.match(cfg.text,/^Level=0/m);
 assert.equal(proof.nativeBuild.exitCode,0);assert.equal(proof.linuxSanitizers.exitCode,0);
 assert.equal(proof.sourceAudit.trackedFilesChecked,3004);assert.deepEqual(proof.sourceAudit.mismatches,[]);
 assert.equal(proof.serialization.previousSaveVersion,918);assert.equal(proof.serialization.newSaveVersion,919);assert.equal(proof.serialization.choiceCount,19);
 assert.equal(proof.programFileSha256,sha(JSON.stringify(mithrilDwellingLevelsFixture(),null,2)));
 assert.deepEqual(Object.values(proof.reports).map(r=>r.scenarios.length),[2,2,2]);
 for(const report of Object.values(proof.reports)){
  assert(report.passed);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,proof.engineSha256);
  const [s,fresh]=report.scenarios;
  assert.deepEqual(s.costs,[1,1,2,null,1,2]);
  assert.deepEqual(s.initial.map(r=>r[0]),[0,90,10,6,62,64]);assert.deepEqual(s.restored.map(r=>r[0]),[1,91,11,6,91,65]);
  assert.deepEqual(s.restored.map(r=>r[1]),s.initial.map(r=>r[1]));
  assert.deepEqual(s.purchases.map(p=>p.cost),[1,1,2,1,2,2]);assert.equal(s.initialMithril-s.restoredMithril,9);
  assert(s.nativeSaveReload&&s.reversedGlobalDefault&&s.swordsmanSourceLevelMismatchBlocked&&s.alreadyUpgradedSourceCostDoubled);
  assert.equal(s.nativeSaveVersion,919);assert(fresh.disabledFreshGame&&fresh.noSavedActivationLeak);
 }
 assert.equal(proof.reports.touchPortrait.scenarios[0].viewport.width,390);assert.equal(proof.reports.desktopMouse.scenarios[0].input,'mouse');
 const old=proof.oldPublishedControl.scenarios[0];assert.deepEqual(old.costs,[1,2,3,2,2,2]);assert(old.swordsmanIncorrectlyEligible);assert.equal(old.nativeSaveVersion,918);
 const legacy=proof.legacySave.scenarios[0];assert(legacy.legacyEighteenOrNineteenChoiceSave);assert.deepEqual(legacy.costs,[1,1,2,null,1,2]);assert.equal(legacy.restoredMithril,91);
 assert.equal(proof.oldReaderControl.futureVersion,919);assert.equal(proof.oldReaderControl.readerVersion,918);assert(proof.oldReaderControl.rejectedBeforeScriptExecution);
 assert.equal(Object.keys(proof.nativeRegressions).length,13);
 for(const r of Object.values(proof.nativeRegressions)){assert(r.passed);assert.deepEqual(r.errors,[]);assert.equal(r.engineSha256,proof.engineSha256);}
});
