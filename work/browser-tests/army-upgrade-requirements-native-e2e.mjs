import {chromium,webkit} from 'playwright-core';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {silenceTestAudio} from './silent-audio.mjs';
const browser=await(process.env.TEST_BROWSER==='webkit'?webkit:chromium).launch({headless:true});const p=await browser.newPage({viewport:{width:430,height:873},hasTouch:true,bypassCSP:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
const wait=(f,a)=>p.waitForFunction(f,a,{timeout:180000}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]);
try{await silenceTestAudio(p);await p.addInitScript(()=>addEventListener('goonk-state',e=>window.__upgradeRawState=e.detail));await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8993')+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&goonkSessionRecovery?.phase==='done');
 const bytes=execFileSync('python3',['-c',String.raw`
import json,zipfile,io,sys,importlib.util,copy
with zipfile.ZipFile('maps/000-Goonk.vmap') as z:entries={n:z.read(n) for n in z.namelist()}
objects=[o for o in json.loads(entries['objects.json']) if o['instanceName'] in ['goonkHero','goonkTown','enemyTown']]
town=next(o for o in objects if o['instanceName']=='goonkTown');town['options']['army']=[{'type':'core:pikeman','amount':5}]
hero=next(o for o in objects if o['instanceName']=='goonkHero');hero['options']['army']=[{'type':'core:pikeman','amount':2}]
other=copy.deepcopy(next(o for o in objects if o['instanceName']=='enemyTown'));other.update(instanceName='missingUpgradeTown',x=19,y=19);other['options']['name']='Missing building';other['options']['owner']='red';other['options']['buildings']={'allOf':['core:villageHall','core:fort','core:dwellingLvl1']};objects.append(other)
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
 const index=await p.evaluate(()=>goonkMobileState.maps.find(m=>m.name==='000 - Preview focus').index);await cmd(24,index);await wait(()=>window.__upgradeRawState?.selectedMap==='000 - Preview focus');await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);

const initial=await p.evaluate(()=>({hero:goonkMobileState.heroId,towns:goonkMobileState.towns,resources:goonkMobileState.resources}));
assert.equal(initial.towns.length,2,JSON.stringify(initial));
for(const [id,reason] of [[initial.hero,'noTown'],[initial.towns.find(t=>t.name==='Goonkbourg').id,'wrongTown'],[initial.towns.find(t=>t.name!=='Goonkbourg').id,'requiredBuilding']]){
 await cmd(121,id);await wait(id=>goonkMobileState.armyUpgradeQuote?.armyId===id,id);
 const quote=await p.evaluate(()=>goonkMobileState.armyUpgradeQuote);assert.equal(quote.unavailableReason,reason,JSON.stringify(quote));assert.equal(quote.units.length,0);
 assert.deepEqual(await p.evaluate(()=>goonkMobileState.resources),initial.resources,'Error quote spends nothing');
 console.log('PASS native upgrade requirement',reason);
}
assert.deepEqual(errors,[]);
}finally{await browser.close();}
