/** Private unchanged original journeys, with optional native first main victory.
 * Complete optional quests and later campaign scenarios are not established. */
import {chromium,webkit} from 'playwright-core';import crypto from 'node:crypto';
import {readOriginalCampaign} from '../../scripts/era-bridge/campaigns/importer.mjs';
import {readCompletedNativeSave} from './native-save-completed.mjs';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {silenceTestAudio} from './silent-audio.mjs';
const id='zc1',selected=1,out=process.env.REVIEW_OUTPUT||'/tmp/goonk-campaign189-first-quests';fs.mkdirSync(out,{recursive:true});
const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8877',original=`mod/wake-of-gods/Mods/maps/content/maps/${id}.vcmp`,campaign=readOriginalCampaign(original),bytes=fs.readFileSync(original),entryId=id+'-'+selected;
const browser=await (process.env.CAMPAIGN_BROWSER==='webkit'?webkit:chromium).launch({headless:true}),page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(page);page.setDefaultTimeout(90000);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>fs.appendFileSync(path.join(out,'console.log'),m.text()+'\n'));
const wait=(f,arg)=>page.waitForFunction(f,arg,{timeout:90000}),cmd=(...args)=>page.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]),state=()=>page.evaluate(()=>goonkMobileState);
await page.addInitScript(({bytes,entryId})=>{
 sessionStorage.setItem('heroes-goonk.storage-failed','true');let current;Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{current=m;const old=Object.getOwnPropertyDescriptor(m,'callMain');let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;old?.set?.call(m,f);},get:()=>function(...args){const invoke=old?.get?old.get.call(m):main,root='/home/web_user/.local/share/vcmi/',folder=root+'Mods/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns/';m.FS.writeFile(root+'Maps/000-Original-Campaign.vcmp',new Uint8Array(bytes));const registry=JSON.parse(m.FS.readFile(folder+'registry.json',{encoding:'utf8'}));const entry=registry.programs.find(p=>p.id===entryId);if(!entry||entry.enabled)throw Error('Missing dormant entry '+entryId);entry.enabled=true;m.FS.writeFile(folder+'registry.json',JSON.stringify(registry));return invoke.apply(m,args);}});}});
},{bytes:[...bytes],entryId});

