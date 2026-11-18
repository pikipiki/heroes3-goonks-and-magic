import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
test('source170 resource units, eligibility, independent counters and map scan order',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-mithril-replacement-'));
 try{const bin=path.join(dir,'test');execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','tests/native/EraMithrilReplacementRules.test.cpp','-o',bin]);execFileSync(bin);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('native mithril replacement preserves gold, source namespaces and saves on touch and mouse',()=>{
 const p=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/mithril-replacement-native-validation.json'));
 const sha=b=>createHash('sha256').update(b).digest('hex');
 for(const flag of ['activation','completeRules','profilesAdmitted'])assert.equal(p[flag],false);
 for(const [file,hash]of Object.entries(p.sourceBindings))assert.equal(sha(fs.readFileSync(file)),hash,file);
 for(const f of p.upstreamReference.sourceFragments)assert.equal(sha(f.text),f.sha256);
 const binary=p.upstreamReference.binaryReference;assert.equal(sha(fs.readFileSync(binary.file)),binary.sha256);assert(binary.staticOnly);assert.equal(binary.runtimeExecuted,false);
 assert.equal(p.nativeBuild.exitCode,0);assert.equal(p.linuxSanitizers.exitCode,0);assert.equal(p.serialization.saveVersion,924);assert.equal(p.serialization.choiceCount,21);
 assert.equal(p.sourceAudit.trackedFilesChecked,3008);assert.deepEqual(p.sourceAudit.mismatches,[]);assert.equal(p.servedEngineSha256,p.engineSha256);
 const verifyReport=r=>{assert(r.passed);assert.deepEqual(r.errors,[]);assert.equal(r.engineSha256,p.engineSha256);};
 for(const r of [...Object.values(p.reports),p.amounts,...Object.values(p.inherited),p.oneTime]){
  verifyReport(r);
  for(const s of r.scenarios){
   assert(s.nativeSaveReloadBeforePickup&&s.source170FrozenAcrossChangedDefaults&&s.pairedStringPreserved);assert.equal(s.nativeSaveVersion,924);
   if(s.name==='campfire'){assert.equal(s.delta[6],s.delta[7]*100);assert(s.delta[7]>=4&&s.delta[7]<=6);}
   else if(s.active){
    const expected={gold:[7,3],guarded:[7,3],wood:[7,5],rare:[7,9],large:[6,1000],small:[5,1],'native-fractional-gold':[6,550],'shared-counter':[7,3]}[s.name];assert.equal(s.delta[expected[0]],expected[1]);
   }else{assert.equal(s.delta[7],0);assert.equal(s.delta[6],500);}
  }
 }
 verifyReport(p.disabled);assert(p.disabled.scenarios.some(s=>s.originalGuardsRetained));for(const s of p.disabled.scenarios)if(s.delta)assert.equal(s.delta[7],0);
 const once=p.oneTime.scenarios[0];assert(once.oneTimePassPreserved);assert.equal(once.readyCounterMessage.replace('READY','NEXT'),once.sourceCounterMessage);
 assert.equal(p.reports.touchPortrait.scenarios[0].viewport.width,390);assert.equal(p.reports.desktopMouse.scenarios[0].input,'mouse');
 verifyReport(p.legacyConsumer);assert(p.legacyConsumer.scenarios[0].noRetroactiveReplacement);assert.equal(p.legacyConsumer.scenarios[0].inputVersion,923);assert.equal(p.legacyConsumer.scenarios[0].outputVersion,924);
 for(const r of Object.values(p.nativeRegressions))verifyReport(r);
 assert(p.ui.passed);assert.equal(p.ui.cases.length,16);for(const c of p.ui.cases)assert(c.geometry.w>=48&&c.geometry.h>=48&&c.geometry.radius==='0px');
 const old=p.oldReaderControl.scenarios[0];assert.equal(old.futureVersion,924);assert.equal(old.readerVersion,923);assert(old.rejectedBeforeScriptExecution);
 assert.equal(p.archive.runtimeFiles.length,10);assert(p.archive.runtimeFiles.every(r=>r.identical));assert(p.archive.finalDockerRuntimeComparison.every(r=>r.identical));
});
