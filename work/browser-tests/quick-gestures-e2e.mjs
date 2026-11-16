import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});
 try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await silenceTestAudio(page);
 await page.route('**/web/**',r=>{const file=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?r.fulfill({path:file}):r.abort();});
 await page.route('**/eligibility',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><canvas id=canvas width=800 height=600></canvas><script>Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...args){(window.calls||=[]).push(args)}};</script><script type=module src=/web/mobile.mjs></script><script type=module src=/web/game-menu.mjs></script>'}));
 await page.route('**/opfs-worker.js',r=>r.fulfill({path:path.resolve('work/vcmi-wasm/lib/html5/opfs-worker.js'),contentType:'text/javascript'}));
 await page.goto('http://localhost/eligibility');await page.waitForSelector('#mobile-app');

 for(const spell of [false,true]){
 await page.waitForTimeout(650);
 await page.evaluate(spell=>{
 window.calls=[];
 const units=[{stackId:1,x:102,y:196,name:'Ally',enemy:false,count:20},{stackId:3,x:718,y:196,name:'Enemy',enemy:true,count:20,canShootAt:true}];
 dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'battle',round:1,activeStack:1,manualControl:true,canAct:!spell,spellTargeting:spell,selectedSpell:'Magic Arrow',battleUnits:units,battleCells:units.map((u,i)=>({hex:i+1,x:u.x,y:u.y,reachable:false,actionLabel:i===1?'Shoot':'',spellTarget:i===1})),activeUnit:{controlled:true}}}));
 },spell);
 if(!await page.locator('.target-picker-list').count())await page.locator('[data-ui=targets]').first().click();
 await page.locator('.target-picker-list [data-battle-target="718,196"]').click();

 assert.deepEqual(await page.evaluate(()=>calls.filter(c=>c[0]===14).map(c=>c.slice(0,3))),[[14,spell?3:4,2]]);
 }

 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(650);
 const destination=await page.evaluate(async()=>{
 const {battleHex}=await import('/web/mobile-layout.mjs'),cell={...battleHex({x:400,y:300}),hex:88,reachable:true,actionLabel:'Move'};
 window.calls=[];dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'battle',round:2,activeStack:1,manualControl:true,canAct:true,battleUnits:[{stackId:1,x:102,y:196,name:'Ally',enemy:false,count:20}],battleCells:[cell],activeUnit:{controlled:true}}}));return cell;
 });
 await page.waitForTimeout(200);
 const position=await page.evaluate(async cell=>{
 const {fitNativeBattle}=await import('/web/battle-scene.mjs'),scene=document.querySelector('#mobile-scene'),r=scene.getBoundingClientRect(),l=fitNativeBattle(scene.clientWidth,scene.clientHeight,null,'whole');
 return {x:r.x+l.dx+(cell.x-l.x)*l.scale,y:r.y+l.dy+(cell.y-l.y)*l.scale};
 },destination);
 await page.touchscreen.tap(position.x,position.y);
 assert.equal(await page.evaluate(()=>calls.filter(c=>c[0]===14).length),0,'First tap only previews movement');
 await page.waitForTimeout(700);
 await page.touchscreen.tap(position.x,position.y);

 assert.deepEqual(await page.evaluate(()=>calls.filter(c=>c[0]===14).map(c=>c.slice(0,3))),[[14,4,88]]);
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{
 calls=[];dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'map',turn:true,heroId:1,day:1,heroName:'Hero',resources:[],heroMovement:100,hasPath:true}}));
 });
 await page.waitForTimeout(200);
 const box=await page.locator('#mobile-scene').boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
 await page.touchscreen.tap(x,y);
 await page.evaluate(()=>dispatchEvent(new CustomEvent('goonk-state',{detail:{...goonkMobileState,hasPath:true}})));

 assert.equal(await page.evaluate(()=>calls.filter(c=>c[0]===2).length),1);
 assert.equal(await page.locator('[data-ui=move]').count(),0,'No Move button on the map');
 await page.locator('#game-menu-toggle').click();
 await page.locator('[data-menu=settings]').click();
 await page.locator('[data-map-two-clicks]').check();
 assert.equal(await page.evaluate(()=>localStorage.getItem('heroes-goonk.map-two-clicks')),'true');
 await page.locator('[data-menu=close]').click();
 await page.evaluate(()=>{calls=[];dispatchEvent(new CustomEvent('goonk-state',{detail:{...goonkMobileState,hasPath:false}}));});
 await page.waitForTimeout(150);await page.touchscreen.tap(x,y);
 await page.evaluate(()=>dispatchEvent(new CustomEvent('goonk-state',{detail:{...goonkMobileState,hasPath:true}})));
 assert.equal(await page.evaluate(()=>calls.filter(c=>c[0]===2).length),0,'First click only previews with the option enabled');
 await page.waitForTimeout(700);await page.touchscreen.tap(x,y);
 assert.equal(await page.evaluate(()=>calls.filter(c=>c[0]===2).length),1,'Second click confirms with no double-tap timer');
 await page.evaluate(()=>{
 calls=[];dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'spellbook',heroId:1,spellbook:{inCombat:true,mana:30,school:-1,page:0,pages:1,spells:[{id:15,name:'Magic Arrow',cost:5,level:1,enabled:true,target:'enemy'}]}}}));
 });
 await page.locator('[data-spell="15"]').click();
 assert.equal(await page.evaluate(()=>calls.filter(c=>c[0]===49&&c[1]===15).length),1);
 await page.reload();await page.locator('#game-menu-toggle').click();await page.locator('[data-menu=settings]').click();
 assert(await page.locator('[data-map-two-clicks]').isChecked(),'Map click option survives a reload');
 assert.deepEqual(errors,[]);console.log(name+': two-click battle movement and single-click map/attack/spell passed');
 }finally{await browser.close();}
}
