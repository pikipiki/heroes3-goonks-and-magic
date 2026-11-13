import {chromium,webkit} from 'playwright-core';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const kind=process.env.BROWSER||'chromium',out=process.env.REVIEW_OUTPUT||'/tmp/goonk-auto-views';fs.mkdirSync(out,{recursive:true});
const browser=await(kind==='webkit'?webkit:chromium).launch({headless:true,...(kind==='chromium'?{args:['--no-sandbox']}: {})});
const p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,deviceScaleFactor:3,isMobile:true,bypassCSP:true,serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message);});
let phase='boot';p.on('console',m=>{if(m.type()==='error'||/Map.+error|Error loading/i.test(m.text()))console.log('ENGINE',m.text().slice(0,300));});
const wait=f=>p.waitForFunction(f,null,{timeout:90000}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]);
try{
 await p.addInitScript(privateMode=>{if(privateMode)sessionStorage.setItem('heroes-goonk.storage-failed','true');window.autoReview={frames:[],tasks:[],calls:[]};let last=performance.now();function tick(t){autoReview.frames.push(t-last);last=t;requestAnimationFrame(tick);}requestAnimationFrame(tick);if(PerformanceObserver.supportedEntryTypes.includes('longtask'))new PerformanceObserver(l=>autoReview.tasks.push(...l.getEntries().map(e=>e.duration))).observe({type:'longtask'});},process.env.STORAGE_MODE!=='normal');
 await (await import('./silent-audio.mjs')).silenceTestAudio(p);await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8777')+'/game.html?mobile=1');
 await wait(()=>window.goonkMobileState?.mode==='menu');
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
    if o.get('instanceName')=='goonkHero':o['x']=8;o['y']=9;o['options'].update({'type':'core:zydar','primarySkills':{'attack':0,'defence':100,'spellpower':1,'knowledge':10},'spellBook':['core:lightningBolt'],'artifacts':{'spellbook':'core:spellBook'},'army':[{'type':'goonk:'+name,'amount':1000} for name in ['paingpaingExalted','picpiqueExalted','zinzeclairExalted','bubuExalted','glouglouExalted','bobopeExalted','maillemailleSolar']]})
    if o.get('instanceName')=='trainingGuard':o['x']=12;o['y']=9;o['subtype']='core:titan';o['options']['amount']=10000
   data=json.dumps(objects).encode()
  dst.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`]);
 await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture]);
 phase='lobby';await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);console.log('PASS lobby ready');await wait(()=>goonkMobileState.maps?.some(m=>/bow.*hope/i.test(m.name)));const mapPath=await p.evaluate(()=>goonkMobileState.maps.find(m=>/bow.*hope/i.test(m.name))?.path);assert(mapPath);const preview=await p.evaluate(async path=>{const {scenarioPreview}=await import('./web/scenario-preview.mjs');return scenarioPreview(path);},mapPath);assert(preview.length>0);fs.writeFileSync(out+'/'+kind+'-map-preview.png',Buffer.from(preview[0].split(',')[1],'base64'));const bow=await p.evaluate(()=>goonkMobileState.maps.find(m=>/bow.*hope/i.test(m.name)));await cmd(24,bow.index);await wait(()=>/bow.*hope/i.test(goonkMobileState.selectedMap));await p.locator('.lobby-map-emblem[data-preview-ready=true]').waitFor({state:'visible'});assert.equal(await p.locator('.lobby-map-emblem').getAttribute('src'),preview[0]);console.log('PASS native full terrain preview in map selection UI');phase='select';await cmd(21);await wait(()=>goonkMobileState.selectedMap?.startsWith('000'));console.log('PASS map selected');phase='begin';await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);console.log('PASS native fixture starts');
 await p.locator('#game-menu-toggle').tap();await p.locator('[data-menu=settings]').tap();await p.locator('[data-default-battle-view]').selectOption('vertical');await p.screenshot({path:out+'/'+kind+'-settings.png'});await p.locator('#game-menu [data-menu=close]').tap();await p.setViewportSize({width:390,height:740});await p.waitForTimeout(300);
 if(process.env.ALL_SPELLS){await cmd(29,3);await wait(()=>goonkMobileState.heroMana>=999&&goonkMobileState.heroHasSpellbook);console.log('PASS complete spellbook and 999 mana');}
 phase='battle';await cmd(6);await p.waitForTimeout(250);await p.evaluate(()=>Module._vcmiMobilePointer(433,281,4));await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='battle');await cmd(15);await p.waitForTimeout(200);if(await p.evaluate(()=>goonkMobileState.canEndTactics))await cmd(35);
 await p.setViewportSize({width:390,height:740});
 await wait(()=>document.querySelector('#mobile-app').dataset.verticalBattle==='true');
 await wait(()=>document.querySelector('#mobile-app').dataset.verticalBattle==='true'&&window.goonkBattlePlanes?.version>2&&window.goonkBattleSpriteBounds?.length>2);
 await wait(()=>goonkMobileState.canAct&&!goonkMobileState.animating);

 const cdp=await p.context().newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:Number(process.env.CPU_RATE||4)});
 if(process.env.CPU_PROFILE){await cdp.send('Profiler.enable');await cdp.send('Profiler.start');}
 const report={storage:process.env.STORAGE_MODE||'private',views:[]};
 for(const view of (process.env.VIEWS||'vertical,portrait,landscape').split(',')){
  await p.setViewportSize(view==='landscape'?{width:851,height:393}:{width:393,height:851});await p.waitForTimeout(250);
  if(view!=='landscape'){
   const vertical=await p.locator('#mobile-app').getAttribute('data-vertical-battle');if((vertical==='true')!==(view==='vertical'))await p.locator('[data-ui=battle-view]').tap();
  }
  await wait(()=>goonkMobileState.canAutoCombat&&goonkMobileState.canAct);
  await p.evaluate(()=>{autoReview.frames=[];autoReview.tasks=[];});const start=Date.now();await p.locator('[data-ui=battle-auto]').tap();await wait(()=>goonkMobileState.autoCombat||goonkMobileState.mode!=='battle');const enabledMs=Date.now()-start;
  await p.waitForTimeout(2000);const stats=await p.evaluate(()=>({maxFrame:Math.max(...autoReview.frames),tasks:autoReview.tasks,mode:goonkMobileState.mode,auto:goonkMobileState.autoCombat,round:goonkMobileState.round}));stats.enabledMs=enabledMs;stats.view=view;report.views.push(stats);console.log('AUTOCOMBAT',JSON.stringify(stats));if(process.env.MAX_FRAME_MS)assert(stats.maxFrame<Number(process.env.MAX_FRAME_MS),'Autocombat keeps the browser responsive: '+view);
  if(stats.mode!=='battle')break;
  const menuStart=Date.now();await p.locator('#game-menu-toggle').tap();await p.locator('#game-menu [data-menu=close]').waitFor({state:'visible'});await p.locator('#game-menu [data-menu=close]').tap();stats.menuMs=Date.now()-menuStart;assert(stats.menuMs<5000,'The menu remains responsive during autocombat');
  const stop=Date.now();await p.locator('[data-ui=battle-auto]').tap();
  await wait(()=>goonkMobileState.autoCombat===false);stats.stopAcknowledgedMs=Date.now()-stop;assert(stats.stopAcknowledgedMs<5000,'Stop request is acknowledged without waiting for the next player turn');
  await wait(()=>goonkMobileState.canAct);stats.stoppedMs=Date.now()-stop;console.log('Stopped',view,stats.stoppedMs);
 }
 if(process.env.CPU_PROFILE){const {profile}=await cdp.send('Profiler.stop');fs.writeFileSync(out+'/cpu.json',JSON.stringify(profile));}
 fs.writeFileSync(out+'/'+report.storage+'-report.json',JSON.stringify(report,null,2));assert.equal(report.views.length,(process.env.VIEWS||'vertical,portrait,landscape').split(',').length);assert.deepEqual(errors,[]);
}catch(e){console.log('FAILED',e.stack);await p.screenshot({path:out+'/failed.png'}).catch(()=>{});throw e;}finally{await browser.close();}
