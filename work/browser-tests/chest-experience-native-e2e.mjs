// Actual native chest -> experience -> hero/commander level-up flow.
// The test map and liveness probes live only in this browser's MEMFS/window.
import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {readZip,readOriginalCampaign} from '../../scripts/era-bridge/campaigns/importer.mjs';
import {parseJsonc} from '../../scripts/era-bridge/artifacts/importer.mjs';
import {silenceTestAudio} from './silent-audio.mjs';
const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8996',engineName=process.env.CHEST_BROWSER||'chromium',language=process.env.CHEST_LANG||'fr',out=process.env.REVIEW_OUTPUT||'/tmp/goonk-chest-experience-'+engineName;
fs.mkdirSync(out,{recursive:true});
const base=readZip(fs.readFileSync('maps/003-Goonks-WoG.vmap')),header=JSON.parse(base['header.json']),objects=JSON.parse(base['objects.json']);
let heroTemplate,chestTemplate;
for(const m of readOriginalCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc1.vcmp').maps)for(const o of Object.values(parseJsonc(m.map['objects.json'].toString()))){if(o.type==='hero')heroTemplate??=o.template;if(o.type==='treasureChest')chestTemplate??=o;}
header.name='000 - Native chest experience regression';header.mapLevels.surface.width=header.mapLevels.surface.height=72;header.events=[];
for(const color of ['red','blue']){header.players[color].allowedFactions={anyOf:['core:castle']};header.players[color].randomFaction=false;header.players[color].canPlay=color==='red'?'PlayerOnly':'AIOnly';}
header.players.blue.mainTown={x:63,y:63,l:0,generateHero:false};header.players.red.mainTown.generateHero=false;header.players.red.mainHero='privateChristian';header.players.red.heroes={privateChristian:{type:'core:christian'}};
const homes=objects.filter(o=>['redHome','blueHome'].includes(o.instanceName));homes.find(o=>o.instanceName==='blueHome').x=63;homes.find(o=>o.instanceName==='blueHome').y=63;for(const home of homes)home.options.buildings={allOf:['core:villageHall','core:fort'],noneOf:['core:tavern']};
const hero={instanceName:'privateChristian',type:'hero',subtype:'knight',x:18,y:18,l:0,template:heroTemplate,options:{owner:'red',type:'core:christian',gender:-1,experience:950,army:[{type:'core:blackDragon',amount:10}]}};
const chestPositions=[20,24,28,32],chests=chestPositions.map(x=>({...structuredClone(chestTemplate),instanceName:'privateChest'+x,x,y:18,l:0}));
const entries={'header.json':header,'objects.json':[...homes,hero,...chests],'surface_terrain.json':Array.from({length:72},()=>Array(72).fill('gr0_')),'english.json':JSON.parse(base['english.json'])};
const map=execFileSync('python3',['-c',`import sys,json,zipfile,io
data=json.load(sys.stdin);out=io.BytesIO()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for name,value in data.items():z.writestr(name,json.dumps(value,separators=(',',':'),ensure_ascii=False))
sys.stdout.buffer.write(out.getvalue())`],{input:JSON.stringify(entries)});
assert(['chromium','webkit'].includes(engineName),'Supported browser');assert(['fr','en'].includes(language),'Supported language');
const browser=await(engineName==='webkit'?webkit:chromium).launch({headless:true}),page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,bypassCSP:true}),errors=[],trail=[];
await silenceTestAudio(page);page.on('pageerror',e=>{errors.push(e.message);fs.appendFileSync(out+'/errors.log',e.stack+'\n')});page.on('console',m=>fs.appendFileSync(out+'/console.log',m.type()+': '+m.text().slice(0,2500)+'\n'));
await page.addInitScript(({map,language})=>{sessionStorage.setItem('heroes-goonk.storage-failed','true');localStorage.setItem('heroes-goonk.language',language);window.chestProbe={ticks:0,beats:0,last:0};addEventListener('goonk-state',()=>{chestProbe.ticks++;chestProbe.last=performance.now()});setInterval(()=>chestProbe.beats++,100);let current;Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{current=m;const old=Object.getOwnPropertyDescriptor(m,'callMain');let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;old?.set?.call(m,f)},get:()=>function(...args){const invoke=old?.get?old.get.call(m):main;m.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/000-Native-chest-regression.vmap',new Uint8Array(map));return invoke.apply(m,args)}})}});},{map:[...map],language});
const state=()=>page.evaluate(()=>goonkMobileState),cmd=(...args)=>page.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]),wait=(fn,arg,timeout=60000)=>page.waitForFunction(fn,arg,{timeout});
const record=async stage=>{const data=await page.evaluate(()=>({probe:chestProbe,nativeToken:window.goonkNativeWindowToken,state:{mode:goonkMobileState.mode,kind:goonkMobileState.dialogKind,token:goonkMobileState.windowToken,heroMoving:goonkMobileState.heroMoving,hasPath:goonkMobileState.hasPath,dialog:goonkMobileState.dialogPresentation,rect:goonkMobileState.rect},inert:[...document.querySelectorAll('[inert]')].map(e=>({tag:e.tagName,id:e.id,class:e.className})),dialogs:[...document.querySelectorAll('[role=dialog],dialog')].filter(e=>e.getBoundingClientRect().height>0&&!e.closest('[hidden]')).map(e=>({id:e.id,class:e.className,aria:e.getAttribute('aria-modal')}))}));trail.push({stage,...data});fs.writeFileSync(out+'/progress.json',JSON.stringify(trail,null,2));console.log(stage,JSON.stringify({mode:data.state.mode,kind:data.state.kind,token:data.state.token,nativeToken:data.nativeToken,ticks:data.probe.ticks}));return data;};
async function center(x,y){for(let i=0;i<30;i++){const mini=(await state()).mapOverview;await page.evaluate(t=>Module._vcmiMobilePointer(t.x,t.y,5),{x:Math.round(mini.rect.x+x*mini.rect.w/mini.width),y:Math.round(mini.rect.y+y*mini.rect.h/mini.height)});await page.waitForTimeout(120);const m=(await state()).mapOverview;if(m.viewport.x===Math.floor(x+.5-Math.floor(m.view.w/2)/32)&&m.viewport.y===Math.floor(y+.5-Math.floor(m.view.h/2)/32))return m.view;}throw Error('Camera failed');}
async function visit(x){const v=await center(x,18);await page.evaluate(t=>Module._vcmiMobilePointer(t.x,t.y,1),{x:Math.round(v.x+v.w/2),y:Math.round(v.y+v.h/2)});await wait(()=>goonkMobileState.hasPath||goonkMobileState.mode!=='map');if((await state()).hasPath)await cmd(2);await wait(()=>goonkMobileState.mode==='dialog');}
const watchdog=setTimeout(()=>browser.close(),300000);
try{
 const engine=(await(await page.request.get(origin+'/asset-manifest.json')).json()).engine;fs.writeFileSync(out+'/engine.json',JSON.stringify(engine));console.log('engine',engine.sha256);await page.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);console.log('Native menu ready');
 await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);const entry=(await state()).maps.find(m=>m.name===header.name);assert(entry,'Private map indexed');await page.locator('#mobile-map-select').selectOption(String(entry.index),{force:true});await wait(name=>goonkMobileState.selectedMap===name,header.name);await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);await record('new-map');
 let heroLevels=0,commanderLevels=0;
 for(const [i,x]of chestPositions.entries()){
  await page.setViewportSize(i%2?{width:844,height:390}:{width:390,height:844});await cmd(29,1);await visit(x);await record('chest-'+i);
  const chest=await state(),choices=chest.dialogPresentation?.choices||[];assert.equal(choices.filter(c=>c.selectable).length,2);await page.locator('[data-dialog-choice="1"]').tap();await record('xp-selected-'+i);await page.locator('[data-dialog-confirm]').tap();await wait(token=>goonkMobileState.windowToken!==token,chest.windowToken,10000);await record('xp-confirmed-'+i);
  for(let step=0;step<25;step++){
   let s=await state();if(s.mode==='map'){
    await wait(()=>goonkMobileState.mode!=='map'||(!goonkMobileState.heroMoving&&!goonkMobileState.campaignPending),null,10000);
    // Rewards enqueue commander progression after the hero window closes.
    await page.waitForTimeout(1500);s=await state();if(s.mode==='map'&&!s.heroMoving&&!s.campaignPending)break;
   }
   assert.equal(s.mode,'dialog','Unexpected native mode');
   if(s.dialogKind==='commander-level-up')commanderLevels++;
   else {assert(s.dialogPresentation?.title==='Level up'||s.dialogKind==='hero-level-up','Expected hero or commander level-up');heroLevels++;}
   const choice=page.locator('[data-dialog-choice]').filter({visible:true}).first();if(await choice.count())await choice.tap();
   await page.screenshot({path:out+'/chest-'+i+'-step-'+step+'.png'});
   await page.locator('[data-dialog-confirm]').tap();
   await wait(token=>goonkMobileState.windowToken!==token,s.windowToken,10000);
   await record('level-'+i+'-'+step);
  }
  await wait(()=>goonkMobileState.mode==='map'&&!goonkMobileState.heroMoving&&!goonkMobileState.campaignPending,null,5000);const end=await record('settled-'+i);
  assert.equal(end.state.token,end.nativeToken,'Published state matches current native window');
  assert.equal(await page.locator('.mobile-play').evaluate(e=>e.inert),false,'Map input restored after experience reward');
  await wait(ticks=>chestProbe.ticks>ticks,end.probe.ticks,5000);const live=await record('liveness-'+i);
  assert(live.probe.beats>end.probe.beats,'JavaScript timers remain live');
  await page.locator('#game-menu-toggle').tap();assert(await page.locator('#game-menu').isVisible(),'Actual menu responds after returning to map');await page.locator('[data-menu=close]').tap();await page.screenshot({path:out+'/map-after-'+i+'.png'});console.log('PASS chest',i,'hero levels',heroLevels,'commander levels',commanderLevels);
 }
 assert(heroLevels>0,'At least one hero level-up completed');assert(commanderLevels>0,'At least one commander level-up completed');
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,browser:engineName,language,heroLevels,commanderLevels,trail,errors},null,2));
}catch(error){await record('failure').catch(()=>{});await page.screenshot({path:out+'/failure.png',timeout:3000}).catch(()=>{});throw error;}finally{clearTimeout(watchdog);await browser.close();}
