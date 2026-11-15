/** Long campaign catalogue: real mobile UI, touchscreen scrolling and stable state updates. */
import{chromium,webkit}from'playwright-core';import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{silenceTestAudio}from'./silent-audio.mjs';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-campaign183-catalogue';fs.mkdirSync(out,{recursive:true});const results=[];
for(const kind of['chromium','webkit']){
 const browser=await(kind==='webkit'?webkit.launch({executablePath:process.env.WEBKIT_PATH}):chromium.launch({executablePath:process.env.CHROME_PATH}));
 try{const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];await silenceTestAudio(page);page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/web/**',async r=>{const file=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);if(!fs.existsSync(file))return r.abort();await r.fulfill({path:file});});
 await page.route('**/campaign-catalogue-test*',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...a){calls.push(a)}};</script><script type=module src=/web/mobile.mjs></script>'}));
 await page.goto('http://127.0.0.1:8877/campaign-catalogue-test?mobile=1');await page.waitForSelector('#mobile-app');await page.evaluate(()=>{window.catalogue={mode:'campaign',lobbyReady:true,campaigns:Array.from({length:30},(_,index)=>({index,name:'Campagne '+(index+1)+' — Les terres oubliées des Goonks'}))};window.sendCatalogue=()=>dispatchEvent(new CustomEvent('goonk-state',{detail:structuredClone(catalogue)}));sendCatalogue();});
 for(const[width,height]of[[320,568],[568,320],[390,844],[844,390],[768,1024],[1024,768],[820,1180]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(250);
  const list=page.locator('.campaign-list'),exit=page.locator('.campaign-catalogue-controls [data-action="0"]');
  for(const index of[0,29]){await page.locator(`[data-campaign="${index}"]`).tap();assert.deepEqual((await page.evaluate(()=>calls.at(-1))).slice(0,2),[52,index]);}
  const box=await exit.boundingBox();assert(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1&&box.width>=48&&box.height>=48,JSON.stringify({kind,width,height,box}));
  assert.equal(await page.locator('.mobile-menu [data-action="0"]:visible').count(),1);
  const stable=await list.evaluate(async element=>{const previous=element.scrollTop;for(let i=0;i<12;i++){sendCatalogue();await new Promise(r=>requestAnimationFrame(r));}const ancestors=[];for(let p=element;p;p=p.parentElement)ancestors.push(getComputedStyle(p).touchAction);return{sameNode:element===document.querySelector('.campaign-list'),sameScroll:element.scrollTop===previous,scrollable:element.scrollHeight>element.clientHeight,scrollTop:previous,noScrollBlock:!ancestors.includes('none')};});
  assert(stable.sameNode&&stable.sameScroll&&stable.scrollable&&stable.scrollTop>0&&stable.noScrollBlock,JSON.stringify({kind,width,height,...stable}));await exit.tap();assert.equal((await page.evaluate(()=>calls.at(-1)))[0],0);results.push({kind,width,height,...stable});
 }
 assert.deepEqual(errors,[]);await page.screenshot({path:path.join(out,kind+'.png')});
 }finally{await browser.close();}
}
fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,scope:'Mobile catalogue only;30 entries, first/last buttons, one exit and stable list node/scroll across state updates on Chromium/WebKit.',results},null,2));
