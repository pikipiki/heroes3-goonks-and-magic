/** Actual Samaritan third-scenario save: recruit a reserve hero initialized by
 * unchanged original DO loops. Caller supplies hash-pinned private save; no saves
 * are shipped. Native resources cheat funds the separate recruitment QA case. */
import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {readOriginalCampaign} from '../../scripts/era-bridge/campaigns/importer.mjs';
import {readCompletedNativeSave} from './native-save-completed.mjs';
import {silenceTestAudio} from './silent-audio.mjs';
const origin=process.env.GOONK_TEST_ORIGIN,out=process.env.REVIEW_OUTPUT;assert(origin&&out);fs.mkdirSync(out,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),input=fs.readFileSync(process.env.CAMPAIGN_LOAD_SAVE);assert.equal(hash(input),process.env.CAMPAIGN_EXPECTED_SAVE_SHA);assert.equal(input.readInt32LE(4),906);
const source='mod/wake-of-gods/Mods/maps/content/maps/zc2.vcmp',campaign=readOriginalCampaign(source),archive=fs.readFileSync(source),browserName=process.env.CAMPAIGN_BROWSER==='webkit'?'webkit':'chromium';
assert.equal(campaign.sha256,'5404bb0faf8bea89ec708263a2e3cc37b41e4f0ddc20af6e474f0a911b76f16f');
const browser=await(browserName==='webkit'?webkit:chromium).launch({headless:true}),page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(page);
const errors=[],dialogs=[],battles=[],seen=new Set(),layouts=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>fs.appendFileSync(out+'/console.log',m.text()+'\n'));const watchdog=setTimeout(()=>browser.close(),240000);
const state=()=>page.evaluate(()=>goonkMobileState),wait=(f,arg)=>page.waitForFunction(f,arg,{timeout:90000}),cmd=(...args)=>page.evaluate(a=>Module._vcmiMobileCommand(...a),[...args,...Array(6-args.length).fill(0)]);
await page.addInitScript(({archive})=>{sessionStorage.setItem('heroes-goonk.storage-failed','true');let current;Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{current=m;const old=Object.getOwnPropertyDescriptor(m,'callMain');let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;old?.set?.call(m,f)},get:()=>function(...args){const root='/home/web_user/.local/share/vcmi/',file=root+'Mods/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns/registry.json',registry=JSON.parse(m.FS.readFile(file,{encoding:'utf8'}));for(const row of registry.programs)if(row.id.startsWith('zc2-'))row.enabled=true;m.FS.writeFile(file,JSON.stringify(registry));m.FS.writeFile(root+'Maps/000-Original-Campaign.vcmp',new Uint8Array(archive));m.FS.mkdirTree('/home/web_user/.config/vcmi/');m.FS.writeFile('/home/web_user/.config/vcmi/settings.json',JSON.stringify({battle:{speedFactor:18}}));return(old?.get?old.get.call(m):main).apply(m,args)}})}})},{archive:[...archive]});
async function ready(){await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn&&!goonkMobileState.campaignPending&&!goonkMobileState.heroMoving);await page.waitForTimeout(500)}
async function load(bytes){await page.evaluate(b=>{const p='/home/web_user/.local/share/vcmi/Saves/';Module.FS.mkdirTree(p);Module.FS.writeFile(p+'Goonk-auto.vsgm1',new Uint8Array(b))},[...bytes]);await cmd(23);await wait(()=>goonkMobileState.mode==='load'&&goonkMobileState.lobbyReady);const row=(await state()).maps.find(m=>/Goonk-auto/i.test(m.name+' '+m.file));assert(row);await cmd(27,row.index);await wait(i=>goonkMobileState.selectedIndex===i,row.index);await cmd(22);await ready()}
try{
 const engine=await(await page.request.get(origin+'/engine-build.json')).json();assert.equal(engine.sha256,process.env.EXPECTED_ENGINE_SHA);assert.equal(hash(await(await page.request.get(origin+'/'+engine.wasm)).body()),engine.sha256);
 await page.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done');await load(input);
 const before=await state();assert.equal(before.currentPlayer,0);assert.equal(before.day,1);assert.equal(before.heroes.length,1);
 await cmd(29,0);await page.waitForTimeout(350);await cmd(5,0);await wait(()=>goonkMobileState.mode==='town');let town=await state();const tavern=town.buildings.find(b=>/:tavern$/.test(b.key));assert(tavern);
 if(!tavern.built){await cmd(8,tavern.id);await wait(id=>goonkMobileState.buildings.some(b=>b.id===id&&b.built),tavern.id)}
 await cmd(39,tavern.id);await wait(()=>goonkMobileState.dialogKind==='tavern');const offers=await state(),entries=Object.entries(offers.tavernHeroes);assert(entries.length);assert(entries.every(([,h])=>h.level===20));assert(offers.tavern.canRecruit);
 for(const[width,height]of[[320,568],[568,320],[390,844],[844,390],[768,1024],[1024,768],[820,1180]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(300);const close=page.locator('[data-tavern-close]:visible');assert.equal(await close.count(),1);const r=await close.boundingBox();assert(r&&r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1);
  assert(await page.evaluate(async()=>{const n=document.querySelector('[data-tavern-recruit]');await new Promise(r=>setTimeout(r,400));return n===document.querySelector('[data-tavern-recruit]')}));layouts.push({width,height,singleVisibleClose:true,stableRecruitControl:true});
 }
 await page.setViewportSize({width:844,height:390});const[index,offer]=entries[0];await cmd(86,Number(index),offer.id);await wait(()=>goonkMobileState.heroes?.length===2);
 if((await state()).dialogKind==='tavern')await cmd(40);if((await state()).mode==='town')await cmd(1);await ready();const recruit=(await state()).heroes.find(h=>!before.heroes.some(old=>old.id===h.id));assert(recruit);await cmd(4,recruit.index);await wait(id=>goonkMobileState.heroId===id,recruit.id);await cmd(55);await wait(()=>goonkMobileState.mode==='hero');const hero=await state();assert.equal(hero.heroWindow.level,20);assert(hero.heroHasSpellbook);assert(hero.equipment.some(a=>a.slot===17&&a.name==='Spell Book'));
 await cmd(62,17);await wait(()=>goonkMobileState.mode==='spellbook');await cmd(70,1);await page.waitForTimeout(300);const spells=await state();assert(spells.spellbook.spells.some(s=>s.id===15));assert.equal(hero.heroMana,hero.heroManaLimit);await cmd(0);await wait(()=>goonkMobileState.mode==='hero');await cmd(63);await ready();
 const saved=await readCompletedNativeSave(page,cmd);assert.equal(saved.readInt32LE(4),906);fs.writeFileSync(out+'/recruited.vsgm1',saved);assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,browser:browserName,engineSha256:engine.sha256,sourceArchiveSha256:campaign.sha256,inputSaveSha256:hash(input),saveSha256:hash(saved),originalProgramsUnchanged:true,nativeResourceCheatUsed:true,scope:'Original third-scenario global book, experience, mana and school-spell initialization survives actual reserve recruitment; no campaign-victory claim',offers:offers.tavernHeroes,recruitedHero:hero,spells:spells.spellbook,layouts,errors},null,2));
}catch(error){fs.writeFileSync(out+'/failure-state.json',JSON.stringify(await state().catch(()=>null),null,2));await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw error}finally{clearTimeout(watchdog);await browser.close()}
