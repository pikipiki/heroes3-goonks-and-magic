import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const read=file=>JSON.parse(fs.readFileSync(file));
test('original commander words preserve baseline, acquired rank, automatic actors and saved state',()=>{
 const p=read('scripts/era-bridge/gameplay/commander-experience-native-validation.json');
 for(const flag of ['activation','completeRules','profilesAdmitted','originalRuntimeObserved','reaEvidence'])assert.equal(p[flag],false);
 assert(p.nativeReceiversAvailable);assert.equal(p.serialization.saveVersion,941);assert.equal(p.serialization.previousSaveVersion,940);assert.equal(p.serialization.choiceCount,32);assert.equal(p.serialization.packetType,279);
 for(const [file,hash]of Object.entries(p.sourceBindings))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,file);
 assert.equal(p.nativeBuild.exitCode,0);assert.equal(p.sourceAudit.trackedFilesChecked,3043);assert.deepEqual(p.sourceAudit.mismatches,[]);
 assert.equal(Object.keys(p.reports).length,20);
 for(const r of Object.values(p.reports)){assert(r.passed);assert.equal(r.engineSha256,p.engineSha256);assert.deepEqual(r.errors,[]);assert(r.scenarios[0].checkpointReload);}
 for(let type=0;type<9;++type){const s=p.reports['faction-'+type].scenarios[0];assert.equal(s.type,type);assert.equal(s.packetOrder.filter(x=>x==='CommanderLevelUp').length,type?4:5);assert.deepEqual(s.commanderLevels,Array.from({length:type?4:5},(_,i)=>i+2));}
 assert(p.reports['faction-1'].scenarios[0].desktop);
 const reserve=p.reports.reserve.scenarios[0];assert.deepEqual(reserve.order,[]);assert(reserve.reserve);assert(reserve.completedText.endsWith('CLEVEL 5 REF 5000'));
 assert(p.reports.ai.scenarios[0].ai);assert.deepEqual(p.reports.ai.scenarios[0].order,[]);
 assert.equal(p.reports.cap.scenarios[0].packetOrder.length,74);assert.equal(p.reports.cap.scenarios[0].completedText,'COMMANDER_DONE 2147483647/0/1 CLEVEL 75 REF 0');
 assert.equal(p.reports.reference.scenarios[0].completedText,'COMMANDER_DONE 6000/5000/5 CLEVEL 5 REF 5000');
 assert.equal(p.reports.baseline.scenarios[0].completedText,'COMMANDER_DONE 3700/5000/5 CLEVEL 5 REF 5000');
 assert.equal(p.reports.suppressed.scenarios[0].completedText,'COMMANDER_DONE 8500/5000/5 CLEVEL 7 REF 5000 AFTER 0');
 assert.equal(p.reports['hero-negative'].scenarios[0].completedText,'COMMANDER_DONE -1/-1/0 CLEVEL 1 REF -1');
 assert.equal(p.reports.negative.scenarios[0].raw,-1);assert.equal(p.reports.wrap.scenarios[0].raw,-2147483648);
 assert(p.reports.legacy940.scenarios[0].legacy);assert.equal(p.reports.legacy940.scenarios[0].completedText,'COMMANDER_DONE 0/5000/5');
 assert.equal(p.oldReaderControl.scenarios[0].readerVersion,940);assert.equal(p.oldReaderControl.scenarios[0].futureVersion,941);
 assert.equal(p.regressionScenarioCount,61);assert.equal(p.archive.runtimeFiles.length,10);
 const rules=read('scripts/era-bridge/gameplay/map-rules.json');assert(!rules.source77ImplementedCodes.includes(118));assert.equal(rules.completeRules,false);
});
