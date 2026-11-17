import {chromium,webkit} from 'playwright-core';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {silenceTestAudio} from './silent-audio.mjs';
const browser=await(process.env.TEST_BROWSER==='webkit'?webkit:chromium).launch({headless:true});const p=await browser.newPage({viewport:{width:430,height:873},hasTouch:true,bypassCSP:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
const wait=(f,a)=>p.waitForFunction(f,a,{timeout:180000}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]);
try{await silenceTestAudio(p);await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8993')+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&goonkSessionRecovery?.phase==='done');
 const bytes=execFileSync('python3',['-c',String.raw`
import json,zipfile,io,sys,importlib.util
with zipfile.ZipFile('maps/000-Goonk.vmap') as z:entries={n:z.read(n) for n in z.namelist()}
objects=[o for o in json.loads(entries['objects.json']) if o['instanceName'] in ['goonkHero','goonkTown','enemyTown']]
if True:
 town=next(o for o in objects if o['instanceName']=='goonkTown');town['subtype']='goonk:goonk';town['options']['buildings']={'allOf':['goonk:villageHall','goonk:tavern','goonk:fort','goonk:dwellingLvl1','goonk:dwellingUpLvl1','goonk:dwellingUp2Lvl1']}
town['options']['army']=[{'type':'goonk:paingpaing','amount':5},{'type':'goonk:paingpaingRoyal','amount':3}]
next(o for o in objects if o['instanceName']=='goonkHero')['y']=town['y']
next(o for o in objects if o['instanceName']=='goonkHero')['options']['army']=[{'type':'goonk:paingpaing','amount':2}]
entries['objects.json']=json.dumps(objects).encode();header=json.loads(entries['header.json']);header['name']='000 - Preview focus';entries['header.json']=json.dumps(header).encode()
for name in ['english.json','french.json']:
 text=json.loads(entries[name]);text['mapName']=header['name'];entries[name]=json.dumps(text).encode()
spec=importlib.util.spec_from_file_location('normalize','scripts/normalize-map-instances.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);entries=mod.normalize(entries)
out=io.BytesIO()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for n,data in entries.items():z.writestr(n,data)
sys.stdout.buffer.write(out.getvalue())
`]);
 await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/003-Goonks-WoG.vmap',new Uint8Array(bytes)),[...bytes]);
 await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.maps?.some(m=>m.name==='000 - Preview focus')&&goonkMobileState.lobbyReady);
 const index=await p.evaluate(()=>goonkMobileState.maps.find(m=>m.name==='000 - Preview focus').index);await p.locator('#mobile-map-select').selectOption(String(index),{force:true});await wait(()=>goonkMobileState.selectedMap==='000 - Preview focus');await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);await cmd(5,0);await wait(()=>goonkMobileState.mode==='town');

const armies=await p.evaluate(()=>goonkMobileState.armies);assert.equal(armies.length,2,'Town and visiting hero');
for(const army of armies){
 await p.locator('[data-ui=army]').click();const before=await p.evaluate(()=>({resources:goonkMobileState.resources,armies:goonkMobileState.armies}));
 await p.locator('.army-upgrade-all').nth(armies.indexOf(army)).click();await wait(id=>goonkMobileState.armyUpgradeQuote?.armyId===id,army.id);
 const quote=await p.evaluate(()=>goonkMobileState.armyUpgradeQuote);assert(quote.units.length);assert(quote.units.every(u=>/Emperor/.test(u.name)),JSON.stringify(quote));
 const prior=before.armies.find(a=>a.id===army.id);let expected=0;for(const slot of prior.slots.filter(Boolean))expected+=(slot.name==='Paingpaing'?152-70:152-98)*slot.count;assert.equal(quote.cost[6],expected,'Sum of every intermediate evolution');
 assert.deepEqual(await p.evaluate(()=>goonkMobileState.resources),before.resources,'Quote is free');await p.locator('[data-army-upgrade-cancel]').click();assert.deepEqual(await p.evaluate(()=>goonkMobileState.resources),before.resources,'Cancel is free');
 await cmd(121,army.id);await wait(id=>goonkMobileState.armyUpgradeQuote?.armyId===id,army.id);await cmd(122,army.id,quote.hash+1);await wait(()=>goonkMobileState.armyUpgradeQuote?.status==='changed');assert.deepEqual(await p.evaluate(()=>goonkMobileState.resources),before.resources,'Stale confirmation spends nothing');
 await p.locator('.army-upgrade-all').nth(armies.indexOf(army)).click();await p.locator('[data-army-upgrade-confirm]').waitFor();await p.waitForFunction(()=>!document.querySelector('[data-army-upgrade-confirm]').disabled);await p.locator('[data-army-upgrade-confirm]').click();await wait(id=>goonkMobileState.armyUpgradeOperation?.armyId===id&&goonkMobileState.armyUpgradeOperation?.status==='done',army.id);
 const after=await p.evaluate(()=>({resources:goonkMobileState.resources,army:goonkMobileState.armies.find(a=>a.id===goonkMobileState.armyUpgradeOperation.armyId),operation:goonkMobileState.armyUpgradeOperation}));
 assert.equal(after.operation.completedSteps,army===armies[0]?3:2);for(let i=0;i<before.resources.length;i++)assert.equal(before.resources[i]-after.resources[i],quote.cost[i]||0,'Exact total resource '+i);for(const u of quote.units){assert.equal(after.army.slots[u.slot].id,u.id);assert.equal(after.army.slots[u.slot].count,u.count);}assert.equal(after.army.slots.filter(Boolean).length,prior.slots.filter(Boolean).length,'Split formations retained');
 await cmd(121,army.id);await wait(id=>goonkMobileState.armyUpgradeQuote?.armyId===id&&goonkMobileState.armyUpgradeQuote?.units?.length===0,army.id);console.log('PASS maximum paid upgrades',army.name,after.operation.completedSteps,quote.cost);assert(await p.locator('.army-upgrades-page').isHidden(),'Successful confirmation closes');await p.screenshot({path:'/tmp/goonk242-army-'+(process.env.TEST_BROWSER||'chromium')+'-'+army.id+'.png'});await p.locator('[data-ui=close-sheet]').click();
}
assert.deepEqual(errors,[]);
}finally{await browser.close();}
