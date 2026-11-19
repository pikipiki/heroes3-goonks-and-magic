import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const read=file=>JSON.parse(fs.readFileSync(file));
test('source239 pins the town entrance, placement, guardian record and signed count contracts',()=>{
 const r=read('tests/fixtures/era-gameplay/map-town-banners-reference.json');assert.equal(r.originalRuntimeObserved,false);assert.equal(r.reaEvidence,false);assert.equal(r.sourceScriptSha256,'94db153050a700920454bc4e3a16eeae4e74d8c7b2aa85299abaa51633256c63');
 assert.deepEqual(r.reports.map(x=>x.originalReportSha256),['f4b542462d64408a0b39254faf1aa6647297fbc4f2625a57460588c60020ec68','054f7e3e4d3620e8e5b6637ae2bcab68af81f0d656ea58069cbb213b0f58381a','e04caf574ca12908f9bb06c47978a4e5cec96f923140e8977448a7b1ecd0b22f','83581ffc9768794da3ce94145a55addeb3a383bae13f7863fc48ba5feb3f5add','409526c2c0cf6d31caf156a0b72dfae8c25d51719a3cb30dede5032c99088290']);
 for(const report of r.reports)assert(report.report.regions.length>=2);
 const table=r.reports[0].report.difficultyGuardTable;assert.equal(table.length,5);for(const row of table)assert.equal(row.creatureByTownType.length,9);
 const rules=read('scripts/era-bridge/gameplay/map-rules.json');assert.equal(rules.completeRules,false);assert.equal(rules.implementedCodes.length,20);assert.equal(rules.source77ImplementedCodes.length,19);assert(rules.source77ImplementedCodes.includes(239));assert(!rules.source77ImplementedCodes.includes(131));
});
test('native town banners preserve placement, hidden guards, difficulty, calendar and old save boundaries',()=>{
 const p=read('scripts/era-bridge/gameplay/map-town-banners-native-validation.json');for(const key of ['activation','completeRules','profilesAdmitted','originalRuntimeObserved'])assert.equal(p[key],false);
 for(const[file,sha]of Object.entries(p.sourceBindings))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),sha,file);
 assert.equal(p.nativeBuild.exitCode,0);assert.equal(p.sourceAudit.trackedFilesChecked,3039);assert.deepEqual(p.sourceAudit.mismatches,[]);assert.equal(p.serialization.saveVersion,938);assert.equal(p.serialization.previousSaveVersion,937);assert.equal(p.serialization.choiceCount,31);assert.equal(p.archive.runtimeFiles.length,10);
 for(const result of Object.values(p.reports)){assert(result.passed);assert.equal(result.engineSha256,p.engineSha256);assert.deepEqual(result.errors,[]);assert(result.scenarios.length);}
 for(const d of [0,1,2,3,4]){
  const s=p.reports['growth'+d].scenarios[0];assert.deepEqual(s.days.map(x=>x.day),[8,15,22,29]);assert.deepEqual(s.days.map(x=>x.count),d%2?[1,1,1,2]:[1,2,2,3]);assert(s.day1SaveReload&&s.frozenRuleSurvivesReversedDefaults);
  const prototypes=p.prototypeComparison[d];assert.equal(prototypes.difficulty,d);assert.equal(prototypes.expectedKeys.length,9);assert.deepEqual([...prototypes.expectedKeys].sort(),[...prototypes.observedLiteralKeys].sort());
 }
 assert.equal(p.reports.blocked3.scenarios[0].records.length,1);assert(p.reports.inheritOn.scenarios[0].active);for(const name of ['off','inheritOff','banned'])assert.equal(p.reports[name].scenarios[0].active,false);
 const pickup=p.reports.pickup.scenarios[0].pickup;assert.equal(pickup.input,'touch');assert(pickup.inactiveGuardDidNotFight);assert.equal(pickup.artifacts.length,1);
 assert.equal(p.reports.fightTouch.scenarios[0].pickup.battle.guardian,'core:champion');assert.equal(p.reports.fightDesktop.scenarios[0].pickup.battle.guardian,'wake-of-gods.level8units:supremeArchangel');assert.equal(p.reports.fightDesktop.scenarios[0].pickup.input,'mouse');
 assert(p.reports.sourceOptions.scenarios[0].sourceOptions&&p.reports.sourceOptions.scenarios[0].active);assert(p.reports.sourceBan.scenarios[0].sourceOptions&&!p.reports.sourceBan.scenarios[0].active);
 const legacy=p.reports.legacy.scenarios[0];assert.equal(legacy.legacyInput,937);assert(legacy.configured&&!legacy.active);assert.equal(p.historicalControl.scenarios[0].saveVersion,937);assert.notEqual(p.historicalControl.engineSha256,p.engineSha256);assert.equal(p.oldReaderControl.scenarios[0].readerVersion,937);assert.equal(p.oldReaderControl.scenarios[0].futureVersion,938);assert(p.oldReaderControl.scenarios[0].rejectedBeforeScriptExecution);
 const ui=p.parallelUiIntegration;assert.equal(ui.stability.caseCount,48);assert.equal(ui.stability.inputCount,31);for(const[file,sha]of Object.entries(ui.sourceBindings))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),sha,file);for(const report of Object.values(ui.nativeReports)){assert(report.passed);assert.equal(report.engineSha256,p.engineSha256);assert.deepEqual(report.errors,[]);}
 assert.equal(p.radio.cases.length,16);assert.deepEqual(p.radio.errors,[]);assert.equal(Object.values(p.regressions).reduce((sum,r)=>sum+r.scenarioCount,0),63);for(const r of Object.values(p.regressions)){assert(r.passed);assert.equal(r.engineSha256,p.engineSha256);assert.deepEqual(r.errors,[]);}
});
