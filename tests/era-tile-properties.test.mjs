import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {tilePropertiesProgram} from '../work/browser-tests/wog-era-tile-properties-cases.mjs';

test('PO:N has coordinate storage, four-bit writes and generic v-array selectors in the supplied ERA artifacts',()=>{
 const d=JSON.parse(fs.readFileSync('tests/fixtures/era-gameplay/tile-number-reference.json'));
 assert.equal(d.runtimeValidated,false);assert.equal(d.contract.receiver,'PO:N');
 assert.deepEqual(d.contract.readRange,[0,15]);assert.deepEqual(d.selectors.acceptedCounts,[1,3]);
 assert.equal(d.contract.levelsAllocated,2);assert.equal(d.regions.length,11);
 assert.equal(d.contract.examples.find(r=>r.writtenInt32===-1).subsequentRead,15);
 assert.equal(d.contract.examples.find(r=>r.writtenInt32===16).subsequentRead,0);
});
test('native tile numbers survive suspended and completed saves on both map levels and old saves start at zero',()=>{
 const p=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/tile-properties-native-validation.json'));
 for(const key of ['activation','completeRules','profilesAdmitted'])assert.equal(p[key],false);
 for(const [file,hash] of Object.entries(p.sourceBindings))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,file);
 assert.equal(p.programSha256,tilePropertiesProgram().sha256);assert.equal(p.nativeBuild.exitCode,0);assert.equal(p.linuxSanitizers.exitCode,0);assert.deepEqual(p.sourceAudit.mismatches,[]);
 for(const report of Object.values(p.reports)){
  assert.equal(report.passed,true);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,p.engineSha256);
  assert.equal(report.scenarios.length,1);const s=report.scenarios[0];
  for(const key of ['directCoordinates','zeroDefault','nibbleWrap','signedOverflow','packedCoordinateAliases','independentSurfaceAndUnderground','independentNeighbours','pendingNativeSaveReload','dayTwoNativeSaveReload'])assert.equal(s[key],true,key);
  assert.deepEqual(s.indirectSelectors,[2,998]);
 }
 assert.equal(p.legacyProducer.scenarios[0].saveVersion,927);assert.equal(p.legacyConsumer.scenarios[0].saveVersion,928);
 assert.equal(p.legacyConsumer.scenarios[0].zeroDefaultBothLevels,true);assert.equal(p.legacyConsumer.scenarios[0].noRetroactiveTileNumbers,true);
 const old=p.oldReaderControl.scenarios[0];assert.equal(old.futureVersion,928);assert.equal(old.readerVersion,927);assert.equal(old.rejectedBeforeScriptExecution,true);
 for(const report of Object.values(p.regressions)){assert.equal(report.passed,true);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,p.engineSha256);}
});
