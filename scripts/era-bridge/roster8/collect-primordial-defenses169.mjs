import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const [shields,ice,out='outputs/wog-priorities-0.4.147']=process.argv.slice(2);
if(!shields||!ice)throw Error('SHIELDS_RUN ICE_DEFEND_RUN [OUTPUT]');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const engine='375373eb4c2cd02af48a838e49854829ac1410dbbb7002f215405be3f25a2f91';
const a=JSON.parse(fs.readFileSync(path.join(shields,'result.json'))),b=JSON.parse(fs.readFileSync(path.join(ice,'result.json')));
for(const r of[a,b]){assert.equal(r.passed,true);assert.deepEqual(r.errors,[]);assert.equal(r.report.engineMetadata.sha256,engine);}
for(const [name,loss,coefficient]of[['intrinsic30',89,.3],['liveBasic20',59,.2],['defendTwice30',89,.3],['preHitHealthCap',450,.3]]){
 const row=a.report['primordialShield'+name];assert.equal(row.expected,loss);assert.equal(row.coefficient,coefficient);
 const before=row.beforeHit.battleUnits.find(u=>u.key==='core:gnoll'),after=row.afterHit.battleUnits.find(u=>u.key==='core:gnoll');assert.equal(before.currentHealth-after.currentHealth,loss);
 if(name==='liveBasic20'){assert(row.cast.book.spellbook.spells.some(s=>s.id===29&&s.enabled));assert(row.gear.red.every(x=>x.icon!==93));assert.equal(row.cast.after.battleCamera.label,'Fire Shield');}
 if(name==='defendTwice30'){assert.equal(row.afterAction.battleCamera.sequence-row.beforeAction.battleCamera.sequence,3);assert.equal(row.afterAction.battleUnits.find(u=>u.key==='tum-era:eraCreature346').remainingCasts,10);}
 if(name==='preHitHealthCap')assert(!row.afterHit.battleUnits.some(u=>u.key==='tum-era:eraCreature346'));
 else assert.equal(row.physical,299);
}
const d=b.report.primordial347Defend;assert.equal(d.before.battleUnits.find(u=>u.key==='core:gnoll').currentHealth-d.after.battleUnits.find(u=>u.key==='core:gnoll').currentHealth,2120);assert.equal(d.after.battleCamera.sequence-d.before.battleCamera.sequence,3);assert.equal(d.after.battleCamera.label,'Frost Ring');assert.equal(d.after.battleUnits.find(u=>u.key==='tum-era:eraCreature347').remainingCasts,10);assert.equal(d.after.activeUnit.key,'goonk:bubu');
fs.mkdirSync(out,{recursive:true});const assets=[];
for(const[label,run]of[['primordial346-shields169',shields],['primordial347-defend169',ice]])for(const name of fs.readdirSync(run).filter(n=>n==='result.json'||n==='console.log'||n.endsWith('.png'))){const bytes=fs.readFileSync(path.join(run,name)),file=path.join(out,label+'-'+name);fs.writeFileSync(file,bytes);assets.push({path:file,sha256:sha(bytes)});}
const harness=['work/browser-tests/wog-primordial-shields-native-e2e.mjs','work/browser-tests/primordial-shield-cases.mjs','work/browser-tests/wog-primordial-defend-native-e2e.mjs','work/browser-tests/primordial-whole-overlay.mjs'];
fs.writeFileSync(path.join(out,'native-primordial-defenses169.json'),JSON.stringify({passed:true,engineSHA256:engine,controls:{fire346:{intrinsic30:89,liveBasic20OverridesIntrinsic:59,realDefendTwoCasts:89,preHitHealth1500CapsLethalReflection:450,physicalNonlethalObserved:299},ice347:{realDefendFrostRingCasts:2,totalDamage:2120,chargesUnchanged:10,defendEndsTurn:true}},scope:'Whole original R0 actors. Enemy Gnoll durability/damage/inactivity/morale/retaliation fixtures isolate each branch. Gear normalized through actual hero UI. No original source actor immunity/stat overrides. Does not close later-round347 slot lifecycle.',fixtureHistory:'The first liveShield harness tapped while hero animation was still pending. The accepted run waits for actual spell sequence>=2, inactive camera and native canUseMagic readiness. No engine change between failing and accepted169 runs.',assets,harness:harness.map(p=>({path:p,sha256:sha(fs.readFileSync(p))}))},null,2)+'\n');
console.log('Retained four real346 shield cases and real347 double-FrostRing Defend with exact native provenance.');
