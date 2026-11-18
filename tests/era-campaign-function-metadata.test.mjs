import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {compileErm} from '../scripts/era-bridge/campaigns/parser.mjs';
import {mergePrograms,sha256} from '../scripts/era-bridge/campaigns/importer.mjs';
import {functionMetadataFixture} from '../work/browser-tests/wog-era3-function-metadata-cases.mjs';

test('ERA3 numeric argument metadata gets an explicit v5 contract',()=>{
 for(const operation of ['A?y1','A42','A11/22/33','S1/?y1','Sx1/?i^flags^']){
  const p=compileErm('!?FU7;!!FU:'+operation+';',{dialect:'era3'});
  assert.equal(p.schemaVersion,5);assert.equal(p.functionMetadata,'era3-integers');assert.equal(p.functionArguments,'era3-integers');
 }
 assert.equal(compileErm('!?FU7;!!FU8:P?v1;',{dialect:'era3'}).schemaVersion,4);
 assert.equal(compileErm('!?FU7;!!FU:A?y1;').schemaVersion,1,'Original WoG ASTs are unchanged');
});
test('metadata rejects unsupported string/float/default argument and selector conventions',()=>{
 for(const operation of ['A','A?y1/2','A^text^','A?z1','Ae1','Ad','A'+Array(17).fill('1').join('/'),
  'S1','S1/2','S?y1/?y2','S1/?z1','S^text^/?y1','S1/?-y1','A=1'])
  assert.throws(()=>compileErm('ZVSE2\n!?FU7;!!FU:'+operation+';'),/ERA3 FU:[AS] requires/);
 assert.throws(()=>compileErm('ZVSE2\n!?FU7;!!FU9:A?y1;'),/takes no selector/);
});
test('mixed ERA3 v4 and v5 imports preserve the metadata requirement',()=>{
 const source=(id,text)=>({id,bytes:Buffer.from(text),sha256:sha256(Buffer.from(text))});
 const result=mergePrograms([source('old','ZVSE2\n!?FU7;!!FU8:P?v1;'),source('new','ZVSE2\n!?FU8;!!FU:A?y1;')]);
 assert.equal(result.schemaVersion,5);assert.equal(result.functionMetadata,'era3-integers');
 assert.equal(result.functionArguments,'era3-integers');
});
test('native metadata keeps each saved call frame and its syntax flags',()=>{
 const proof=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/era3-function-metadata-native-validation.json'));
 assert.equal(proof.activation,false);assert.equal(proof.completeRules,false);assert.equal(proof.profilesAdmitted,false);
 for(const [file,sha]of Object.entries(proof.sourceBindings))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),sha,file);
 assert.equal(proof.codec.exitCode,0);assert.equal(proof.codec.addressSanitizer,true);assert.equal(proof.codec.undefinedBehaviorSanitizer,true);
 assert.equal(proof.oldReaderControl.v4Accepted,true);assert.equal(proof.oldReaderControl.v5RejectedBeforeScriptExecution,true);
 assert.equal(proof.legacyAst.byteIdenticalLegacyAst,true);assert.equal(proof.legacyAst.checked,133);
 for(const report of Object.values(proof.reports)){
  assert.equal(report.passed,true);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,proof.engineSha256);
  const s=report.scenarios[0];assert.equal(s.programSha256,functionMetadataFixture().sha256);
  assert.equal(s.cases.length,6);assert.deepEqual(s.cases.map(c=>c.count),[0,1,1,2,16,1]);
  assert.deepEqual(s.cases.map(c=>c.flag),[1,1,0,1,1,0]);
  assert.equal(s.nested,'META NESTED 2/1/2/1 caller 9/10');assert.equal(s.defaults,'META DEFAULTS 44/5/6 count 0');
  assert.equal(s.nestedNativeSaveReload,true);assert.equal(s.completedNativeSaveReload,true);assert.equal(s.namedCountAndFastSyntax,true);
 }
 assert.equal(proof.reports.touchPortrait.scenarios[0].viewport.width,390);
 assert.equal(proof.reports.touchLandscape.scenarios[0].viewport.width,844);
 assert.equal(proof.reports.desktopMouse.scenarios[0].input,'mouse');
 assert.equal(proof.previousEngineSave.passed,true);
});
