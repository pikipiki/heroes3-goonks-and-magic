import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
test('pending original commander choices survive native reload without awarding the acquired level twice',()=>{
 const p=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/commander-choices-native-validation.json'));
 for(const flag of ['activation','completeRules','profilesAdmitted','originalRuntimeObserved','rule118Activated'])assert.equal(p[flag],false);
 assert.equal(p.serialization.saveVersion,942);assert.equal(p.serialization.previousSaveVersion,941);assert.equal(p.serialization.choiceCount,32);
 for(const [file,hash]of Object.entries(p.sourceBindings))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,file);
 assert.equal(p.sourceAudit.trackedFilesChecked,3045);assert.deepEqual(p.sourceAudit.mismatches,[]);assert.equal(p.nativeBuild.exitCode,0);
 assert.equal(Object.keys(p.checkpoints).length,6);
 for(const [name,r]of Object.entries(p.checkpoints)){
  assert(r.passed);assert.equal(r.engineSha256,p.engineSha256);assert.deepEqual(r.errors,[]);
  const s=r.scenarios[0];assert.equal(s.choiceReloads,1);assert(s.checkpointReload);
  assert.equal(s.packetOrder.filter(x=>x==='CommanderLevelUp').length,s.type===1?5:6);
  assert.deepEqual(s.commanderLevels,Array.from({length:s.type===1?4:5},(_,i)=>i+2));
  if(name==='desktop')assert(s.desktop);if(name==='legacy941')assert(s.previousWordSave);
 }
 assert.equal(p.checkpoints.first.scenarios[0].checkpointLevel,2);assert.equal(p.checkpoints.last.scenarios[0].checkpointLevel,6);
 assert.equal(Object.keys(p.wordRegressions).length,20);
 for(const r of Object.values(p.wordRegressions)){assert(r.passed);assert.equal(r.engineSha256,p.engineSha256);assert.deepEqual(r.errors,[]);}
 assert.equal(p.regressionScenarioCount,34);
 for(const r of Object.values(p.regressions)){assert(r.passed);assert.equal(r.engineSha256,p.engineSha256);}
 const battle=p.nativeBattleBoundary;assert(battle.passed);assert.equal(battle.engineSha256,p.engineSha256);assert.equal(battle.scenarios[0].pendingBattleSaveAllowed,false);assert.equal(battle.scenarios[0].reloadPhase,'completed-native-battle');assert(battle.scenarios[0].returnedToMap);
 assert(p.oldReaderControl.passed);assert.equal(p.oldReaderControl.scenarios[0].readerVersion,941);assert.equal(p.oldReaderControl.scenarios[0].futureVersion,942);
 assert.equal(p.archive.runtimeFiles.length,10);
 const rules=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/map-rules.json'));assert(!rules.implementedCodes.includes(118));assert.equal(rules.completeRules,false);
});
