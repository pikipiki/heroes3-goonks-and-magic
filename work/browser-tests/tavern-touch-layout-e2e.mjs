import{chromium,webkit}from'playwright-core';import assert from'node:assert/strict';import fs from'node:fs';
const report={},state={mode:'dialog',dialogKind:'tavern',dialogTitle:'Taverne',rect:{x:203,y:48,w:395,h:504},dialogCloseRect:{x:513,y:476,w:64,h:32}};
for(const kind of ['chromium','webkit']){
 const browser=kind==='webkit'?await webkit.launch({headless:true,executablePath:'/Users/sevenone./Library/Caches/ms-playwright/webkit-2215/pw_run.sh'}):await chromium.connectOverCDP('http://127.0.0.1:9224'),context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),p=await context.newPage();report[kind]={errors:[],sizes:[]};p.on('pageerror',e=>report[kind].errors.push(e.message));
 try{
  await p.route('**/tavern-touch-test?mobile=1',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/web/mobile.css"><link rel="stylesheet" href="/web/h3-theme.css"></head><body><canvas id="canvas" width="1600" height="1200"></canvas><script>window.calls=[];window.Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...a){calls.push(a)},_vcmiMobilePointer(...a){calls.push(['pointer',...a])}};window.goonkAssetsReady=Promise.resolve();window.goonkAssetURLs=[];</script><script type="module" src="/web/mobile.mjs"></script></body></html>`}));
  await p.goto('http://127.0.0.1:8767/tavern-touch-test?mobile=1');await p.waitForSelector('#mobile-app');
  await p.evaluate(s=>{window.fixture=s;window.dispatchEvent(new CustomEvent('goonk-state',{detail:s}));},state);
  for(const [width,height]of [[390,844],[844,390],[320,568],[568,320]]){
   await p.setViewportSize({width,height});await p.waitForTimeout(150);const hit=await p.locator('.native-dialog-close-hit').boundingBox();assert(hit.width>=44&&hit.height>=44);assert(hit.x>=0&&hit.y>=0&&hit.x+hit.width<=width&&hit.y+hit.height<=height);
   const before=await p.evaluate(()=>calls.length);await p.touchscreen.tap(hit.x+hit.width/2,hit.y+2);await p.waitForTimeout(50);assert.deepEqual(await p.evaluate(n=>calls.slice(n),before),[[40,0,0,0,0,0]]);report[kind].sizes.push({width,height,hit});
  }
  const header=p.getByRole('button',{name:'Fermer la taverne',exact:true}),box=await header.boundingBox(),before=await p.evaluate(()=>calls.length);await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.evaluate(()=>window.dispatchEvent(new CustomEvent('goonk-state',{detail:{...fixture,resources:[20,10,20,10,10,10,20000]}})));await p.waitForTimeout(350);await p.mouse.up();assert.deepEqual(await p.evaluate(n=>calls.slice(n),before),[[40,0,0,0,0,0]]);
  await p.evaluate(()=>window.dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'dialog',rect:fixture.rect}})));assert(await header.isHidden());assert(await p.locator('.native-dialog-close-hit').isHidden());assert.deepEqual(report[kind].errors,[]);
 }finally{await context.close();await browser.close();}
}
fs.writeFileSync(new URL('../../outputs/tavern-touch-layout-e2e.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
