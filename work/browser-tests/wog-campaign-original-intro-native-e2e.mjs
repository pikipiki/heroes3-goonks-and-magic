/** Exact original archive and script program, private registry admission only.
 * Proves the real original introduction and ready day-one state; no quest/victory proof. */
import {chromium} from 'playwright-core';import crypto from 'node:crypto';
import {readOriginalCampaign} from '../../scripts/era-bridge/campaigns/importer.mjs';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {silenceTestAudio} from './silent-audio.mjs';
const id='zc1',selected=1,out=process.env.REVIEW_OUTPUT||'/tmp/goonk-campaign188-original-intro';fs.mkdirSync(out,{recursive:true});
const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8877',original=`mod/wake-of-gods/Mods/maps/content/maps/${id}.vcmp`,campaign=readOriginalCampaign(original),bytes=fs.readFileSync(original),entryId=id+'-'+selected;
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(page);page.setDefaultTimeout(90000);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>fs.appendFileSync(path.join(out,'console.log'),m.text()+'\n'));
const wait=(f,arg)=>page.waitForFunction(f,arg,{timeout:90000}),cmd=(...args)=>page.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]),state=()=>page.evaluate(()=>goonkMobileState);
await page.addInitScript(({bytes,entryId})=>{
 sessionStorage.setItem('heroes-goonk.storage-failed','true');let current;Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{current=m;const old=Object.getOwnPropertyDescriptor(m,'callMain');let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;old?.set?.call(m,f);},get:()=>function(...args){const invoke=old?.get?old.get.call(m):main,root='/home/web_user/.local/share/vcmi/',folder=root+'Mods/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns/';m.FS.writeFile(root+'Maps/000-Original-Campaign.vcmp',new Uint8Array(bytes));const registry=JSON.parse(m.FS.readFile(folder+'registry.json',{encoding:'utf8'}));const entry=registry.programs.find(p=>p.id===entryId);if(!entry||entry.enabled)throw Error('Missing dormant entry '+entryId);entry.enabled=true;m.FS.writeFile(folder+'registry.json',JSON.stringify(registry));return invoke.apply(m,args);}});}});
},{bytes:[...bytes],entryId});

