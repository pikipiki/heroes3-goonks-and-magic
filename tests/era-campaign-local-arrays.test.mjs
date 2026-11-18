import test from 'node:test';
import assert from 'node:assert/strict';
import {compileErm} from '../scripts/era-bridge/campaigns/parser.mjs';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {localArraysFixture} from '../work/browser-tests/wog-era3-local-arrays-cases.mjs';

test('ERM2 constant arrays reserve contiguous pools, reverse indices, SIZE and addresses',()=>{
 const p=compileErm(`ZVSE2
!?FU1;
!#VA(prefix:y) (items[COUNT]:y) (last:y);
!!VR(items[0]):C10/20/30;
!!VR(last):S(items[-1]);
!!VR(prefix):S(@items[0]);
!!IF:M^%(items[0])/%(items[-1]) size %(items[SIZE]) addr %(@items)/%(@items[-1]) literal (items[0])^;`,{bindings:{COUNT:3}});
 const c=p.blocks[0].commands;
 assert.equal(c[0].selectors[0].index.number,2);assert.deepEqual(c[0].operations[0].args.map(a=>a.number),[10,20,30]);
 assert.equal(c[1].selectors[0].index.number,5);assert.equal(c[1].operations[0].args[0].index.number,4);
 assert.equal(c[2].operations[0].args[0].number,2);
 assert.equal(c[3].operations[0].args[0].text,'%Y2/%Y4 size 3 addr 2/4 literal (items[0])');
 assert.equal(p.schemaVersion,4);
});

test('ERM2 zero size allocates one source slot, and full arrays exhaust only their own pool',()=>{
 const p=compileErm('ZVSE2\n!?FU1;!#VA(empty[0]:y) (tail:y) (args[16]:x);!!VR(empty):S(empty[SIZE]);!!VR(tail):S(@empty[-1]);!!VR(args[-1]):S(args[SIZE]);');
 const c=p.blocks[0].commands;
 assert.equal(c[0].selectors[0].index.number,1);assert.equal(c[0].operations[0].args[0].number,1);
 assert.equal(c[1].selectors[0].index.number,2);assert.equal(c[1].operations[0].args[0].number,1);
 assert.equal(c[2].selectors[0].index.number,16);assert.equal(c[2].operations[0].args[0].number,16);
 assert.doesNotThrow(()=>compileErm('ZVSE2\n!?FU1;!#VA(a[100]:y) (b[16]:x);!!VR(a[-100]):S(@b[-16]);'));
 for(const decl of ['!#VA(a[101]:y);','!#VA(a[17]:x);','!#VA(a[100]:y) (b:y);','!#VA(a[16]:x) (b:x);'])
  assert.throws(()=>compileErm('ZVSE2\n!?FU1;'+decl),/pool exhausted/);
});

test('ERM2 constant arrays reject unknown extents, invalid bounds and conflicting redeclarations',()=>{
 for(const statement of ['!#VA(a[-1]:y);','!#VA(a[SIZE]:y);','!#VA(a[UNKNOWN]:y);',
  '!#VA(a[2]:y);!!VR(a[2]):S1;','!#VA(a[2]:y);!!VR(a[-3]):S1;',
  '!#VA(a[2]:y);!!VR(a[i]):S1;','!#VA(a[2]:y);!!VR(a[2147483648]):S1;',
  '!#VA(a[2]:y);!!VR(@a[SIZE]):S1;','!#VA(a[2]:y);!#VA(a[3]:y);',
  '!#VA(a[2]:y);!#VA(a[2]:x);','!#VA(a[0]:y);!#VA(a[0]:y);'])
  assert.throws(()=>compileErm('ZVSE2\n!?FU1;'+statement),/ERM2/);
 assert.doesNotThrow(()=>compileErm('ZVSE2\n!?FU1;!#VA(a[2]:y);!#VA(a[2]:y);!!VR(a[-2]):S1;'));
});

test('native local arrays preserve caller registers, copy-out and suspended frames on touch and mouse',()=>{
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 const proof=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/era3-local-arrays-native-validation.json'));
 assert.equal(proof.activation,false);assert.equal(proof.completeRules,false);assert.equal(proof.profilesAdmitted,false);
 for(const [file,hash]of Object.entries(proof.sourceBindings))assert.equal(sha(fs.readFileSync(file)),hash,file);
 for(const fragment of proof.upstreamReference.fragments)assert.equal(sha(fragment.text),fragment.sha256);
 assert.equal(proof.compilerOnlyChangeReusesVerifiedNativeEngine,true);
 assert.equal(proof.webAssemblyVerification.exitCode,0);assert.equal(proof.webAssemblyVerification.warMachinesAdmitted,false);
 assert.equal(proof.legacyAst.identical,133);assert.equal(proof.legacyAst.knownMalformed,4);
 assert.equal(proof.legacyAst.advancedCoreProgramByteIdentical,true);assert.equal(proof.legacyAst.previousCompilerRejectsArray,true);
 const program=localArraysFixture();assert.equal(program.schemaVersion,4);
 for(const report of Object.values(proof.reports)){
  assert.equal(report.passed,true);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,proof.engineSha256);
  assert.equal(report.programFileSha256,sha(JSON.stringify(program,null,2)));assert.equal(report.scenarios.length,1);
  const s=report.scenarios[0];assert.equal(s.programSha256,program.sha256);
  assert.equal(s.entry,'ARRAY ENTRY 1/2/3/4 items 10/20/30 size 3 addr 2/4');
  assert.equal(s.nested,'ARRAY NESTED 6 values 71/72');assert.equal(s.returned,'ARRAY RETURN 78/2/23/7 locals 77/10/20/30');
  assert.equal(s.copied,'ARRAY OUTPUT 78/2/23/7');assert.equal(s.full,'ARRAY FULL 16/100 sizes 16/100 addr 16/100');
  assert.equal(s.zero,'ARRAY ZERO 42/43 size 1 addr 1/2');
  assert.equal(s.nestedNativeSaveReload,true);assert.equal(s.completedNativeSaveReload,true);
 }
 assert.equal(proof.reports.touchPortrait.scenarios[0].viewport.width,390);
 assert.equal(proof.reports.desktopMouse.scenarios[0].input,'mouse');
 assert.equal(proof.previousEngineSave.passed,true);
});
