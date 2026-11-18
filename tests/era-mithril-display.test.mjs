import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
test('source149 captures the sequential source36/149/170/171 initialization',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-mithril-display-'));
 try{const bin=path.join(dir,'test');execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','tests/native/EraMithrilDisplayRules.test.cpp','-o',bin]);execFileSync(bin);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('native Mithril information is frozen, read-only, localized and available with touch or mouse',()=>{
 const p=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/mithril-display-native-validation.json'));
 const sha=b=>createHash('sha256').update(b).digest('hex');
 for(const flag of ['activation','completeRules','profilesAdmitted'])assert.equal(p[flag],false);
 for(const [file,hash]of Object.entries(p.sourceBindings))assert.equal(sha(fs.readFileSync(file)),hash,file);
 for(const f of p.upstreamReference.sourceFragments)assert.equal(sha(f.text),f.sha256);
 assert.equal(p.nativeBuild.exitCode,0);assert.equal(p.linuxSanitizers.exitCode,0);assert.equal(p.serialization.saveVersion,925);assert.equal(p.serialization.choiceCount,22);
 assert.equal(p.sourceAudit.trackedFilesChecked,3009);assert.deepEqual(p.sourceAudit.mismatches,[]);
 for(const r of Object.values(p.reports)){
  assert(r.passed);assert.deepEqual(r.errors,[]);assert.equal(r.engineSha256,p.engineSha256);
  for(const s of r.scenarios){
   assert.equal(s.expectedDisplay,!!(s.display||s.enhancements));assert.equal(s.liveSource149,!!(s.display||s.enhancements||s.replacement));
   assert(s.frozenAfterChangedGlobalDefault&&s.sourceOptionsBeforeAndAfterReload&&s.readOnly);assert.equal(s.saveVersion,925);
  }
 }
 assert.equal(p.reports.touchLandscape.scenarios.length,6);assert.equal(p.reports.touchPortrait.scenarios[0].viewport.width,390);assert.equal(p.reports.desktopMouse.scenarios[0].input,'mouse');
 assert(p.reports.classicFrench.scenarios.every(s=>s.classic&&s.language==='fr'));assert(p.reports.classicEnglish.scenarios.every(s=>s.classic&&s.language==='en'));
 for(const key of ['radio','information']){assert(p.ui[key].passed);assert.equal(p.ui[key].cases.length,16);for(const c of p.ui[key].cases)assert(c.geometry.w>=48&&c.geometry.h>=48&&c.geometry.radius==='0px');}
 for(const r of Object.values(p.nativeRegressions)){assert(r.passed);assert.deepEqual(r.errors,[]);assert.equal(r.engineSha256,p.engineSha256);}
 assert.equal(p.archive.runtimeFiles.length,10);assert(p.archive.runtimeFiles.every(r=>r.identical));
});
