import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {screenCases,stateFor} from './material-screen-cases.mjs';
import {silenceTestAudio} from './silent-audio.mjs';
const model=stateFor(screenCases.find(entry=>entry[0]==='hall'));
for(const [name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
  const p=await browser.newPage({hasTouch:true}),errors=[];p.on('pageerror',error=>errors.push(error.stack));await silenceTestAudio(p);
  await p.route('**/web/**',route=>{const file=path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?route.fulfill({path:file}):route.abort();});
  await p.route('**/lifecycle?mobile=1',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>Module={_vcmiMobileEnable(){},_vcmiMobileCommand(){}};</script><script type=module src=/web/mobile.mjs></script>'}));
  await p.goto('http://localhost/lifecycle?mobile=1');await p.waitForSelector('#mobile-app');
  for(const language of ['fr','en'])for(const viewport of [{width:360,height:716},{width:716,height:279}]){
   await p.setViewportSize(viewport);await p.evaluate(async lang=>(await import('/web/i18n.mjs')).setLanguage(lang),language);
   for(let round=0;round<8;round++){
    await p.evaluate(state=>dispatchEvent(new CustomEvent('goonk-state',{detail:state})),model);await p.waitForTimeout(30);
    const button=p.locator('[data-family-select="'+round%3+'"]');await button.scrollIntoViewIfNeeded();await button.tap();
    await p.locator('.hall-actions>.ui-overflow-trigger').tap();await p.locator('[data-recruit-all]').waitFor({state:'visible'});await p.keyboard.press('Escape');
    await p.locator('[data-family-select="'+(round+1)%3+'"]').tap();
    assert.equal(await p.locator('[data-recruit-all]').count(),1,'A menu cannot adopt and destroy the header action');
    await p.evaluate(state=>dispatchEvent(new CustomEvent('goonk-state',{detail:{...state,fortFamilies:state.fortFamilies.map(family=>({...family,variants:family.variants.map(unit=>({...unit,name:unit.name+' '+state.round}))}))}})),{...model,round});
    assert.equal(await p.locator('[data-recruit-all]').count(),1,'Replacing the roster must restore foreign header actions before removing the old layout');
    await p.evaluate(state=>dispatchEvent(new CustomEvent('goonk-state',{detail:{...state,recruitUnit:{id:900,count:state.round}}})),{...model,round});
    await p.evaluate(state=>dispatchEvent(new CustomEvent('goonk-state',{detail:{...state,mode:'map'}})),model);
   }
  }
  assert.deepEqual(errors,[]);console.log('PASS',name,'32 menu close/change/reset cycles, FR/EN, portrait/landscape, persistent header action and zero errors');
 }finally{await browser.close();}
}
