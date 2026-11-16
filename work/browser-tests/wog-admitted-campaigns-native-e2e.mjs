/** Delivered campaign catalogue, original starts and native save continuity. No mod/registry/map override. */
import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {readOriginalCampaign} from '../../scripts/era-bridge/campaigns/importer.mjs';
import {silenceTestAudio} from './silent-audio.mjs';
import {readCompletedNativeSave} from './native-save-completed.mjs';
const origin=process.env.GOONK_TEST_ORIGIN,out=process.env.REVIEW_OUTPUT,expected=process.env.EXPECTED_ENGINE_SHA;
assert(origin&&out&&expected);fs.mkdirSync(out,{recursive:true});
const browser=await(process.env.CAMPAIGN_BROWSER==='webkit'?webkit:chromium).launch({headless:true});
const admitted=(process.env.ADMITTED_CAMPAIGN_IDS||'zc1,zc2,zc3,zc4').split(',');
const reports=[],errors=[],campaigns=Object.fromEntries(['zc1','zc2','zc3','zc4'].map(id=>[id,readOriginalCampaign(`mod/wake-of-gods/Mods/maps/content/maps/${id}.vcmp`)]));
const layouts=[[320,568],[568,320],[390,844],[844,390],[768,1024],[1024,768],[820,1180]];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function open(){
 const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(page);page.setDefaultTimeout(90000);
 await page.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>fs.appendFileSync(out+'/console.log',m.text()+'\n'));
 const state=()=>page.evaluate(()=>goonkMobileState),cmd=(...args)=>page.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]),wait=(fn,arg)=>page.waitForFunction(fn,arg,{timeout:180000});
 await page.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&goonkSessionRecovery?.phase==='done');
 return{page,state,cmd,wait};
}
try{
 assert.equal((await(await fetch(origin+'/engine-build.json')).json()).sha256,expected);
 for(const id of (process.env.CAMPAIGN_IDS||'zc3,zc4').split(',')){
  const{page,state,cmd,wait}=await open();const report={id,engineSha256:expected,sourceArchiveSha256:campaigns[id].sha256,productionOnly:true};
  const installed=await page.evaluate(admitted=>{const root='/home/web_user/.local/share/vcmi/Mods/wake-of-gods/Mods/mapSupport/Content/';return{registry:JSON.parse(Module.FS.readFile(root+'config/era-campaigns/registry.json',{encoding:'utf8'})),archives:Object.fromEntries(admitted.map(id=>[id,Array.from(Module.FS.readFile(root+'maps/'+id+'.vcmp'))]))};},admitted);
  assert.equal(installed.registry.programs.filter(p=>p.enabled).length,admitted.reduce((n,id)=>n+campaigns[id].maps.length,0));assert.equal(installed.registry.programs.find(p=>p.id==='cave-gerfrex').enabled,false);
  for(const key of admitted)assert.equal(sha(Buffer.from(installed.archives[key])),campaigns[key].sha256);
  await cmd(47);await wait(()=>goonkMobileState.mode==='campaign'&&goonkMobileState.lobbyReady&&goonkMobileState.campaigns?.length);
  const catalogue=(await state()).campaigns;for(const [key,campaign]of Object.entries(campaigns))assert.equal(catalogue.some(c=>c.name===campaign.header.name),admitted.includes(key),campaign.header.name);
  const entry=catalogue.find(c=>c.name===campaigns[id].header.name),seenLayouts=[];
  for(const[width,height]of layouts){
   await page.setViewportSize({width,height});await page.waitForTimeout(300);const button=page.locator(`[data-campaign="${entry.index}"]`);await button.scrollIntoViewIfNeeded();
   const exit=page.locator('.campaign-catalogue-controls [data-action="0"]:visible');assert.equal(await exit.count(),1);const box=await exit.boundingBox();assert(box&&box.height>=44&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1);
   assert(await button.evaluate(async node=>{const panel=document.querySelector('.campaign-list'),scroll=panel.scrollTop;for(let p=panel;p;p=p.parentElement)if(getComputedStyle(p).touchAction==='none')return false;await new Promise(r=>setTimeout(r,500));return node===document.querySelector(`[data-campaign="${node.dataset.campaign}"]`)&&panel===document.querySelector('.campaign-list')&&panel.scrollTop===scroll;}));
   seenLayouts.push({width,height,singleExit:true,stableControls:true,scrollAllowed:true});
  }
  report.layouts=seenLayouts;await page.setViewportSize({width:844,height:390});await page.locator(`[data-campaign="${entry.index}"]`).tap();await wait(()=>['campaign-intro','campaign-scenario'].includes(goonkMobileState.mode));if((await state()).mode==='campaign-intro')await cmd(68);await wait(()=>goonkMobileState.mode==='campaign-scenario');
  const scenario=(await state()).campaignScenario;assert(scenario.scenarios.some(s=>s.available));if(!scenario.canStart&&scenario.bonuses?.length)await page.locator('[data-campaign-bonus]').first().tap();await wait(()=>goonkMobileState.campaignScenario?.canStart);await cmd(67);
  let token=null,quiet=0;const dialogs=[];
  for(let i=0;i<1800;i++){
   const s=await state();
   if(s.mode==='campaign-intro'){await cmd(68);quiet=0;}
   else if(s.mode==='dialog'){
    quiet=0;const model=s.dialogPresentation;assert(!JSON.stringify(model).includes('Original script error:'),JSON.stringify(model));const key=s.windowToken+':'+JSON.stringify(model);
    if(key!==token){token=key;dialogs.push(model);if(model?.scriptDialog){await page.locator('.campaign-media-thumbnail img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));if(model.scriptDialog.inputLabel)await page.locator('[data-campaign-input]').fill('Native QA');if(model.scriptDialog.choices?.length)await page.locator('[data-campaign-choice]').first().check();await page.locator('[data-dialog-confirm]').tap();}else await cmd(1);await page.waitForTimeout(250);}
   }else if(s.mode==='map'&&s.turn&&s.heroName&&!s.campaignPending){token=null;if(++quiet>=12){report.started={heroName:s.heroName,day:s.day,heroes:s.heroes};break;}}
   else quiet=0;
   await page.waitForTimeout(100);if(i===1799)throw Error('Original campaign start did not settle '+id);
  }
  const bytes=await readCompletedNativeSave(page,cmd);assert.equal(bytes.readInt32LE(4),906);report.saveSha256=sha(bytes);report.dialogs=dialogs;await page.close();
  const loaded=await open();await loaded.page.evaluate(bytes=>{const folder='/home/web_user/.local/share/vcmi/Saves/';Module.FS.mkdirTree(folder);Module.FS.writeFile(folder+'Goonk-auto.vsgm1',new Uint8Array(bytes));},[...bytes]);await loaded.cmd(23);await loaded.wait(()=>goonkMobileState.mode==='load'&&goonkMobileState.lobbyReady&&goonkMobileState.maps?.length);const save=(await loaded.state()).maps.find(m=>/Goonk-auto/i.test(m.name+' '+m.file));assert(save);await loaded.cmd(27,save.index);await loaded.wait(index=>goonkMobileState.selectedIndex===index,save.index);await loaded.cmd(22);await loaded.wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn&&!goonkMobileState.campaignPending);const reloaded=await loaded.state();assert.equal(reloaded.heroName,report.started.heroName);assert.equal(reloaded.day,report.started.day);report.nativeReload=true;await loaded.page.close();reports.push(report);fs.writeFileSync(out+'/progress.json',JSON.stringify(reports,null,2));
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,productionOnly:true,engineSha256:expected,reports,errors},null,2));
}finally{await browser.close();}
