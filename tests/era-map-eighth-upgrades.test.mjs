import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
test('source125 pins global timing, nine pairs and signed experience consumers without admitting full profiles',()=>{
 const r=JSON.parse(fs.readFileSync('tests/fixtures/era-gameplay/map-eighth-upgrades-reference.json'));
 assert.equal(r.source.sha256,'94db153050a700920454bc4e3a16eeae4e74d8c7b2aa85299abaa51633256c63');assert.equal(r.originalRuntimeObserved,false);assert.equal(r.reaEvidence,false);
 assert.deepEqual(r.contract.sourceTypes,[13,27,41,55,69,83,97,111,131]);assert.deepEqual(r.contract.targetTypes,[150,151,152,153,154,155,156,157,158]);assert.deepEqual(r.contract.heroIds,[0,155]);assert(r.contract.oncePerGlobalDay&&r.contract.beforeRule116&&r.contract.negativeExperienceRetained);assert.equal(r.contract.mergeSlots,false);assert.equal(r.contract.genericHeC1SixArgumentsAdmitted,false);
 assert.deepEqual(Object.values(r.staticReports).map(x=>x.sha256),['f1e8e3ffed1a81c9c070b4e1a14f26cef79e139939e7fd46d8fcf9c8095721d1','012d3bd6151642c84b291f201fde5dcab41df676ad2ce9bcd217848bf4db7a7c','a40e42b8658cfc2c4117c0c1118076e11b0d6eee6297c0610a6fec8a25838267','0a145b38d2bf1a798cdaf8b85880f1e148300869d7a5250925a7520efb1c9cee']);
 const rules=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/map-rules.json'));assert.equal(rules.completeRules,false);assert.equal(rules.implementedCodes.length,19);assert(rules.implementedCodes.includes(125));
});
test('native eighth upgrades retain slots, signed words, payments and saved choices on touch and mouse',()=>{
 const p=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/map-eighth-upgrades-native-validation.json'));
 for(const key of ['activation','completeRules','profilesAdmitted','originalRuntimeObserved'])assert.equal(p[key],false);
 for(const [file,hash] of Object.entries(p.sourceBindings))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,file);
 assert.equal(p.nativeBuild.exitCode,0);assert.deepEqual(p.sourceAudit.mismatches,[]);assert.equal(p.serialization.saveVersion,934);assert.equal(p.serialization.choiceCount,27);
 for(const report of Object.values(p.reports)){assert.equal(report.passed,true);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,p.engineSha256);const s=report.scenarios[0];for(const flag of ['dayOneUnchanged','slotsNotMerged','pendingNativeSaveReload','completedNativeSaveReload','noReplay','aiHero','pooledHero'])assert.equal(s[flag],true,flag);}
 const first=p.reports['final-first'].scenarios[0],second=p.reports['final-second'].scenarios[0];assert(first.active&&second.active);assert.equal(first.day2[0].key,'wake-of-gods.level8units:supremeArchangel');assert.equal(second.day2[0].key,'wake-of-gods.level8units:ghostBehemoth');assert.equal(second.day2[1].key,'wake-of-gods.level8units:hellHydra');assert.equal(second.day2[2].key,'wake-of-gods.level8units:sacredPhoenix');
 assert.equal(p.reports['final-off'].scenarios[0].active,false);const wrapped=p.reports['final-wrapped'].scenarios[0];assert(wrapped.active&&wrapped.wrappedPrecheckSkip);assert(wrapped.day2.slice(0,4).every(u=>u.key==='core:archangel'&&u.count===1073741824));
 const transfer=p.reports['final-signed'];assert(transfer.signedTransfer.averagePreserved);assert.equal(transfer.signedTransfer.input,'touch');assert.equal(transfer.postBattleRepair.before,transfer.signedTransfer.mergedAverage);assert(transfer.postBattleRepair.after>=0);
 assert.equal(p.reports['final-zero'].postBattleRepair.after,0);const paid=p.reports['final-paid'].paidUpgrade;assert(paid.before<0&&paid.independentArmyAndPaymentCheck);assert.equal(paid.after,Math.trunc(paid.before*.75));assert.equal(paid.goldPaid,paid.quantity);
 assert.equal(p.legacyConsumer.scenarios[0].legacyInput,933);assert.equal(p.legacyConsumer.scenarios[0].active,false);assert.equal(p.oldReaderControl.scenarios[0].futureVersion,934);assert.equal(p.oldReaderControl.scenarios[0].readerVersion,933);
 assert.equal(p.radio.cases.length,16);assert.deepEqual(p.radio.errors,[]);
 for(const report of Object.values(p.regressions)){assert.equal(report.passed,true);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,p.engineSha256);assert(report.scenarioCount>0);}
});
