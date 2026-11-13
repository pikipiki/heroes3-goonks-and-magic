/** Activation guard for a genuine native seven-tier binary save migration. */
import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
export function validateEighthTownSaveProof(document,{patchSha256,markerBytes}={}){
 const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),marker=JSON.parse(markerBytes),factions=['castle','rampart','tower','inferno','necropolis','dungeon','stronghold','fortress','conflux'].map(n=>'core:'+n);
 assert.equal(marker.schemaVersion,1);assert.deepEqual(Object.keys(marker).sort(),['factions','schemaVersion']);assert.deepEqual([...marker.factions].sort(),[...factions].sort());assert.equal(new Set(marker.factions).size,9);
 assert.equal(document.passed,true);const p=document.report?.town8OldSaveCompatibility;assert(p?.passed,'Complete independent old-save native proof required');assert.equal(p.patchSha256,patchSha256);assert.equal(p.markerSha256,sha(markerBytes));assert.equal(p.productionActivation,false);
 const engine=document.report.engineMetadata?.sha256;assert(/^[a-f0-9]{64}$/.test(engine||''));assert.equal(p.engineMetadata.sha256,engine);assert(/^[a-f0-9]{64}$/.test(p.old.oldEngine.sha256||''));assert.notEqual(p.old.oldEngine.sha256,engine,'Use a genuine earlier native engine for the old save');assert(p.old.passed&&p.old.oldSevenReloadPassed&&p.old.portalNativeConstruction);assert.equal(p.old.patchSha256,patchSha256);
 for(const key of ['oldSevenStocksPreserved','portal7To8Preserved','resourcesAndArmiesPreserved','builtIDsPreserved','oldSevenReloadUnchanged','newEightIdempotent','goonkSevenUnchanged','weeklyMatchesOldBaseline'])assert.equal(p.claims[key],true,'Missing native old-save control '+key);
 // Only hashes and snapshots are versioned; the private native save itself
 // must still be available for this final installation audit.
 const input=fs.readFileSync(p.old.oldSave.path);assert(input.length>1000);assert.equal(input.length,p.old.oldSave.bytes);assert.equal(sha(input),p.old.oldSave.sha256);assert(/\.vsgm1$/i.test(p.old.oldSave.path));const resave=fs.readFileSync(p.resave.path);assert.equal(sha(resave),p.resave.sha256);assert.equal(resave.length,p.resave.bytes);
 const core=s=>s.towns.filter(t=>factions.includes(t.faction));assert.equal(p.before.towns.length,10);assert.equal(core(p.before).length,9);assert.deepEqual(core(p.before).map(t=>t.faction).sort(),[...factions].sort());const goonk=p.before.towns.filter(t=>!factions.includes(t.faction));assert.equal(goonk.length,1);assert(goonk[0].faction.startsWith('goonk:'));assert.equal(goonk[0].fortAreas,7);
 const equal=(old,next,newConfig)=>{
  assert.equal(next.day,old.day);assert.deepEqual(next.resources,old.resources);assert.equal(next.towns.length,old.towns.length);
  for(const a of old.towns){const b=next.towns.find(t=>t.id===a.id);assert(b);assert.equal(b.faction,a.faction);assert.deepEqual(b.armies,a.armies);assert.deepEqual(b.built,a.built);const a7=a.stocks.filter(r=>r.level<7),b7=b.stocks.filter(r=>r.level<7);assert.deepEqual(b7,a7);
   if(factions.includes(a.faction)){assert.equal(a7.length,7);if(newConfig){assert.equal(b.fortAreas,a.faction==='core:dungeon'?9:8);assert(!b.stocks.some(r=>r.level===7));if(a.faction==='core:dungeon'){const oldPortal=a.stocks.find(r=>r.level===7),newPortal=b.stocks.find(r=>r.level===8);assert(oldPortal&&newPortal);assert.deepEqual({...newPortal,level:7},oldPortal);}}else assert.deepEqual(b,a);}
   else assert.deepEqual(b,a,'Goonk seven-tier control remains byte-equivalent');
  }
 };
 for(const t of core(p.before))assert.equal(t.fortAreas,t.faction==='core:dungeon'?8:7,'Native old7 layout must be observed before saving');equal(p.before,p.oldReload,false);equal(p.before,p.restored,true);assert.equal(p.weekly.day,8);equal(p.weekly,p.migratedWeekly,true);
 assert.equal(p.constructions.length,2);assert.deepEqual(p.constructions.map(c=>c.faction).sort(),['core:castle','core:dungeon']);for(const c of p.constructions){assert(c.after.buildings.some(b=>b.id===150&&b.built));assert(!c.before.buildings.some(b=>b.id===150&&b.built));assert(c.after.recruits.some(r=>r.level===7&&r.count===1));assert.deepEqual(c.after.armies,c.before.armies);for(let i=0;i<c.before.resources.length;i++)assert.equal(c.before.resources[i]-c.after.resources[i],c.before.buildings.find(b=>b.id===150).cost[i]||0);}
 assert.deepEqual(p.reloaded,p.newBefore,'Repeated save/load must not insert a second stock row');
 return{engineSha256:engine,oldEngineSha256:p.old.oldEngine.sha256,oldSaveSha256:p.old.oldSave.sha256,newSaveSha256:p.resave.sha256,markerSha256:p.markerSha256,patchSha256,oldSevenRowsNative:true,portalMoved7To8:true,idempotent:true,goonkSevenUnchanged:true};
}
