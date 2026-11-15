import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});
 try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await silenceTestAudio(page);
 await page.route('**/web/**',r=>{const file=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?r.fulfill({path:file}):r.abort();});
 await page.route('**/eligibility',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><canvas id=canvas width=800 height=600></canvas><script>Module={_vcmiMobileEnable(){},_vcmiMobileCommand(){}};</script><script type=module src=/web/mobile.mjs></script>'}));
 await page.goto('http://localhost/eligibility');await page.waitForSelector('#mobile-app');
 for(const size of [{width:390,height:844},{width:844,height:390}]){
 await page.setViewportSize(size);
 for(const offensive of [false,true]){
 await page.evaluate(offensive=>{
 const units=[{stackId:1,x:102,y:196,name:'Ally',enemy:false},{stackId:2,x:146,y:196,name:'Immune ally',enemy:false},{stackId:3,x:718,y:196,name:'Enemy',enemy:true}].map(u=>({...u,count:20}));
 dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'battle',round:1,activeStack:1,manualControl:true,spellTargeting:true,selectedSpell:offensive?'Magic Arrow':'Fire Shield',battleUnits:units,battleCells:units.map((u,i)=>({hex:i+1,x:u.x,y:u.y,spellTarget:offensive?i===2:i===0})),activeUnit:{controlled:true},canAct:false}}));
 },offensive);
 // Allies remain visible even when immune; invalid targets cannot be activated.
 if(!await page.locator('.target-picker-list').count())await page.locator('[data-ui=targets]').first().click();
 const ally=page.locator('.target-picker-list [data-battle-target="102,196"]'),immune=page.locator('.target-picker-list [data-battle-target="146,196"]');
 await immune.waitFor();assert(await immune.isDisabled());assert.match(await immune.textContent(),/Cannot target|Sort impossible/);
 assert.equal(await ally.isDisabled(),offensive);
 }
 }
 assert.deepEqual(errors,[]);console.log(name+': protective/offensive eligibility passed in portrait and landscape');
 }finally{await browser.close();}
}
