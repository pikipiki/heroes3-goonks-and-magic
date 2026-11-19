import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const read=n=>JSON.parse(fs.readFileSync(n));
test('native source127 preserves warning, reward, daily limit and old saves',()=>{
 const p=read('scripts/era-bridge/gameplay/map-rogue-ambush-native-validation.json');
 assert(p.activation);assert.equal(p.completeRules,false);assert.equal(p.profilesAdmitted,false);assert.equal(p.originalRuntimeObserved,false);
 for(const[n,h]of Object.entries(p.sourceBindings))assert.equal(createHash('sha256').update(fs.readFileSync(n)).digest('hex'),h,n);
 assert.equal(p.nativeBuild.exitCode,0);assert.equal(p.sourceAudit.trackedFilesChecked,3043);assert.deepEqual(p.sourceAudit.mismatches,[]);
 assert.equal(p.serialization.saveVersion,940);assert.equal(p.serialization.previousSaveVersion,939);assert.equal(p.serialization.choiceCount,32);assert.equal(p.serialization.optionIndex,31);
 for(const r of Object.values(p.reports)){assert(r.passed);assert.equal(r.engineSha256,p.engineSha256);assert.deepEqual(r.errors,[]);}
 const land=p.reports['land-cooldown'].scenarios[0].encounter;
 assert.equal(land.warning.flag875,false);assert.equal(land.reward.flag875,true);assert.deepEqual(land.reward.dates,[]);assert.equal(land.reward.jobs[0].gold,500);
 assert.equal(land.completed.flag875,false);assert.equal(land.completed.dates[0].day,1);assert.equal(land.cooldownVisits.length,3);assert.equal(land.cooldown.sequence,land.completed.sequence);
 const water=p.reports['water-seed2'].scenarios[0].encounter;
 assert(water.units.some(u=>u.key==='core:iceElemental'));assert.equal(water.units.reduce((sum,u)=>sum+u.count,0),20);assert(!water.reward);
 assert.equal(p.reports['defeat-first'].scenarios[0].encounter.completed.flag875,true);
 assert.equal(p.reports['option-off'].scenarios[0].encounter,null);assert.equal(p.reports['old939-load'].scenarios[0].active,false);
 const ai=p.reports['ai-witness3'].scenarios[0];assert(ai.ai);assert.deepEqual(ai.witness,{creature:0,count:20});assert.equal(ai.days.at(-1).jobs.length,0);
 assert.equal(p.aiPacketWitness.creationAndReleasePackets,2);assert.equal(p.aiPacketWitness.goldPackets,1);
 assert.equal(p.historicalControl.scenarios[0].saveVersion,939);assert.equal(p.oldReaderControl.scenarios[0].readerVersion,939);assert.equal(p.oldReaderControl.scenarios[0].futureVersion,940);
 assert.equal(p.regressionScenarioCount,57);assert.equal(p.ui.stability.caseCount,48);assert(p.ui.radio.passed);assert.equal(p.archive.runtimeFiles.length,10);
 const rules=read('scripts/era-bridge/gameplay/map-rules.json');assert(rules.source77ImplementedCodes.includes(127));assert(!rules.source77ImplementedCodes.includes(118));assert.equal(rules.source77ImplementedCodes.length,20);assert.equal(rules.completeRules,false);
});
