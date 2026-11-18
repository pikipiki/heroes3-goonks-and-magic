import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

test('bounded extracted ERA math observations match the current Henchmen WASM helper',()=>{
 const proof=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/henchmen-math-binary-validation.json'));
 for(const flag of ['activation','completeRules','profilesAdmitted'])assert.equal(proof[flag],false);
 for(const[file,hash]of Object.entries(proof.sourceBindings))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,file);
 assert(proof.execution.originalBlocksByteIdentical);
 assert(proof.execution.controlWordReadbackVerified);
 for(const summary of Object.values(proof.webAssembly.actualHeaderComparison.summary)){
  assert.equal(summary.actualExpressionFloatBitDifferences,0);
  assert.equal(summary.actualHeaderConsumedDifferences,0);
 }
 for(const summary of Object.values(proof.webAssembly.millionCostBaseComparison.summary)){
  assert.equal(summary.inputs,1000000);
  assert.equal(summary.actualExpressionFloatBitDifferences,0);
  assert.equal(summary.actualHeaderLevelRateDifferences,0);
 }
 const output=execFileSync(process.execPath,['tests/fixtures/era-gameplay/henchmen-math/test-math.cjs','work/vcmi-wasm/lib/era/EraHenchmanRules.h'],{encoding:'utf8'});
 assert.deepEqual(JSON.parse(output),{checks:452,rootVectors:64,costBaseVectors:83,selectorVectors:11,status:'passed'});
 const source=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/math-source.json'));
 assert.equal(source.binaryDifferentialValidated,false);
 assert.equal(source.boundedBinaryComparison.fullWindowsEraRuntimeValidated,false);
 assert.equal(createHash('sha256').update(fs.readFileSync(source.boundedBinaryComparison.file)).digest('hex'),source.boundedBinaryComparison.sha256);
});

test('loaded ERA Sqrt and VR:S store zero for the observed negative and quiet-NaN inputs',()=>{
 const source=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/math-source.json'));
 const file=source.loadedIntegerComparison.file;
 assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),source.loadedIntegerComparison.sha256);
 const d=JSON.parse(fs.readFileSync(file));assert.equal(d.fullWindowsEraRuntimeValidated,false);assert.equal(d.binaryDifferentialValidated,false);
 assert.equal(d.observations.naturalControlWordAtProbeDllMain,0x023f);
 assert.equal(d.observations.results.length,18);assert.equal(d.observations.exceptionsDuringDirectProbes,0);
 for(const cw of [0x023f,0x037f,0x027f]){
  const rows=d.observations.results.filter(r=>r.controlWord===cw);assert.equal(rows.length,6);
  for(const row of rows){assert.equal(row.vrSuccess,1);assert.equal(row.actualStoredInt32,row.inputIndex===0?3:0);}
 }
 assert.equal(d.observations.restorationsToNaturalControlWord,18);
});
