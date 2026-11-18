import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {stringReceiversFixture} from '../work/browser-tests/wog-era3-string-receivers-cases.mjs';

test('native string receivers use the source negative-array addresses and numeric dialog indices',()=>{
 const p=stringReceiversFixture();assert.equal(p.schemaVersion,6);assert.equal(p.stringLocals,'era3-z-ascii');
 const parent=p.blocks.find(b=>b.selectors[0]?.number===9450);
 assert.deepEqual(parent.commands.slice(0,3).map(c=>c.operations[0].args.map(a=>a.number)),[[4,-3,0],[4,-2,1],[4,-1,2]]);
 assert.equal(parent.commands[4].operations[0].args[0].number,-3);
 const child=p.blocks.find(b=>b.selectors[0]?.number===9451);
 assert.deepEqual(child.commands[0].operations[0].args.map(a=>a.number),[4,-1,3]);
});

test('native receiver cells preserve caller names and text choices across touch, mouse and saves',()=>{
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 const proof=JSON.parse(fs.readFileSync('scripts/era-bridge/gameplay/era3-string-receivers-native-validation.json'));
 for(const flag of ['activation','completeRules','profilesAdmitted'])assert.equal(proof[flag],false);
 for(const[file,hash]of Object.entries(proof.sourceBindings))assert.equal(sha(fs.readFileSync(file)),hash,file);
 for(const f of proof.upstreamReference.fragments)assert.equal(sha(f.text),f.sha256);
 assert.equal(proof.nativeBuild.exitCode,0);assert.equal(proof.linuxSanitizers.exitCode,0);assert(proof.linuxSanitizers.regressions.every(r=>r.exitCode===0));
 assert.equal(proof.sourceAudit.trackedFilesChecked,3004);assert.deepEqual(proof.sourceAudit.mismatches,[]);
 assert.equal(proof.serialization.previousSaveVersion,920);assert.equal(proof.serialization.newSaveVersion,921);assert.equal(proof.serialization.choiceCount,19);
 for(const r of Object.values(proof.reports)){
  assert(r.passed);assert.deepEqual(r.errors,[]);assert.equal(r.engineSha256,proof.engineSha256);assert.equal(r.scenarios.length,1);
  const s=r.scenarios[0];assert.equal(s.programSha256,stringReceiversFixture().sha256);assert.equal(s.nativeSaveVersion,921);
  assert(s.nativeNameOutputScoped&&s.numericDialogText&&s.numericChecklistCells&&s.nestedNativeSaveReload&&s.completedNativeSaveReload);
  assert.equal(s.seen[0],'STRCELLS NAMES Pathfinding/Archery/Logistics');assert.equal(s.seen[3],'STRCELLS RETURN Pathfinding/Archery/Logistics');
  assert.equal(s.choices[0].label,'Archery');assert.equal(s.choices[1].label,'Logistics');
 }
 assert.equal(proof.reports.touchPortrait.scenarios[0].viewport.width,390);assert.equal(proof.reports.desktopMouse.scenarios[0].input,'mouse');
 const old=proof.oldPublishedControl.scenarios[0];assert.equal(old.nativeSaveVersion,920);assert.equal(old.seen[0],'STRCELLS NAMES //');assert.equal(old.choices[1].label,'Scouting');
 const reader=proof.oldReaderControl.scenarios[0];assert.equal(reader.futureVersion,921);assert.equal(reader.readerVersion,920);assert(reader.rejectedBeforeScriptExecution);
 assert.equal(Object.keys(proof.nativeRegressions).length,6);
 for(const r of Object.values(proof.nativeRegressions)){assert(r.passed);assert.deepEqual(r.errors,[]);assert.equal(r.engineSha256,proof.engineSha256);}
 assert.equal(proof.serialization.legacyScopeInputVersion,920);assert.equal(proof.serialization.legacyScopeOutputVersion,921);
 assert(proof.archive.runtimeByteIdenticalToTestedCandidate);
});
