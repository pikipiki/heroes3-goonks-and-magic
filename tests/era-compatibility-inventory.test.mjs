import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {inventoryErm, bindEvents, sha256} from '../scripts/era-bridge/compatibility/erm-inventory.mjs';
import {inventoryArtifacts} from '../scripts/era-bridge/compatibility/build.mjs';
import {buildCompatibilityInventory} from '../scripts/era-bridge/compatibility/inventory.mjs';

test('ERM inventory ignores prose, comments and fake commands inside multiline caret strings',()=>{
  const source=['ZVSE2','; !?FU(FakeComment);','// !?FU(FakeComment2);','!#VRv1:S1;',
    '!?FU(Same)&v1=1;','!!IF:M^first; !!UN:C123/4/5;', '!?FU(FakeString); last^; !!VRv2:S2;',
    '!?FU(Same)&v1=2;','!!FU(Target):P; trailing prose !!UN:C0/0/0;'].join('\n');
  const result=inventoryErm(source,'Data/s/example.erm');
  assert.equal(result.triggerCount,2);
  assert.equal(result.events.length,3);
  assert.deepEqual(result.diagnostics,[]);
  assert.equal(result.events[0].kind,'initialization');
  assert.deepEqual(result.events.slice(1).map(e=>e.source.line),[5,8]);
  assert.deepEqual(result.events[1].receivers,{IF:1,VR:1});
  assert.deepEqual(result.events[1].platformDependencies,[]);
  assert.deepEqual(result.events[2].calls,['Target']);
  assert.notEqual(result.events[1].id,result.events[2].id);
});

test('ERM inventory reports unterminated source rather than certifying a truncated block',()=>{
  const result=inventoryErm('!?FU(Start);\n!!IF:M^unfinished;','bad.erm');
  assert.equal(result.diagnostics[0].code,'unterminated-command');
});

test('legacy bytes keep distinct code hashes and UTF8 BOM does not hide a trigger',()=>{
  const make=byte=>Buffer.concat([Buffer.from('!?FU(Start);\n!!IF:M^'),Buffer.from([byte]),Buffer.from('^;')]);
  const a=inventoryErm(make(0x80),'legacy.erm'),b=inventoryErm(make(0x81),'legacy.erm');
  assert.notEqual(a.events[0].source.codeSha256,b.events[0].source.codeSha256);
  const bom=inventoryErm(Buffer.concat([Buffer.from([0xef,0xbb,0xbf]),Buffer.from('!?FU(Start);')]),'bom.erm');
  assert.equal(bom.triggerCount,1);
});

test('post-visit ERM callbacks have their own source scope rather than joining the prior event',()=>{
  const result=inventoryErm('!?OB63/56;\n!!VRv1:S1;\n!$OB63/56&1000;\n!!VRv2:S2;','cave.erm');
  assert.equal(result.triggerCount,1);
  assert.equal(result.postTriggerCount,1);
  assert.deepEqual(result.events.map(e=>e.kind),['trigger','post-trigger']);
  assert.deepEqual(result.events.map(e=>e.commandCount),[1,1]);
});

const example=()=>inventoryErm('!?FU(Same);\n!!UN:C123/4/5;','one.erm').events;
const mapping=()=>({id:'named-part',file:'one.erm',line:1,codeSha256:example()[0].source.codeSha256,
  status:'partial',scope:'One named behavior only',implementation:['native.cpp'],evidence:['proof.json']});
const resolve=file=>({file,sha256:sha256(file)});

test('bindings require exact source and real references; names alone cannot produce coverage',()=>{
  assert.throws(()=>bindEvents(example(),[{...mapping(),codeSha256:'0'.repeat(64)}],resolve),/Stale/);
  assert.throws(()=>bindEvents(example(),[{...mapping(),line:2}],resolve),/Stale/);
  assert.throws(()=>bindEvents(example(),[mapping()],()=>{throw Error('Missing reference');}),/Missing/);
  const rows=bindEvents(example(),[mapping(),{...mapping(),id:'other-part'}],resolve);
  assert.equal(rows[0].status,'partial');
  assert.equal(rows[0].bindings.length,2);
  assert.deepEqual(rows[0].platformDependencies,['windows-memory']);
  assert.equal(bindEvents(example(),[],resolve)[0].status,'unassessed');
});

test('whole event validation cannot be inferred from partial mappings or absent evidence',()=>{
  assert.throws(()=>bindEvents(example(),[{...mapping(),status:'validated'}],resolve),/Whole-event/);
  assert.throws(()=>bindEvents(example(),[{...mapping(),status:'validated',wholeEventReviewed:true,evidence:[]}],resolve),/Whole-event/);
  assert.throws(()=>bindEvents(example(),[{...mapping(),status:'complete'}],resolve),/Invalid/);
});

test('committed compatibility inventory accounts for every row and regenerates its human/CSV views',()=>{
  const report=JSON.parse(fs.readFileSync('outputs/era-compatibility/inventory.json'));
  assert.equal(report.fullEraCompatibility,false);
  assert.equal(report.summary.sourceScripts,109);
  assert.equal(report.summary.triggerDeclarations,484);
  assert.equal(report.summary.postTriggerDeclarations,1);
  assert.equal(report.events.filter(e=>e.kind==='post-trigger').length,1);
  assert.equal(report.events.filter(e=>e.kind==='trigger').length,484);
  assert.equal(new Set(report.events.map(e=>e.id)).size,report.events.length);
  assert.equal(report.experienceRules.filter(r=>r.status==='validated-source-contract').length,43);
  assert.equal(report.artifacts.filter(a=>a.active).length,110);
  assert.equal(report.creatureConfigs.filter(c=>c.sourceId===null).length,1);
  assert.equal(report.summary.creaturePropertyRules,report.creatureRules.length);
  assert.equal(report.summary.artifactPropertyRules,report.artifactRules.length);
  assert.equal(report.summary.dwellings,report.dwellings.length);
  assert.equal(report.summary.banks,report.banks.length);
  for(const script of report.scripts){
    const events=report.events.filter(e=>e.source.file===script.file);
    assert.equal(events.length,script.events);
    assert.equal(events.filter(e=>e.kind==='trigger').length,script.triggers);
  }
  for(const [file,contents]of inventoryArtifacts(report))assert.equal(fs.readFileSync(file,'utf8'),contents,file);
  const verify=ref=>assert.equal(sha256(fs.readFileSync(ref.file)),ref.sha256,ref.file);
  for(const event of report.events)for(const binding of event.bindings){
    for(const ref of [...binding.implementation,...binding.evidence])verify(ref);
  }
  for(const mechanism of report.nativeMechanisms)for(const ref of [...mechanism.implementation,...mechanism.evidence])verify(ref);
  for(const row of report.experienceRules)for(const ref of row.evidence)verify(ref);
  for(const row of report.objectDefinitions)verify(row.definition);
  for(const row of report.artifacts)if(row.definition)verify(row.definition);
  for(const row of report.wogModules)verify(row.definition);
});

const sourceRoot=path.resolve(process.env.TUM_SOURCE??'../Third-Upgrade-Mod-Full');
test('fresh supplied TUM sources reproduce every committed inventory byte',
  {skip:!fs.existsSync(path.join(sourceRoot,'Data/AmeCre.pac'))},()=>{
    const bindings=JSON.parse(fs.readFileSync('scripts/era-bridge/compatibility/source-bindings.json'));
    const report=buildCompatibilityInventory({projectRoot:process.cwd(),sourceRoot,bindings});
    for(const [file,contents]of inventoryArtifacts(report))assert.equal(fs.readFileSync(file,'utf8'),contents,file);
  });
