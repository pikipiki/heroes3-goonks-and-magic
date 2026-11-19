import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
test('source118 signed XP floor and commander reference arithmetic',()=>{
 const reference=JSON.parse(fs.readFileSync('tests/fixtures/era-gameplay/map-starting-level-and-banner-kernels-reference.json','utf8'));
 for(const flag of ['activation','completeRules','profilesAdmitted','originalRuntimeObserved','reaEvidence'])assert.equal(reference[flag],false);
 assert.equal(reference.reports.length,4);
 assert.equal(reference.sourceScriptSha256,'94db153050a700920454bc4e3a16eeae4e74d8c7b2aa85299abaa51633256c63');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-starting-level-'));
 try{
  const binary=path.join(dir,'check');
  execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','-fno-sanitize-recover=all','tests/native/EraStartingLevelRules.test.cpp','-o',binary]);
  execFileSync(binary);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
