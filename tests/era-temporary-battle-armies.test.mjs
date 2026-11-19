import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const read=file=>JSON.parse(fs.readFileSync(file));
test('source127 reference distinguishes static contracts from playable admission',()=>{
 const r=read('tests/fixtures/era-gameplay/map-rogue-ambush-reference.json');
 for(const key of ['activation','completeRules','profilesAdmitted','originalRuntimeObserved','reaEvidence'])assert.equal(r[key],false);
 assert.equal(r.sourceScriptSha256,'94db153050a700920454bc4e3a16eeae4e74d8c7b2aa85299abaa51633256c63');
 assert.deepEqual(r.reports.map(x=>x.originalReportSha256),['b76da1c0bc4300d9a515e3792416e43e7197fd256246cbd521986dafcded397c','e9f4e79c19124a7258d4c698c32eb9f4929115214a3666f30187409cf89f22ad','cab5527f28a6ff08092a8fc6eb204500c55340f200577f526e2287bef2b72400','638342285011a5d61da6d82f6391e25c759d0f3229be3bdeb60916e6e70c9478','88afe097425931eec05893335f47dd2c3075007fb70a8c01bf836b73e84182b3']);
 for(const entry of r.reports)assert(entry.report.regions.length>=8);
});
test('native off-map armies survive queries and release before the original visit resumes',()=>{
 const p=read('scripts/era-bridge/gameplay/temporary-battle-armies-native-validation.json');
 for(const key of ['activation','completeRules','profilesAdmitted','originalRuntimeObserved'])assert.equal(p[key],false);
 for(const[file,sha]of Object.entries(p.sourceBindings))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),sha,file);
 assert.equal(p.nativeBuild.exitCode,0);assert.equal(p.sourceAudit.trackedFilesChecked,3040);assert.deepEqual(p.sourceAudit.mismatches,[]);
 assert.equal(p.serialization.previousSaveVersion,938);assert.equal(p.serialization.saveVersion,939);assert.equal(p.serialization.choiceCount,31);assert.equal(p.archive.runtimeFiles.length,10);
 assert.equal(Object.keys(p.reports).length,5);
 for(const r of Object.values(p.reports)){
  assert(r.passed);assert.equal(r.engineSha256,p.engineSha256);assert.deepEqual(r.errors,[]);
  const s=r.scenarios[0];assert(s.temporaryArmy&&!s.mapEventCreated);assert.equal(s.creationAndReleasePackets,2);assert(s.postBattleSaveReload);
 }
 assert(p.reports.portrait.scenarios[0].nativeTownVisitResumed);assert(p.reports.offer.scenarios[0].companionPrompt);
 assert.equal(p.reports.legacyDesktop.scenarios[0].legacyInput,938);assert(p.reports.legacyDesktop.scenarios[0].desktop);
 assert(p.reports.defeat.scenarios[0].defeatedHeroSkipsNativeVisit);assert.equal(p.reports.defeat.scenarios[0].nativeTownVisitResumed,false);
 assert(p.reports.progression.scenarios[0].progressionKinds.length>0);assert(p.reports.progression.scenarios[0].progressedHero.level>1);
 assert.equal(p.historicalControl.scenarios[0].saveVersion,938);assert.notEqual(p.historicalControl.engineSha256,p.engineSha256);
 assert.equal(p.oldReaderControl.scenarios[0].readerVersion,938);assert.equal(p.oldReaderControl.scenarios[0].futureVersion,939);assert(p.oldReaderControl.scenarios[0].rejectedBeforeScriptExecution);
 assert(Object.values(p.regressions).reduce((n,r)=>n+r.scenarioCount,0)>=63);
 for(const r of Object.values(p.regressions)){assert(r.passed);assert.equal(r.engineSha256,p.engineSha256);assert.deepEqual(r.errors,[]);}
 assert.equal(p.uiRebuild.stability.caseCount,48);assert(p.uiRebuild.stability.passed);
 for(const r of Object.values(p.uiRebuild.nativeReports)){assert(r.passed);assert.equal(r.engineSha256,p.engineSha256);}
 for(const[file,sha]of Object.entries(p.uiRebuild.sourceBindings))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),sha,file);
 assert.equal(p.privateFixtureScope.productionDiagnosticExportInstalled,false);
 assert.equal(p.catalogue.choiceCount,31);assert.equal(p.catalogue.source127Admitted,false);
});
