import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {silenceTestAudio} from './silent-audio.mjs';
const out='/tmp/goonk-last-spell';fs.mkdirSync(out,{recursive:true});
const unit={id:98,stackId:1,name:'Gnoll',count:12,attack:4,defense:6,currentHealth:5,maximumHealth:6,health:6,speed:5,x:102,y:196,enemy:false};
const battle={mode:'battle',canAct:true,round:1,activeStack:1,activeUnit:unit,canAutoCombat:true,heroHasSpellbook:true,heroCanCast:true,battleUnits:[unit],battleCells:[]};
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
  for(const language of ['fr','en'])for(const view of ['classic','vertical'])for(const viewport of [{width:320,height:568},{width:390,height:844},{width:716,height:279},{width:844,height:390}]){
   const context=await browser.newContext({viewport,hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));await silenceTestAudio(page);
   await page.addInitScript(({language,view})=>{localStorage.setItem('heroes-goonk.language',language);localStorage.setItem('heroes-goonk.default-battle-view',view);},{language,view});
   await page.route('**/web/**',route=>{const file=path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?route.fulfill({path:file}):route.abort();});
   await page.route('**/opfs-worker.js',route=>route.fulfill({contentType:'text/javascript',body:'export const opfsList=async()=>({}),opfsUnlink=async()=>{},opfsFlush=async()=>{};'}));
   await page.route('**/last-spell?mobile=1',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>Module={_vcmiMobileEnable(){},_vcmiMobileCommand(){},_vcmiMobilePointer(){}};</script><script type=module src=/web/mobile.mjs></script>'}));
   await page.goto('http://localhost/last-spell?mobile=1');await page.waitForSelector('#mobile-app');
   const send=async state=>{await page.evaluate(state=>dispatchEvent(new CustomEvent('goonk-state',{detail:state})),state);await page.waitForTimeout(40);};
   await send(battle);const status=page.locator('.ui-battle-last-spell');assert.equal(await status.isVisible(),false,'No fictitious last cast on a new battle');
   const geometry=()=>page.locator('#mobile-scene').evaluate(node=>node.getBoundingClientRect().toJSON()),before=await geometry();await page.screenshot({path:path.join(out,`${name}-${language}-${view}-${viewport.width}-before.png`)});
   await send({...battle,spellTargeting:true,selectedSpell:{name:'Uncast spell'},battleCamera:{sequence:1,kind:'spell',active:true,label:''}});assert.equal(await status.isVisible(),false,'Targeting and cancelled casting never create a last cast');
   const spell=language==='fr'?'Protection contre tous les éléments':'Protection from all elemental damage';
   await send({...battle,battleCamera:{sequence:2,kind:'spell',active:true,label:spell}});await status.waitFor({state:'visible'});
   assert.equal(await status.locator('[data-last-spell-name]').textContent(),spell);assert((await status.textContent()).includes(language==='fr'?'Dernier sort':'Last spell'));
   assert.deepEqual(await geometry(),before,'The reminder never resizes the battlefield');
   assert.equal(await status.locator('.MuiTypography-root').count(),1,'The status uses the shared MUI text component');
   const metrics=await status.evaluate(node=>{const rect=node.getBoundingClientRect(),text=node.firstElementChild,bounds=text.getBoundingClientRect(),play=node.parentElement.getBoundingClientRect();return {rect:rect.toJSON(),bounds:bounds.toJSON(),play:play.toJSON(),scrollWidth:text.scrollWidth,clientWidth:text.clientWidth,pointer:getComputedStyle(node).pointerEvents,ellipsis:getComputedStyle(text).textOverflow};});
   assert(metrics.bounds.x>=metrics.play.x&&metrics.bounds.right<=metrics.play.right+1&&metrics.bounds.y>=metrics.play.y&&metrics.bounds.bottom<=metrics.play.bottom+1,JSON.stringify(metrics));
   const tagNode=page.locator('.action-tag:visible'),tag=await tagNode.count()?await tagNode.boundingBox():null;if(tag)assert(metrics.bounds.y>=tag.y+tag.height+2,'The reminder avoids the action-view badge');assert(metrics.scrollWidth<=metrics.clientWidth+1,'Full spell name wraps without horizontal overflow');assert.equal(metrics.pointer,'none');assert.notEqual(metrics.ellipsis,'ellipsis');
   await send({...battle,battleCamera:{sequence:3,kind:'attack',active:true,label:''}});assert.equal(await status.locator('[data-last-spell-name]').textContent(),spell,'A later attack does not erase the last spell');
   await send({mode:'spellbook',spellbook:{inCombat:true,spells:[],mana:10}});assert.equal(await status.isVisible(),false);await send({...battle,battleCamera:{sequence:4,kind:'move',active:false,label:''}});assert.equal(await status.locator('[data-last-spell-name]').textContent(),spell,'The combat spellbook retains battle history');
   await page.screenshot({path:path.join(out,`${name}-${language}-${view}-${viewport.width}.png`)});
   await send({mode:'map',turn:true,resources:[],armies:[]});await send(battle);assert.equal(await status.isVisible(),false,'A new battle clears the previous cast');
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log('PASS',name,'native cast reminder, no targeting false positive, persistent until battle ends, no canvas resize, FR/EN Classic/Vertical portrait/landscape');
 }finally{await browser.close();}
}
