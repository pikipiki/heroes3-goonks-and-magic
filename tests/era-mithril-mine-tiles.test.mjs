import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

test('source42 and77 share mine purchase, income, countdown and weekly protection marks',()=>{
 const d=JSON.parse(fs.readFileSync('tests/fixtures/era-gameplay/mithril-mine-tiles-reference.json'));
 assert.equal(d.upstream.commit,'233993be3eea4646b5c9f351e74f0bb51101adf6');
 for(const key of ['sharedWithSourcePON','anyNonzeroMarkerBlocksRepurchase','dailyDecrementAllMineOwners','weeklyConsumesAnyNonzeroMarker','weeklyConsumptionSkipsResourceDraw'])assert.equal(d.contract[key],true);
 assert.equal(d.contract.purchaseMarker,7);assert.equal(d.nativeCompatibility.originalEraRuntimeValidated,false);
 assert.equal(d.sourceRegions.length,4);
 for(const region of d.sourceRegions)assert.equal(createHash('sha256').update(region.text).digest('hex'),region.textSha256);
});
test('native shared mine markers preserve buys, scripts, neutral mines, Monday and legacy saves',()=>{
 const p=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/mithril-mine-tiles-native-validation.json'));
 for(const key of ['activation','completeRules','profilesAdmitted'])assert.equal(p[key],false);
 for(const [file,hash] of Object.entries(p.sourceBindings))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,file);
 assert.equal(p.nativeBuild.exitCode,0);assert.equal(p.linuxSanitizers.exitCode,0);assert.deepEqual(p.sourceAudit.mismatches,[]);
 assert.equal(p.serialization.saveVersion,930);assert.equal(p.serialization.choiceCount,25);
 for(const r of Object.values(p.reports)){
  assert.equal(r.passed,true);assert.deepEqual(r.errors,[]);assert.equal(r.engineSha256,p.engineSha256);
  for(const s of r.scenarios){assert.equal(s.pendingNativeSaveReload,true);assert.equal(s.sharedSourceAndUI,true);assert.equal(s.reversedGlobalDefault,true);}
 }
 const rows=p.reports.touchLandscape.scenarios,find=name=>rows.find(s=>s.name===name);assert.equal(rows.length,5);
 assert.equal(find('daily-purchase').day2Marker,6);assert.equal(find('daily-purchase').daily.at(-1).marker,0);
 assert.equal(find('daily-script-clear').scriptEdit,0);
 assert.equal(find('daily-purchase').daily[0].resources[6]-find('daily-script-clear').daily[0].resources[6],1000,'A source N1 earns one additional native gold-mine period before expiring');
 for(const name of ['weekly-purchase-custom','weekly-script-marker']){const s=find(name);assert.equal(s.daily.at(-1).day,8);assert.equal(s.daily.at(-1).marker,0);assert.equal(s.daily.at(-1).foreign,0);assert.equal(s.protectedResourcePreserved,true);}
 assert.equal(find('disabled-script-marker').daily.at(-1).marker,5);assert.equal(find('disabled-script-marker').daily.at(-1).foreign,5);
 for(const r of Object.values(p.legacyConsumers)){assert.equal(r.passed,true);assert.equal(r.engineSha256,p.engineSha256);assert.equal(r.scenarios[0].legacyInput,929);assert.equal(r.scenarios[0].saveVersion,930);}
 assert.equal(p.oldReaderControl.scenarios[0].rejectedBeforeScriptExecution,true);
 for(const r of Object.values(p.regressions)){assert.equal(r.passed,true);assert.deepEqual(r.errors,[]);assert.equal(r.engineSha256,p.engineSha256);}
});
