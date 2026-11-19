import{chromium,webkit}from'playwright-core';import assert from'node:assert/strict';import fs from'node:fs';import path from'node:path';import{silenceTestAudio}from'./silent-audio.mjs';
for(const[name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
 const p=await browser.newPage({hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));await silenceTestAudio(p);
 await p.route('**/web/**',r=>{const file=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?r.fulfill({path:file}):r.abort();});
 await p.route('**/opfs-worker.js',r=>r.fulfill({contentType:'text/javascript',body:'export const opfsList=async()=>({}),opfsUnlink=async()=>{},opfsFlush=async()=>{};'}));
 await p.route('**/accordions?mobile=1',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/game-menu.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...args){calls.push(args)}};</script><script type=module src=/web/mobile.mjs></script><script type=module src=/web/game-menu.mjs></script>'}));
 await p.goto('http://127.0.0.1:8782/accordions?mobile=1');await p.waitForSelector('#game-menu-toggle');
 await p.evaluate(()=>{window.model={mode:'lobby',lobbyReady:true,lobbyHumanCount:1,selectedMap:'The King and Queen',selectedFaction:-1,difficulty:1,maps:[{index:0,name:'The King and Queen',width:144,height:144,players:2,castleChoice:true,humanSeats:1},{index:1,name:'Another map',width:72,height:72,players:4,humanSeats:1}],players:[],factions:[],wogOptionsEditable:true,wogOptions:Array(30).fill(-1)};window.send=()=>dispatchEvent(new CustomEvent('goonk-state',{detail:structuredClone(model)}));send();});
 for(const language of['fr','en'])for(const viewport of[{width:320,height:568},{width:716,height:279}]){
 await p.setViewportSize(viewport);await p.evaluate(async language=>{(await import('/web/i18n.mjs')).setLanguage(language);send();},language);
 assert.equal(await p.locator('.lobby-extra-options details').count(),0,'Setup disclosures are not native details');
 for(const selector of['.wog-options','.custom-game-options']){
 const accordion=p.locator(selector),summary=accordion.locator('[data-ui-accordion-summary]');assert(await accordion.evaluate(n=>n.classList.contains('MuiAccordion-root')));assert(await summary.evaluate(n=>n.classList.contains('MuiAccordionSummary-root')));
 if(await summary.getAttribute('aria-expanded')==='true'){await summary.click();await accordion.locator('.MuiCollapse-hidden').waitFor({state:'attached'});}
 await accordion.evaluate(n=>{n.toggleCount=0;if(!n.trackToggle){n.trackToggle=true;n.addEventListener('toggle',()=>n.toggleCount++);}});const height=(await summary.boundingBox()).height;await summary.focus();await summary.press('Enter');await accordion.locator('.MuiCollapse-entered').waitFor();assert.equal(await summary.getAttribute('aria-expanded'),'true');assert.equal((await summary.boundingBox()).height,height,'Summary retains its height when expanded');
 const controls=await summary.evaluate(button=>({id:button.id,controls:button.getAttribute('aria-controls')}));assert(await accordion.locator('[role=region]').evaluate((region,controls)=>region.id===controls.controls&&region.getAttribute('aria-labelledby')===controls.id,controls),'Accessible summary/region linkage');
 if(selector==='.wog-options'){
 const input=accordion.locator('input[data-wog-option="0"][value="1"]');await p.evaluate(()=>{model.wogOptions[0]=-1;send();});await input.locator('xpath=ancestor::label[1]').tap();assert.equal((await p.evaluate(()=>calls.at(-1)))[0],109);await p.evaluate(()=>{model.wogOptions[0]=1;send();});await input.waitFor();assert(await input.isChecked());await p.evaluate(()=>window.savedChoice=document.querySelector('input[data-wog-option="0"][value="1"]'));
 }
 await summary.focus();await summary.press('Space');await accordion.locator('.MuiCollapse-hidden').waitFor({state:'attached'});assert.equal(await summary.getAttribute('aria-expanded'),'false');
 await p.evaluate(()=>{for(let i=0;i<10;i++)send();});assert.equal(await summary.getAttribute('aria-expanded'),'false','Native updates never reopen an accordion');assert.equal(await accordion.evaluate(n=>n.toggleCount),2,'Exactly one toggle event per keyboard action');
 await summary.click();await accordion.locator('.MuiCollapse-entered').waitFor();
 if(selector==='.wog-options')assert(await p.evaluate(()=>savedChoice===document.querySelector('input[data-wog-option="0"][value="1"]')&&savedChoice.checked),'Collapse keeps the selected input mounted');
 await summary.click();await accordion.locator('.MuiCollapse-hidden').waitFor({state:'attached'});
 }
 await p.locator('[data-setting=mobile-map-select] button').tap();const filter=p.locator('.scenario-filter-disclosure'),trigger=filter.locator('[data-ui-accordion-summary]');assert(await filter.evaluate(n=>n.classList.contains('MuiAccordion-root')));assert.equal(await p.locator('.scenario-filters details').count(),0);
 await trigger.tap();await filter.locator('.MuiCollapse-entered').waitFor();assert(await p.locator('.scenario-filters [data-filter=players]').count());await trigger.tap();await filter.locator('.MuiCollapse-hidden').waitFor({state:'attached'});await p.locator('[data-picker-close]').tap();
 }
 const adapter=await p.evaluate(async()=>{const{renderMarkup}=await import('/web/ui/material-components.mjs');const host=document.createElement('div');document.body.append(host);renderMarkup(host,'<details open class="legacy-disclosure"><summary>Rules</summary><p>Retained content</p></details>');const accordion=host.firstElementChild;let toggles=0;accordion.addEventListener('toggle',()=>toggles++);const initial=accordion.open;accordion.open=false;const closed=!accordion.open;accordion.open=true;return{initial,closed,reopened:accordion.open,toggles,mui:accordion.classList.contains('MuiAccordion-root'),native:host.querySelectorAll('details,summary').length};});
 assert.deepEqual(adapter,{initial:true,closed:true,reopened:true,toggles:2,mui:true,native:0},'Existing disclosure markup and toggle controllers use real MUI');
 assert.deepEqual(errors,[]);console.log('PASS',name,'real MUI accordions, keyboard, ARIA, fixed summary geometry, retained options and map filters in portrait/landscape FR/EN');
 }finally{await browser.close();}
}
