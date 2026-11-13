import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-compact-review';fs.mkdirSync(out,{recursive:true});
for(const [kind,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
 const p=await browser.newPage({viewport:{width:740,height:300},hasTouch:true});await silenceTestAudio(p);const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/web/**',r=>{const f=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);return fs.existsSync(f)?r.fulfill({path:f}):r.abort();});
 await p.route('**/compact-review?mobile=1',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/game-menu.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...a){calls.push(a)},_vcmiMobilePointer(){}};document.querySelector('canvas').getContext('2d').fillRect(0,0,800,600);</script><script type=module src=/web/mobile.mjs></script>`}));
 await p.route('**/opfs-worker.js',r=>r.fulfill({path:path.resolve('work/vcmi-wasm/lib/html5/opfs-worker.js')}));await p.goto('http://localhost/compact-review?mobile=1');await p.waitForSelector('#mobile-app');await p.evaluate(()=>import('/web/game-menu.mjs'));
 const unit={id:1,name:'A long creature name',count:12,attack:45,defense:43,damageMin:45,damageMax:60,health:400,speed:19,cost:[0,0,0,0,0,0,118300],preview:{x:0,y:0,w:150,h:150},previewAtlas:true,previewKey:1};
 const army={id:1,name:'Wystan',slots:Array.from({length:7},()=>unit)};
 const base={turn:true,day:1,resources:[229,210,229,210,210,210,211330,200],armies:[army],previewUnits:[unit]};
 const send=async state=>{await p.evaluate(s=>dispatchEvent(new CustomEvent('goonk-state',{detail:s})),{...base,...state});await p.waitForTimeout(220);};
 const hit=async selector=>{const e=p.locator(selector);await e.scrollIntoViewIfNeeded();assert(await e.evaluate(el=>{const r=el.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return h===el||el.contains(h);}),selector+' accepts input');};
 for(const size of [{width:640,height:280},{width:740,height:300},{width:1024,height:768},{width:360,height:740}]){
  await p.setViewportSize(size);
  await send({mode:'hero',heroWindow:{id:1,name:'Wystan',level:1,mana:10,manaLimit:10,primarySkills:[0,4,1,1],slots:[],backpack:[]}});
  await p.locator('[data-hero-tab=army]').tap();
  const grid=p.locator('.hero-equipment-grid');if(size.height<=300)assert(await grid.evaluate(e=>e.scrollHeight>e.clientHeight),'Army cards scroll on short landscape screens');
  if(kind==='chromium'&&size.height===280){const cdp=await p.context().newCDPSession(p),r=await grid.boundingBox(),x=r.x+r.width*.4,y=r.y+r.height*.8;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=10;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*10}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(150);assert(await grid.evaluate(e=>e.scrollTop)>20,'Real touch swipe scrolls the troop roster');await cdp.detach();}
  await send({mode:'dialog',dialogKind:'commander',rect:{x:0,y:0,w:800,h:600},dialogPresentation:{title:'Commander',unit,commanderTree:{skills:[],abilities:[]},choices:['Attack','Defense','Health','Damage','Speed','Magic'].map((label,i)=>({label,inspectable:true,rect:{x:i*40,y:0,w:32,h:32}}))}});
  await hit('[data-commander-tree]');assert(await p.locator('.commander-summary').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'Commander image and stats fit');
  assert.equal(await p.locator('.commander-facts dt').count(),4);
  for(const e of await p.locator('.commander-facts dd').all())assert(await e.evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Stat values fit');
  await p.screenshot({path:path.join(out,kind+'-commander-'+size.width+'.png')});
  await send({mode:'map',mapOverview:{rect:{x:600,y:0,w:144,h:144},width:144,height:144,view:{x:0,y:0,w:560,h:555},viewport:{x:0,y:0,w:20,h:20}}});
  assert.equal(await p.locator('.mobile-calendar>span:first-child').textContent(),'1D 1W 1M');
  assert(await p.locator('[data-resource=gold] .resource-quantity').evaluate(e=>{const r=document.createRange();r.selectNodeContents(e);return r.getBoundingClientRect().width<=e.closest('.mobile-resource').clientWidth+1;}),'Gold amount fits its cell '+JSON.stringify(await p.locator('[data-resource=gold]').evaluate(e=>({html:e.outerHTML,width:e.clientWidth,scroll:e.scrollWidth,font:getComputedStyle(e).font,grid:getComputedStyle(e.parentElement).gridTemplateColumns,container:e.parentElement.clientWidth,display:getComputedStyle(e).display}))));
  if(size.width>size.height){const map=await p.locator('#mobile-overview').boundingBox(),cue=await p.locator('.calendar-recruit-cue').boundingBox();assert(cue.x>=map.x+map.width-1,'Recruitment shortcut is beside minimap');assert(map.height>=60,'Minimap retains height');}
  await p.screenshot({path:path.join(out,kind+'-map-'+size.width+'.png')});
  await p.locator('#game-menu-toggle').tap();await p.locator('[data-menu=cheats]').tap();
  if(size.width>size.height&&size.height<=600){const head=await p.locator('#game-menu>header').boundingBox(),list=await p.locator('.game-menu-body').boundingBox();assert(head.x>=list.x+list.width-1,'Cheat heading and close occupy a right rail');}
  await hit('#game-menu [data-menu=close]');await p.screenshot({path:path.join(out,kind+'-cheats-'+size.width+'.png')});await p.locator('#game-menu [data-menu=close]').tap();

  await send({mode:'recruit',recruitUnit:{...unit,description:'Recruit this creature'},recruitMaximum:12,recruitAmount:1,previewUnits:[unit,{...unit,id:2,name:'Sea Serpent',upgradeRank:1}]});
  await hit('[data-presentation-close]');if(size.width<size.height){const head=await p.locator('.creature-view-head').boundingBox(),stage=await p.locator('.creature-stage').boundingBox();assert(head.y+head.height<=stage.y+1,'Portrait recruitment keeps its header before the picture');}
  await p.screenshot({path:path.join(out,kind+'-recruit-'+size.width+'.png')});

  await p.evaluate(async()=>{const {renderArmyPanel}=await import('/web/army-panel.mjs');const root=document.querySelector('#mobile-app');root.dataset.sheet='army';const body=root.querySelector('.sheet-body');root.querySelector('.mobile-sheet').hidden=false;renderArmyPanel({body,armies:[{id:1,name:'Hero',slots:[{id:1,name:'Creature',count:12}]},{id:2,name:'Garrison',slots:[]}],showVisitorPlaceholder:true,onMove:()=>{},onInfo:(...a)=>calls.push(['details',...a]),onBack:()=>calls.push(['back'])});});
  const first=p.locator('[data-army="1"][data-slot="0"]');await first.tap();await first.tap();assert.deepEqual(await p.evaluate(()=>calls.at(-1)),['details',1,0]);
  if(size.width>size.height){await hit('.army-back');await p.locator('.army-back').tap();assert.deepEqual(await p.evaluate(()=>calls.at(-1)),['back']);}
  await p.evaluate(()=>{document.querySelector('.mobile-sheet').hidden=true;delete document.querySelector('#mobile-app').dataset.sheet;});
 }

 await p.setViewportSize({width:740,height:300});
 const town=JSON.parse(fs.readFileSync('mod/tum-era/content/config/reviewed-eighth-town-access.json'));
 const {townBuildingArt}=await import('../../web/town/building-art.mjs');
 for(const faction of Object.keys(townBuildingArt)){
  const source=town['core:'+faction].town.buildings;
  const buildings=Object.keys(townBuildingArt[faction]).filter(key=>!key.includes('Up')&&!['citadel','castle','townHall','cityHall','capitol'].includes(key)).map((key,id)=>({id,key:'core:'+key,name:key,built:true,baseId:id,upgradeId:-1}));
  buildings.push(...Object.entries(source).map(([key,b])=>({...b,key:'tum-era:'+key,built:true,baseId:150,upgradeId:b.id===151?150:-1})));
  await send({mode:'town',townFaction:'core:'+faction,buildings:buildings.map(b=>b.id>=150?{...b,built:false}:b),recruits:[]});await p.waitForTimeout(350);assert.equal(await p.locator('[data-town-eighth],[data-town-building="150"],[data-town-building="151"]').count(),0,'Unbuilt eighth dwelling has no floating city label');
  await send({mode:'town',townFaction:'core:'+faction,buildings,recruits:[{...unit,level:7,variant:1,name:source.dwellingUpLvl8.name}]});
  await p.waitForTimeout(500);const selector=faction==='necropolis'?'[data-town-building="151"]':'[data-town-eighth]',tile=p.locator(selector);await hit(selector);
  if(faction!=='necropolis')assert.equal(await tile.locator('strong').textContent(),source.dwellingUpLvl8.name);
  await tile.tap();assert((await p.evaluate(()=>calls)).some(c=>c[0]===30&&c[1]===7),'Original eighth dwelling opens recruitment');await p.waitForTimeout(2100);
  if(faction==='fortress'||faction==='necropolis')await p.screenshot({path:path.join(out,kind+'-'+faction+'-eighth.png')});
 }
 assert.deepEqual(errors,[]);console.log('PASS',kind,'troop scrolling, commander fit, compact calendar, readable gold, minimap, selected troop details and landscape Back');
 }finally{await browser.close();}
}
