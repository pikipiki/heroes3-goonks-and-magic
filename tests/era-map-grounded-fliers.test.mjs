import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {preGroundedFixture} from '../work/browser-tests/wog-map-grounded-fliers-cases.mjs';

test('WoG111 native combats preserve the source flight predicate, exclusions and independent grants',()=>{
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 const proof=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/map-grounded-fliers-native-validation.json'));
 for(const flag of ['activation','completeRules','profilesAdmitted'])assert.equal(proof[flag],false);
 for(const[file,hash]of Object.entries(proof.sourceBindings))assert.equal(sha(fs.readFileSync(file)),hash,file);
 for(const part of proof.upstreamReference.fragments)assert.equal(sha(part.text),part.sha256);
 assert.equal(proof.upstreamReference.rule,111);
 assert.equal(proof.nativeBuild.exitCode,0);assert.equal(proof.linuxSanitizers.exitCode,0);
 assert.equal(proof.sourceAudit.trackedFilesChecked,3003);assert.deepEqual(proof.sourceAudit.mismatches,[]);
 assert.deepEqual(proof.serialization.catalogueCounts,[6,7,13,14,15,16,17,18]);
 assert.equal(proof.serialization.previousSaveVersion,916);assert.equal(proof.serialization.newSaveVersion,917);
 assert.deepEqual(Object.values(proof.reports).map(r=>r.scenarios.length),[10,3,3]);
 assert.equal(proof.preGroundedProgramSha256,sha(JSON.stringify(preGroundedFixture())));
 for(const report of Object.values(proof.reports)){
  assert(report.passed);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,proof.engineSha256);
  for(const s of report.scenarios){
   assert.equal(s.active,s.choice<0?s.configured:s.choice===1);
   const flyer=s.actorKey!=='core:pikeman',preGrounded=s.control==='pre-grounded',excluded=s.control==='excluded';
   const affected=s.active&&flyer&&!preGrounded&&!excluded;
   assert.equal(s.affected,affected);
   assert.equal(s.flying,s.control==='grant'||flyer&&!preGrounded&&!affected);
   const noRetaliation=affected||s.actorKey==='core:vampire';
   assert.equal(s.actorDamage,noRetaliation?0:1);assert.equal(s.targetDamage,10);
   assert.equal(s.remainingRetaliations,noRetaliation?1:0);
   assert.equal(s.abilities[s.actorKey].filter(t=>t.startsWith('{No Retaliation}')).length,noRetaliation?1:0);
   assert(s.nativeSaveReload&&s.reversedGlobalDefault);assert.equal(s.nativeSaveVersion,917);
   assert(s.abilities['core:ballista'].every(t=>!t.startsWith('{No Retaliation}')));
  }
 }
 const matrix=proof.reports.touchLandscape.scenarios;
 for(const control of ['pre-grounded','grant','excluded'])assert(matrix.some(s=>s.control===control));
 assert(matrix.some(s=>s.actorKey==='core:pikeman'));assert(matrix.some(s=>s.actorKey==='core:vampire'));
 assert.equal(proof.reports.touchPortrait.scenarios[0].viewport.width,390);
 assert.equal(proof.reports.desktopMouse.scenarios[0].input,'mouse');
 const legacy=proof.legacySave.scenarios[0];assert(legacy.legacySeventeenChoiceSave);assert(!legacy.active);assert(legacy.flying);assert.equal(legacy.actorDamage,1);
 const rejection=proof.oldReaderControl;assert.equal(rejection.futureVersion,917);assert.equal(rejection.readerVersion,916);assert(rejection.rejectedBeforeScriptExecution);
 for(const r of Object.values(proof.nativeRegressions)){assert(r.passed);assert.deepEqual(r.errors,[]);assert.equal(r.engineSha256,proof.engineSha256);}
 assert(proof.mobileUI.passed);assert.equal(proof.mobileUI.cases.length,16);
});
