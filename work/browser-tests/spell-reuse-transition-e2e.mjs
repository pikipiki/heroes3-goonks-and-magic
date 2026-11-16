import {chromium,webkit} from 'playwright-core';
import path from 'node:path';import assert from 'node:assert/strict';
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
 const p=await browser.newPage({viewport:{width:390,height:844}});
 await p.route('**/web/**',r=>r.fulfill({path:path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1])}));
 await p.route('**/reuse-test',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><div id="root"><main class="mobile-play"></main></div><script type="module">import {createMobileSpellbook} from "/web/spellbook.mjs";window.calls=[];window.ui=createMobileSpellbook({root:document.querySelector("#root"),command:(...a)=>calls.push(a)});</script>'}));
 await p.goto('http://localhost/reuse-test');await p.waitForFunction(()=>window.ui);
 await p.evaluate(()=>{
  window.book={inCombat:true,mana:30,school:-1,page:0,pages:1,spells:[{id:15,name:'Magic Arrow',cost:5,enabled:true,target:'enemy'}]};
  window.send=(mode='spellbook',extra={})=>ui.update({mode,heroId:1,heroMana:30,...(mode==='spellbook'?{spellbook:structuredClone(book)}:{}),...extra});send();
 });
 await p.locator('[data-spell="15"]').click();
 await p.evaluate(()=>{
  send('battle',{canAct:true,spellTargeting:false}); // Book closes before targeting is published.
  send('battle',{canAct:false,spellTargeting:true});
  send('battle',{canAct:true,spellTargeting:false}); // Target accepted, mana snapshot arrives later.
  send('battle',{canAct:true,spellTargeting:false,heroMana:25});
  book.mana=25;send();
 });
 assert.equal(await p.locator('[data-reuse]').isDisabled(),false,'Successful cast survives intermediate battle snapshots');
 assert.equal(await p.locator('[data-reuse] strong').textContent(),'Magic Arrow');
 await p.locator('[data-reuse]').click();assert.deepEqual(await p.evaluate(()=>calls.at(-1)),[49,15]);
 await p.evaluate(()=>{send('battle',{spellTargeting:true,canAct:false,heroMana:25});send('battle',{spellTargeting:false,canAct:true,heroMana:25});send();});
 assert.equal(await p.locator('[data-reuse] strong').textContent(),'Magic Arrow','Canceling a target keeps the last confirmed spell');
 // A different canceled selection must never replace the last successful spell.
 await p.evaluate(()=>{book.spells.push({id:16,name:'Ice Bolt',cost:5,enabled:true,target:'enemy'});send();});
 await p.locator('[data-spell="16"]').click();await p.evaluate(()=>{send('battle',{spellTargeting:true,canAct:false,heroMana:25});send('battle',{spellTargeting:false,canAct:true,heroMana:25});send();});
 assert.equal(await p.locator('[data-reuse] strong').textContent(),'Magic Arrow');
 await p.evaluate(()=>send('spellbook',{heroId:2}));assert(await p.locator('[data-reuse]').isDisabled(),'History is separate for each hero');
 await p.evaluate(()=>{book.mana=2;send();});assert(await p.locator('[data-reuse]').isDisabled(),'Insufficient mana still disables reuse');
 console.log('PASS',name,'late mana, intermediate targeting states, canceled selection and per-hero history');
 }finally{await browser.close();}
}
