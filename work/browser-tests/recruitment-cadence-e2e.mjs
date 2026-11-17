import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {silenceTestAudio} from './silent-audio.mjs';
const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8994',out=process.env.REVIEW_OUTPUT||'/tmp/goonk-recruitment-focus';fs.mkdirSync(out,{recursive:true});
const browser=await(process.env.TEST_BROWSER==='webkit'?webkit:chromium).launch({headless:true});const errors=[],cases=[];
try{for(const faction of ['tower','goonk']){
 const p=await browser.newPage({viewport:{width:360,height:716},hasTouch:true,bypassCSP:true});await silenceTestAudio(p);p.on('pageerror',e=>errors.push(e.message));
 const wait=(f,a)=>p.waitForFunction(f,a,{timeout:240000}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]);
 await p.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&goonkSessionRecovery?.phase==='done');

 assert.deepEqual(await p.evaluate(()=>JSON.parse(Module.FS.readFile('/config/mobile-creature-focus.json',{encoding:'utf8'}))),JSON.parse(fs.readFileSync('work/vcmi-wasm/config/mobile-creature-focus.json','utf8')),'The release contains the exact offline camera table');
 const engine=await(await p.request.get(origin+'/engine-build.json')).json();if(process.env.EXPECTED_ENGINE_SHA)assert.equal(engine.sha256,process.env.EXPECTED_ENGINE_SHA);
 const bytes=execFileSync('python3',['-c',String.raw`
import json,zipfile,io,sys,importlib.util
with zipfile.ZipFile('maps/000-Goonk.vmap') as z:entries={n:z.read(n) for n in z.namelist()}
objects=[o for o in json.loads(entries['objects.json']) if o['instanceName'] in ['goonkHero','goonkTown','enemyTown']]
if sys.argv[1]=='tower':
 town=next(o for o in objects if o['instanceName']=='goonkTown');town['subtype']='core:tower';town['options']['buildings']={'allOf':['core:villageHall','core:tavern','core:fort','core:dwellingLvl1']}
entries['objects.json']=json.dumps(objects).encode();header=json.loads(entries['header.json']);header['name']='000 - Preview focus';entries['header.json']=json.dumps(header).encode()
for name in ['english.json','french.json']:
 text=json.loads(entries[name]);text['mapName']=header['name'];entries[name]=json.dumps(text).encode()
spec=importlib.util.spec_from_file_location('normalize','scripts/normalize-map-instances.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);entries=mod.normalize(entries)
out=io.BytesIO()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for n,data in entries.items():z.writestr(n,data)
sys.stdout.buffer.write(out.getvalue())
`,faction]);
 await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/003-Goonks-WoG.vmap',new Uint8Array(bytes)),[...bytes]);
 await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.maps?.some(m=>m.name==='000 - Preview focus')&&goonkMobileState.lobbyReady);
 const index=await p.evaluate(()=>goonkMobileState.maps.find(m=>m.name==='000 - Preview focus').index);await p.locator('#mobile-map-select').selectOption(String(index),{force:true});await wait(()=>goonkMobileState.selectedMap==='000 - Preview focus');await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);await cmd(5,0);await wait(()=>goonkMobileState.mode==='town');await p.locator('[data-ui=town-fort]').click();await wait(()=>goonkMobileState.mode==='fort');
 const units=await p.evaluate(()=>[goonkMobileState.fortFamilies[0].variants[0],goonkMobileState.fortFamilies[5].variants.find(u=>u.name==='Naga Empress')||goonkMobileState.fortFamilies[5].variants[0]].map(u=>({id:u.id,name:u.name})));
 for(const unit of units){
  await p.locator(`[data-family-select="${unit.id}"]`).click();await p.waitForTimeout(600);await wait(id=>goonkMobileState.previewUnits?.some(u=>u.id===id&&window.goonkCreaturePreviewRects?.has(u.previewKey??id)),unit.id);
  const sample=await p.evaluate(async id=>{
   const packets=[],changes=[],frames=[],start=performance.now();let version=-1,hash,previous=start;
   await new Promise(resolve=>{const tick=now=>{frames.push(now-previous);previous=now;
    if(window.goonkCreaturePreviewVersion!==version){version=window.goonkCreaturePreviewVersion;packets.push(now-start);const u=goonkMobileState.previewUnits?.findLast(u=>u.id===id),rect=u&&goonkCreaturePreviewRects.get(u.previewKey??id);if(rect){const c=document.createElement('canvas');c.width=rect.w;c.height=rect.h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(goonkCreaturePreviewAtlas,rect.x,rect.y,rect.w,rect.h,0,0,rect.w,rect.h);const data=ctx.getImageData(0,0,rect.w,rect.h).data;let value=2166136261;for(let i=0;i<data.length;i+=16)value=Math.imul(value^data[i]^data[i+1]^data[i+2],16777619);if(value!==hash){changes.push(now-start);hash=value;}}}
    if(now-start<12000)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});
   return {packets,changes,frames};
  },unit.id);
  const holds=sample.changes.slice(1).map((t,i)=>t-sample.changes[i]);if(process.env.STRICT_CADENCE)assert(Math.max(...holds)<170,unit.name+' should not stall on repeated poses: '+Math.max(...holds));cases.push({faction,unit:unit.name,sample});console.log(JSON.stringify({faction,unit:unit.name,packets:sample.packets.length,changes:sample.changes.length,maxRaf:Math.max(...sample.frames)}));
 }

 await p.close();
}assert.deepEqual(errors,[]);fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,cases,errors},null,2));console.log('PASS cadence capture');}finally{await browser.close();}
