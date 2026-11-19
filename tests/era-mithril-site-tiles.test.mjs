import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

test('source42 distinguishes purchase marks, nonzero mills and exact N2 university lessons',()=>{
 const d=JSON.parse(fs.readFileSync('tests/fixtures/era-gameplay/mithril-site-tiles-reference.json'));
 assert.equal(d.upstream.commit,'233993be3eea4646b5c9f351e74f0bb51101adf6');
 assert.equal(d.contract.universityLessonSubtype,0);assert.equal(d.contract.purchaseMarker,2);assert.equal(d.contract.universityHumanPrice,3000);assert.equal(d.contract.maximumEligibleSkills,2);
 for(const k of ['purchaseRequiresMarker0','millActiveOnAnyNonzeroMarker','universityLessonRequiresExactMarker2','weeklyEffectDoesNotRequireSource36','universityPostVisitDoesNotRequireSource36','weeklyDoesNotClearMarkers'])assert.equal(d.contract[k],true);
 assert.equal(d.nativeCompatibility.originalEraRuntimeValidated,false);
 for(const r of d.sourceRegions)assert.equal(createHash('sha256').update(r.text).digest('hex'),r.textSha256);
});
test('native site markers preserve options, learning, stock, denied purchases and legacy conversions',()=>{
 const p=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/mithril-site-tiles-native-validation.json'));
 for(const k of ['activation','completeRules','profilesAdmitted'])assert.equal(p[k],false);
 for(const [f,h] of Object.entries(p.sourceBindings))assert.equal(createHash('sha256').update(fs.readFileSync(f)).digest('hex'),h,f);
 assert.equal(p.nativeBuild.exitCode,0);assert.equal(p.linuxSanitizers.exitCode,0);assert.deepEqual(p.sourceAudit.mismatches,[]);
 assert.equal(p.serialization.saveVersion,931);assert.equal(p.serialization.choiceCount,25);
 for(const r of Object.values(p.reports)){
  assert.equal(r.passed,true);assert.deepEqual(r.errors,[]);assert.equal(r.engineSha256,p.engineSha256);
  for(const s of r.scenarios){assert.equal(s.pendingNativeSaveReload,true);assert.equal(s.editSaveReload,true);assert.equal(s.sharedSourceAndUI,true);assert.equal(s.reversedGlobalDefault,true);}
 }
 const mills=p.reports.millsLandscape.scenarios,universities=p.reports.universitiesLandscape.scenarios;assert.equal(mills.length,6);assert.equal(universities.length,6);
 const wheel=n=>mills.find(s=>s.name===n),school=n=>universities.find(s=>s.name===n);
 assert.equal(wheel('wheel-purchase-custom').markerAfterPurchase,2);assert.equal(wheel('wheel-purchase-custom').rewards[6],2000);
 assert.equal(wheel('wheel-source36-off').rewards[6],2000);assert.equal(wheel('wheel-source171-off').rewards[6],1000);assert.equal(wheel('wheel-script-clear').rewards[6],1000);
 const pair=p.reports.millsLandscape.windmillSourcePair;assert.deepEqual(pair.upgraded,pair.baseline.map(v=>v*2));
 for(const n of ['university-marker1','university-marker3','university-other-subtype']){assert.equal(school(n).universityLesson,false);assert.equal(school(n).blockedPurchaseRejected,true);}
 for(const n of ['university-purchase','university-source36-off']){assert.equal(school(n).universityLesson,true);assert.equal(school(n).completedLessonSaveReload,true);}
 assert.equal(school('university-script-clear').universityLesson,false);
 assert(p.reports.touchPortrait.scenarios.every(s=>s.viewport.width===390&&s.input==='touch'));
 assert(p.reports.desktopMouse.scenarios.every(s=>s.viewport.width===1440&&s.input==='mouse'));
 for(const r of Object.values(p.legacyConsumers)){assert.equal(r.passed,true);assert.equal(r.engineSha256,p.engineSha256);assert.equal(r.scenarios[0].legacyInput,930);assert.equal(r.scenarios[0].saveVersion,931);assert.equal(r.scenarios[0].scriptEdit,0);assert.equal(r.scenarios[0].editSaveReload,true);}
 assert.equal(p.firstWeek.passed,true);assert.equal(p.firstWeek.engineSha256,p.engineSha256);assert.equal(p.firstWeek.scenarios[0].nativePayout,1000);assert.equal(p.firstWeek.scenarios[0].sourceFirstWeekParity,true);
 assert.equal(p.firstWeekOldControl.scenarios[0].nativePayout,500);assert.notEqual(p.firstWeekOldControl.engineSha256,p.engineSha256);
 assert.equal(p.oldReaderControl.scenarios[0].rejectedBeforeScriptExecution,true);
 for(const r of Object.values(p.regressions)){assert.equal(r.passed,true);assert.deepEqual(r.errors,[]);assert.equal(r.engineSha256,p.engineSha256);}
});
