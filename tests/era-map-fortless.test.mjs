import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fortlessTownsFixture} from '../work/browser-tests/wog-map-fortless-cases.mjs';
test('source131 includes neutral/human towns and optionally preserves AI fortifications',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-fortless-'));
 try{const bin=path.join(dir,'test');execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','tests/native/EraMapFortlessRules.test.cpp','-o',bin]);execFileSync(bin);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('native source131/144 preserves rebuilt forts, captures, visiting heroes and old saves',()=>{
 const p=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/map-fortless-native-validation.json'));
 const sha=b=>createHash('sha256').update(b).digest('hex');
 for(const flag of ['activation','completeRules','profilesAdmitted'])assert.equal(p[flag],false);
 for(const [file,hash]of Object.entries(p.sourceBindings))assert.equal(sha(fs.readFileSync(file)),hash,file);
 for(const f of p.upstreamReference.sourceFragments)assert.equal(sha(f.text),f.sha256);
 assert.equal(p.nativeBuild.exitCode,0);assert.equal(p.linuxSanitizers.exitCode,0);assert.equal(p.serialization.saveVersion,927);assert.equal(p.serialization.choiceCount,24);
 assert.equal(p.sourceAudit.trackedFilesChecked,3012);assert.deepEqual(p.sourceAudit.mismatches,[]);assert.equal(p.programFileSha256,sha(JSON.stringify(fortlessTownsFixture(),null,2)));
 for(const r of Object.values(p.reports)){
  assert(r.passed);assert.deepEqual(r.errors,[]);assert.equal(r.engineSha256,p.engineSha256);
  for(const s of r.scenarios){
   const expected=[7,7,1,3,7,3,1,7,7].map((rank,i)=>s.active&&!(s.preserve&&[1,4].includes(i))?0:rank);
   assert.deepEqual(s.ready.types,[0,1,2,3,4,5,6,7,8]);assert.deepEqual(s.ready.ranks,expected);expected[0]|=1;assert.deepEqual(s.rebuilt.ranks,expected);assert.deepEqual(s.restored.ranks,expected);
   for(const flag of ['customFaction','visitingHeroPreserved','nativeSaveReload','reversedGlobalDefaults','rebuiltFortNotRemoved','capturedTownNotReprocessed','recruitmentAccessible'])assert(s[flag],flag);
   assert.equal(s.firstStock,14);assert.equal(s.saveVersion,927);
  }
 }
 assert.equal(p.reports.touchLandscape.scenarios.length,5);assert.equal(p.reports.touchPortrait.scenarios[0].viewport.width,390);assert.equal(p.reports.desktopMouse.scenarios[0].input,'mouse');
 const legacy=p.legacyConsumer.scenarios[0];assert(legacy.noRetroactiveFortRemoval&&legacy.continuedNextDay);assert.equal(legacy.inputVersion,926);assert.equal(legacy.saveVersion,927);
 for(const r of Object.values(p.nativeRegressions)){assert(r.passed);assert.deepEqual(r.errors,[]);assert.equal(r.engineSha256,p.engineSha256);}
 for(const r of Object.values(p.ui)){assert(r.passed);assert.equal(r.cases.length,16);for(const c of r.cases)assert(c.geometry.w>=48&&c.geometry.h>=48&&c.geometry.radius==='0px');}
 const old=p.oldReaderControl.scenarios[0];assert.equal(old.futureVersion,927);assert.equal(old.readerVersion,926);assert(old.rejectedBeforeScriptExecution);
 assert.equal(p.archive.runtimeFiles.length,10);assert(p.archive.runtimeFiles.every(r=>r.identical));
});
