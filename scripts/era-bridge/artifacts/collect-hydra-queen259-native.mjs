/** Retain completed asserted controls; never promote a failed fixture to a passing run. */
import fs from'node:fs';import assert from'node:assert/strict';
const first='/tmp/goonk157-hydra259-native-final',rest='/tmp/goonk157-hydra259-native-rest',root=process.argv[2]||'outputs/wog-priorities-0.4.147',folder=root+'/hydra259-native';fs.mkdirSync(folder,{recursive:true});
const read=p=>JSON.parse(fs.readFileSync(p)),initial=read(first+'/partial-result.json'),remaining=read(rest+'/result.json');assert.equal(remaining.passed,true);
const firstNames=['new-summon-worn','new-summon-backpack','new-clone-worn','new-clone-backpack','baseline','equipped','backpack','opposite-hero','unrelated-head'];assert.deepEqual(Object.keys(initial).sort(),[...firstNames].sort());assert.equal(Object.keys(remaining.report).length,8);
const controls={...initial,...remaining.report};assert.equal(Object.keys(controls).length,17);
for(const[name,row]of Object.entries(controls)){
 if(name.startsWith('new-')){assert.equal(row.created.enemy,false);assert.equal(row.created.nativeFlags.attacksAllAdjacent,name.endsWith('-worn'));continue;}
 const all=['equipped','goonk','nonlisted-life-drain'].includes(name);assert.equal(row.affected,name==='breath'?row.affected:all?3:1);if(name==='breath')assert(row.affected<=2);
 const source=firstNames.includes(name)?first:rest,before=read(source+'/'+name+'-before.json'),actor=before.battleUnits.find(u=>u.stackId===before.activeStack);assert.equal(actor.nativeFlags.attacksAllAdjacent,all);row.effectiveAllAdjacent=actor.nativeFlags.attacksAllAdjacent;
}
assert.equal(controls.equipped.ownBefore-controls.equipped.ownAfter,1);assert.equal(controls.equipped.roundBefore,1);assert.equal(controls.equipped.roundAfter,2);
fs.copyFileSync(first+'/partial-result.json',folder+'/first-nine-completed.json');fs.copyFileSync(rest+'/result.json',folder+'/remaining-eight.json');
for(const[name,source]of[['equipped',first],['goonk',rest],['new-summon-worn',first],['new-clone-backpack',first]])fs.copyFileSync(source+'/'+name+'.png',folder+'/'+name+'.png');
const proof={passed:true,engineSHA256:'7f87443fff4a9ee3983d9ac91fae0d52826660de990296ec29e905270f0ff3be',controls,pendingNativeControls:[],collectionNotes:['The first nine asserted controls completed successfully; the following wide-creature fixture then ended before combat because its AI hero fled. Only the nine previously completed controls are retained from that run.','The remaining eight controls passed in a new run with ordinary Shackles of War preventing premature AI retreat. This item changes no tested damage/eligibility rule.','The Haste counter-isolation fixture uses base speed23: native grass adds1, so enemies25 act first; expert Haste then makes the wearer act first next round.']};fs.writeFileSync(root+'/native-hydra-queen259.json',JSON.stringify(proof,null,2)+'\n');console.log('PASS source259:17 asserted native controls retained with fixture provenance.');
