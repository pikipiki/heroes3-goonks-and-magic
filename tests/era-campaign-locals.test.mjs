import test from 'node:test';
import assert from 'node:assert/strict';
import {compileErm} from '../scripts/era-bridge/campaigns/parser.mjs';

test('ERM2 scalar locals allocate source x/y pools and reset at each trigger',()=>{
 const p=compileErm(`ZVSE2
!?FU(First);
!#VA(hero:x) (result:x);
!!VR(result):S(hero);
!!VR(scratch:y):S7;
!!VR(another:y):S(scratch:y);
!!IF:M^hero %(hero), value %(result); literal (hero), %%(hero)^;
!$FU(Second);
!#VA(hero:x);
!!VR(scratch:y):S(hero);`,{bindings:{First:9000,Second:9001}});
 const [a,b]=p.blocks;
 assert.equal(p.initializers.length,0);
 assert.equal(a.commands[0].selectors[0].space,'x');
 assert.equal(a.commands[0].selectors[0].index.number,2);
 assert.equal(a.commands[0].operations[0].args[0].index.number,1);
 assert.equal(a.commands[1].selectors[0].index.number,1);
 assert.equal(a.commands[2].selectors[0].index.number,2);
 assert.equal(a.commands[2].operations[0].args[0].index.number,1);
 assert.equal(a.commands[3].operations[0].args[0].text,'hero %X1, value %X2; literal (hero), %%(hero)');
 assert.equal(b.kind,'post-trigger');
 assert.equal(b.commands[0].selectors[0].index.number,1);
 assert.equal(b.commands[0].operations[0].args[0].index.number,1);
 assert.equal(p.schemaVersion,4);
});

test('ERM2 constants interpolate without touching unmarked literal identifiers',()=>{
 const p=compileErm('ZVSE2\n!?FU(FUNC);!!IF:M^%(VALUE) (VALUE)^;', {bindings:{FUNC:9000,VALUE:4}});
 assert.equal(p.blocks[0].commands[0].operations[0].args[0].text,'4 (VALUE)');
});

test('ERM2 locals reject unimplemented types, unknown indices, invalid declarations and pool overflow',()=>{
 for(const source of ['!!VR(missing):S1;','!#VA(a:z);','!#VA(a:e);','!#VA(a[2]:y);!!VR(a[unknown]):S0;',
  '!#VA(-a);','!#VA(a:x);!!VR(a:y):S0;','!#VA(a:x):S1;',
  '!#VA(a:x);!!IF:M^%y(a)^;'])
  assert.throws(()=>compileErm('ZVSE2\n!?FU1;'+source),/ERM2/);
 const args=Array.from({length:17},(_,i)=>`!#VA(arg${i}:x);`).join('');
 assert.throws(()=>compileErm('ZVSE2\n!?FU1;'+args),/pool exhausted/);
 const locals=Array.from({length:101},(_,i)=>`!!VR(local${i}:y):S0;`).join('');
 assert.throws(()=>compileErm('ZVSE2\n!?FU1;'+locals),/pool exhausted/);
 assert.throws(()=>compileErm('ZVSE2\n!?FU1;!#VA(old:x);!?FU2;!!VR(old):S1;'),/Undeclared/);
});

test('original Advanced Classes class lookup keeps source locals and dynamic hero names',async()=>{
 const fs=await import('node:fs');
 const {compileAdvancedClassIdentity}=await import('../scripts/era-bridge/gameplay/advanced-class-identity.mjs');
 const bytes=fs.readFileSync('tests/fixtures/era-gameplay/advanced-class-identity-1.1.erm');
 const p=compileAdvancedClassIdentity(bytes),commands=p.blocks[0].commands;
 assert.equal(p.initializers.length,0);
 assert.equal(commands.length,14);
 assert.equal(commands[0].selectors[0].space,'x');
 assert.equal(commands[0].selectors[0].index.number,2);
 assert.equal(commands[2].selectors[0].space,'y');
 assert.equal(commands[2].selectors[0].index.number,1);
 assert.equal(commands[2].operations[0].args[0].name,'Master_Warrior_Hero%X1');
 assert.equal(commands.at(-1).conditions[0].any.length,3,'Original any-grandmaster test remains an OR group');
 assert.throws(()=>compileAdvancedClassIdentity(Buffer.concat([bytes,Buffer.from(' ')])),/identity changed/);
});

test('native class lookup proof covers original priority and scoped names without admitting promotions',async()=>{
 const fs=await import('node:fs');
 const {createHash}=await import('node:crypto');
 const proof=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/advanced-class-identity-native-validation.json'));
 assert.equal(proof.activation,false);assert.equal(proof.completeRules,false);assert.equal(proof.advancedClassesProfileAdmitted,false);
 for(const [file,sha]of Object.entries(proof.sourceBindings))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),sha,file);
 for(const report of Object.values(proof.reports)){
  assert.equal(report.passed,true);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,proof.engineSha256);
  const result=report.scenarios[0];assert.equal(result.cases.length,16);
  assert.equal(new Set(result.cases.map(c=>[c.mask,c.grandmaster].join('/'))).size,16);
  assert.equal(result.nestedCallPreservesCaller,true);assert.equal(result.heroSpecificNames,true);
  assert.equal(result.pendingNativeSaveReload,true);assert.equal(result.completedNativeSaveReload,true);
 }
});
