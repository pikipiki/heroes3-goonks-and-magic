import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compileAdvancedClassSkillLevels} from '../scripts/era-bridge/gameplay/advanced-class-skill-levels.mjs';
import {advancedCoreFixture} from '../work/browser-tests/wog-advanced-core-cases.mjs';

test('original Advanced Classes skill get/set functions retain native ceiling and source conditions',()=>{
 const bytes=fs.readFileSync('tests/fixtures/era-gameplay/advanced-class-skill-levels-1.1.erm');
 const p=compileAdvancedClassSkillLevels(bytes);
 assert.equal(p.schemaVersion,3);assert.equal(p.initializers.length,0);
 assert.deepEqual(p.blocks.map(b=>b.selectors[0].number),[9405,9406]);
 const setter=p.blocks[1].commands;
 assert.deepEqual(setter.filter(c=>c.receiver==='VR').slice(0,2).map(c=>c.operations.at(-1).args.map(a=>a.number)),[[0,5],[0,3]]);
 assert.equal(setter.find(c=>c.receiver==='HE').operations[0].code,'S');
 assert.equal(setter.filter(c=>c.receiver==='FU').length,3,'Original three extra-level branches remain distinct');
 assert.throws(()=>compileAdvancedClassSkillLevels(Buffer.concat([bytes,Buffer.from(' ')])),/identity changed/);
});

test('merged native probes preserve component identities, initializer visibility and bounded jumps',()=>{
 const p=advancedCoreFixture();assert.equal(p.blocks.length,9);assert.equal(p.components.length,3);
 assert.equal(p.contract,'source-campaign-erm-ast-v3');
 for(const [index,command]of p.initializers.entries()){
  assert(command.visibleBlocks>=3&&command.visibleBlocks<=9);
  if(command.receiver==='__flow'){
   const target=command.operations[0].args[0].number;
   assert(target>index&&target<=p.initializers.length);
  }
 }
 const ids=p.blocks.map(b=>b.selectors[0].number);
 assert.equal(new Set(ids).size,9,'Private function slots never collide across original components');
});

test('integer bounds select contract v3 while earlier programs retain their contracts',async()=>{
 const {compileErm}=await import('../scripts/era-bridge/campaigns/parser.mjs');
 assert.equal(compileErm('!?FU7;!!VRv1:F0/5;').schemaVersion,3);
 assert.equal(compileErm('!?FU7;!!VRv1:S5;').schemaVersion,1);
 assert.equal(compileErm('!?FU7;!!if&v1=1;!!VRv2:S5;!!en;').schemaVersion,2);
});

test('grouped native proof keeps skill routing bounded and validates prior original calculations',async()=>{
 const {createHash}=await import('node:crypto');
 const proof=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/advanced-class-skill-levels-native-validation.json'));
 assert.equal(proof.activation,false);assert.equal(proof.completeRules,false);assert.equal(proof.advancedClassesProfileAdmitted,false);
 for(const [file,sha]of Object.entries(proof.sourceBindings))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),sha,file);
 assert.equal(proof.codec.sourceAstVersion,3);assert.equal(proof.oldReaderControl.v3RejectedBeforeScriptExecution,true);
 for(const report of Object.values(proof.reports)){
  assert.equal(report.passed,true);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,proof.engineSha256);
  const [points,classes,skills]=report.scenarios;
  assert.equal(points.markers.length,9);assert.equal(classes.cases.length,16);assert.equal(skills.cases.length,12);
  assert.equal(skills.staleFlagsDoNotOverrideAdvancedNativeSkill,true);
  assert.equal(skills.otherSkillDoesNotInheritPathfindingFlags,true);
  assert.equal(skills.pendingNativeSaveReload,true);assert.equal(skills.completedNativeSaveReload,true);
 }
 assert.equal(proof.previousEngineSave.passed,true);
});
