import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {silenceTestAudio} from './silent-audio.mjs';

const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8808';
const output=process.env.REVIEW_OUTPUT||'/private/tmp/goonk-henchmen-campaign';
const engine=process.env.GOONK_ENGINE_DIR||'work/downloads/henchmen-campaign-source241-engine';
fs.mkdirSync(output,{recursive:true});
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const report={completeRules:false,engineSha256:sha(path.join(engine,'vcmiclient.wasm')),scenarios:[],errors:[]};
const browser=await chromium.launch({headless:true});let page;
const state=()=>page.evaluate(()=>goonkMobileState);
const command=(...values)=>page.evaluate(values=>Module._vcmiMobileCommand(...values,...Array(6-values.length).fill(0)),values);
const wait=(fn,arg,timeout=90000)=>page.waitForFunction(fn,arg,{timeout});
async function hero(){
 await command(4,0);await command(55);
 await wait(()=>goonkMobileState.mode==='hero'&&goonkMobileState.heroWindow);
 return (await state()).heroWindow;
}
try{
 const transfer=process.env.TRANSFER!=='0',freeBanner=process.env.FREE_BANNER!=='0',alive=process.env.ALIVE!=='0';
 const nextTransfer=process.env.NEXT_TRANSFER===undefined?transfer:process.env.NEXT_TRANSFER!=='0';
 const nextFreeBanner=process.env.NEXT_FREE_BANNER===undefined?freeBanner:process.env.NEXT_FREE_BANNER!=='0';
 const archive=execFileSync('python3',['work/browser-tests/henchmen-campaign-fixture.py',JSON.stringify({alive})]);
 report.parameters={transfer,freeBanner,nextTransfer,nextFreeBanner,alive,returnedBanner:process.env.RETURN_BANNER==='1'};
 report.harnessSha256=sha(new URL(import.meta.url));
 report.fixtureSourceSha256=sha('work/browser-tests/henchmen-campaign-fixture.py');
 report.archiveSha256=createHash('sha256').update(archive).digest('hex');
 page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(page);
 page.on('pageerror',error=>report.errors.push(error.message));
 page.on('console',message=>fs.appendFileSync(path.join(output,'console.log'),message.text()+'\n'));
 await page.addInitScript(({archive,transfer,freeBanner})=>{
  sessionStorage.setItem('heroes-goonk.storage-failed','true');let module;
  Object.defineProperty(window,'Module',{configurable:true,get:()=>module,set:value=>{
   module=value;let callMain;
   Object.defineProperty(value,'callMain',{configurable:true,set:fn=>callMain=fn,get:()=>function(...args){
    const root='/home/web_user/.local/share/vcmi/';
    value.FS.writeFile(root+'Maps/000-Henchmen-Crossover.vcmp',new Uint8Array(archive));
    const file=root+'Mods/tum-era/mod.json',manifest=JSON.parse(value.FS.readFile(file,{encoding:'utf8'}));
    manifest.settings??={};manifest.settings.modules??={};
    manifest.settings.modules.henchmen=true;value.FS.writeFile(file,JSON.stringify(manifest));
    value.FS.writeFile(root+'Mods/tum-era/content/config/henchmen-settings.json',JSON.stringify({henchmen:{settings:{campaignTransfer:transfer,bannerFree:freeBanner,battleExpStatic:0,battleExpRandom:0,battleHeroExpCoef:0,battleExpPerHeroLv:0,battleExpMin:0,battleExpMax:0}}}));
    return callMain.apply(value,args);
   }});
  }});
 },{archive:[...archive],transfer,freeBanner});
 await page.goto(origin+'/game.html?mobile=1');
 await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);
 await command(47);await wait(()=>goonkMobileState.mode==='campaign'&&goonkMobileState.lobbyReady&&goonkMobileState.campaigns?.length);
 const campaign=(await state()).campaigns.find(row=>row.name==='000 - Henchmen private crossover');assert(campaign);
 await command(52,campaign.index);await wait(()=>goonkMobileState.campaignScenario?.scenarios?.length===2);
 await command(65,0);await wait(()=>goonkMobileState.campaignScenario?.selected===0&&goonkMobileState.campaignScenario.canStart);
 await command(67);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 fs.writeFileSync(path.join(output,'first-map.json'),JSON.stringify(await state(),null,2));
 let before=await hero();
 if(!transfer){
  assert(!before.henchman.unit);await page.locator('[data-hero-tab=henchman]').tap();
  await page.locator('[data-henchman-action="0"][data-henchman-slot="0"]').tap();
  await wait(()=>goonkMobileState.heroWindow?.henchman?.unit);before=(await state()).heroWindow;
 }
 if(process.env.RETURN_BANNER==='1'){
  await page.locator('[data-hero-tab=henchman]').tap();await page.locator('[data-henchman-action="5"]').tap();
  await wait(()=>goonkMobileState.heroWindow?.henchman?.bannerStyle===-1);before=(await state()).heroWindow;
 }
 // The current map already froze its rules. Only the next scenario may use
 // this changed installation configuration, matching ERA's map-start load.
 await page.evaluate(({nextTransfer,nextFreeBanner})=>{
  Module.FS.writeFile('/home/web_user/.local/share/vcmi/Mods/tum-era/content/config/henchmen-settings.json',JSON.stringify({henchmen:{settings:{campaignTransfer:nextTransfer,bannerFree:nextFreeBanner,battleExpStatic:0,battleExpRandom:0,battleHeroExpCoef:0,battleExpPerHeroLv:0,battleExpMin:0,battleExpMax:0}}}));
 },{nextTransfer,nextFreeBanner});
 await command(63);await wait(()=>goonkMobileState.mode==='map');
 await page.mouse.move(400,300);await page.waitForTimeout(200);
 await command(6);await page.waitForTimeout(200);
 const point=await page.evaluate(()=>{const view=goonkMobileState.mapOverview.view;return{x:view.x+view.w/2+32,y:view.y+view.h/2};});
 await page.evaluate(p=>Module._vcmiMobilePointer(p.x,p.y,1),point);await wait(()=>goonkMobileState.hasPath);await command(2);
 let battleObserved=false,autoAdvanced=false;
 for(let tick=0;tick<300;++tick){
  const s=await state();fs.writeFileSync(path.join(output,'progress.json'),JSON.stringify(s,null,2));
  if(s.mode==='map'&&s.turn&&s.towns?.length===2){autoAdvanced=true;break;}
  if(s.campaignScenario?.scenarios?.find(row=>row.id===1&&row.available))break;
  if(s.mode==='battle'){
   battleObserved=true;
   await command(15);
   if(s.canAutoCombat&&!s.autoCombat)await command(44,1);
  }else if(s.mode!=='map'||s.dialogPresentation){
   if(s.dialogKind==='commander-level-up'){
    const choice=s.dialogPresentation?.choices?.find(choice=>choice.selectable&&Number.isInteger(choice.skillId));
    if(choice)await command(96,choice.skillId);
   }
   await command(1);
  }
  await page.waitForTimeout(150);
 }
 assert(battleObserved,'The scenario objective must be completed through its native battle');
 if(!autoAdvanced){
  await wait(()=>goonkMobileState.campaignScenario?.scenarios?.find(row=>row.id===1&&row.available));
  await command(65,1);await wait(()=>goonkMobileState.campaignScenario?.selected===1&&goonkMobileState.campaignScenario.canStart);
  await command(67);
 }
 await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn&&goonkMobileState.towns?.length===2);
 const after=await hero();
 if(nextTransfer){
  assert.equal(after.henchman.unit?.key,before.henchman.unit?.key);
  assert.equal(after.henchman.experience,before.henchman.experience);
  assert.equal(after.henchman.alive,before.henchman.alive);assert.equal(after.henchman.stackExperience,0);
  const carriedStyle=transfer&&freeBanner&&before.henchman.bannerStyle>0?before.henchman.bannerStyle:0;
  assert.equal(after.henchman.bannerStyle,nextFreeBanner?carriedStyle:-1);
 }else{
  assert(!after.henchman.unit);
  await page.locator('[data-hero-tab=henchman]').tap();
  await page.locator('[data-henchman-action="0"][data-henchman-slot="0"]').tap();
  await wait(()=>goonkMobileState.heroWindow?.henchman?.unit);
  const selected=(await state()).heroWindow.henchman;
  assert.equal(selected.bannerStyle,nextFreeBanner?0:-1,'A fresh scenario must initialize its free banner even when transfer is disabled');
  report.reselectedCompanion={key:selected.unit.key,bannerStyle:selected.bannerStyle};
 }
 report.scenarios.push(`native-two-scenario-crossover-transfer-${transfer}-to-${nextTransfer}-free-banner-${freeBanner}-to-${nextFreeBanner}-alive-${alive}-returned-banner-${report.parameters.returnedBanner}`);
 assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({passed:true,...report,before,after},null,2));
}catch(error){
 if(page){await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(output,'failure-state.json'),JSON.stringify(await state().catch(()=>null),null,2));}
 console.error(error);process.exitCode=1;
}finally{await browser.close();}
