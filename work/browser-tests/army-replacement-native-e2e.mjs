import {chromium} from 'playwright-core';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
const browser=await chromium.launch({headless:true}),p=await browser.newPage({viewport:{width:390,height:740},hasTouch:true,bypassCSP:true,serviceWorkers:'block'});
p.on('pageerror',e=>console.log('PAGEERROR',e.message));p.on('console',m=>{if(m.type()==='error')console.log('ENGINE',m.text().slice(0,250));});
const wait=f=>p.waitForFunction(f,null,{timeout:120000}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]);
try{
 await silenceTestAudio(p);await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));
 await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8777')+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done');
 const fixture=execFileSync('python3',['-c',`import zipfile,json,io,sys
out=io.BytesIO()
with zipfile.ZipFile('maps/000-Goonk.vmap') as src,zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as dst:
 for name in src.namelist():
  data=src.read(name)
  if name=='objects.json':
   objects=json.loads(data)
   for o in objects:
    if o.get('instanceName')=='goonkHero':o['x']=9;o['y']=9
    if o.get('instanceName')=='goonkTown':o['options']['army']=[{'type':'core:'+t,'amount':i+10} for i,t in enumerate(['pikeman','archer','griffin','swordsman','monk','cavalier','angel'])]
   data=json.dumps(objects).encode()
  dst.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`]);
 await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture]);await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await cmd(21);await wait(()=>goonkMobileState.selectedMap?.startsWith('000'));await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);console.log('PASS fixture map loaded');await cmd(5,0);await wait(()=>goonkMobileState.mode==='town'&&goonkMobileState.armies?.length===2);
 const snapshot=()=>p.evaluate(()=>goonkMobileState.armies.map(a=>({id:a.id,slots:a.slots.map(s=>s?{id:s.id,count:s.count}:null)})));
 const before=await snapshot();assert(before.every(a=>a.slots.filter(Boolean).length===7),'Two full formations');
 await cmd(58,before[0].id,before[1].id);await p.waitForFunction(before=>goonkMobileState.armies[1].slots.every((s,i)=>s?.id===before[0].slots[i]?.id&&s?.count===before[0].slots[i]?.count),before);let after=await snapshot();assert.deepEqual(after[0].slots,before[1].slots,'Old hero formation returns to garrison');assert.deepEqual(after[1].slots,before[0].slots,'Hero receives every garrison slot');
 await cmd(58,before[1].id,before[0].id);await p.waitForFunction(before=>goonkMobileState.armies[0].slots.every((s,i)=>s?.id===before[0].slots[i]?.id&&s?.count===before[0].slots[i]?.count),before);after=await snapshot();assert.deepEqual(after,before,'Reverse exchange conserves every creature and slot');console.log('PASS native seven-slot replacement in both directions without creature loss');
}catch(e){console.log('STATE',await p.evaluate(()=>({mode:window.goonkMobileState?.mode,armies:window.goonkMobileState?.armies})));throw e;}finally{await browser.close();}
