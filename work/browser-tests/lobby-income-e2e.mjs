import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {silenceTestAudio} from './silent-audio.mjs';
const output=process.env.REVIEW_OUTPUT||'/private/tmp/goonk-lobby-income';fs.mkdirSync(output,{recursive:true});
const results=[];
for(const [kind,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{for(const language of ['fr','en'])for(const viewport of [{width:320,height:568},{width:390,height:844},{width:568,height:280},{width:844,height:390},{width:1440,height:900}]){
  const mouse=viewport.width===1440,page=await browser.newPage({viewport,hasTouch:!mouse}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));await silenceTestAudio(page);
  await page.addInitScript(language=>localStorage.setItem('heroes-goonk.language',language),language);
  await page.route('**/web/**',route=>{const file=path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?route.fulfill({path:file}):route.abort();});
  await page.route('**/income-review*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/web/mobile.css"><link rel="stylesheet" href="/web/h3-theme.css"><link rel="stylesheet" href="/web/mobile-upgrade.css"><canvas id="canvas" width="800" height="600"></canvas><script>window.calls=[];window.Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...args){calls.push(args)}};</script><script type="module" src="/web/mobile.mjs"></script>'}));
  await page.goto('http://127.0.0.1:8783/income-review?mobile=1');await page.waitForSelector('#mobile-app');
  await page.evaluate(()=>{
   const factions=[{id:0,key:'core:castle',name:'Castle'},{id:9,key:'goonk:goonk',name:'Goonk'}];
   window.incomeState={mode:'lobby',lobbyReady:true,lobbyHumanCount:1,selectedMap:'Income review',difficulty:1,selectedFaction:9,allowRandomFaction:false,factions,maps:[{index:0,name:'Income review',width:36,height:36,players:2,castleChoice:true}],players:[{color:0,name:'Alexandre le Conquérant',faction:9,factions,incomePercent:100},{color:1,name:'Ordinateur',faction:0,factions,incomePercent:85}]};
   window.sendIncome=()=>dispatchEvent(new CustomEvent('goonk-state',{detail:structuredClone(incomeState)}));sendIncome();
  });
  const selector='[data-setting=income-0] [data-tile-value="70"]',control=page.locator(selector);
  await control.waitFor();await control.scrollIntoViewIfNeeded();const box=await control.boundingBox();assert(box.width>=48&&box.height>=48);assert(box.x>=0&&box.x+box.width<=viewport.width+1);
  const name=await page.locator('[data-setting=income-0] h3').textContent();assert(name.includes(language==='fr'?'Revenus de':'Income for'));
  const before=await page.evaluate(()=>calls.filter(c=>c[0]===1210).length);
  await control[mouse?'click':'tap']();
  assert.deepEqual(await page.evaluate(()=>calls.filter(c=>c[0]===1210).at(-1).slice(0,3)),[1210,0,70]);
  assert.equal(await page.evaluate(()=>calls.filter(c=>c[0]===1210).length),before+1);
  await page.evaluate(()=>{incomeState.players[0].incomePercent=70;sendIncome();});await page.waitForFunction(()=>document.querySelector('[data-player-income="0"]').value==='70');
  await page.locator(selector).scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,`${kind}-${language}-${viewport.width}x${viewport.height}.png`)});
  await page.evaluate(()=>{incomeState.lobbyReady=false;sendIncome();});
  await page.waitForFunction(()=>document.querySelector('[data-player-income="0"]').disabled);
  assert(await page.locator(selector).isDisabled());
  await page.evaluate(()=>{incomeState.lobbyReady=true;incomeState.players[0].incomePercent=50;sendIncome();});
  await page.waitForFunction(()=>document.querySelector('[data-setting=income-0] [data-tile-value="50"]')?.getAttribute('aria-pressed')==='true');
  await page.evaluate(()=>{incomeState.players=[];sendIncome();});
  await page.waitForFunction(()=>document.querySelector('.lobby-players')?.hidden&&!document.querySelector('[data-setting=income-0]'));
  assert.deepEqual(errors,[]);results.push({kind,language,viewport,input:mouse?'mouse':'touch',minimumTarget:48,oneCommandPerGesture:true,command:[1210,0,70]});await page.close();
 }}finally{await browser.close();}
}
fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({passed:true,errors:[],results},null,2));console.log('PASS lobby income',results.length,'browser/language/viewport cases');
