import{chromium,webkit}from'playwright-core';
import assert from'node:assert/strict';import fs from'node:fs';import path from'node:path';
import{silenceTestAudio}from'./silent-audio.mjs';
const results=[];
for(const[name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
 const p=await browser.newPage({hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));await silenceTestAudio(p);
 await p.route('**/web/**',r=>{const file=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?r.fulfill({path:file}):r.abort();});
 await p.route('**/opfs-worker.js',r=>r.fulfill({contentType:'text/javascript',body:'export const opfsList=async()=>({}),opfsUnlink=async()=>{},opfsFlush=async()=>{};'}));
 await p.route('**/wog-stability?mobile=1',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/game-menu.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...args){calls.push(args)}};</script><script type=module src=/web/mobile.mjs></script><script type=module src=/web/game-menu.mjs></script>'}));
 await p.goto('http://127.0.0.1:8782/wog-stability?mobile=1');await p.waitForSelector('#game-menu-toggle');
 await p.evaluate(()=>{window.model={mode:'lobby',lobbyReady:true,lobbyHumanCount:1,selectedMap:'The King and Queen',selectedFaction:-1,difficulty:1,maps:[{index:0,name:'The King and Queen',width:144,height:144,players:2,castleChoice:true}],players:[],factions:[],wogOptionsEditable:true,wogOptions:Array(32).fill(-1)};window.send=()=>dispatchEvent(new CustomEvent('goonk-state',{detail:structuredClone(model)}));send();});
 await p.locator('.wog-options [data-ui-accordion-summary]').tap();await p.locator('.wog-options .MuiCollapse-entered').waitFor();

 // Resolve the module before viewport changes; language updates themselves are synchronous.
 await p.evaluate(async()=>{window.setMockLanguage=(await import('/web/i18n.mjs')).setLanguage;});
 for(const language of['fr','en'])for(const viewport of[{width:320,height:568},{width:390,height:844},{width:430,height:932},{width:568,height:280},{width:716,height:279},{width:844,height:390}]){
 await p.setViewportSize(viewport);await p.evaluate(language=>{setMockLanguage(language);send();},language);
 const last=await p.locator('.wog-options fieldset:visible').count()-1;
 for(const index of[0,last]){
 const value=await p.evaluate(index=>model.wogOptions[index]===1?0:1,index),selector=`input[data-wog-option="${index}"][value="${value}"]`,choice=p.locator(selector),label=choice.locator('xpath=ancestor::label[1]');
 await label.scrollIntoViewIfNeeded();await p.waitForTimeout(100);
 const measure=()=>p.evaluate(selector=>{const n=document.querySelector(selector),label=n.closest('label'),form=n.closest('.wog-options'),scroll=document.querySelector('.lobby-scroll'),footer=document.querySelector('.lobby-footer');return{scroll:scroll.scrollTop,form:form.getBoundingClientRect().height,label:label.getBoundingClientRect().top,status:form.querySelector('[role=status]').getBoundingClientRect().height,footer:footer.getBoundingClientRect().top,sameInput:!window.originalChoice||window.originalChoice===n};},selector);
 await p.evaluate(selector=>window.originalChoice=document.querySelector(selector),selector);const before=await measure();await label.tap();await p.waitForFunction(()=>document.querySelector('.wog-options').getAttribute('aria-busy')==='true');
 const pending=[];for(let i=0;i<4;i++){await p.waitForTimeout(20);pending.push(await measure());}
 assert(await choice.isChecked(),'Selected option remains visible during acknowledgement');assert(await choice.isDisabled());
 await p.evaluate(({index,value})=>{model.wogOptions[index]=value;send();},{index,value});await p.waitForFunction(()=>document.querySelector('.wog-options').getAttribute('aria-busy')==='false');
 const after=[];for(let i=0;i<4;i++){await p.waitForTimeout(20);after.push(await measure());}
 for(const sample of[...pending,...after]){for(const key of['scroll','form','label','status','footer'])assert(Math.abs(sample[key]-before[key])<=1,`${name} ${language} ${viewport.width} rule ${index}: ${key} moved ${JSON.stringify({before,sample})}`);assert(sample.sameInput,'Selection never replaces the radio input');}
 assert(await choice.isChecked());assert(await choice.isEnabled());results.push({name,language,viewport,index,stable:true});
 }
 }
 assert.deepEqual(errors,[]);console.log('PASS',name,'WoG selection keeps scroll, control positions, status height, footer and input identity through pending/confirmation');
 }finally{await browser.close();}
}
fs.writeFileSync('/tmp/wog-options-stability.json',JSON.stringify(results,null,2));