const dialogs=[],seen=new Set();let victory=null;
async function answer(s){const model=s.dialogPresentation;if(!model)return;const token=s.windowToken+':'+model.queryId+':'+JSON.stringify(model);if(seen.has(token))return;seen.add(token);dialogs.push(model);fs.writeFileSync(out+'/dialogs.json',JSON.stringify(dialogs,null,2));if(model.scriptDialog){const images=page.locator('.campaign-media-thumbnail img');await images.evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));if(model.scriptDialog.inputLabel)await page.locator('[data-campaign-input]').fill('Native hero');if(model.scriptDialog.choices?.length){const ratibor=model.scriptDialog.text?.includes('Ratibor looks very irritable');await (ratibor?page.locator('[data-campaign-choice="2"]'):page.locator('[data-campaign-choice]').first()).check();}await page.locator('[data-dialog-confirm]').tap();}else await cmd(1);await page.waitForTimeout(200);}
async function ready(){for(let i=0;i<900;i++){const s=await state();fs.writeFileSync(out+'/progress.json',JSON.stringify(s,null,2));if(s.mode==='battle')throw Error('Unexpected original battle: '+JSON.stringify(s.battleUnits?.map(u=>({key:u.key,count:u.count,enemy:u.enemy}))));if(s.mode==='map'&&s.turn&&!s.campaignPending&&!s.heroMoving){if(s.movement===0){const day=s.day;await cmd(3);await page.waitForTimeout(400);await wait(day=>goonkMobileState.day>day||goonkMobileState.mode==='dialog',day);await page.waitForTimeout(500);if((await state()).mode==='map'&&(await state()).hasPath)await cmd(2);continue;}if(!s.hasPath)return s;await cmd(2);await page.waitForTimeout(400);continue;}if(s.mode==='dialog')await answer(s);await page.waitForTimeout(100);}throw Error('Original map not ready');}
async function centerTile(x,y){
 fs.writeFileSync(out+'/target.json',JSON.stringify({x,y}));
 for(let attempt=0;attempt<30;attempt++){
  const mini=(await state()).mapOverview;await page.evaluate(({x,y})=>Module._vcmiMobilePointer(x,y,5),{x:Math.round(mini.rect.x+x*mini.rect.w/mini.width),y:Math.round(mini.rect.y+y*mini.rect.h/mini.height)});await page.waitForTimeout(150);
  const map=(await state()).mapOverview;if(map.viewport.x===Math.floor(x+0.5-Math.floor(map.view.w/2)/32)&&map.viewport.y===Math.floor(y+0.5-Math.floor(map.view.h/2)/32))return map.view;
 }
 throw Error('Native camera did not settle on '+x+'/'+y);
}
async function encounter(x,y){await ready();const prior=dialogs.length,view=await centerTile(x,y);await page.evaluate(({x,y})=>Module._vcmiMobilePointer(x,y,1),{x:Math.round(view.x+view.w/2),y:Math.round(view.y+view.h/2)});await wait(()=>goonkMobileState.hasPath||goonkMobileState.mode==='dialog');if((await state()).mode==='map')await cmd(2);for(let i=0;i<900;i++){const s=await state();fs.writeFileSync(out+'/progress.json',JSON.stringify(s,null,2));if(s.mode==='dialog')await answer(s);else if(s.mode==='map'&&s.turn&&!s.heroMoving&&!s.campaignPending){if(s.movement===0){await ready();if((await state()).hasPath)await cmd(2);}else if(!s.hasPath&&dialogs.length>prior)return s;else if(s.hasPath){await cmd(2);await page.waitForTimeout(400);}}await page.waitForTimeout(100);}throw Error('Original encounter did not complete '+x+'/'+y);}
async function travel(x,y){await ready();const view=await centerTile(x,y);await page.evaluate(({x,y})=>Module._vcmiMobilePointer(x,y,1),{x:Math.round(view.x+view.w/2),y:Math.round(view.y+view.h/2)});try{await page.waitForFunction(()=>goonkMobileState.hasPath||goonkMobileState.mode==='dialog',null,{timeout:8000});}catch(error){await cmd(55);await wait(()=>goonkMobileState.mode==='hero');fs.writeFileSync(out+'/unreachable-target.json',JSON.stringify({target:[x,y],hero:await state()},null,2));throw error;}await cmd(2);await page.waitForTimeout(400);return ready();}
async function saveCheckpoint(){const bytes=await readCompletedNativeSave(page,cmd);assert.equal(bytes.readInt32LE(4),905);fs.writeFileSync(out+'/original-encounters.vsgm1',bytes);return crypto.createHash('sha256').update(bytes).digest('hex');}

