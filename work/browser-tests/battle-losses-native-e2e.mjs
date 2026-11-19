import {chromium,webkit} from 'playwright-core';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
const name=process.env.BROWSER||'chromium',out=process.env.REVIEW_OUTPUT||'/tmp/goonk-battle-losses-native';fs.mkdirSync(out,{recursive:true});
const browser=await({chromium,webkit}[name]).launch({headless:true});
const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,bypassCSP:true,serviceWorkers:'block'}),errors=[];
p.on('pageerror',e=>errors.push(e.message));p.on('crash',()=>errors.push('page process crashed'));
const wait=(f,arg)=>p.waitForFunction(f,arg,{timeout:180000}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]);
try{
 await silenceTestAudio(p);await p.addInitScript(()=>{sessionStorage.setItem('heroes-goonk.storage-failed','true');localStorage.setItem('heroes-goonk.language','fr');window.lossPaint=[];const paint=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){if(/^−\d+(?:–\d+)?$/.test(text)&&['mobile-scene','battle-strategic-scene'].includes(this.canvas.id)){if(lossPaint.length<200)lossPaint.push({text,canvas:this.canvas.id,args});}return paint.call(this,text,...args);};});
 await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8997')+'/game.html?mobile=1');
 await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done');
 const fixture=execFileSync('python3',['-c',`import zipfile,json,io,sys
out=io.BytesIO()
with zipfile.ZipFile('maps/000-Goonk.vmap') as src,zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as dst:
 for name in src.namelist():
  data=src.read(name)
  if name=='objects.json':
   objects=[o for o in json.loads(data) if o.get('instanceName')!='trainingOgre']
   for o in objects:
    if o.get('instanceName')=='goonkTown':o['subtype']='core:castle';o['template']['animation']='AVCCAST0.DEF'
    if o.get('instanceName')=='goonkHero':o['x']=8;o['y']=9;o['options'].update({'type':'core:christian','spellBook':['core:magicArrow'],'artifacts':{'spellbook':'core:spellBook'},'army':[{'type':'core:marksman','amount':200},{'type':'core:pikeman','amount':100}]})
    if o.get('instanceName')=='trainingGuard':o['x']=12;o['y']=9;o['subtype']='core:skeleton';o['options']['amount']=200
   data=json.dumps(objects).encode()
  dst.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`]);
 await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture]);
 await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await cmd(21);await wait(()=>goonkMobileState.selectedMap?.startsWith('000'));await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 await cmd(6);await p.waitForTimeout(250);await p.evaluate(()=>Module._vcmiMobilePointer(433,281,4));await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='battle');await cmd(15);await p.waitForTimeout(250);if(await p.evaluate(()=>goonkMobileState.canEndTactics))await cmd(35);
 await wait(()=>goonkMobileState.canAct&&goonkMobileState.battleLossEstimatesVersion===1&&goonkMobileState.battleUnits.some(u=>u.attackLosses));
 const first=await p.evaluate(()=>structuredClone(goonkMobileState));
 const enemies=first.battleUnits.filter(u=>u.enemy&&(u.canShootAt||u.canMeleeAt));assert(enemies.length>0);
 for(const u of enemies){assert(u.attackLosses,'Every legal native enemy receives a forecast');assert.equal(u.attackLosses.actor,first.activeStack);assert(Number.isInteger(u.attackLosses.min)&&u.attackLosses.min>=0&&u.attackLosses.max>=u.attackLosses.min&&u.attackLosses.max<=u.count);}
 assert(first.battleUnits.filter(u=>!u.enemy).every(u=>!u.attackLosses),'No friendly casualty label');
 const stable=JSON.stringify(enemies.map(u=>[u.stackId,u.count,u.currentHealth,u.attackLosses]));await p.waitForTimeout(1500);assert.equal(await p.evaluate(()=>JSON.stringify(goonkMobileState.battleUnits.filter(u=>u.enemy&&(u.canShootAt||u.canMeleeAt)).map(u=>[u.stackId,u.count,u.currentHealth,u.attackLosses]))),stable,'Idle forecasts do not attack, advance state or consume randomness');
 const captures=[];
 for(const viewport of [{width:390,height:844},{width:844,height:390},{width:320,height:568}]){
  await p.setViewportSize(viewport);await p.waitForTimeout(200);
  if(viewport.height>viewport.width){await p.locator('.battle-view').tap();await p.waitForTimeout(250);}
  await p.evaluate(()=>lossPaint=[]);await p.waitForTimeout(350);
  const painted=await p.evaluate(()=>lossPaint);assert(painted.length>0,'Forecasts paint without a hover or target selection');
  const file=`${out}/${name}-${viewport.width}x${viewport.height}.png`;await p.screenshot({path:file});captures.push({viewport,file,painted:[...new Set(painted.map(x=>x.text))]});
 }
 await p.evaluate(async()=>{const {setBattleLossEstimates}=await import('/web/battle-preferences.mjs');setBattleLossEstimates(false);lossPaint=[];});await p.waitForTimeout(350);assert.equal(await p.evaluate(()=>lossPaint.length),0,'Setting immediately hides native forecasts');
 await p.evaluate(async()=>{const {setBattleLossEstimates}=await import('/web/battle-preferences.mjs');setBattleLossEstimates(true);lossPaint=[];});await p.waitForTimeout(350);assert(await p.evaluate(()=>lossPaint.length>0));
 assert(await p.locator('.mobile-nav>[data-ui=defend]').isVisible(),'Defend remains directly accessible');
 assert.equal(await p.locator('.mobile-nav>[data-ui=battle-magic]').count(),0,'Magic is secondary');
 await p.locator('.mobile-nav>button[aria-haspopup=menu]').tap();await p.locator('.MuiMenu-root [data-ui=battle-magic]').tap();
 await wait(()=>goonkMobileState.mode==='spellbook'||document.querySelector('#mobile-app').dataset.sheet==='battle-magic');
 if(await p.evaluate(()=>goonkMobileState.mode!=='spellbook')){await p.locator('[data-ui=cast-hero-spell]').tap();await wait(()=>goonkMobileState.mode==='spellbook');}
 await cmd(0);await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct);
 await p.locator('.mobile-nav>[data-ui=defend]').tap();await wait(actor=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct&&goonkMobileState.activeStack!==actor,first.activeStack);
 const next=await p.evaluate(()=>structuredClone(goonkMobileState));assert(next.battleUnits.every(u=>!u.attackLosses||u.attackLosses.actor===next.activeStack),'Forecasts follow the next native actor after Defend');
 assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/result.json',JSON.stringify({browser:name,capability:first.battleLossEstimatesVersion,actor:first.activeStack,forecasts:enemies.map(u=>({id:u.id,name:u.name,count:u.count,canShoot:u.canShootAt,canMelee:u.canMeleeAt,losses:u.attackLosses})),captures},null,2));
 console.log('PASS',name,'real native legal casualty ranges, unchanged idle armies, automatic Classic/Vertical annotations, rotations, instant preference and Defend/Magic navigation');
}catch(e){await p.screenshot({path:out+'/'+name+'-failed.png'});fs.writeFileSync(out+'/'+name+'-failed-state.json',JSON.stringify(await p.evaluate(()=>window.goonkMobileState||{}),null,2));throw e;}finally{await browser.close();}
