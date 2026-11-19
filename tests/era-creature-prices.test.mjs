import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
test('rule113 is pinned to original table transitions and explicitly scoped native extensions',()=>{
 const r=JSON.parse(fs.readFileSync('tests/fixtures/era-gameplay/creature-prices-reference.json'));
 assert.equal(r.source.sha256,'94db153050a700920454bc4e3a16eeae4e74d8c7b2aa85299abaa51633256c63');assert.equal(r.originalRuntimeObserved,false);assert.equal(r.reaEvidence,false);
 assert.deepEqual(r.contract.resourcesTransformed,[6]);assert.deepEqual(r.contract.excludedSourceCreatures,[145,146,147,148,149]);assert.equal(r.contract.restoreRememberedBase,false);assert.equal(r.contract.genericCostWritesAdmitted,false);
 assert.deepEqual(Object.values(r.staticReports).map(e=>e.sha256),['a7508fc8672281eb2e821b3ed685e8443b743249f58dd2d119d6ab633e6f6092','ee2e044b15ecd2e3f62cad6e36743f32db57ae0ab9385a126d97558e54886d83','0a27beb045bc455b5d8f6af6457999f63f55fc733d366bd57aa0669d80b51aa9','256e389273b1cc9f0bbfff38239b0b8c63f030792029400aa630ae496a933c71']);
 const rules=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/map-rules.json'));assert.equal(rules.completeRules,false);assert.equal(rules.implementedCodes.length,16);assert(rules.implementedCodes.includes(113));
});
test('native map-local prices survive player turns, payments, saves and explicit choices',()=>{
 const p=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/creature-prices-native-validation.json'));
 for(const key of ['activation','completeRules','profilesAdmitted','originalRuntimeObserved'])assert.equal(p[key],false);
 for(const [file,hash] of Object.entries(p.sourceBindings))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,file);
 assert.equal(p.nativeBuild.exitCode,0);assert.deepEqual(p.sourceAudit.mismatches,[]);assert.equal(p.serialization.saveVersion,933);assert.equal(p.serialization.choiceCount,26);
 const rows=p.reports.calendar.scenarios;assert.equal(rows.length,9);assert.deepEqual(rows.map(s=>s.humanGold),[129,129,128,128,128,128,64,128,128]);assert.deepEqual(rows.map(s=>s.precedingAiGold),[0,129,64,64,64,64,64,64,64]);
 for(const report of Object.values(p.reports)){assert.equal(report.passed,true);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,p.engineSha256);assert(report.scenarios.every(s=>s.mithril===37&&s.fightValue===123456));}
 assert(p.reports['desktop-off'].scenarios.every(s=>s.humanGold===129&&!s.enabled));assert(p.reports['portrait-on'].scenarios.every(s=>s.enabled));
 const purchase=p.reports['purchases-touch'].purchases;assert(purchase.recruit&&purchase.upgrade&&purchase.independentPaymentAndArmyCheck&&purchase.insufficientResourcesRejected);assert.deepEqual(purchase.recruitCost,[1,2,3,4,5,6,64,37]);assert.deepEqual(purchase.upgradeCost,[0,0,0,0,0,0,6,0]);
 assert(p.legacyConsumer.scenarios.every(s=>!s.enabled&&s.humanGold===129));assert.equal(p.oldReaderControl.scenarios[0].readerVersion,932);assert.equal(p.oldReaderControl.scenarios[0].futureVersion,933);
 assert.equal(p.radio.cases.length,16);assert.deepEqual(p.radio.errors,[]);
 for(const report of Object.values(p.regressions)){assert.equal(report.passed,true);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,p.engineSha256);assert(report.scenarioCount>0);}
});
