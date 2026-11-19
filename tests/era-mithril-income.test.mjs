import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const read=file=>JSON.parse(fs.readFileSync(file));
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
test('Mithril income reference distinguishes bounded original evidence and observed native rounding',()=>{
 const reference=read('tests/fixtures/era-gameplay/mithril-income-order-reference.json');
 assert.equal(reference.reportSha256,'e2d77c9c4c946cffcb1e24d822baf8d576e473349ae3b46172fe9bc0af2e386f');
 assert.match(reference.evidenceKind,/static/i);
 assert.equal(reference.nativeComparison.example.aggregateResult,3);
 assert.equal(reference.nativeComparison.example.oldNativePerMineCeilResult,4);
 assert.equal(reference.nativeComparison.example.oldNativeTownGoldControl,425);
});
test('Native income aggregates before handicap and preserves raw grants, saves and accessible choices',()=>{
 const proof=read('scripts/era-bridge/gameplay/mithril-income-native-validation.json');
 for(const key of ['activation','completeRules','profilesAdmitted'])assert.equal(proof[key],false);
 for(const [file,hash] of Object.entries(proof.sourceBindings))assert.equal(sha(file),hash,file);
 assert.equal(proof.nativeBuild.exitCode,0);assert.equal(proof.linuxSanitizers.exitCode,0);assert.deepEqual(proof.sourceAudit.mismatches,[]);
 assert.equal(proof.serialization.saveVersion,931);assert.equal(proof.serialization.newSerializedCppFields,false);
 const matrix=proof.reports.touchLandscape.scenarios,find=name=>matrix.find(row=>row.name===name);
 assert.equal(matrix.length,7);
 for(const [name,gems,gold] of [['100-baseline',2,500],['100-mithril',4,500],['85-baseline',1,425],['85-mithril',3,425],['70-baseline',1,350],['70-mithril',2,350],['85-goose',3,7425]]){
  const row=find(name);assert.equal(row.gems,gems);assert.equal(row.nextDayGems,gems);assert.equal(row.gold,gold);assert.equal(row.nextDayGold,gold);assert(row.pendingIncomeSaveReload);assert.equal(row.checkpointPhase,'after-income');
  if(row.enabled)assert(row.mineInformationChecked);
 }
 for(const report of Object.values(proof.reports)){assert(report.passed);assert.equal(report.engineSha256,proof.engineSha256);assert.deepEqual(report.errors,[]);}
 assert.equal(proof.reports.finalTouchPortrait.scenarios[0].viewport.width,390);
 assert.equal(proof.reports.finalTouchPortrait.scenarios[0].input,'touch');
 assert.equal(proof.reports.finalDesktopMouse.scenarios[0].viewport.width,1440);
 assert.equal(proof.reports.finalDesktopMouse.scenarios[0].input,'mouse');
 const ai=proof.reports.aiRawGrants.scenarios;assert.equal(ai.length,2);assert.equal(ai[0].observed,12550);assert.equal(ai[1].observed,19550);
 assert.equal(proof.historicalNativeControl.scenarios[0].gems,4);assert.equal(proof.historicalNativeControl.scenarios[0].gold,425);
 assert.notEqual(proof.historicalNativeControl.engineSha256,proof.engineSha256);
 const legacy=proof.legacyConsumer;assert.equal(legacy.engineSha256,proof.engineSha256);assert.equal(legacy.scenarios[0].legacyInput,931);assert.equal(legacy.scenarios[0].gems,0);assert.equal(legacy.scenarios[0].nextDayGems,3);
 for(const report of Object.values(proof.regressions)){assert(report.passed);assert.equal(report.engineSha256,proof.engineSha256);}
 assert(proof.lobbyUI.passed);assert.equal(proof.lobbyUI.results.length,20);assert(proof.lobbyRegression.passed);
 assert(proof.archive.runtimeFiles.every(row=>row.equal));assert.equal(proof.archive.runtimeFiles.length,10);
});
