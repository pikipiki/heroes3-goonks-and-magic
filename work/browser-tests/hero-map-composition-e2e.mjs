// Exercise the native mobile command bridge, with a deterministic framebuffer.
import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {silenceTestAudio} from './silent-audio.mjs';
const baseline=process.env.BATTLE_COMPARE_REF||'ce9c515e',out=process.env.BATTLE_CAPTURE_DIR||'/tmp/goonk-hero-map-layout';
fs.mkdirSync(out,{recursive:true});
const dimensions=[[320,568],[390,844],[716,279],[844,390]];
const ally={id:98,stackId:1,name:'Gnoll',count:12,attack:4,defense:6,currentHealth:5,maximumHealth:6,health:6,speed:5,x:102,y:196,enemy:false};
const enemy={...ally,id:99,stackId:2,name:'Enemy',count:7,x:718,y:196,enemy:true,canShootAt:true,canMeleeAt:true};
const state={mode:'battle',canAct:true,round:1,activeStack:1,activeUnit:ally,canAutoCombat:true,canRetreat:true,heroHasSpellbook:true,heroCanCast:true,battleCells:Array.from({length:165},(_,i)=>{const row=Math.floor(i/15),col=i%15+1;return{hex:row*17+col,x:36+(row%2===0?22:0)+44*col,y:112+42*row,kind:0,reachable:true,actionLabel:'Move'};}),battleUnits:[ally,enemy]};
const report=[];
const cached=new Map();
async function mount(browser,lang,viewport,reference){
 const context=await browser.newContext({viewport,hasTouch:true}),page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(lang=>{localStorage.setItem('heroes-goonk.language',lang);localStorage.setItem('heroes-goonk.default-battle-view','classic');},lang);
 await page.route('**/web/**',async route=>{
  const name=new URL(route.request().url()).pathname.slice(1),file=path.resolve(name);
  if(reference&&/\.(?:mjs|css)$/.test(name)){
   if(!cached.has(name)){try{cached.set(name,execFileSync('git',['show',reference+':'+name],{stdio:['ignore','pipe','ignore']}));}catch{cached.set(name,null);}}
   const body=cached.get(name);if(body)return route.fulfill({body,contentType:name.endsWith('.css')?'text/css':'text/javascript'});
  }
  return fs.existsSync(file)?route.fulfill({path:file}):route.abort();
 });
 await page.route('**/battle?mobile=1',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/web/mobile.css"><link rel="stylesheet" href="/web/h3-theme.css"><link rel="stylesheet" href="/web/mobile-upgrade.css"><canvas id="canvas" width="800" height="600"></canvas><script>window.calls=[];window.Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...a){calls.push(['command',...a])},_vcmiMobilePointer(...a){calls.push(['pointer',...a])}};const ctx=document.querySelector('canvas').getContext('2d');ctx.fillStyle='#777744';ctx.fillRect(0,0,800,600);ctx.fillStyle='rgb(200,20,20)';ctx.fillRect(0,0,800,30);ctx.fillStyle='rgb(20,20,200)';ctx.fillRect(0,525,800,30);</script><script type="module" src="/web/mobile.mjs"></script>`}));
 await silenceTestAudio(page);await page.goto('http://goonk.test/battle?mobile=1');await page.waitForSelector('#mobile-app');
 await page.evaluate(async()=>{const {createUIElement}=await import('/web/ui/material-components.mjs'),button=createUIElement('button');button.id='game-menu-toggle';button.textContent='☰';button.setAttribute('aria-label','Menu');document.querySelector('.mobile-brand').replaceWith(button);});
 await page.route('**/mithril.png',r=>r.fulfill({path:path.resolve('mod/wake-of-gods/Mods/mithril/content/sprites/mithril/small.png')}));
 await page.evaluate(()=>{window.goonkAssetURLs=[{path:'Mods/wake-of-gods/Mods/mithril/content/sprites/mithril/small.png',url:'/mithril.png'}]});
 await send(page,state);await page.waitForTimeout(160);
 return{page,context,errors};
}
async function send(page,patch){await page.evaluate(detail=>dispatchEvent(new CustomEvent('goonk-state',{detail:{...window.goonkMobileState,...detail}})),patch);await page.waitForTimeout(80);}
const box=(page,selector)=>page.locator(selector).boundingBox();


const heroState=lang=>({mode:'hero',turn:true,heroName:'Fiona',heroId:7,day:1,resources:[120,115,120,110,110,110,20000,100],resourceTypes:[...Array.from({length:7},(_,id)=>({id})),{id:7,key:'mithril',name:'Mithril',scope:'wake-of-gods.mithril',icon:'mithril/small.png'}],heroWindow:{id:7,owned:true,name:'Fiona',className:lang==='fr'?'Apostat':'Heretic',commanderIcon:0,level:1,mana:10,manaLimit:10,experience:76,primaryIcons:[0,1,2,3],manaIcon:4,experienceIcon:5,primarySkills:[2,2,1,1],portrait:{x:0,y:0,w:58,h:64},skills:[{name:lang==='fr'?'Sagesse':'Wisdom',mastery:'Basic',description:'A complete skill description.'}],slots:Array.from({length:19},(_,slot)=>({slot})),backpack:[]},armies:[{id:7,name:'Fiona',slots:[{id:0,name:lang==='fr'?'Diablotin':'Imp',count:23,attack:2,defense:3,damageMin:1,damageMax:2,health:4,speed:5},{id:1,name:lang==='fr'?"Chien de l’Enfer":'Hell hound',count:5,attack:10,defense:6,damageMin:2,damageMax:7,health:25,speed:7},{id:1,name:lang==='fr'?"Chien de l’Enfer":'Hell hound',count:1,attack:10,defense:6,damageMin:2,damageMax:7,health:25,speed:7}]}]});
const intersects=(a,b)=>a&&b&&Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
for(const kind of ['chromium','webkit']){
 const browser=await(kind==='chromium'?chromium:webkit).launch({headless:true});
 try{for(const lang of ['fr','en'])for(const [width,height]of dimensions){
  const {page,context,errors}=await mount(browser,lang,{width,height});
  await send(page,heroState(lang));await page.waitForTimeout(150);
  assert.equal(await page.locator('.hero-bag-tabs .MuiSelect-select').count(),1,'Exactly one real MUI section selector');
  page.setDefaultTimeout(5000);
  const select=async value=>{await page.locator('.hero-bag-tabs .MuiSelect-select').tap();await page.locator(`.MuiMenuItem-root[data-value="${value}"]`).tap();await page.waitForTimeout(80);assert.equal(await page.locator('.hero-equipment-page').getAttribute('data-inventory'),value);assert(await page.locator('.hero-bag-tabs .MuiSelect-select').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'Selected section label fits '+JSON.stringify(await page.locator('.hero-bag-tabs .MuiSelect-select').evaluate(e=>({text:e.textContent,w:e.clientWidth,scroll:e.scrollWidth,rect:e.getBoundingClientRect().toJSON(),font:getComputedStyle(e).font}))));};
  await page.screenshot({path:path.join(out,`${kind}-${lang}-${width}x${height}-before-army.png`)});
  await select('army');
  const geometry=await page.evaluate(()=>Object.fromEntries(['.mobile-top','.hero-card-head','.hero-face','.hero-card-head>div','.hero-primary','.hero-bag-tabs','.hero-army-dock-tools','[data-ui-rail-close]'].map(s=>{const e=document.querySelector(s);return[s,e?.getBoundingClientRect().toJSON()]})));
  for(const [a,b]of [['.hero-face','.hero-card-head>div'],['.hero-primary','.hero-bag-tabs'],['.hero-primary','.hero-card-head>div']])assert(!intersects(geometry[a],geometry[b]),a+' does not overlap '+b+' '+JSON.stringify(geometry));
  if(width>height){const chrome=geometry['.mobile-top'],close=geometry['[data-ui-rail-close]'];assert(close.width>=48&&close.height>=48&&close.y>=chrome.y&&close.bottom<=chrome.bottom+1,'Close is beside resources in chrome');}
  await page.screenshot({path:path.join(out,`${kind}-${lang}-${width}x${height}-army.png`)});
  for(const value of ['skills','backpack','worn','army'])await select(value);
  await page.evaluate(()=>calls.length=0);await page.locator('[data-hero-commander]').tap();assert.equal(await page.evaluate(()=>calls.filter(c=>c[0]==='command'&&c[1]===85).length),1,'Commander invokes its native action exactly once');
  const portraitViewport={width:Math.min(width,height),height:Math.max(width,height)},landscapeViewport={width:Math.max(width,height),height:Math.min(width,height)};
  for(const viewport of [portraitViewport,landscapeViewport,portraitViewport]){await page.setViewportSize(viewport);await page.waitForTimeout(80);assert.equal(await page.locator('.hero-bag-tabs .MuiSelect-select').count(),1,'Rotation does not duplicate the selector');const nav=await page.locator('.hero-bag-tabs').boundingBox();assert(nav.x>=-1&&nav.y>=0&&nav.x+nav.width<=viewport.width+1&&nav.y+nav.height<=viewport.height+1,'Navigation remains inside viewport after rotation');}
  await page.setViewportSize({width,height});
  await send(page,{mode:'map',heroWindow:undefined,heroName:'Fiona',movement:1000,movementLimit:2000,mana:10,manaLimit:10,day:1,resources:[120,115,120,110,110,110,20000,100],resourceTypes:[...Array.from({length:7},(_,id)=>({id})),{id:7,key:'mithril',name:'Mithril',scope:'wake-of-gods.mithril',icon:'mithril/small.png'}],heroes:[{index:0,name:'Fiona',movement:1000,mana:10,manaLimit:10}],turn:true});await page.waitForTimeout(120);
  const calendar=page.locator('.mobile-calendar'),calendarBox=await calendar.boundingBox();assert(calendarBox.width>0&&calendarBox.height>0&&calendarBox.x>=0&&calendarBox.y>=0&&calendarBox.x+calendarBox.width<=width+1&&calendarBox.y+calendarBox.height<=height+1,'Recruits cue remains visible');
  assert.match(await calendar.innerText(),lang==='fr'?/Recrues.*7/s:/Recruits.*7/s);
  await page.screenshot({path:path.join(out,`${kind}-${lang}-${width}x${height}-map.png`)});
  assert(await calendar.evaluate(e=>{const r=e.querySelector('.calendar-recruit-cue').getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}),'Recruit cue is unobscured and tappable '+JSON.stringify(await calendar.evaluate(e=>{const r=e.querySelector('.calendar-recruit-cue').getBoundingClientRect();return {rect:r.toJSON(),hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML.slice(0,300)}})));
  await page.screenshot({path:path.join(out,`${kind}-${lang}-${width}x${height}-map.png`)});
  assert.deepEqual(errors,[]);await context.close();console.log('PASS',kind,lang,width,height,'hero selector and summary, shared close/resource row, rotation and map calendar');
 }}finally{await browser.close();}
}
