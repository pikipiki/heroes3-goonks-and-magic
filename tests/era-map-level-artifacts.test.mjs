import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const read=file=>JSON.parse(fs.readFileSync(file));
test('source126 pins the shared artifact selector, real gained-level hooks and original automatic equipment boundaries',()=>{
 const r=read('tests/fixtures/era-gameplay/map-level-artifacts-reference.json');assert.equal(r.originalRuntimeObserved,false);assert.equal(r.reaEvidence,false);
 assert.equal(r.source.sha256,'94db153050a700920454bc4e3a16eeae4e74d8c7b2aa85299abaa51633256c63');
 assert.deepEqual(Object.values(r.staticReports).map(v=>v.sha256),['3d9d0f153166efe77854d208e333723de18fa061f26c987671cc0d685da04a37','ec8a043d5a9e84ea2c175a6bf5d99e40ad3fad127bb711fe82ae5dd00c1773e5','0e38f2730024d0315be054b26bd852726b680e7132182df78c9cb85a8092162a']);
 assert(r.contract.sharedMutablePool);assert.deepEqual(r.contract.fixedDisabled,[141,142,143]);assert.equal(r.contract.humanLevel1To4RewardCount,3);assert.equal(r.contract.humanLastCountedLevel,104);assert.deepEqual(r.contract.equipmentSlotOrder,Array.from({length:19},(_,i)=>i));assert.equal(r.contract.backpackCapacity,64);assert.equal(r.contract.summaryIconsPerPage,8);
 const rules=read('scripts/era-bridge/gameplay/map-rules.json');assert.equal(rules.completeRules,false);assert.equal(rules.source77CatalogueCodes.length,21);assert.equal(rules.source77ImplementedCodes.length,19);assert(rules.source77ImplementedCodes.includes(126));assert.equal(rules.implementedCodes.length,20);
});
test('native level artifacts preserve skill choices, pages, assembly, old games and deferred object rewards with touch or mouse',()=>{
 const p=read('scripts/era-bridge/gameplay/map-level-artifacts-native-validation.json');for(const key of ['activation','completeRules','profilesAdmitted','originalRuntimeObserved'])assert.equal(p[key],false);
 for(const [file,sha]of Object.entries(p.sourceBindings))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),sha,file);
 assert.equal(p.nativeBuild.exitCode,0);assert.deepEqual(p.sourceAudit.mismatches,[]);assert.equal(p.serialization.saveVersion,937);assert.equal(p.serialization.choiceCount,30);assert.equal(p.serialization.newJsonSystem,'artifactGrants');assert.deepEqual(p.linuxSanitizers.sanitizers,['address','undefined']);assert.equal(p.linuxSanitizers.exitCode,0);
 for(const report of Object.values(p.reports)){assert(report.passed);assert.equal(report.engineSha256,p.engineSha256);assert.deepEqual(report.errors,[]);assert(report.scenarios.length);}
 assert(p.reports.on.scenarios[0].enabled);assert.equal(p.reports.off.scenarios[0].enabled,false);assert(p.reports.inheritOn.scenarios[0].enabled);assert.equal(p.reports.inheritOff.scenarios[0].enabled,false);
 for(const name of ['pagesTouch','pagesDesktop','pagesLandscape']){const s=p.reports[name].scenarios[0];assert.equal(s.rewardCount,11);assert.equal(s.summaries,2);assert(s.touchArtifactInspection);assert.equal(s.summaryLayouts.length,2);assert(s.summaryLayouts.every(layout=>layout.display==='grid'&&layout.confirmVisible&&layout.blockedTouchAncestor===null));assert(s.pendingSkillSaveReload&&s.pendingSummarySaveReload&&s.primaryGainsAppliedOnce&&s.resultSaveReload);}
 assert(p.reports.pool.scenarios[0].deterministicNextDraws);assert(p.reports.poolCombo.scenarios[0].combinedPrototypeEligible&&p.reports.poolCombo.scenarios[0].disabled141Excluded);
 assert(p.reports.reject.scenarios[0].alreadySeenDoesNotAskAgain);assert(p.reports.nativeAssembly.scenarios[0].nativeRefusalSurvivesSave&&p.reports.nativeAssembly.scenarios[0].sourceGrantDoesNotRepeatNativePrompt);assert(p.reports.ai.scenarios[0].ai);assert(p.reports.reserve.scenarios[0].reserveAutomaticAssembly);assert(p.reports.full.scenarios[0].failedPlacementDoesNotReplaceEquipment);
 for(const name of ['town','object']){const s=p.reports[name].scenarios[0];assert(s.pendingSkillSaveReload&&s.pendingSummarySaveReload&&s.nonzeroSelectedRewardRestored&&s.sourceCampaignNotHoldingVisit&&s.completedSaveReload);assert.equal(s.manaAfter,name==='town'?18:7);}
 const legacy=p.legacyConsumer.scenarios[0];assert.equal(legacy.legacyInput,936);assert(legacy.configured&&legacy.oldMapRuleRemainsDisabled);assert.equal(legacy.level,5);assert.equal(p.oldReaderControl.scenarios[0].futureVersion,937);assert.equal(p.oldReaderControl.scenarios[0].readerVersion,936);
 assert.equal(p.radio.cases.length,16);assert.deepEqual(p.radio.errors,[]);for(const report of Object.values(p.regressions)){assert(report.passed);assert.equal(report.engineSha256,p.engineSha256);assert(report.scenarioCount>0);assert.deepEqual(report.errors,[]);}
});
