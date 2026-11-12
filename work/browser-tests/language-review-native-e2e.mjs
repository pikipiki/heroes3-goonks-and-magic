import {execFileSync} from 'node:child_process';
import{chromium,webkit}from'playwright-core';import fs from'node:fs';import assert from'node:assert/strict';
const browser=await (process.env.BROWSER==='webkit'?webkit:chromium).launch({headless:true,...(process.env.BROWSER==='webkit'?{}:{args:['--no-sandbox']})}),context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,bypassCSP:true,serviceWorkers:'block'}),p=await context.newPage();p.setDefaultTimeout(120000);const errors=[];p.on('pageerror',e=>{errors.push(e.stack);console.log('PAGE ERROR',e.stack);});p.on('console',m=>{if(/Server encountered a problem|Assertion failed/.test(m.text()))errors.push(m.text());});
const wait=f=>p.waitForFunction(f,null,{timeout:120000}),command=(...args)=>p.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]);
try{
 await p.addInitScript(()=>{sessionStorage.setItem('heroes-goonk.storage-failed','true');localStorage.setItem('heroes-goonk.language','fr');});
 await (await import('./silent-audio.mjs')).silenceTestAudio(p);await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8777')+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done');console.log('Native engine ready');
 const fixture=execFileSync('python3',['-c',`import zipfile,json,io,sys
out=io.BytesIO()
with zipfile.ZipFile('maps/000-Goonk.vmap') as src,zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as dst:
 for name in src.namelist():
  data=src.read(name)
  if name=='objects.json':
   objects=[o for o in json.loads(data) if o.get('instanceName')!='trainingOgre']
   for o in objects:
    if o.get('instanceName')=='goonkTown':
     o['subtype']='core:castle';o['template']['animation']='AVCCAST0.DEF';o['options']['name']='Castellatus';o['options']['buildings']={'allOf':['core:villageHall','core:tavern','core:fort','core:dwellingLvl1','core:blacksmith']}
    if o.get('instanceName')=='goonkHero':o['x']=8;o['y']=9;o['options'].update({'type':'core:christian','spellBook':['core:magicArrow'],'artifacts':{'spellbook':'core:spellBook'},'army':[{'type':'core:archangel','amount':1},{'type':'core:pikeman','amount':20}]})
    if o.get('instanceName')=='trainingGuard':o['x']=12;o['y']=9;o['options']['amount']=1
   data=json.dumps(objects).encode()
  dst.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`]);
 await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture]);
 await command(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await command(21);await wait(()=>goonkMobileState.selectedMap?.startsWith('000'));await command(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);console.log('Native fixture ready');


 await command(5);await wait(()=>goonkMobileState.mode==='town');await p.locator('[data-ui=town-fort]').click();await wait(()=>goonkMobileState.mode==='fort');await command(42,13);await wait(()=>goonkMobileState.mode==='creature');const unit=await p.evaluate(()=>goonkMobileState.selectedCreature||goonkMobileState.creature||goonkMobileState);console.log('FR UNIT',JSON.stringify(unit).slice(0,1500));const body=await p.locator('#mobile-app').innerText();assert.match(body,/Archange/i);assert.match(body,/Retour/);assert(!body.includes('Back'));assert(!body.includes('Attack'));assert(!body.includes('Increases allies morale'));assert(!body.includes('Advanced King'));const beats=await p.evaluate(()=>new Promise(resolve=>{let n=0;const timer=setInterval(()=>{if(++n===10){clearInterval(timer);resolve(n)}},20)}));assert.equal(beats,10);console.log('PASS French native archangel, translated controls and responsive event loop');
}catch(error){console.error(error);throw error;}finally{await browser.close();}
