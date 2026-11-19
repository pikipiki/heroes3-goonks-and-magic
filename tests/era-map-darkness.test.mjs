import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
test('source120 preserves the player-index decoder, exact source bitset composition and movement route boundaries',()=>{
 const r=JSON.parse(fs.readFileSync('tests/fixtures/era-gameplay/map-darkness-reference.json'));assert.equal(r.originalRuntimeObserved,false);assert.equal(r.reaEvidence,false);assert.equal(r.source.sha256,'94db153050a700920454bc4e3a16eeae4e74d8c7b2aa85299abaa51633256c63');
 assert.deepEqual(Object.values(r.staticReports).map(x=>x.sha256),['805cad71c61be08dd638b276485e8d108698fdb0966cd79d86ec813a0ee093dd','048d69c41ccf069e7a23422c409e27e49d21fbfb3c720a0e37e0af28beb7ea16','9fc230b5b2cc3c6d647779ef8268ca933168e591b07e8f7b5365f53106bbc49a']);assert.equal(r.contract.turnStartHidesMap,false);assert.equal(r.contract.genericHeTeleportTriggersMoveHook,false);assert.equal(r.contract.unhFourthArgument,'preserved player index, not player mask');assert.deepEqual(r.contract.nativeSupportedRadius,[0,4096]);
 const rules=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/map-rules.json'));assert.deepEqual(rules.source77CatalogueCodes,[...Array.from({length:20},(_,i)=>111+i),239]);assert.deepEqual(rules.additionalImplementedCodes,[131]);assert.equal(rules.source77ImplementedCodes.length,17);assert(!rules.source77ImplementedCodes.includes(131));assert(rules.source77ImplementedCodes.includes(120));assert.equal(rules.completeRules,false);
});
test('native darkness distinguishes visibility restoration, player preservation, movement and saved activation on two map levels',()=>{
 const p=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/map-darkness-native-validation.json'));for(const k of ['activation','completeRules','profilesAdmitted','originalRuntimeObserved'])assert.equal(p[k],false);
 for(const [file,hash]of Object.entries(p.sourceBindings))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,file);
 assert.equal(p.nativeBuild.exitCode,0);assert.deepEqual(p.sourceAudit.mismatches,[]);assert.equal(p.serialization.saveVersion,936);assert.equal(p.serialization.choiceCount,29);
 const visible=rgb=>rgb.slice(0,3).some(v=>v!==0);
 for(const r of Object.values(p.reports)){assert(r.passed);assert.equal(r.engineSha256,p.engineSha256);assert.deepEqual(r.errors,[]);const s=r.scenarios[0];assert(s.bothMapLevels&&s.ownedSightPreserved&&s.noTurnStartClear&&s.pendingSaveReload&&s.reversedGlobalDefault);assert(s.initial.every(visible));assert(s.day2BeforeMove.every(visible));assert(s.afterMove.every(c=>visible(c)===!s.active));assert(s.day2AfterMove.every(c=>visible(c)===!s.active));}
 assert(p.reports.active.scenarios[0].active);assert(p.reports.allied.scenarios[0].active&&p.reports.allied.scenarios[0].allied);assert.equal(p.reports.off.scenarios[0].active,false);assert(p.reports.inheritOn.scenarios[0].active);assert.equal(p.reports.inheritOff.scenarios[0].active,false);
 for(const [name,preserved]of [['circle0',true],['circle1',false],['circleAll',false],['circle8',false],['circleAlliedPreserve',true]]){const c=p.reports[name].scenarios[0].circle;assert.equal(visible(c.center),preserved);assert.equal(visible(c.diagonal),preserved);assert(visible(c.outside));}
 assert.equal(visible(p.historicalControls.circle0.scenarios[0].circle.center),false);assert.equal(visible(p.historicalControls.circle1.scenarios[0].circle.center),true);
 const legacy=p.legacyConsumer.scenarios[0];assert.equal(legacy.legacyInput,935);assert.equal(legacy.active,false);assert(legacy.configured);assert.equal(p.oldReaderControl.scenarios[0].futureVersion,936);assert.equal(p.oldReaderControl.scenarios[0].readerVersion,935);assert(p.oldReaderControl.scenarios[0].rejectedBeforeScriptExecution);
 assert.equal(p.radio.cases.length,16);assert.deepEqual(p.radio.errors,[]);for(const r of Object.values(p.regressions)){assert(r.passed);assert.equal(r.engineSha256,p.engineSha256);assert(r.scenarioCount>0);assert.deepEqual(r.errors,[]);}
});
