import {chromium} from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const browser=await chromium.connectOverCDP('http://127.0.0.1:9223');
const context=browser.contexts()[0];
const page=await context.newPage();
for(const other of context.pages())if(other!==page)await other.close();
const report={cases:[]};
const data=path.resolve('../game-data/homm3eng/home/web_user/.local/share/vcmi/Data');
try{
 for(const [name,url]of [['netlify','http://127.0.0.1:8767/'],['github-pages','http://127.0.0.1:8768/heroes-goonk/']]){
  const result={name,url,errors:[],badResponses:[]};report.cases.push(result);
  const onError=error=>result.errors.push(error.message);
  const onResponse=response=>{if(response.status()>=400&&!response.url().endsWith('/favicon.ico'))result.badResponses.push([response.status(),response.url()]);};
  page.on('pageerror',onError);page.on('response',onResponse);
  await page.setViewportSize({width:390,height:844});
  await (await import('./silent-audio.mjs')).silenceTestAudio(page);await page.goto(url+'?mobile=1');
  await page.waitForURL(/game\.html\?mobile=1/,{timeout:45000});
  result.isolation=await page.evaluate(()=>({isolated:crossOriginIsolated,sharedMemory:typeof SharedArrayBuffer==='function',worker:!!navigator.serviceWorker.controller,scope:location.pathname}));
  assert(result.isolation.isolated&&result.isolation.sharedMemory);
  if(name==='github-pages')assert(result.isolation.worker);
  assert.equal(await page.locator('input[type=file]').count(),0);
  await page.waitForFunction(()=>window.goonkMobileState?.mode==='menu',null,{timeout:180000});
  result.firstCache=await page.evaluate(()=>goonkCacheStats);
  await page.getByRole('button',{name:'Nouvelle aventure',exact:true}).click();
  await page.waitForFunction(()=>goonkMobileState.maps?.length);
  const map=(await page.evaluate(()=>goonkMobileState.maps)).find(x=>x.name.includes('Château Goonk'));assert(map);
  await page.locator('#mobile-map-select').selectOption(String(map.index));
  await page.getByRole('button',{name:'Commencer',exact:true}).click();
  await page.waitForFunction(()=>goonkMobileState.mode==='map'&&goonkMobileState.heroName,null,{timeout:45000});
  result.realGame=true;
  await page.screenshot({path:'../../outputs/hosting-'+name+'.png'});
  await (await import('./silent-audio.mjs')).silenceTestAudio(page);await page.goto(url+'?mobile=1');
  await page.waitForFunction(()=>window.goonkMobileState?.mode==='menu',null,{timeout:60000});
  result.warmCache=await page.evaluate(()=>goonkCacheStats);assert.equal(result.warmCache.downloaded,0);
  assert.deepEqual(result.errors,[]);assert.deepEqual(result.badResponses,[]);
  page.off('pageerror',onError);page.off('response',onResponse);
  console.log('PASS',name,JSON.stringify(result));
 }
}catch(error){report.failure=error.stack;console.error(error.stack);await page.screenshot({path:'../../outputs/hosting-failure.png'});}
fs.writeFileSync('../../outputs/hosting-validation.json',JSON.stringify(report,null,2));
process.exit(report.failure?1:0);
