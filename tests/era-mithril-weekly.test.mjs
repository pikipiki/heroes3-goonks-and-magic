import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
test('source171 weekly calendar, object scan order and stock arithmetic',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-weekly-mithril-'));
 try{const binary=path.join(dir,'test');execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','tests/native/EraMithrilWeeklyRules.test.cpp','-o',binary]);execFileSync(binary);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('native weekly mithril rewards freeze their choice, preserve saves and do not compound',()=>{
 const d=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/mithril-weekly-native-validation.json'));
 const sha=b=>createHash('sha256').update(b).digest('hex');
 for(const flag of ['activation','completeRules','profilesAdmitted'])assert.equal(d[flag],false);
 for(const [file,hash]of Object.entries(d.sourceBindings))assert.equal(sha(fs.readFileSync(file)),hash,file);
 for(const f of d.upstreamReference.sourceFragments)assert.equal(sha(f.text),f.sha256);
 assert.equal(d.nativeBuild.exitCode,0);assert.equal(d.linuxSanitizers.exitCode,0);assert.equal(d.serialization.saveVersion,923);assert.equal(d.serialization.choiceCount,20);
 assert.equal(d.sourceAudit.trackedFilesChecked,3006);assert.deepEqual(d.sourceAudit.mismatches,[]);
 for(const report of [...Object.values(d.reports),...Object.values(d.controls)]){
  assert(report.passed);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,d.engineSha256);
  const s=report.scenarios[0];assert(s.nativeSaveReload&&s.frozenChoiceAcrossChangedDefaults&&s.noCompounding&&s.purchaseDoesNotDoubleCurrentStock);
  assert.deepEqual(s.rewards,s.mode==='enabled'?[500,2000,2000]:[500,1000,1000]);
 }
 assert.equal(d.reports.touchPortrait.scenarios[0].viewport.width,390);assert.equal(d.reports.desktopMouse.scenarios[0].input,'mouse');
 for(const site of ['garden','windmill']){
  const report=d.sourceRewards[site];assert(report.passed);assert.equal(report.engineSha256,d.engineSha256);assert(report.scenarios.some(s=>s.delta[7]>0));
  for(const s of report.scenarios){assert(s.source36Disabled);if(s.delta[7])assert(site==='garden'?s.delta[7]===5:s.delta[7]>=3&&s.delta[7]<=6);}
 }
 assert(d.sourceRewardDisabled.passed);for(const s of d.sourceRewardDisabled.scenarios)assert.equal(s.delta[7],0);
 assert(d.sourceOptionReads.passed);assert.equal(d.sourceOptionReads.scenarios.length,4);
 for(const s of d.sourceOptionReads.scenarios){assert(s.nativeSaveReload&&s.frozenAcrossChangedDefaults);assert(s.initial.endsWith(s.active?'1':'0'));assert(s.next.endsWith(s.active?'1':'0'));}
 assert(d.legacyConsumer.passed);const legacy=d.legacyConsumer.scenarios[0];assert.equal(legacy.inputSaveVersion,922);assert.equal(legacy.outputSaveVersion,923);assert.deepEqual(legacy.rewards,[1000,2000]);assert(legacy.source171NotRetroactivelyEnabled);
 assert(d.windmillUpgrade.passed);const windmill=d.windmillUpgrade.scenarios[0];assert.deepEqual(windmill.upgraded[0],windmill.baseline[0]);for(let week=1;week<3;++week)assert.deepEqual(windmill.upgraded[week],windmill.baseline[week].map(n=>n*2));
 assert(d.ui.passed);assert.equal(d.ui.cases.length,16);for(const s of d.ui.cases){assert(s.geometry.w>=48&&s.geometry.h>=48);assert.equal(s.geometry.radius,'0px');assert(s.singleActivation&&s.longLabelsFit);}
 assert.equal(d.archive.runtimeFiles.length,10);assert(d.archive.runtimeFiles.every(f=>f.identical));assert(d.archive.finalDockerRuntimeComparison.every(f=>f.identical));
 for(const r of Object.values(d.nativeRegressions)){assert(r.passed);assert.deepEqual(r.errors,[]);assert.equal(r.engineSha256,d.engineSha256);}
 const old=d.oldReaderControl.scenarios[0];assert.equal(old.futureVersion,923);assert.equal(old.readerVersion,922);assert(old.rejectedBeforeScriptExecution);
});
