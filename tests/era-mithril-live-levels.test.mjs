import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {liveCreatureLevelsFixture} from '../work/browser-tests/wog-mithril-live-levels-cases.mjs';
test('source MA:L clamps signed writes only after wrapped int32 arithmetic',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-creature-levels-'));
 try{const bin=path.join(dir,'test');execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','tests/native/EraCreatureLevelRules.test.cpp','-o',bin]);execFileSync(bin);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('native Mithril uses live map-local levels, rejects old quotes and preserves stocks across saves',()=>{
 const p=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/mithril-live-levels-native-validation.json'));
 const sha=b=>createHash('sha256').update(b).digest('hex');
 for(const flag of ['activation','completeRules','profilesAdmitted'])assert.equal(p[flag],false);
 for(const [file,hash]of Object.entries(p.sourceBindings))assert.equal(sha(fs.readFileSync(file)),hash,file);
 assert(p.upstreamReference.staticOnly);assert.equal(p.upstreamReference.runtimeExecuted,false);assert.equal(p.upstreamReference.report.regions.length,12);
 assert.equal(p.nativeBuild.exitCode,0);assert.equal(p.linuxSanitizers.exitCode,0);assert.equal(p.serialization.saveVersion,926);assert.equal(p.serialization.choiceCount,22);
 assert.equal(p.sourceAudit.trackedFilesChecked,3010);assert.deepEqual(p.sourceAudit.mismatches,[]);
 assert.equal(p.programFileSha256,sha(JSON.stringify(liveCreatureLevelsFixture(),null,2)));
 for(const r of Object.values(p.reports)){
  assert(r.passed);assert.deepEqual(r.errors,[]);assert.equal(r.engineSha256,p.engineSha256);assert.equal(r.scenarios.length,2);
  const s=r.scenarios[0];assert.deepEqual(s.initialCosts,[2,3,1,1,3,3]);assert.deepEqual(s.changedCosts,[3,3,1,1,3,3]);
  assert.deepEqual(s.purchases.map(row=>row.cost),[3,3,1,1,3,6,3]);assert.equal(s.remaining,80);
  assert.deepEqual(s.initial.map(row=>row[0]),[0,90,10,6,62,64]);assert.deepEqual(s.restored.map(row=>row[0]),[1,91,11,7,91,65]);assert.deepEqual(s.initial.map(row=>row[1]),s.restored.map(row=>row[1]));
  assert(s.oldQuoteRejected&&s.signedClamp&&s.wrapBeforeClamp&&s.nativeSaveReload&&s.reversedGlobalDefault);assert.equal(s.saveVersion,926);
  assert(r.scenarios[1].noCrossGameLevelLeak);assert.deepEqual(r.scenarios[1].costs,[1,1,2,null,1,2]);
 }
 assert.equal(p.reports.touchPortrait.scenarios[0].viewport.width,390);assert.equal(p.reports.desktopMouse.scenarios[0].input,'mouse');
 const classic=p.classic.scenarios[0];assert(classic.classic&&classic.cancelPreservesResources&&classic.nativeSaveReload);assert.equal(classic.paidMithril,2);
 const legacy=p.legacyConsumer.scenarios[0];assert(legacy.oldPricesPreserved);assert.equal(legacy.inputVersion,925);assert.equal(legacy.saveVersion,926);assert.equal(legacy.amount,100);
 for(const r of Object.values(p.nativeRegressions)){assert(r.passed);assert.deepEqual(r.errors,[]);assert.equal(r.engineSha256,p.engineSha256);}
 const old=p.oldReaderControl.scenarios[0];assert.equal(old.futureVersion,926);assert.equal(old.readerVersion,925);assert(old.rejectedBeforeScriptExecution);
 assert.equal(p.archive.runtimeFiles.length,10);assert(p.archive.runtimeFiles.every(r=>r.identical));
});
