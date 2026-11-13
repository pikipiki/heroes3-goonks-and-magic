/** Private Dungeon-only UI regression fixture. No global town activation or
 * synthetic completion of the eighteen-actor ledger is permitted here. */
import fs from'node:fs';import assert from'node:assert/strict';import{injectOwnedFiles}from'./eighth-owned-files.mjs';
export async function applyPortalTownOverlay(page,{eighth}){
 if(!eighth)return;
 const stage=process.env.PORTAL_TOWN_REVIEW||process.env.EIGHTH_TOWN_STAGE;
 if(!stage)throw Error('PORTAL_TOWN_REVIEW or EIGHTH_TOWN_STAGE must point to the reviewed source town assets');
 const metadata=JSON.parse(fs.readFileSync(stage+'/eighth-town-source.json')),ledger=JSON.parse(fs.readFileSync('outputs/wog-priorities-0.4.147/eighth-reviewed-actor-contracts.json'));
 const record=metadata.records.find(r=>r.town==='core:dungeon'),baseline=metadata.baselineTowns[record.town],hall=metadata.halls[record.town];assert.equal(baseline.creatures.length,7);
 const roster=record.roster.slice(0,2).map(id=>{const c=ledger.actorContracts[id];assert(c.complete&&c.nativeValidated,'Actual Dungeon actor proof required');return c.nativeId;});
 const hallSlots=structuredClone(baseline.hallSlots);hallSlots[4].push(['dwellingLvl8','dwellingUpLvl8']);
 const buildings=Object.fromEntries(record.buildings.map(b=>[b.key,{id:b.nativeId,name:b.name,description:b.description,cost:b.cost,requires:[b.sourceId===88?'dwellingLvl6':'dwellingLvl8'],...(b.sourceId===89?{upgrades:'dwellingLvl8'}:{})}]));
 const patch={'core:dungeon':{town:{creatures:[...baseline.creatures,roster],hallSlots,buildingsIcons:hall.animation,buildings}}};
 await injectOwnedFiles(page,stage,metadata.files.filter(f=>f.path.includes('eighth-dungeon-')));
 await page.addInitScript(patch=>{const prior=Object.getOwnPropertyDescriptor(window,'Module');let current;Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{prior?.set?.call(window,m);current=m;const previous=Object.getOwnPropertyDescriptor(m,'callMain');let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;previous?.set?.call(m,f);},get:()=>function(...args){const invoke=previous?.get?previous.get.call(m):main,root='/home/web_user/.local/share/vcmi/Mods/tum-era/',manifest=JSON.parse(m.FS.readFile(root+'mod.json',{encoding:'utf8'}));manifest.factions.push('config/portal-dungeon-test.json');m.FS.writeFile(root+'content/config/portal-dungeon-test.json',JSON.stringify(patch));m.FS.writeFile(root+'mod.json',JSON.stringify(manifest));return invoke.apply(m,args);}});}});},patch);
}
