/** Exact original campaign bytes; only its registry admission is changed privately.
 * Checks the real initial form and pending save, before the unported calendar. */
import {chromium} from 'playwright-core';import crypto from 'node:crypto';import {readOriginalCampaign} from '../../scripts/era-bridge/campaigns/importer.mjs';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {silenceTestAudio} from './silent-audio.mjs';
const id='zc1',selected=1,out=process.env.REVIEW_OUTPUT||'/tmp/goonk-campaign183-original-start';fs.mkdirSync(out,{recursive:true});
const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8877',original=`mod/wake-of-gods/Mods/maps/content/maps/${id}.vcmp`,campaign=readOriginalCampaign(original),bytes=fs.readFileSync(original),entryId=id+'-'+selected;
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(page);page.setDefaultTimeout(90000);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>fs.appendFileSync(path.join(out,'console.log'),m.text()+'\n'));
const wait=(f,arg)=>page.waitForFunction(f,arg,{timeout:90000}),cmd=(...args)=>page.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]),state=()=>page.evaluate(()=>goonkMobileState);
await page.addInitScript(({bytes,entryId})=>{
 sessionStorage.setItem('heroes-goonk.storage-failed','true');let current;Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{current=m;const old=Object.getOwnPropertyDescriptor(m,'callMain');let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;old?.set?.call(m,f);},get:()=>function(...args){const invoke=old?.get?old.get.call(m):main,root='/home/web_user/.local/share/vcmi/',folder=root+'Mods/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns/';m.FS.writeFile(root+'Maps/000-Original-Campaign.vcmp',new Uint8Array(bytes));const registry=JSON.parse(m.FS.readFile(folder+'registry.json',{encoding:'utf8'}));const entry=registry.programs.find(p=>p.id===entryId);if(!entry||entry.enabled)throw Error('Missing dormant entry '+entryId);entry.enabled=true;m.FS.writeFile(folder+'registry.json',JSON.stringify(registry));return invoke.apply(m,args);}});}});
},{bytes:[...bytes],entryId});

try{
 const engine=await(await page.request.get(origin+'/engine-build.json')).json();assert.equal(engine.sha256,process.env.EXPECTED_ENGINE_SHA);
 await page.goto(origin+'/game.html?mobile=1&new-campaign=1');await wait(()=>window.goonkMobileState?.mode==='campaign'&&goonkMobileState.lobbyReady&&goonkMobileState.campaigns?.length);
 const index=await page.evaluate(name=>goonkMobileState.campaigns.find(c=>c.name===name)?.index,campaign.header.name);assert.notEqual(index,undefined);await page.locator(`[data-campaign="${index}"]`).tap();
 await wait(()=>['campaign-scenario','campaign-intro'].includes(goonkMobileState.mode));if((await state()).mode==='campaign-intro')await cmd(68);await wait(()=>goonkMobileState.mode==='campaign-scenario');
 const before=await state();assert(before.campaignScenario.scenarios.find(s=>s.id===selected).available);await cmd(65,selected);await wait(selected=>goonkMobileState.campaignScenario?.selected===selected,selected);
 const bonus=page.locator('[data-campaign-bonus]').first();if(await bonus.count())await bonus.tap();await wait(()=>goonkMobileState.campaignScenario?.canStart);await cmd(67);
 await wait(()=>['campaign-intro','dialog','map'].includes(goonkMobileState.mode));if((await state()).mode==='campaign-intro')await cmd(68);
 await wait(()=>goonkMobileState.dialogKind==='source-campaign'&&goonkMobileState.dialogPresentation?.scriptDialog?.kind==='extended');
 const pending=await state(),form=pending.dialogPresentation.scriptDialog;
 assert.deepEqual(form.choices.map(c=>c.value),[1,2,3,4]);assert.deepEqual(form.pictures.map(p=>p.mediaKey),['cmp.res/11_901.bmp','cmp.res/11_902.bmp','cmp.res/11_903.bmp','cmp.res/11_904.bmp']);assert.match(form.text,/Time to play a real game/);
 assert.equal(await page.locator('.campaign-media-thumbnail img').count(),4);await page.locator('.campaign-media-thumbnail img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
 await page.locator('[data-campaign-input]').fill('Native hero');await page.locator('[data-campaign-choice="4"]').check();await page.waitForTimeout(500);
 assert((await state()).autosaveAllowed);const file='/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1',prior=await page.evaluate(file=>{try{return Module.FS.stat(file).mtime.getTime()}catch{return 0}},file);await cmd(34,183);await wait(({file,prior})=>{try{return Module.FS.stat(file).mtime.getTime()>prior}catch{return false}},{file,prior});
 const save=Buffer.from(await page.evaluate(file=>Array.from(Module.FS.readFile(file)),file));assert.equal(save.readInt32LE(4),905);assert(save.includes(Buffer.from('Native hero')));fs.writeFileSync(out+'/original-start-pending.vsgm1',save);assert.deepEqual(errors,[]);await page.screenshot({path:out+'/original-start.png'});
 fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,scope:'Exact original zc1 archive and scripts privately admitted; actual initial extended form, original four illustrations, native draft and pending save. Calendar, complete quest and victory are not validated.',engine,sourceArchiveSha256:campaign.sha256,sourceProgramId:entryId,pendingSaveSha256:crypto.createHash('sha256').update(save).digest('hex'),pending,draft:{text:await page.locator('[data-campaign-input]').inputValue(),selection:Number(await page.locator('[data-campaign-choice]:checked').inputValue())},errors},null,2));

}catch(e){fs.writeFileSync(path.join(out,'failure-state.json'),JSON.stringify(await state().catch(()=>null),null,2));await page.screenshot({path:path.join(out,'failure.png')});throw e;}finally{await browser.close();}
