import test from 'node:test';
import assert from 'node:assert/strict';
import {compileErm} from '../scripts/era-bridge/campaigns/parser.mjs';

test('dynamic local indices capture source addresses left to right in compiler y temporaries',()=>{
 const p=compileErm('ZVSE2\n!?FU1;!#VA(a[3]:y) (idx:y);!!VR(a[idx]):S(a[i]);!!VRv1:S(a[idx]);!!IF:M^address %(@a[i])^;');
 const c=p.blocks[0].commands;assert.equal(c.length,7);assert.equal(p.schemaVersion,4);
 assert.deepEqual(c.slice(0,2).map(c=>c.selectors[0].index.number),[5,6]);
 assert.equal(c[0].operations[1].args[0].space,'y');assert.equal(c[0].operations[1].args[0].index.number,4);
 assert.equal(c[1].operations[1].args[0].name,'i');
 for(const i of[0,1,3,5])assert.deepEqual(c[i].operations[2].args.map(a=>a.number),[1,3,0,0]);
 assert.equal(c[2].selectors[0].index.index.number,5);assert.equal(c[2].operations[0].args[0].index.index.number,6);
 assert.equal(c[3].selectors[0].index.number,5,'A released gap is reused before the tail');
 assert.equal(c.at(-1).operations[0].args[0].text,'address %Y5');
 assert.deepEqual(c[0].source,c[2].source,'Generated prefixes retain their original command provenance');
});

test('dynamic prefixes are unconditional and single-letter quick indices override same-name locals',()=>{
 const p=compileErm('ZVSE2\n!?FU1;!#VA(a[2]:x) (i:y);!!VR(a[i])&777:S1;');
 const [prefix,command]=p.blocks[0].commands;
 assert.deepEqual(prefix.conditions,[]);assert.equal(command.conditions[0].any[0].flag,777);
 assert.equal(prefix.operations[1].args[0].kind,'fast');assert.equal(prefix.operations[1].args[0].name,'i');
 assert.equal(command.selectors[0].space,'x');assert.equal(command.selectors[0].index.space,'y');
});

test('dynamic local indices reject unadmitted contexts, extents, interpolation and exhausted compiler pools',()=>{
 for(const suffix of ['!#VRv1:S(a[i]);','!!IF:M^%(a[i])^;','!!if&1;!!el&(a[i])=1;!!en;',
  '!!VR(a[unknown]):S1;','!!VR(a[-i]):S1;','!!VR(b[i]:y):S1;'])
  assert.throws(()=>compileErm('ZVSE2\n!?FU1;!#VA(a[3]:y);'+suffix),/ERM2/);
 assert.throws(()=>compileErm('ZVSE2\n!?FU1;!#VA(a[100]:y);!!VR(a[i]):S1;'),/pool exhausted/);
});

test('dynamic addresses use the first index-array slot and temporary freeing preserves later local allocation',()=>{
 const p=compileErm(`ZVSE2
!?FU1;
!#VA(values[3]:x) (positions[2]:y);
!!VR(values[positions]):S(values[j]);
!!VR(after:y):S(@values[positions]);
!!VRv1:S(@after);`);
 const c=p.blocks[0].commands;
 assert.equal(c[0].operations[1].args[0].index.number,1);
 assert.deepEqual(c.slice(0,2).map(c=>c.selectors[0].index.number),[3,4]);
 assert.equal(c[3].selectors[0].index.number,4,'Inline local consumes the first freed gap before the index is lowered');
 assert.equal(c[4].selectors[0].index.number,3,'Inline local survives release of the prefix temporary');
 assert.equal(c.at(-1).operations[0].args[0].number,3);
});

import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {dynamicArraysFixture} from '../work/browser-tests/wog-era3-dynamic-arrays-cases.mjs';

test('native dynamic arrays capture copy-out addresses across suspended calls on touch and mouse',()=>{
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 const proof=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/era3-dynamic-arrays-native-validation.json'));
 for(const flag of ['activation','completeRules','profilesAdmitted'])assert.equal(proof[flag],false);
 for(const[file,hash]of Object.entries(proof.sourceBindings))assert.equal(sha(fs.readFileSync(file)),hash,file);
 for(const part of proof.upstreamReference.fragments)assert.equal(sha(part.text),part.sha256);
 assert.equal(proof.legacyAst.identical,133);assert.equal(proof.legacyAst.knownMalformed,4);
 for(const flag of ['advancedCoreProgramByteIdentical','constantArrayProgramByteIdentical','quickScopeProgramByteIdentical','previousCompilerRejectsDynamicIndex'])assert.equal(proof.legacyAst[flag],true);
 const p=dynamicArraysFixture();assert.equal(p.schemaVersion,4);
 for(const report of Object.values(proof.reports)){
  assert.equal(report.passed,true);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,proof.engineSha256);
  assert.equal(report.programFileSha256,sha(JSON.stringify(p,null,2)));assert.equal(report.scenarios.length,1);
  const s=report.scenarios[0];assert.equal(s.programSha256,p.sha256);
  assert.equal(s.entry,'DYNAMIC ENTRY 50/81 addr 2/2 quick 0');
  assert.equal(s.nested,'DYNAMIC NESTED 0/99');
  assert.equal(s.returned,'DYNAMIC RETURN 0 items 10/99/30 args 7/81/9 quick 2 read 30 invalid 0/0');
  for(const flag of ['nestedNativeSaveReload','completedNativeSaveReload','capturedOutputIndexBeforeEarlierCopyOut','quickIndexRestoredAfterCall','outOfBoundsAddressOnly'])assert.equal(s[flag],true);
 }
 assert.equal(proof.reports.touchPortrait.scenarios[0].viewport.width,390);
 assert.equal(proof.reports.touchLandscape.scenarios[0].viewport.height,390);
 assert.equal(proof.reports.desktopMouse.scenarios[0].input,'mouse');
});
