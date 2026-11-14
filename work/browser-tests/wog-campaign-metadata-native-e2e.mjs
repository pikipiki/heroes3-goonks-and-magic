/** Metadata-only original-campaign control. A private day-two victory checks scenario transitions;
 * it does not validate the original quests or victory conditions. */
import {execFileSync} from 'node:child_process';import {readOriginalCampaign} from '../../scripts/era-bridge/campaigns/importer.mjs';
import {chromium} from 'playwright-core';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {silenceTestAudio} from './silent-audio.mjs';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-campaign174-metadata';fs.mkdirSync(out,{recursive:true});
const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8877',original='mod/wake-of-gods/Mods/maps/content/maps/zc1.vcmp';
const headers=Object.fromEntries(readOriginalCampaign(original).maps.map(m=>{m.header.events=[];m.header.triggeredEvents={controlledVictory:{condition:['allOf',['isHuman',{value:1}],['daysPassed',{value:1}]],effect:{type:'victory'}}};return[m.member,m.header];}));
const bytes=execFileSync('python3',['-c',`import sys,json,zipfile,io
p=json.load(sys.stdin); source=zipfile.ZipFile(p['source']);out=io.BytesIO()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as target:
 for name in source.namelist():
  data=source.read(name)
  if name in p['headers']:
   old=zipfile.ZipFile(io.BytesIO(data));new=io.BytesIO()
   with zipfile.ZipFile(new,'w',zipfile.ZIP_DEFLATED) as dest:
    for member in old.namelist():dest.writestr(member,json.dumps(p['headers'][name]).encode() if member=='header.json' else old.read(member))
   data=new.getvalue()
  target.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`],{input:JSON.stringify({source:original,headers})});
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(page);page.setDefaultTimeout(90000);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>fs.appendFileSync(path.join(out,'console.log'),m.text()+'\n'));
const wait=(f,arg)=>page.waitForFunction(f,arg,{timeout:90000}),cmd=(...args)=>page.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]),state=()=>page.evaluate(()=>goonkMobileState);
await page.addInitScript(bytes=>{
 sessionStorage.setItem('heroes-goonk.storage-failed','true');let current;Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{current=m;const old=Object.getOwnPropertyDescriptor(m,'callMain');let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;old?.set?.call(m,f);},get:()=>function(...args){const invoke=old?.get?old.get.call(m):main;m.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/000-Reference-ZC1.vcmp',new Uint8Array(bytes));return invoke.apply(m,args);}});}});
},[...bytes]);
try{
 await page.goto(origin+'/game.html?mobile=1&new-campaign=1');await wait(()=>window.goonkMobileState?.mode==='campaign'&&goonkMobileState.lobbyReady&&goonkMobileState.campaigns?.length);
 const id=await page.evaluate(()=>goonkMobileState.campaigns.find(c=>/in the wake of gods/i.test(c.name))?.index);assert.notEqual(id,undefined);await page.locator(`[data-campaign="${id}"]`).tap();
 await wait(()=>['campaign-scenario','campaign-intro'].includes(goonkMobileState.mode));if((await state()).mode==='campaign-intro')await cmd(68);await wait(()=>goonkMobileState.mode==='campaign-scenario');
 const transitions=[];
 for(const selected of [1,2,0]){
  const s=await state();transitions.push(s.campaignScenario);assert.equal(s.campaignScenario.selected,selected);assert.equal(s.campaignScenario.scenarios.find(x=>x.id===selected).available,true);assert.deepEqual(s.campaignScenario.scenarios.filter(x=>x.available&&!x.completed).map(x=>x.id),[selected]);
  const bonus=page.locator('[data-campaign-bonus]').first();if(await bonus.count())await bonus.tap();await wait(()=>goonkMobileState.campaignScenario?.canStart);await cmd(67);
  await wait(()=>['map','campaign-intro','dialog'].includes(goonkMobileState.mode));if((await state()).mode==='campaign-intro')await cmd(68);
  for(let i=0;i<20;i++){await page.waitForTimeout(200);const s=await state();if(s.mode==='map'&&s.turn)break;if(s.mode==='dialog')await cmd(1);}
  await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);assert.equal((await state()).cheatsAllowed,true);
  await cmd(3);
  await page.waitForTimeout(1200);fs.writeFileSync(path.join(out,'after-win-'+selected+'.json'),JSON.stringify(await state(),null,2));
  for(let i=0;i<20;i++){const s=await state();if(['campaign-scenario','campaign-intro','campaign'].includes(s.mode))break;if(s.mode==='dialog')await cmd(1);await page.waitForTimeout(400);}
  if(selected!==0){await wait(()=>['campaign-scenario','campaign-intro'].includes(goonkMobileState.mode));if((await state()).mode==='campaign-intro')await cmd(68);await wait(()=>goonkMobileState.mode==='campaign-scenario');}
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,scope:'Original metadata and controlled day-two victories only; no original quest or victory condition validation',transitions,after:await state(),errors},null,2));
}catch(e){fs.writeFileSync(path.join(out,'failure-state.json'),JSON.stringify(await state().catch(()=>null),null,2));await page.screenshot({path:path.join(out,'failure.png')});throw e;}finally{await browser.close();}
