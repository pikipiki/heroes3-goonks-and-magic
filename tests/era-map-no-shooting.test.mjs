import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
test('source129 preserves the six erased row families and signed HP arithmetic without admitting generic EA writes',()=>{
 const r=JSON.parse(fs.readFileSync('tests/fixtures/era-gameplay/map-no-shooting-reference.json'));
 assert.equal(r.originalRuntimeObserved,false);assert.equal(r.reaEvidence,false);assert.equal(r.source.sha256,'94db153050a700920454bc4e3a16eeae4e74d8c7b2aa85299abaa51633256c63');assert.equal(r.staticReport.sha256,'f91ad12485a1a47bb2b604f75c66348d89cbf3010bf05025b7a4c742511366bb');
 assert.deepEqual(r.contract.experienceRows,[[102,69],[102,83],[102,115],[79,null],[105,null],[111,null]]);assert(r.contract.baseShooterOnly&&r.contract.baseShotCountRetained&&r.contract.artifactSourcePreserved);assert.equal(r.contract.laterGenericEaWritesAdmitted,false);
 const rules=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/map-rules.json'));assert(rules.implementedCodes.includes(129));assert.equal(rules.implementedCodes.length,21);assert.equal(rules.completeRules,false);
});
test('native source129 distinguishes innate, experience and artifact shooting, freezes saves and refreshes world previews',()=>{
 const p=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/map-no-shooting-native-validation.json'));
 for(const k of ['activation','completeRules','profilesAdmitted','originalRuntimeObserved'])assert.equal(p[k],false);
 for(const [file,hash]of Object.entries(p.sourceBindings))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,file);
 assert.equal(p.nativeBuild.exitCode,0);assert.deepEqual(p.sourceAudit.mismatches,[]);assert.equal(p.serialization.saveVersion,935);assert.equal(p.serialization.choiceCount,28);
 for(const r of Object.values(p.reports)){assert(r.passed);assert.equal(r.engineSha256,p.engineSha256);assert.deepEqual(r.errors,[]);const s=r.scenarios[0];assert(s.pendingSaveReload&&s.reversedGlobalDefault&&s.onceOnlyHealth&&s.absoluteHealthEdit);}
 const a=p.reports.active.scenarios[0],off=p.reports.off.scenarios[0],artifact=p.reports.artifact.scenarios[0],noXp=p.reports.noExperience.scenarios[0];assert(a.active&&a.experience);assert.equal(a.initial.health,7);assert(a.experienced.experienceRank>=1);assert.equal(a.secondBattle.canShoot,false);assert.equal(a.secondBattle.remainingShots,0);assert.equal(a.edited.health,11);assert(a.details.defense>=3);
 assert.equal(off.active,false);assert(off.secondBattle.canShoot);assert.equal(off.secondBattle.remainingShots,20);for(const title of ['Shooter','No Distance Penalty','No Melee Penalty','No Wall Penalty','Point-Blank Shot'])assert(off.details.abilities.some(s=>s.includes(title)));assert(!a.details.abilities.some(s=>/Shooter|Distance Penalty|Melee Penalty|Wall Penalty|Point-Blank Shot/.test(s)));
 assert(artifact.active&&artifact.artifact&&artifact.secondBattle.canShoot);assert.equal(artifact.secondBattle.remainingShots,15);assert.equal(noXp.experience,false);assert.equal(noXp.experienced.experienceRank,0);
 assert.deepEqual(p.reports.preview.recruitmentCreaturePreview.map(u=>[u.health,u.shooter]),[[7,false],[11,false]]);
 assert.equal(p.legacyConsumer.scenarios[0].legacyInput,934);assert(p.legacyConsumer.scenarios[0].legacyDoesNotEnableRule);assert.equal(p.oldReaderControl.scenarios[0].futureVersion,935);assert.equal(p.oldReaderControl.scenarios[0].readerVersion,934);assert(p.oldReaderControl.scenarios[0].rejectedBeforeScriptExecution);
 assert.equal(p.radio.cases.length,16);assert.deepEqual(p.radio.errors,[]);for(const r of Object.values(p.regressions)){assert(r.passed);assert.equal(r.engineSha256,p.engineSha256);assert(r.scenarioCount>0);assert.deepEqual(r.errors,[]);}
});
