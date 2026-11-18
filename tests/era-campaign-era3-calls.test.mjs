import test from 'node:test';
import assert from 'node:assert/strict';
import {compileErm} from '../scripts/era-bridge/campaigns/parser.mjs';
import {mergeNativeInitializers} from '../scripts/era-bridge/campaigns/native-compiler.mjs';
import {advancedCoreFixture} from '../work/browser-tests/wog-advanced-core-cases.mjs';

test('ERA3 numeric calls are explicit, source-bound and isolated from358f programs',()=>{
 const bytes='!?FU7;!!VRx1:+1;!#FU7:P?v1;';
 const classic=compileErm(bytes),era3=compileErm(bytes,{dialect:'era3'});
 assert.equal(classic.schemaVersion,1);assert(!Object.hasOwn(classic,'functionArguments'));
 assert.equal(era3.schemaVersion,4);assert.equal(era3.functionArguments,'era3-integers');
 assert.notEqual(era3.sha256,classic.sha256);
 assert.equal(compileErm('ZVSE2\n'+bytes).functionArguments,'era3-integers');
 assert.throws(()=>compileErm('ZVSE2\n'+bytes,{dialect:'wog358'}),/requires the ERA3/);
 assert.throws(()=>compileErm(bytes,{dialect:'unknown'}),/Unknown ERM dialect/);
 assert.throws(()=>mergeNativeInitializers([classic,era3]),/Mixed source call dialects/);
 const merged=advancedCoreFixture();assert.equal(merged.schemaVersion,4);assert.equal(merged.functionArguments,'era3-integers');
});

test('ERA3 integer call scope rejects string, float, modifier and DO conventions',()=>{
 for(const argumentsText of ['^text^','z1','?z1','e1','?e1','s^named^','?s^named^','d1','=v1','@alias@','d','?-v1','?7'])
  assert.throws(()=>compileErm('ZVSE2\n!?FU1;!!FU2:P'+argumentsText+';'),/requires admitted integer arguments/);
 assert.throws(()=>compileErm('ZVSE2\n!?FU1;!!DO2/0/3/1:P;'),/ERA3 DO calls are not admitted/);
 const p=compileErm('ZVSE2\n!?FU1;!!FU2:P42/?v1/?x1/?y1/?w1/?f/?i^counter^;');
 assert.equal(p.blocks[0].commands[0].operations[0].args.length,7);
});

test('generic imports preserve the dialect and structured jumps instead of relabeling them v1',async()=>{
 const {mergePrograms,sha256}=await import('../scripts/era-bridge/campaigns/importer.mjs');
 const source=(id,text)=>({id,bytes:Buffer.from(text),sha256:sha256(Buffer.from(text))});
 const a=source('a','ZVSE2\n!?FU7;!!VRx1:+1;!#VRv1:S1;');
 const b=source('b','ZVSE2\n!#if&v1=1;!#FU7:P?v2;!#en;');
 const p=mergePrograms([a,b],{source:'mixed-file-era3'});
 assert.equal(p.schemaVersion,4);assert.equal(p.functionArguments,'era3-integers');
 assert.equal(p.initializers[1].operations[0].args[0].number,3);
 assert.equal(p.initializers[2].visibleBlocks,1);
 const legacy=source('old','!?FU8;!!VRx1:+1;');
 assert.throws(()=>mergePrograms([a,legacy]),/Mixed source call dialects/);
 assert.equal(mergePrograms([legacy],{dialect:'era3'}).schemaVersion,4);
 assert.equal(mergePrograms([legacy]).schemaVersion,1);
});

test('native ERA3 numeric call proof preserves legacy calls and pending frames',async()=>{
 const fs=await import('node:fs');const {createHash}=await import('node:crypto');
 const proof=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/era3-numeric-calls-native-validation.json'));
 assert.equal(proof.activation,false);assert.equal(proof.completeRules,false);assert.equal(proof.profilesAdmitted,false);
 for(const [file,sha]of Object.entries(proof.sourceBindings))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),sha,file);
 assert.equal(proof.oldReaderControl.v4RejectedBeforeScriptExecution,true);
 assert.equal(proof.legacyConventionBefore.scenarios[0].text,proof.legacyConventionAfter.scenarios[0].text);
 for(const report of Object.values(proof.reports)){
  assert.equal(report.passed,true);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,proof.engineSha256);
  const calls=report.scenarios.find(s=>s.kind==='era3-numeric-calls');
  assert.equal(calls.cases.length,6);assert.equal(calls.nestedSaveReload,true);assert.equal(calls.unpassedRegistersCleared,true);
  assert.equal(calls.namedAndFastOutputs,true);assert.equal(calls.duplicateOutputTargets,true);
 }
 assert.equal(proof.previousEngineSave.passed,true);
});