try{
 const engine=await(await page.request.get(origin+'/engine-build.json')).json();assert.equal(engine.sha256,process.env.EXPECTED_ENGINE_SHA);const checkpoint=fs.readFileSync(process.env.CAMPAIGN_LOAD_SAVE);assert.equal(crypto.createHash('sha256').update(checkpoint).digest('hex'),process.env.CAMPAIGN_EXPECTED_SAVE_SHA||'5c454366c00ab800a75273f6294e9068001157ea320e89a68968765dfa400d45');await page.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done');await page.evaluate(bytes=>{Module.FS.mkdirTree('/home/web_user/.local/share/vcmi/Saves');Module.FS.writeFile('/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1',new Uint8Array(bytes));},[...fs.readFileSync(process.env.CAMPAIGN_LOAD_SAVE)]);await cmd(23);await wait(()=>goonkMobileState.mode==='load'&&goonkMobileState.lobbyReady&&goonkMobileState.maps?.length);const entry=(await state()).maps.find(e=>/Goonk-auto/i.test(e.name+' '+e.file));assert(entry);await cmd(27,entry.index);await wait(index=>goonkMobileState.selectedIndex===index,entry.index);await cmd(22);await ready();const stages=[],journey=process.env.CAMPAIGN_JOURNEY_STAGE||'intro';assert(['intro','kirr','melnik','ratibor','escape','escaped','passage'].includes(journey),'Unknown original journey stage');
 if(journey==='escape'||journey==='escaped'||journey==='passage'){
  if(journey==='escape'){
  for(const[x,y]of[[5,13],[8,14],[10,17],[13,20],[15,22],[18,25]])stages.push({target:[x,y],after:await travel(x,y)});
  const day=(await state()).day;await cmd(3);await wait(day=>goonkMobileState.day>day,day);await ready();

  await cmd(55);await wait(()=>goonkMobileState.mode==='hero'&&goonkMobileState.troopDeployment?.troops?.length);
  const before=await state(),data=before.troopDeployment,peasant=data.troops.find(t=>t.key==='core:peasant');assert(peasant&&peasant.maximum===1);assert(data.targets.find(t=>t.direction===3).available);
  await page.locator('[data-hero-tab="army"]').tap();await page.locator('[data-hero-leave-troops]').tap();
  const panel=page.locator('.troop-deployment-page');await panel.waitFor({state:'visible'});await page.locator('[data-deploy-troop]').selectOption(String(peasant.slot));
  const layouts=[];for(const[width,height]of[[320,568],[568,320],[390,844],[844,390],[768,1024],[1024,768],[1366,1024]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(200);const geometry=await panel.evaluate(p=>{const r=p.getBoundingClientRect(),scroll=p.querySelector('.progression-scroll'),buttons=[...p.querySelectorAll('footer button')].map(b=>{const r=b.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}});window.deploymentInput=p.querySelector('[data-deploy-count]');window.deploymentScroll=scroll;return{x:r.x,y:r.y,w:r.width,h:r.height,buttons,ancestorTouchNone:(()=>{for(let n=scroll;n;n=n.parentElement)if(getComputedStyle(n).touchAction==='none')return true;return false})()};});assert(geometry.buttons.every(r=>r.h>=44&&r.x>=0&&r.y>=0&&r.x+r.w<=width+1&&r.y+r.h<=height+1));assert(!geometry.ancestorTouchNone);await page.waitForTimeout(400);assert(await panel.evaluate(p=>deploymentInput===p.querySelector('[data-deploy-count]')&&deploymentScroll===p.querySelector('.progression-scroll')),'Polling retains the same controls');layouts.push({width,height,geometry});await page.screenshot({path:out+'/deployment-'+width+'x'+height+'.png'});
  }fs.writeFileSync(out+'/deployment-layouts.json',JSON.stringify(layouts,null,2));await page.setViewportSize({width:844,height:390});
  await page.locator('[data-deploy-direction="3"]').tap();await page.locator('[data-deploy-count]').fill('0');assert(await page.locator('[data-deploy-confirm]').isDisabled());await page.locator('[data-deploy-count]').fill('1');await page.keyboard.press('Enter');assert.equal((await state()).mode,'hero');assert(await panel.isVisible());await page.keyboard.press('Escape');assert(await panel.isHidden());assert.equal((await state()).mode,'hero');await page.locator('[data-hero-leave-troops]').tap();await page.locator('[data-deploy-troop]').selectOption(String(peasant.slot));await page.locator('[data-deploy-direction="3"]').tap();await page.locator('[data-deploy-confirm]').tap();await panel.waitFor({state:'hidden'});await wait(revision=>goonkMobileState.troopDeployment.revision===revision+1,data.revision);
  const after=await state();assert(!after.troopDeployment.troops.some(t=>t.key==='core:peasant'));assert(after.troopDeployment.troops.some(t=>t.key==='core:pikeman'&&t.count===1));fs.writeFileSync(out+'/deployment.json',JSON.stringify({before,after},null,2));await cmd(63);await ready();await saveCheckpoint();
  for(const[x,y]of[[17,24],[15,25],[14,28],[16,30],[17,31]])stages.push({target:[x,y],after:await travel(x,y)});
  for(let i=0;i<2;i++){const day=(await state()).day;await cmd(3);await wait(day=>goonkMobileState.day>day||goonkMobileState.mode==='dialog',day);await ready();}
  assert(dialogs.some(d=>JSON.stringify(d).includes('Now you really made us angry')),'Original bait and hiding conditions run the pursuit');await saveCheckpoint();
  }
  if(journey!=='passage')for(const[x,y]of[[16,30],[14,28],[13,27],[15,25],[18,25],[20,26],[23,26],[27,27],[30,26],[31,23]])stages.push({target:[x,y],after:await travel(x,y)});
  assert(journey==='passage'||dialogs.some(d=>JSON.stringify(d).includes('Finaly, free!!!')),'Original escape corridor opens');
  if(process.env.CAMPAIGN_MAIN_OBJECTIVE==='1'){
   await saveCheckpoint();
   for(const[x,y]of[[31,22],[30,21],[30,20],[29,17],[30,14],[27,12],[26,9],[23,6]])stages.push({target:[x,y],after:await travel(x,y)});
   stages.push({target:[21,6],after:await encounter(21,6)});
   await travel(23,3);stages.push({target:[24,2],after:await encounter(24,2)});await saveCheckpoint();
   for(const[x,y]of[[23,6],[26,9],[27,12],[30,14],[32,17]])stages.push({target:[x,y],after:await travel(x,y)});
   stages.push({target:[33,19],after:await encounter(33,19)});await saveCheckpoint();
   for(const[x,y]of[[32,17],[30,14],[27,12],[26,9],[23,6]])stages.push({target:[x,y],after:await travel(x,y)});
   stages.push({target:[21,6],after:await encounter(21,6)});await saveCheckpoint();
   for(const[x,y]of[[20,8],[17,7],[14,6],[11,4],[8,4],[5,3]])stages.push({target:[x,y],after:await travel(x,y)});
   const view=await centerTile(3,2);await page.evaluate(({x,y})=>Module._vcmiMobilePointer(x,y,1),{x:Math.round(view.x+view.w/2),y:Math.round(view.y+view.h/2)});await cmd(2);
   const deadline=Date.now()+120000;while(Date.now()<deadline){const s=await state();fs.writeFileSync(out+'/victory-progress.json',JSON.stringify(s,null,2));if(s.campaignScenario?.scenarios?.some(s=>s.id===1&&s.completed)){victory=s;break;}if(s.mode==='dialog')await answer(s);else if(s.mode==='campaign-intro'){await page.locator('[data-campaign-continue]').tap();await page.waitForTimeout(300);}else if(s.mode==='map'&&!s.heroMoving&&s.hasPath)await cmd(2);await page.waitForTimeout(150);}
   assert(victory,'Removing the original objective monster must validate the real campaign victory');assert(dialogs.some(d=>JSON.stringify(d).includes('You complete the main mission')));
  }

 }else if(journey==='kirr'){
  for(const [x,y]of[[23,26],[20,24],[18,23],[18,21],[15,20]]){const after=await travel(x,y);stages.push({target:[x,y],after});}
  stages.push({target:[14,17],after:await encounter(14,17)});assert(dialogs.some(d=>JSON.stringify(d).includes('You search every corner')));
 }else if(journey==='melnik'){
  for(const[x,y]of[[18,21],[19,19]])stages.push({target:[x,y],after:await travel(x,y)});
  stages.push({target:[23,20],after:await encounter(23,20)});await saveCheckpoint();
  for(const[x,y]of[[23,23],[23,26]])stages.push({target:[x,y],after:await travel(x,y)});
  stages.push({target:[22,29],after:await encounter(22,29)});assert(dialogs.some(d=>JSON.stringify(d).includes('Ratibor')));
 }else if(journey==='ratibor'){
  for(const[x,y]of[[21,26],[18,25],[15,22],[13,20],[10,17],[8,14],[5,13],[2,16]])stages.push({target:[x,y],after:await travel(x,y)});
  stages.push({target:[1,16],after:await encounter(1,16)});await saveCheckpoint();
  stages.push({target:[1,16],after:await encounter(1,16)});
  assert(dialogs.some(d=>JSON.stringify(d).includes('Great! I need new forces!')));assert(JSON.stringify((await state()).armies).includes('core:pikeman'),'Original follower joins the actual army');
 }else{
for(const [x,y]of[[17,27],[15,27],[20,26]]){const after=await encounter(x,y);stages.push({target:[x,y],after});await page.screenshot({path:out+'/encounter-'+x+'-'+y+'.png'});}if(process.env.CAMPAIGN_FIRST_OBJECTIVE==='1'){await travel(23,26);const after=await encounter(26,27);stages.push({target:[26,27],after});assert(dialogs.some(d=>JSON.stringify(d).includes('You, scoundrel, get back to work!')));} }
 const saveSha256=victory?null:await saveCheckpoint();if(journey==='intro')for(const [index,expected] of ['This was your home not long ago.','Your friend, Dan, has decided to accompany you','Your horse stumbles over a stone.'].entries())assert(dialogs[index].lines.join(' ').includes(expected));assert.deepEqual(errors,[]);fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,engineSha256:engine.sha256,originalArchiveSha256:campaign.sha256,saveSha256,journey,firstObjective:process.env.CAMPAIGN_FIRST_OBJECTIVE==='1',scope:victory?'Private original first-scenario main victory; optional branches and other scenarios remain unvalidated':'Private unchanged original script encounter exploration, not a campaign victory',victory,stages,dialogs,errors},null,2));
}catch(e){fs.writeFileSync(out+'/failure-state.json',JSON.stringify(await state().catch(()=>null),null,2));await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e;}finally{await browser.close();}
