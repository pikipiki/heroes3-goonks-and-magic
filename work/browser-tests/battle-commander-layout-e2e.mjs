// Exercise the native mobile command bridge, with a deterministic framebuffer.
import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {silenceTestAudio} from './silent-audio.mjs';
const baseline=process.env.BATTLE_COMPARE_REF||'ce9c515e',out=process.env.BATTLE_CAPTURE_DIR||'/tmp/goonk-battle-commander-layout';
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
 await send(page,state);await page.waitForTimeout(160);
 return{page,context,errors};
}
async function send(page,patch){await page.evaluate(detail=>dispatchEvent(new CustomEvent('goonk-state',{detail:{...window.goonkMobileState,...detail}})),patch);await page.waitForTimeout(80);}
const box=(page,selector)=>page.locator(selector).boundingBox();

for(const kind of ['chromium','webkit']){
 const browser=await(kind==='chromium'?chromium:webkit).launch({headless:true});
 try{for(const lang of ['fr','en'])for(const [width,height]of dimensions){
  const {page,context,errors}=await mount(browser,lang,{width,height});
  const sizes=await page.evaluate(()=>Object.fromEntries(['.battle-panel','.battle-panel-card','.battle-unit-inspect','#battle-creature-detail','.battle-unit-info','.battle-unit-stats','.battle-selection','.mobile-nav','.mobile-play'].map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();return[s,{...r.toJSON(),display:getComputedStyle(e).display,minHeight:getComputedStyle(e).minHeight,grid:getComputedStyle(e).gridArea}]})));
  const portrait=sizes['#battle-creature-detail'],inspect=sizes['.battle-unit-inspect'],stats=sizes['.battle-unit-stats'];
  assert(portrait.x>=inspect.x&&portrait.y>=inspect.y&&portrait.right<=inspect.right+1&&portrait.bottom<=inspect.bottom+1,'Whole animated portrait stays within its button');
  assert.equal(stats.display,'grid');assert(stats.height>=24&&stats.width>80,'All four facts visible beside the portrait');
  const pills=await page.locator('.battle-stat-pill').evaluateAll(nodes=>nodes.map(e=>e.getBoundingClientRect().toJSON()));
  assert.equal(pills.length,4);assert(Math.abs(pills[0].y-pills[1].y)<1&&pills[2].y>pills[0].y&&Math.abs(pills[2].y-pills[3].y)<1,'Facts arranged two by two');
  assert(Math.abs(sizes['.mobile-nav'].bottom-height)<1,'Actions use the bottom edge');
  await send(page,{autoCombat:true});assert(await page.locator('.battle-unit-stats').isVisible(),'Stats retained during auto combat');await send(page,{autoCombat:false});
  await page.screenshot({path:path.join(out,`${kind}-${lang}-${width}x${height}-battle.png`)});
  const skills=['Attack','Defense','Health','Damage','Speed','Magic'].map((name,id)=>({id,name,rank:id===0?1:0,selectable:true,description:name}));
  const abilities=[];for(let a=0;a<6;a++)for(let b=a+1;b<6;b++)abilities.push({id:100+abilities.length,requires:[a,b],name:'Special ability',description:'A complete native ability description.',learned:false,selectable:false});
  await send(page,{mode:'dialog',turn:true,dialogKind:'commander-level-up',windowToken:7,rect:{x:100,y:50,w:600,h:500},dialogPresentation:{title:'Commander level up',unit:{name:lang==='fr'?'Chef ogre':'Ogre leader',speed:4,attack:9,defense:8,damageMin:3,damageMax:6,health:60},choices:skills.map(s=>({skillId:s.id,label:s.name,rect:{x:100+s.id*30,y:200,w:25,h:25},selectable:true})),commanderTree:{skills,abilities,masterRank:4,maxRank:5,selectedSkill:0}}});
  await page.waitForTimeout(120);
  for(const treeOpen of [false,true]){
   if(treeOpen){await page.locator('[data-commander-tree]').tap();await page.waitForTimeout(80);}
   const geometry=await page.evaluate(()=>Object.fromEntries(['.dialog-presentation>.ui-screen-header','.dialog-copy','.commander-summary','.commander-preview','.dialog-presentation>.ui-action-dock','[data-commander-tree]','.commander-tree'].map(s=>{const e=document.querySelector(s);return[s,e?.getBoundingClientRect().toJSON()]})));
   const toggle=geometry['[data-commander-tree]'];assert(toggle.width>=48&&toggle.height>=48&&toggle.bottom<=height+1,'Tree action reachable');
   if(width>height){
    const header=geometry['.dialog-presentation>.ui-screen-header'],preview=geometry['.commander-preview'],content=treeOpen?geometry['.dialog-copy']:geometry['.commander-summary'];
    assert(header.x>width/2,'Commander title is on the right');assert(preview.width>48&&preview.height>=63,'Commander remains visible');assert(preview.y>=content.y&&preview.bottom<=content.bottom+1&&geometry['.commander-summary'].bottom<=content.bottom+1,'Commander and all four facts are not clipped by the action dock '+JSON.stringify(geometry));
    assert(toggle.width>=geometry['.dialog-presentation>.ui-action-dock'].width-18,'Specialization action fills the rail');
    if(treeOpen)assert(geometry['.commander-tree'].y<header.bottom,'Tree starts at top, without empty header space');
   }
   await page.screenshot({path:path.join(out,`${kind}-${lang}-${width}x${height}-${treeOpen?'tree':'levelup'}.png`)});
  }
  assert.deepEqual(errors,[]);await context.close();
  console.log('PASS',kind,lang,width,height,'whole portrait, four stats, lower actions, commander levelup and tree');
 }}finally{await browser.close();}
}
