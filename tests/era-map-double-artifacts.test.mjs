import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

test('source119 uses original tile marks and direct artifact records, excluding assembly placeholders',()=>{
 const d=JSON.parse(fs.readFileSync('tests/fixtures/era-gameplay/map-double-artifacts-reference.json'));
 assert.equal(d.source.sha256,'94db153050a700920454bc4e3a16eeae4e74d8c7b2aa85299abaa51633256c63');
 assert.equal(d.runtimeOriginalEraValidated,false);
 assert.equal(d.contract.minimumArtifactId,7);assert.equal(d.contract.initialMarker,15);assert.equal(d.contract.clearOnlyMarker,15);
 assert.equal(d.contract.extraCopyOnlyBelowTotal,2);assert.equal(d.contract.extraCopyDestination,'backpack');
 assert.equal(d.contract.counterWornRecords,19);assert.equal(d.contract.counterBackpackRecords,64);
 assert.equal(d.contract.failedPrimaryStillConsumesMarker15,true);
 assert.equal(d.contract.implicitAssemblyPartsCounted,false);assert.equal(d.contract.independentLocksDoNotExcludeRealRecords,true);
 const rules=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/map-rules.json'));
 assert.equal(rules.enabled,false);assert.equal(rules.completeRules,false);assert(rules.implementedCodes.includes(119));assert.equal(rules.implementedCodes.length,21);
});
test('native artifact pickups preserve duplicates, guards, combinations, full bags, AI turns and old saves',()=>{
 const p=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/map-double-artifacts-native-validation.json'));
 for(const key of ['activation','completeRules','profilesAdmitted'])assert.equal(p[key],false);
 for(const [file,hash] of Object.entries(p.sourceBindings))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,file);
 assert.equal(p.nativeBuild.exitCode,0);assert.deepEqual(p.sourceAudit.mismatches,[]);
 assert.equal(p.serialization.saveVersion,929);assert.equal(p.serialization.choiceCount,25);
 for(const report of Object.values(p.reports)){
  assert.equal(report.passed,true);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,p.engineSha256);
  for(const s of report.scenarios){
   for(const key of ['nativePostVisitWitness','pendingNativeSaveReload','frozenChoiceAfterGlobalReversal','independentInventoryCheck'])assert.equal(s[key],true,key);
  }
 }
 const rows=p.reports.touchLandscape.scenarios,find=name=>rows.find(s=>s.name===name);
 assert.equal(rows.length,13);assert.deepEqual(find('first-copy').after,[2,1]);assert.deepEqual(find('forced-off').after,[1,1]);
 assert.deepEqual(find('existing-backpack').after,[2,1]);assert.deepEqual(find('existing-equipped').after,[2,1]);assert.deepEqual(find('two-existing').after,[3,1]);
 assert.deepEqual(find('equipped-combination').before,[0,0]);assert.deepEqual(find('equipped-combination').after,[2,0]);
 assert.deepEqual(find('backpack-combination').before,[0,0]);assert.deepEqual(find('backpack-combination').after,[2,1]);
 assert.deepEqual(find('full-backpack').after,[1,1]);assert.equal(find('zero-marker').markerAfter,0);assert.equal(find('custom-marker').markerAfter,7);
 assert.equal(find('guard-decline-and-win').guardDeclinePreserved,true);
 assert(p.reports.touchPortrait.scenarios.every(s=>s.input==='touch'&&s.viewport.width===390));
 assert(p.reports.desktopMouse.scenarios.every(s=>s.input==='mouse'&&s.viewport.width===1440));
 assert.equal(p.ai.passed,true);assert.equal(p.ai.engineSha256,p.engineSha256);assert.deepEqual(p.ai.scenarios.map(s=>s.copies),[2,1]);
 assert(p.ai.scenarios.every(s=>s.actualAIAdventureTurn&&s.pendingNativeSaveReload&&s.globalReversalPreserved));
 const old=p.legacyConsumer.scenarios[0];assert.equal(old.inputVersion,928);assert.equal(old.saveVersion,929);assert.equal(old.noRetroactiveDoublePickup,true);assert.equal(old.noRetroactiveMarking,true);assert.equal(old.physicalCopies,1);
 assert.equal(p.oldReaderControl.scenarios[0].rejectedBeforeScriptExecution,true);
 assert.equal(p.failedPrimary.passed,true);assert.equal(p.failedPrimary.engineSha256,p.engineSha256);
 const failed=p.failedPrimary.scenarios[0];assert.deepEqual(failed.first,{marker:0,copies:0,groundObjects:1});assert.deepEqual(failed.retry,{marker:0,copies:1,groundObjects:0});assert.equal(failed.pendingNativeSaveReload,true);assert.equal(failed.independentInventoryCheck,true);
 assert.equal(p.radio.passed,true);assert.equal(p.radio.cases.length,16);assert.deepEqual(p.radio.errors,[]);
 for(const r of Object.values(p.regressions)){assert.equal(r.passed,true);assert.deepEqual(r.errors,[]);assert.equal(r.engineSha256,p.engineSha256);}
 for(const r of p.linuxSanitizers.tests)assert.equal(r.exitCode,0);
});
