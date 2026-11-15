import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
const out='/tmp/goonk-combat-ui-scroll';fs.mkdirSync(out,{recursive:true});
for(const[name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});let p;const errors=[];try{
 p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});p.on('pageerror',e=>errors.push(e.message));await silenceTestAudio(p);
 await p.route('**/web/**',r=>{const file=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?r.fulfill({path:file}):r.abort();});
 // The result must remain usable even if the optional follow-up stylesheet fails.
 await p.route('**/mobile-followup.css*',r=>r.abort());
 await p.route('**/combat-review',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...args){calls.push(args)}};window.send=detail=>dispatchEvent(new CustomEvent('goonk-state',{detail}));</script><script type=module src="/web/mobile.mjs?v=combat-review"></script>`}));
 await p.goto('http://localhost/combat-review');await p.waitForSelector('#mobile-app');
 const send=s=>p.evaluate(s=>send(s),s),unit={id:160,name:'Ancestral Behemoth',key:'tum-era:ancestralBehemoth',count:1};
 const result=count=>({mode:'dialog',dialogKind:'battle-result',resources:[1,2,3,4,5,6,700],battleResult:{won:true,description:'A glorious victory! Christian receives 1090 experience.',sides:[{name:'Christian',winner:true,portrait:[0,0,58,64],losses:count?Array.from({length:count},()=>unit):[]},{name:'Marines',winner:false,portrait:[0,0,58,64],losses:[{...unit,count:12}]}]}});
 for(const[width,height]of[[320,568],[390,844],[568,320],[844,390],[768,1024],[1024,768]]){
  await p.setViewportSize({width,height});
  for(const count of [0,1,14]){
   await send(result(count));await p.waitForTimeout(80);
   const confirm=p.locator('[data-result-confirm]'),box=await confirm.boundingBox();assert(box&&box.height>=44&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,'Result confirmation stays visible');
   assert.equal(await p.locator('#mobile-app button:visible').count(),1,'One visible result action');
   for(const r of await p.locator('.result-losses .unit-portrait').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON())))assert(r.width===44&&r.height===44,'One casualty never expands its portrait');
   const original=await p.locator('.result-content').evaluate(e=>{window.resultContent=e;return e.scrollHeight>e.clientHeight});
   if(count===14){assert(original,'Long casualties scroll');await p.locator('.result-content').evaluate(e=>e.scrollTop=e.scrollHeight);assert(await p.locator('.result-content').evaluate(e=>e.scrollTop>0));}
   await send(result(count));assert(await p.evaluate(()=>resultContent===document.querySelector('.result-content')),'Unchanged snapshots preserve scrolling');
   if(count===1)await p.screenshot({path:out+`/${name}-result-${width}x${height}.png`});
   const before=await p.evaluate(()=>calls.length);await confirm.tap();await confirm.tap({force:true});assert.equal(await p.evaluate(()=>calls.length),before+1,'Repeated confirm sends one command');
   await send({mode:'map',turn:true});await p.locator('.battle-result').waitFor({state:'hidden'});
  }
  const spells=Array.from({length:40},(_,i)=>({id:15+i,name:'Combat spell '+i,cost:5,level:1,enabled:true,target:'none',description:'Description of spell '+i}));
  const state={mode:'spellbook',heroId:1,turn:true,spellbook:{inCombat:true,scrollable:true,mana:100,page:0,pages:1,school:-1,spells}};
  await send(state);await p.waitForTimeout(80);assert.equal(await p.locator('[data-page],.spell-pagination').count(),0,'No page controls in combat');assert.equal(await p.locator('.spell-row').count(),40);
  assert(await p.locator('.spell-list').evaluate(e=>e.scrollHeight>e.clientHeight),'All forty spells use scrolling');
  if(name==='chromium'&&width===320){
   const box=await p.locator('.spell-list').boundingBox(),cdp=await p.context().newCDPSession(p),x=box.x+box.width*.5,y=box.y+box.height*.8,end=box.y+box.height*.2;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+(end-y)*i/8}]});await p.waitForTimeout(20);}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(100);await cdp.detach();assert(await p.locator('.spell-list').evaluate(e=>e.scrollTop>10),'Real finger swipe scrolls the catalogue');
  }
  const last=p.locator('[data-spell="54"]');await last.scrollIntoViewIfNeeded();await last.tap();await p.locator('[data-cast-spell]').tap();assert.deepEqual((await p.evaluate(()=>calls.at(-1))).slice(0,2),[49,54],'A spell beyond the old page is cast directly');
  await send({mode:'battle',heroId:1,heroMana:95,canAct:true});await p.locator('.mobile-spellbook').waitFor({state:'hidden'});await send({...state,spellbook:{...state.spellbook,mana:95}});await p.locator('[data-reuse]').tap();assert.deepEqual((await p.evaluate(()=>calls.at(-1))).slice(0,2),[49,54],'Reuse casts directly without paging');
  await p.screenshot({path:out+`/${name}-book-${width}x${height}.png`});await send({mode:'map',turn:true});await p.locator('.mobile-spellbook').waitFor({state:'hidden'});
 }
 await send({mode:'spellbook',heroId:1,turn:true,spellbook:{inCombat:false,combatSpells:false,mana:100,page:0,pages:2,school:-1,spells:[{id:0,name:'Adventure spell',cost:5,level:1,enabled:true}]}});
 await p.locator('[data-page="1"]').tap();assert.deepEqual((await p.evaluate(()=>calls.at(-1))).slice(0,2),[50,1],'Adventure pagination is preserved');
 assert.deepEqual(errors,[]);console.log('PASS' ,name,'six layouts, zero/one/many losses, optional CSS failure, single confirmation and forty scrollable combat spells');
 }catch(error){await p.screenshot({path:out+'/'+name+'-failure.png'}).catch(()=>{});throw error;}finally{await browser.close();}
}
