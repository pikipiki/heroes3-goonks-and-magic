import {execFileSync} from 'node:child_process';
import{chromium}from'playwright-core';import fs from'node:fs';import assert from'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox']}),context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,bypassCSP:true,serviceWorkers:'block'}),p=await context.newPage();p.setDefaultTimeout(120000);const errors=[];p.on('pageerror',e=>{errors.push(e.stack);console.log('PAGE ERROR',e.stack);});p.on('console',m=>{if(/Server encountered a problem|Assertion failed/.test(m.text()))errors.push(m.text());});
const wait=f=>p.waitForFunction(f,null,{timeout:120000}),command=(...args)=>p.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]);
try{
 await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));
 await (await import('./silent-audio.mjs')).silenceTestAudio(p);await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8777')+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done');console.log('Native engine ready');
 const fixture=execFileSync('python3',['-c',`import zipfile,json,io,sys
out=io.BytesIO()
with zipfile.ZipFile('maps/000-Goonk.vmap') as src,zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as dst:
 for name in src.namelist():
  data=src.read(name)
  if name=='objects.json':
   objects=[o for o in json.loads(data) if o.get('instanceName') not in ['trainingOgre','trainingGuard']]
   for o in objects:
    if o.get('instanceName')=='goonkTown':
     o['subtype']='core:castle';o['template']['animation']='AVCCAST0.DEF';o['options']['name']='Castellatus';o['options']['buildings']={'allOf':['core:villageHall','core:tavern','core:fort','core:dwellingLvl1','core:blacksmith']}
    if o.get('instanceName')=='goonkHero':o['x']=8;o['y']=9;o['options'].update({'type':'core:christian','spellBook':['core:magicArrow'],'artifacts':{'spellbook':'core:spellBook'},'army':json.loads(sys.argv[1])})
    if o.get('instanceName')=='enemyTown':o['x']=15;o['y']=9;o['options']['buildings']={'allOf':['core:villageHall','core:tavern','core:castle']};o['options']['army']=[{'type':'core:pikeman','amount':50},{'type':'core:archer','amount':50}]
   data=json.dumps(objects).encode()
  dst.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`,process.env.ROSTER||JSON.stringify(['paingpaingExalted','picpiqueExalted','zinzeclairExalted','bubuExalted','glouglouExalted','bobopeExalted','maillemailleExalted'].map(type=>({type:'goonk:'+type,amount:5})))]);
 await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture]);
 await command(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await command(21);await wait(()=>goonkMobileState.selectedMap?.startsWith('000'));await command(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);console.log('Native fixture ready');await command(29,3);await command(29,2);await command(29,1);await p.waitForTimeout(600);await command(6);await p.waitForTimeout(250);await p.evaluate(()=>Module._vcmiMobilePointer(497,281,4));await wait(()=>goonkMobileState.hasPath);await command(2);await wait(()=>goonkMobileState.mode==='battle');await command(15);await p.waitForTimeout(300);if(await p.evaluate(()=>goonkMobileState.canEndTactics))await command(35);await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.round>0&&goonkMobileState.canAct);console.log('Native battle ready');



 await p.setViewportSize({width:390,height:740});await p.waitForTimeout(250);await p.locator('.battle-view').click();await wait(()=>document.querySelector('#mobile-app').dataset.verticalBattle==='true'&&window.goonkBattlePlanes?.version>2);await p.waitForTimeout(400);await p.screenshot({path:'/tmp/vertical-siege.png'});console.log('SIEGE',JSON.stringify(await p.evaluate(()=>({units:goonkMobileState.battleUnits.map(u=>u.key),bounds:goonkBattleSpriteBounds.length}))));
 const old=await p.evaluate(()=>goonkMobileState.battleUnits.length);await p.locator('.mobile-nav [data-ui=battle-magic]').click();await p.waitForTimeout(100);if(await p.locator('[data-ui=cast-hero-spell]').isVisible())await p.locator('[data-ui=cast-hero-spell]').click();await wait(()=>goonkMobileState.mode==='spellbook');for(let page=0;page<12&&!(await p.locator('[data-spell="66"]').count());page++){const before=await p.evaluate(()=>goonkMobileState.spellbook.page);await p.locator('[data-page="1"]').click();await p.waitForFunction(before=>goonkMobileState.spellbook.page!==before,before);}await p.locator('[data-spell="66"]').click();await p.locator('[data-cast-spell]').click();await p.waitForFunction(old=>goonkMobileState.mode==='battle'&&goonkMobileState.battleUnits.length>old,old,{timeout:120000});await p.waitForTimeout(700);assert(await p.evaluate(()=>goonkMobileState.battleUnits.some(u=>u.key==='core:fireElemental')));await p.screenshot({path:'/tmp/vertical-siege-summon.png'});console.log('PASS siege walls, war machines and summoned native elemental in vertical view');assert.deepEqual(errors,[]);
}catch(error){console.error(error);await p.screenshot({path:'/tmp/vertical-siege-failed.png'});throw error;}finally{await browser.close();}
