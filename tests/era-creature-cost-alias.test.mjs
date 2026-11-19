import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const read=file=>JSON.parse(fs.readFileSync(file));
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
test('Original MA:C7 aliases signed FightValue through the identified expanded roster relocation',()=>{
 const r=read('tests/fixtures/era-gameplay/creature-cost-alias-reference.json');
 assert.equal(r.originalEraRuntimeValidated,false);assert.match(r.contract.resource7,/MA:F FightValue/);
 assert.equal(r.reports[0].sha256,'a7508fc8672281eb2e821b3ed685e8443b743249f58dd2d119d6ab633e6f6092');
 assert.equal(r.reports[1].sha256,'ee2e044b15ecd2e3f62cad6e36743f32db57ae0ab9385a126d97558e54886d83');
 const relocation=r.amethystFindings.find(f=>f.id==='static-amethyst-C7-F-alias');assert.equal(relocation.patchLoop.entries,154);
 assert.equal(r.nativeWitness.nativeMithrilCost,37);assert.deepEqual(r.nativeWitness.fightValues.map(v=>v.signed32),[0,123456,-2147483648,-1]);
});
test('Native C7/F reads preserve signed words, independent Mithril costs and continuation compatibility',()=>{
 const p=read('scripts/era-bridge/gameplay/creature-cost-alias-native-validation.json');
 for(const key of ['activation','completeRules','profilesAdmitted'])assert.equal(p[key],false);
 for(const [file,hash] of Object.entries(p.sourceBindings))assert.equal(sha(file),hash,file);
 assert.equal(p.nativeBuild.exitCode,0);assert.equal(p.linuxSanitizers.exitCode,0);assert.deepEqual(p.sourceAudit.mismatches,[]);
 const rows=p.reports.matrix.scenarios;assert.equal(rows.length,4);
 for(const row of rows){assert.equal(row.sourceC7,row.signedFightValue);assert.equal(row.sourceF,row.signedFightValue);assert.equal(row.independentNativeFightValue,row.signedFightValue);assert.equal(row.independentNativeMithrilCost,37);assert.deepEqual(row.sourceResourceCosts,[1,2,3,4,5,6,127]);assert(row.pendingNativeSaveReload&&row.completedNativeSaveReload);assert.equal(row.saveVersion,932);}
 for(const report of Object.values(p.reports)){assert(report.passed);assert.deepEqual(report.errors,[]);assert.equal(report.engineSha256,p.engineSha256);}
 assert.equal(p.reports.portrait.scenarios[0].viewport.width,390);assert.equal(p.reports.portrait.scenarios[0].input,'touch');
 assert.equal(p.reports.desktop.scenarios[0].viewport.width,1440);assert.equal(p.reports.desktop.scenarios[0].input,'mouse');
 const old=p.historicalNativeControl;assert.equal(old.scenarios[0].sourceC7,37);assert.equal(old.scenarios[0].independentNativeFightValue,123456);assert.notEqual(old.engineSha256,p.engineSha256);
 const legacy=p.legacyConsumer.scenarios[0];assert.equal(legacy.legacyInput,931);assert(legacy.legacyStoredQueryPreserved);assert.equal(legacy.sourceC7,123456);assert.equal(legacy.saveVersion,932);
 const reject=p.oldReaderControl.scenarios[0];assert.equal(reject.futureVersion,932);assert.equal(reject.readerVersion,931);assert(reject.rejectedBeforeScriptExecution);
 for(const report of Object.values(p.regressions)){assert(report.passed);assert.equal(report.engineSha256,p.engineSha256);}
 assert.equal(p.serialization.choiceCount,25);assert.equal(p.serialization.newSerializedCppFields,false);
 assert.equal(p.archive.runtimeFiles.length,10);assert(p.archive.runtimeFiles.every(row=>row.equal));
});
