import{chromium,webkit}from'playwright-core';
import assert from'node:assert/strict';import fs from'node:fs';import path from'node:path';
import{silenceTestAudio}from'./silent-audio.mjs';
for(const[name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
 const p=await browser.newPage({hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));await silenceTestAudio(p);
 await p.route('**/web/**',r=>{const file=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?r.fulfill({path:file}):r.abort();});
 await p.route('**/opfs-worker.js',r=>r.fulfill({contentType:'text/javascript',body:'export const opfsList=async()=>({}),opfsUnlink=async()=>{},opfsFlush=async()=>{};'}));
 await p.route('**/book?mobile=1',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/game-menu.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>Module={_vcmiMobileEnable(){},_vcmiMobileCommand(){}};</script><script type=module src=/web/mobile.mjs></script><script type=module src=/web/game-menu.mjs></script>'}));
 await p.goto('http://127.0.0.1:8782/book?mobile=1');await p.waitForSelector('#game-menu-toggle',{state:'attached'});
 for(const language of['fr','en'])for(const viewport of[{width:320,height:568},{width:430,height:932},{width:568,height:280},{width:716,height:279}]){
 await p.setViewportSize(viewport);await p.evaluate(()=>dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'map'}})));await p.locator('.mobile-spellbook').waitFor({state:'hidden'});await p.evaluate(async language=>{
  (await import('/web/i18n.mjs')).setLanguage(language);
  window.calls=[];window.book={mana:30,manaLimit:10,school:-1,page:0,pages:3,inCombat:false,combatSpells:true};
  window.send=()=>dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'spellbook',heroId:1,spellbook:{...book,spells:Array.from({length:3},(_,i)=>({id:15+book.page*3+i,name:'Magic '+(book.page*3+i),cost:5,level:1,target:'enemy',enabled:true,description:'A long spell description. '.repeat(45)}))}}}));
  Module._vcmiMobileCommand=(id,value)=>{calls.push([id,value]);if(id===50){book.page+=value;queueMicrotask(send);}if(id===51){book.school=[-1,0,2,1,3][value];book.page=0;queueMicrotask(send);}};send();
 },language);
 try{await p.waitForFunction(()=>document.querySelectorAll('.spell-row').length===9,{},{timeout:5000});}catch(error){throw new Error(JSON.stringify({errors,state:await p.evaluate(()=>({calls,book,count:document.querySelectorAll('.spell-row').length,mode:document.querySelector('#mobile-app')?.dataset.mode}))}));}
 assert.equal(await p.locator('.mobile-spellbook [data-page]').count(),0,'No pagination controls');
 assert.equal(await p.locator('.mobile-spellbook [role=combobox]').count(),1,'One school selector, no duplicate');
 await p.locator('.mobile-spellbook [role=combobox]').tap();await p.getByRole('option',{name:language==='fr'?'Feu':'Fire',exact:true}).tap();
 await p.waitForFunction(()=>document.querySelector('[data-school-select]').value==='3');
 assert.equal(await p.evaluate(()=>calls.filter(([id,v])=>id===51&&v===3).length),1,'One native school command per selection');
 try{await p.waitForFunction(()=>document.querySelectorAll('.spell-row').length===9,{},{timeout:5000});}catch(error){throw new Error(JSON.stringify({errors,state:await p.evaluate(()=>({calls,book,count:document.querySelectorAll('.spell-row').length,mode:document.querySelector('#mobile-app')?.dataset.mode}))}));}
 if(viewport.width>viewport.height){
 const b=await p.evaluate(()=>{const rect=s=>document.querySelector(s).getBoundingClientRect().toJSON();return{menu:rect('#game-menu-toggle'),title:rect('.mobile-spellbook h2'),close:rect('[data-close-book]'),list:rect('.spell-list'),detail:rect('.spell-selection')};});
 assert.equal(b.title.left-b.menu.right,16,'Reserved menu margin');assert.equal(b.close.left-b.title.right,16,'Symmetric title margin');assert(Math.abs(b.list.width-b.detail.width)<1,'Book halves share the same width');
 }
 await p.locator('.spell-list').evaluate(n=>n.scrollTop=n.scrollHeight);await p.locator('[data-spell="15"]').tap();await p.locator('[data-cast-spell]').tap();
 try{await p.waitForFunction(()=>calls.some(([id,value])=>id===49&&value===15),{},{timeout:5000});}catch(error){throw new Error(JSON.stringify({language,viewport,errors,state:await p.evaluate(()=>({calls,book,selection:document.querySelector('.spell-selection h3')?.textContent,cast:document.querySelector('[data-cast-spell]')?.outerHTML}))}));}
 assert.equal(await p.evaluate(()=>calls.filter(([id])=>id===49).length),1,'Casting resolves the native page and executes exactly once');
 }
 assert.deepEqual(errors,[]);console.log('PASS',name,'scroll collection, single localized school selector, symmetric header, equal book halves, native casting');
 }finally{await browser.close();}
}
