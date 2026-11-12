import {chromium,webkit} from 'playwright-core';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const kind=process.env.BROWSER||'chromium',out=process.env.REVIEW_OUTPUT||'/tmp/review136-native';fs.mkdirSync(out,{recursive:true});
const browser=await(kind==='webkit'?webkit:chromium).launch({headless:true,...(kind==='chromium'?{args:['--no-sandbox']}: {})});
const p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true,serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message);});
let phase='boot';p.on('console',m=>{if(m.type()==='error'||/Map.+error|Error loading/i.test(m.text()))console.log('ENGINE',m.text().slice(0,300));});
const wait=f=>p.waitForFunction(f,null,{timeout:90000}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]);
try{
 await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));
 await (await import('./silent-audio.mjs')).silenceTestAudio(p);await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8777')+'/game.html?mobile=1');
 await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done');
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
    if o.get('instanceName')=='goonkHero':o['x']=8;o['y']=9;o['options'].update({'type':'core:christian','spellBook':['core:lightningBolt'],'artifacts':{'spellbook':'core:spellBook'},'army':[{'type':'core:pikeman','amount':20},{'type':'core:archer','amount':10}]})
    if o.get('instanceName')=='trainingGuard':o['x']=12;o['y']=9;o['options']['amount']=50
   data=json.dumps(objects).encode()
  dst.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`]);
 await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture]);
 phase='lobby';await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);console.log('PASS lobby ready');phase='select';await cmd(21);await wait(()=>goonkMobileState.selectedMap?.startsWith('000'));console.log('PASS map selected');phase='begin';await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);console.log('PASS native fixture starts');
 phase='battle';await cmd(6);await p.waitForTimeout(250);await p.evaluate(()=>Module._vcmiMobilePointer(433,281,4));await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='battle');await cmd(15);await p.waitForTimeout(200);if(await p.evaluate(()=>goonkMobileState.canEndTactics))await cmd(35);
 await p.setViewportSize({width:390,height:740});
 assert.equal(await p.locator('#mobile-app').getAttribute('data-vertical-battle'),'false');await p.locator('.battle-view').tap();
 await wait(()=>document.querySelector('#mobile-app').dataset.verticalBattle==='true'&&window.goonkBattlePlanes?.version>2&&window.goonkBattleSpriteBounds?.length>2);
 await wait(()=>goonkMobileState.canAct&&!goonkMobileState.animating);
 const layers=await p.evaluate(()=>{const count=c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let visible=0;for(let i=3;i<d.length;i+=4)visible+=d[i]>0;return visible/(d.length/4);};return{background:count(goonkBattlePlanes.background),obstacles:count(goonkBattlePlanes.ground)};});assert(layers.background>.99,'Upright backdrop fills the scene');assert(layers.obstacles>0&&layers.obstacles<.7,'Actual obstacles remain on a separate transparent layer');console.log('PASS upright full backdrop and separate native obstacles');

 await p.evaluate(()=>{window.effectFrames=0;window.effectTimer=setInterval(()=>{const c=window.goonkBattlePlanes?.effects;if(!c)return;const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let pixels=0;for(let i=3;i<d.length;i+=4)if(d[i]>128)pixels++;if(pixels){window.effectFrames++;if(pixels>(window.effectMaxPixels||0)){window.effectMaxPixels=pixels;window.effectCapture=document.querySelector('#mobile-scene').toDataURL();window.effectPlane=c.toDataURL();}}},30);});
 await p.locator('.mobile-nav [data-ui=battle-magic]').tap();await p.waitForTimeout(150);if(await p.locator('[data-ui=cast-hero-spell]').isVisible())await p.locator('[data-ui=cast-hero-spell]').tap();await wait(()=>goonkMobileState.mode==='spellbook'&&goonkMobileState.spellbook?.spells?.some(s=>s.id===17));await p.locator('[data-spell="17"]').tap();await p.locator('[data-cast-spell]').tap();await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.spellTargeting);
 const enemy=await p.evaluate(()=>goonkMobileState.battleUnits.find(u=>u.enemy));await p.evaluate(u=>{Module._vcmiMobilePointer(u.x,u.y,0);Module._vcmiMobilePointer(u.x,u.y,1);},enemy);await wait(()=>goonkMobileState.mode==='battle'&&!goonkMobileState.spellTargeting&&goonkMobileState.heroSpellCastLimitReached);await p.waitForFunction(()=>window.effectFrames>0,null,{timeout:15000});await wait(()=>goonkMobileState.canAct&&!goonkMobileState.animating);assert(await p.evaluate(()=>window.effectFrames>0),'Native spell effect is exported to the vertical field');await p.evaluate(()=>clearInterval(window.effectTimer));const capture=await p.evaluate(()=>window.effectCapture);if(capture)fs.writeFileSync(out+'/'+kind+'-lightning.png',Buffer.from(capture.split(',')[1],'base64'));const plane=await p.evaluate(()=>window.effectPlane);if(plane)fs.writeFileSync(out+'/'+kind+'-lightning-plane.png',Buffer.from(plane.split(',')[1],'base64'));console.log('PASS live native spell effect plane');
 const frameHash=()=>p.evaluate(()=>{const c=goonkBattleAtlas,d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let h=0;for(let i=0;i<d.length;i+=17)h=(h*31+d[i])|0;return h;});
 const hashes=new Set(),fields=new Set();for(let i=0;i<12;i++){hashes.add(await frameHash());fields.add(await p.locator('#mobile-scene').evaluate(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let h=0;for(let i=0;i<d.length;i+=17)h=(h*31+d[i])|0;return h;}));await p.waitForTimeout(120);}assert(hashes.size>1,'Live native creature animation advances');assert(fields.size>1,'Visible battlefield animation advances');
 for(const size of [{width:390,height:740},{width:320,height:568},{width:768,height:1024}]){
  await p.setViewportSize(size);await p.waitForTimeout(350);
  assert(await p.locator('#mobile-scene').evaluate(c=>c.clientHeight>document.querySelector('#mobile-app').clientHeight*.45),'Vertical board receives most of the screen');
  await p.screenshot({path:out+'/'+kind+'-vertical-'+size.width+'.png'});
  assert(await p.locator('.mobile-nav').evaluate(c=>c.getBoundingClientRect().bottom<=document.querySelector('#mobile-app').getBoundingClientRect().bottom+1));
 }
 await p.setViewportSize({width:390,height:740});await p.waitForTimeout(700);
 const cell=await p.evaluate(()=>{const s=goonkMobileState,a=s.battleUnits.find(u=>u.stackId===s.activeStack);return s.battleCells.filter(c=>c.reachable&&!s.battleUnits.some(u=>Math.hypot(u.x-c.x,u.y-c.y)<65)&&Math.hypot(c.x-a.x,c.y-a.y)>80).sort((a,b)=>a.x-b.x)[0];});assert(cell,'Available movement cell');
 const before=await p.evaluate(()=>({stack:goonkMobileState.activeStack,units:goonkMobileState.battleUnits}));
 const screen=await p.locator('#mobile-scene').evaluate((c,point)=>{const w=c.clientWidth,h=c.clientHeight,s=Math.min((w-8)/492,(h-12)/800),r=c.getBoundingClientRect();return{x:r.x+(w-492*s)/2+(point.y-66)*s,y:r.y+(h-800*s)/2+(800-point.x)*s};},cell);
 await p.mouse.click(screen.x,screen.y);await p.waitForTimeout(300);await p.screenshot({path:out+'/'+kind+'-selected.png'});await p.locator('[data-ui=battle-action]').tap();
 await p.waitForFunction(({id,x,y})=>goonkMobileState.battleUnits.some(u=>u.stackId===id&&Math.hypot(u.x-x,u.y-y)<5),{id:before.stack,x:cell.x,y:cell.y});console.log('PASS touch on vertical cell executes native movement');
 await p.setViewportSize({width:844,height:390});await wait(()=>document.querySelector('#mobile-app').dataset.verticalBattle==='false');await p.waitForTimeout(250);await p.screenshot({path:out+'/'+kind+'-landscape.png'});
 const rail=await p.locator('.mobile-nav').boundingBox(),target=await p.locator('.mobile-nav [data-ui=targets]').boundingBox();assert(Math.abs(rail.x+rail.width-target.x-target.width)<10,'Target button reaches the right edge of the battle rail');
 const menu=await p.locator('#game-menu-toggle').boundingBox();assert(menu.x-rail.x<10,'Menu starts at the left edge of the battle rail');

 await p.setViewportSize({width:390,height:740});await wait(()=>document.querySelector('#mobile-app').dataset.verticalBattle==='true');await p.locator('[data-ui=battle-view]').tap();await wait(()=>document.querySelector('#mobile-app').dataset.verticalBattle==='false');assert.equal(await p.locator('[data-ui=battle-view]').innerText(),'Vertical view');await p.locator('[data-ui=battle-view]').tap();await wait(()=>document.querySelector('#mobile-app').dataset.verticalBattle==='true');
 assert.deepEqual(errors,[]);console.log('PASS',kind,'live vertical animation, native movement, small phone/iPad, landscape and view toggle');
}catch(e){console.error('FAILED PHASE',phase);console.error('FAILED STATE',await p.evaluate(()=>({mode:window.goonkMobileState?.mode,kind:window.goonkMobileState?.dialogKind,active:window.goonkMobileState?.activeUnit,turn:window.goonkMobileState?.turn,selected:window.goonkMobileState?.selectedMap,maps:window.goonkMobileState?.maps?.slice(0,2)})));throw e;}finally{await browser.close();}
