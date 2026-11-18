import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {compileErm, tokenizeErm} from '../scripts/era-bridge/campaigns/parser.mjs';
const hash = value => crypto.createHash('sha256').update(value).digest('hex');

test('structured conditions lower nested branches to forward-only jumps', () => {
 const source = Buffer.from(`!?FU7;
!!if&v1=1;
 !!VRv1:S0;
 !!if&v2=2;
  !!VRv3:S12;
 !!el&v2=3;
  !!VRv3:S13;
 !!el;
  !!VRv3:S14;
 !!en;
!!el&v1=2;
 !!VRv3:S20;
!!el;
 !!VRv3:S30;
!!en;
!!IF:M^After^;`);
 const p = compileErm(source);
 assert.equal(p.schemaVersion,2);
 assert.equal(p.contract,'source-campaign-erm-ast-v2');
 const commands = p.blocks[0].commands;
 assert.deepEqual(commands.filter(c=>c.receiver==='__flow').map(c=>[c.operations[0].code,c.operations[0].args[0].number]),
  [['F',10],['F',5],['J',9],['F',8],['J',9],['J',14],['F',13],['J',14]]);
 for(const [index,c] of commands.entries())if(c.receiver==='__flow'){
  const target = c.operations[0].args[0].number;
  assert(target>index&&target<=commands.length);
 }
 assert.equal(commands.at(-1).receiver,'IF');
 assert.equal(commands.at(-1).operations[0].code,'M');
 assert.equal(p.sha256,hash(source));
});

test('explicit identifiers preserve raw provenance, quoted text and post-trigger marker', () => {
 const source = Buffer.from('!?FU(Func);\n!!FU(Other):P(Offset);\n!!IF:M^(Func) (Other)^;\n!$FU(Func);\n!!VRv1:S1;');
 const bindings={Other:102,Func:101,Offset:4294967295};
 const p=compileErm(source,{bindings});
 assert.equal(p.blocks[0].selectors[0].number,101);
 assert.equal(p.blocks[1].selectors[0].number,101);
 assert.equal(p.blocks[1].kind,'post-trigger');
 assert.equal(p.blocks[0].commands[0].operations[0].args[0].number,-1);
 assert.equal(p.blocks[0].commands[1].operations[0].args[0].text,'(Func) (Other)');
 assert.equal(p.sourceSha256,hash(source));
 const tokens=tokenizeErm(source);
 assert.deepEqual(p.blocks[0].commands[0].source, Object.fromEntries(['line','offset','endOffset','sha256'].map(k=>[k,tokens[1][k]])));
 assert.equal(compileErm(source,{bindings:{Offset:4294967295,Func:101,Other:102}}).sha256,p.sha256);
 assert.notEqual(compileErm(source,{bindings:{...bindings,Func:103}}).sha256,p.sha256);
 assert.throws(()=>compileErm(source),/Unsupported operand/);
 for(const bindings of [null,[],{Func:0.5},{Func:4294967296},{'not-valid':1}])assert.throws(()=>compileErm(source,{bindings}),/Invalid identifier/);
});

test('malformed structured control is rejected and uppercase IF remains legacy', () => {
 for(const body of ['!!el;','!!en;','!!if&v1=1;','!!if;!!el;!!el;!!en;',
  '!!if;!!en&v1=1;','!!if1;!!en;','!!if:M^bad^;!!en;',
  '!!if;!?FU8;!!en;','!#if;!?FU8;!#en;'])
  assert.throws(()=>compileErm('!?FU7;'+body),/Structured|structured/);
 const classic=compileErm('!?FU7;!!IF&v1=1:M^Hello^;');
 assert.equal(classic.schemaVersion,1);
 assert.equal(classic.contract,'source-campaign-erm-ast-v1');
 assert.equal(classic.blocks[0].commands[0].receiver,'IF');
 assert(!Object.hasOwn(classic,'bindings'));
 assert.equal(compileErm('!?FU7;!!if;!!en;').blocks[0].commands[0].operations[0].args[0].number,1);
});

test('Advanced Classes original function compiles with pinned identity and explicit dependencies',async()=>{
 const fs=await import('node:fs');
 const {compileAdvancedClassPoints,advancedClassPointsSource}=await import('../scripts/era-bridge/gameplay/advanced-class-points.mjs');
 const bytes=fs.readFileSync('tests/fixtures/era-gameplay/advanced-class-points-1.1.erm');
 const p=compileAdvancedClassPoints(bytes);
 assert.equal(p.sourceSha256,advancedClassPointsSource.functionSha256);
 assert.equal(p.blocks.length,1);
 assert.equal(p.blocks[0].commands.length,339);
 assert.equal(p.blocks[0].commands.filter(c=>c.receiver==='__flow').length,3);
 assert.deepEqual(p.blocks[0].commands.filter(c=>c.receiver==='FU').map(c=>c.selectors[0].number),[9401,9402]);
 assert.throws(()=>compileAdvancedClassPoints(Buffer.concat([bytes,Buffer.from('\n')])),/identity changed/);
});

test('merging source files rebases structured initializer jumps and function visibility',async()=>{
 const {mergeNativeInitializers}=await import('../scripts/era-bridge/campaigns/native-compiler.mjs');
 const first=compileErm('!#if&v1=1;!#VRv2:S10;!#en;!?FU7;!!VRv3:S1;');
 const second=compileErm('!?FU8;!!VRv3:S2;!#if&v1=2;!#VRv2:S20;!#el;!#VRv2:S30;!#en;');
 const merged=mergeNativeInitializers([first,second]);
 assert.deepEqual(merged.filter(c=>c.receiver==='__flow').map(c=>c.operations[0].args[0].number),[2,5,6]);
 assert.deepEqual(merged.map(c=>c.visibleBlocks),[0,0,2,2,2,2]);
 assert.equal(second.initializers[0].operations[0].args[0].number,3,'Input AST stays unchanged');
});

test('native Advanced Classes calculation proof stays bounded and source-bound',async()=>{
 const fs=await import('node:fs');
 const proof=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/advanced-class-points-native-validation.json'));
 assert.equal(proof.activation,false);
 assert.equal(proof.completeRules,false);
 assert.equal(proof.advancedClassesProfileAdmitted,false);
 for(const [file,sha]of Object.entries(proof.sourceBindings))assert.equal(hash(fs.readFileSync(file)),sha,file);
 for(const report of Object.values(proof.reports)){
  assert.equal(report.passed,true);assert.equal(report.engineSha256,proof.engineSha256);assert.deepEqual(report.errors,[]);
 }
 assert.equal(proof.legacyAst.checked,133);
 assert.equal(proof.legacyAst.byteIdenticalLegacyAst,true);
});