const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex'),layouts=[],images=[],dialogs=[];
async function saveIntro(name='original-intro-pending'){const file='/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1',prior=await page.evaluate(file=>{try{return Module.FS.stat(file).mtime.getTime()}catch{return 0}},file);await cmd(34,188);await wait(({file,prior})=>{try{return Module.FS.stat(file).mtime.getTime()>prior}catch{return false}},{file,prior});const saved=Buffer.from(await page.evaluate(file=>Array.from(Module.FS.readFile(file)),file));assert.equal(saved.readInt32LE(4),905);fs.writeFileSync(out+'/'+name+'.vsgm1',saved);return digest(saved);}
async function layout(label){
 for(const [width,height]of[[320,568],[568,320],[390,844],[844,390],[768,1024],[1024,768],[820,1180]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(350);
  const before=await page.evaluate(()=>{const copy=document.querySelector('.dialog-copy'),form=document.querySelector('.campaign-dialog-form');window.introCopy=copy;window.introForm=form;copy.scrollTop=9999;const ancestors=[];for(let e=copy;e;e=e.parentElement)ancestors.push({tag:e.tagName,cls:e.className,touch:getComputedStyle(e).touchAction});return{scrollTop:copy.scrollTop,overflow:copy.scrollHeight>copy.clientHeight+1,ancestors};});await page.waitForTimeout(500);
  const after=await page.evaluate(()=>{const copy=document.querySelector('.dialog-copy'),form=document.querySelector('.campaign-dialog-form'),buttons=[...document.querySelectorAll('.dialog-presentation footer button')].filter(e=>e.getClientRects().length);return{stableCopy:copy===window.introCopy,stableForm:form===window.introForm,scrollTop:copy.scrollTop,buttons:buttons.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,confirm:e.hasAttribute('data-dialog-confirm'),cancel:e.hasAttribute('data-dialog-cancel')}})};});
  assert(after.stableCopy&&after.stableForm,'Original story form stays mounted');assert.equal(after.scrollTop,before.scrollTop);assert(before.ancestors.every(a=>a.touch!=='none'),'No ancestor blocks vertical touch scrolling');if(before.overflow)assert(before.scrollTop>0);const cancellable=!!(await state()).dialogPresentation.scriptDialog.canCancel;assert.equal(after.buttons.filter(b=>b.confirm).length,1);assert.equal(after.buttons.filter(b=>b.cancel).length,cancellable?1:0);assert.equal(after.buttons.length,cancellable?2:1,'One button per distinct source action');assert(after.buttons.every(r=>r.w>=44&&r.h>=44&&r.x>=-1&&r.y>=-1&&r.x+r.w<=width+1&&r.y+r.h<=height+1));layouts.push({label,width,height,before,after});await page.screenshot({path:path.join(out,label+'-'+width+'x'+height+'.png')});
 }await page.setViewportSize({width:844,height:390});await page.waitForTimeout(300);
}
try{
 const engine=await(await page.request.get(origin+'/engine-build.json')).json();assert.equal(engine.sha256,process.env.EXPECTED_ENGINE_SHA);
 let loadedVersion=null;
 if(process.env.CAMPAIGN_LOAD_SAVE){
  await page.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done');const load=fs.readFileSync(process.env.CAMPAIGN_LOAD_SAVE);loadedVersion=load.readInt32LE(4);await page.evaluate(bytes=>{Module.FS.mkdirTree('/home/web_user/.local/share/vcmi/Saves');Module.FS.writeFile('/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1',new Uint8Array(bytes));},[...load]);await cmd(23);await wait(()=>goonkMobileState.mode==='load'&&goonkMobileState.lobbyReady&&goonkMobileState.maps?.length);const entry=(await state()).maps.find(e=>/Goonk-auto/i.test(e.name+' '+e.file));assert(entry);await cmd(27,entry.index);await wait(index=>goonkMobileState.selectedIndex===index,entry.index);await cmd(22);
 }else{
  await page.goto(origin+'/game.html?mobile=1&new-campaign=1');await wait(()=>window.goonkMobileState?.mode==='campaign'&&goonkMobileState.lobbyReady&&goonkMobileState.campaigns?.length);
 const index=await page.evaluate(name=>goonkMobileState.campaigns.find(c=>c.name===name)?.index,campaign.header.name);assert.notEqual(index,undefined);await page.locator(`[data-campaign="${index}"]`).tap();
 await wait(()=>['campaign-scenario','campaign-intro'].includes(goonkMobileState.mode));if((await state()).mode==='campaign-intro')await cmd(68);await wait(()=>goonkMobileState.mode==='campaign-scenario');
 const before=await state();assert(before.campaignScenario.scenarios.find(s=>s.id===selected).available);await cmd(65,selected);await wait(selected=>goonkMobileState.campaignScenario?.selected===selected,selected);
 const bonus=page.locator('[data-campaign-bonus]').first();if(await bonus.count())await bonus.tap();await wait(()=>goonkMobileState.campaignScenario?.canStart);await cmd(67);

 }
 let pendingSaveSha256=null,firstLayout=false,storyLayout=false;const seen=new Set();
 for(let i=0;i<800;i++){
  await page.waitForTimeout(120);const current=await state();fs.writeFileSync(out+'/progress.json',JSON.stringify(current,null,2));
  if(current.mode==='campaign-intro'){await cmd(68);continue;}
  if(current.mode==='dialog'){
   const token=current.windowToken+':'+current.dialogPresentation?.queryId+':'+JSON.stringify(current.dialogPresentation);if(seen.has(token))continue;seen.add(token);const model=current.dialogPresentation,form=model?.scriptDialog;dialogs.push(model);
   if(form){
    const media=form.pictures.filter(p=>p.mediaKey).map(p=>p.mediaKey);const nodes=page.locator('.campaign-media-thumbnail img');assert.equal(await nodes.count(),media.length);const decoded=await nodes.evaluateAll(imgs=>Promise.all(imgs.map(async img=>{await img.decode();return{src:img.currentSrc,w:img.naturalWidth,h:img.naturalHeight}})));assert(decoded.every(i=>i.w>0&&i.h>0));images.push({text:form.text,media,decoded});
    if(form.inputLabel){
     assert.deepEqual(form.choices.map(c=>c.value),[1,2,3,4]);if(loadedVersion!==null)assert.equal(await page.locator('[data-campaign-input]').inputValue(),'Native hero');else await page.locator('[data-campaign-input]').fill('Native hero');await page.locator('[data-campaign-choice="4"]').check();await page.waitForTimeout(300);if(!process.env.CAMPAIGN_LOAD_SAVE){await layout('original-name');firstLayout=true;}assert.equal(await page.locator('[data-campaign-input]').inputValue(),'Native hero');
    }else if(form.text.includes('A warm summer night')){
     pendingSaveSha256=await saveIntro();if(!process.env.CAMPAIGN_LOAD_SAVE){await layout('original-story');storyLayout=true;}
    }
    await page.locator('[data-dialog-confirm]').tap();
   }else await cmd(1);
  }else if(current.mode==='map'&&current.turn&&!current.campaignPending)break;
 }
 const after=await state();assert.equal(after.mode,'map');assert(after.turn&&!after.campaignPending);assert.equal(after.day,1);assert.equal(after.currentPlayer,6);assert(after.heroes.some(h=>h.name==='Native hero'));assert(after.armies.some(a=>a.name==='Native hero'&&a.slots.filter(Boolean).length===1&&a.slots[0].key==='core:peasant'&&a.slots[0].count===1));assert(dialogs.some(d=>(d.scriptDialog?.text||'').includes('Together you will conquer the world')));if(!process.env.CAMPAIGN_LOAD_SAVE)assert(firstLayout&&storyLayout&&pendingSaveSha256);assert.deepEqual(errors,[]);await page.screenshot({path:out+'/original-day-one-ready.png'});const readySaveSha256=await saveIntro('original-day-one');
 fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,scope:'Exact original zc1 archive and script program privately admitted: actual name/profile form, native story images decoded, complete initial narrative, original day-one hero and army ready; seven-size stable forms and pending original intro save/reload. No original quest, combat or victory validation.',engine,sourceArchiveSha256:campaign.sha256,sourceProgramId:entryId,loadedVersion,pendingSaveSha256,readySaveSha256,dialogs,images,layouts,after,errors},null,2));

}catch(e){fs.writeFileSync(path.join(out,'failure-state.json'),JSON.stringify(await state().catch(()=>null),null,2));await page.screenshot({path:path.join(out,'failure.png')});throw e;}finally{await browser.close();}
