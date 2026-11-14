import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-campaign-army-layout';fs.mkdirSync(out,{recursive:true});
for(const [name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});await silenceTestAudio(page);
 await page.route('**/web/**',route=>route.fulfill({path:path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1])}));
 await page.route('**/army-review',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html class="goonk-mobile"><meta name=viewport content="width=device-width,initial-scale=1"><meta charset=utf-8>${['mobile','h3-theme','mobile-review','mobile-refinement','mobile-followup','mobile-upgrade','mobile-compact'].map(n=>'<link rel=stylesheet href=/web/'+n+'.css>').join('')}<style>#mobile-viewport{position:fixed;inset:0;container:goonk-viewport / size}#mobile-app{position:absolute;inset:0;--control-rail:180px;--safe-bottom:0px}.mobile-play{position:absolute;inset:0}</style><div id=mobile-viewport><div id=mobile-app><main class=mobile-play></main></div></div><script type=module>import{createHeroExchange}from'/web/hero-exchange.mjs';window.calls=[];window.exchange=createHeroExchange({root:document.querySelector('#mobile-app'),command:(...args)=>calls.push(args),refresh:()=>{},portrait:()=>{}});window.update=s=>{if(exchange.hold(s))return;document.querySelector('#mobile-app').dataset.mode=s.mode;exchange.update(s);};</script>`}));
 await page.goto('http://localhost/army-review');await page.waitForFunction(()=>window.exchange);
 for(const [width,height]of [[320,568],[390,844],[568,320],[844,390],[768,1024],[1024,768],[1180,820]]){
  await page.setViewportSize({width,height});
  const unit=(id,count)=>({id,key:id===135?'core:rustDragon':'core:goblin',name:id===135?'Rust Dragon':'A creature with a long descriptive name',count});
  const state={mode:'hero-exchange',turn:true,campaignPending:true,heroExchange:{troopsOnly:true,classicOnly:false,heroes:[{id:700,name:'Event',owned:true,slots:[],army:{needsLastStack:false,slots:[unit(135,3),...Array.from({length:6},()=>unit(84,10))]}},{id:633,name:'Lydorie',owned:true,slots:[],army:{needsLastStack:true,slots:[unit(84,25),unit(84,15),unit(86,8),null,null,null,null]}}]}};
  state.heroExchange.heroes[1].portrait={x:0,y:0,w:48,h:56};
  await page.evaluate(s=>update(s),state);const panel=page.locator('.hero-exchange-page'),close=page.locator('[data-exchange-close]');
  assert.equal(await page.locator('.exchange-tabs').isVisible(),false);const box=await close.boundingBox();assert(box&&box.width>=44&&box.height>=44&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,'Finish stays reachable');
  const scroll=page.locator('.exchange-inventories');
  if(name==='chromium'&&await scroll.evaluate(e=>e.scrollHeight-e.clientHeight>30)){
   const r=await scroll.boundingBox(),cdp=await page.context().newCDPSession(page),x=r.x+r.width*.45,y=r.y+r.height*.8,end=r.y+r.height*.2;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+(end-y)*i/8}]});await page.waitForTimeout(20);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(250);await cdp.detach();assert(await scroll.evaluate(e=>e.scrollTop>10),'Real vertical touch scroll');
  }
  await page.locator('[data-exchange-slot="0:0"]').scrollIntoViewIfNeeded();await page.locator('[data-exchange-slot="0:0"]').tap();await page.locator('[data-exchange-slot="1:3"]').scrollIntoViewIfNeeded();await page.locator('[data-exchange-slot="1:3"]').tap();
  const quantity=page.locator('[data-exchange-quantity]');await quantity.fill('1');
  assert(await page.evaluate(s=>{const input=document.querySelector('[data-exchange-quantity]');input.focus();for(let i=0;i<40;i++)update({...s,day:i});return input===document.querySelector('[data-exchange-quantity]')&&document.activeElement===input&&input.value==='1';},state),'Stable quantity and focus');
  const confirm=page.locator('[data-exchange-confirm]');await confirm.tap();await confirm.tap({force:true});assert.deepEqual(await page.evaluate(()=>calls.splice(0)),[[94,0,0,3,1,135]],'One transfer');
  const ack=structuredClone(state);ack.heroExchange.heroes[0].army.slots[0].count=2;ack.heroExchange.heroes[1].army.slots[3]=unit(135,1);await page.evaluate(s=>update(s),ack);
  await page.locator('[data-exchange-slot="1:1"]').scrollIntoViewIfNeeded();await page.locator('[data-exchange-slot="1:1"]').tap();await page.locator('[data-exchange-slot="1:0"]').tap();await confirm.tap();assert.deepEqual(await page.evaluate(()=>calls.splice(0)),[[94,3,1,0,15,84]],'Merge within the hero army');
  ack.heroExchange.heroes[1].army.slots[0].count=40;ack.heroExchange.heroes[1].army.slots[1]=null;await page.evaluate(s=>update(s),ack);
  assert(await page.evaluate(()=>{const node=document.querySelector('.exchange-inventories'),canvas=document.createElement('canvas');canvas.width=800;canvas.height=600;const c=canvas.getContext('2d');c.fillStyle='red';c.fillRect(0,0,800,600);exchange.paint(canvas);update({mode:'map',campaignPending:true});c.fillStyle='blue';c.fillRect(0,0,800,600);exchange.paint(canvas);const color=[...document.querySelector('[data-exchange-face]').getContext('2d').getImageData(1,1,1,1).data];return node===document.querySelector('.exchange-inventories')&&!document.querySelector('.hero-exchange-page').hidden&&document.querySelector('[data-exchange-close]').disabled&&color[0]===255&&color[2]===0;}),'No transient map or portrait flash');
  await page.evaluate(s=>update(s),ack);await close.tap();await close.tap({force:true});assert.deepEqual(await page.evaluate(()=>calls.splice(0)),[[93]],'One finish action');
  await page.screenshot({path:path.join(out,`${name}-${width}x${height}.png`)});await page.evaluate(()=>update({mode:'map',campaignPending:false}));assert.equal(await panel.isVisible(),false);
 }
 console.log('PASS',name,'seven army layouts, touch scroll, stable quantity, one transfer, resumed receipt and no map flash');
 }finally{await browser.close();}
}
