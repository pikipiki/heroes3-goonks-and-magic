import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-campaign-dialog-layout';fs.mkdirSync(out,{recursive:true});
const sizes=[[320,568],[390,844],[568,320],[844,390],[768,1024],[1024,768],[1180,820]];
for(const [name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});await silenceTestAudio(page);
 await page.route('**/web/**',route=>route.fulfill({path:path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1])}));
 await page.route('**/campaign-review',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html class="goonk-mobile"><meta name=viewport content="width=device-width,initial-scale=1"><meta charset=utf-8>${['mobile','h3-theme','mobile-review','mobile-refinement','mobile-followup','mobile-compact'].map(n=>'<link rel=stylesheet href=/web/'+n+'.css>').join('')}<style>#mobile-viewport{position:fixed;inset:0;container:goonk-viewport / size}#mobile-app{position:absolute;inset:0;--control-rail:180px}</style><div id=mobile-viewport><div id=mobile-app></div></div><script type=module>import{createDialogPresentation}from'/web/dialog-presentation.mjs';window.calls=[];window.dialog=createDialogPresentation({root:document.querySelector('#mobile-app'),command:(...a)=>calls.push(a),pointer:()=>{}});</script>`}));
 await page.goto('http://localhost/campaign-review');await page.waitForFunction(()=>window.dialog);
 for(const [width,height]of sizes){
  await page.setViewportSize({width,height});
  const state={mode:'dialog',dialogKind:'source-campaign',campaignPending:true,dialogPresentation:{queryId:42,title:'Cave of Gerfrex',lines:Array.from({length:60},(_,i)=>`${i+1}. Lydorie follows the path through the invisible maze. The choice changes the quest and its reward.`),choices:[],cancel:true}};
  await page.evaluate(s=>dialog.update(s),state);
  const panel=page.locator('.dialog-presentation'),copy=page.locator('.dialog-copy'),confirm=page.locator('[data-dialog-confirm]');
  const initial=await copy.evaluate(e=>({top:e.scrollTop,overflow:e.scrollHeight-e.clientHeight}));assert(initial.overflow>100,JSON.stringify({width,height,initial}));
  assert.equal(await copy.evaluate(e=>e.firstElementChild.offsetTop>=e.scrollTop),true,'Beginning of long text is reachable');
  // A real browser touch gesture proves that the ancestor chain allows scrolling.
  if(name==='chromium'){
   const box=await copy.boundingBox(),cdp=await page.context().newCDPSession(page);
   const x=box.x+box.width/2,y=box.y+box.height*.8,end=box.y+box.height*.2;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+(end-y)*i/10}]});await page.waitForTimeout(20);}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(200);await cdp.detach();
   assert(await copy.evaluate(e=>e.scrollTop>20),'Real touch scroll '+width+'x'+height);
  }else await copy.evaluate(e=>e.scrollTop=100);
  await page.waitForTimeout(1000); // Let the touch gesture's inertial scrolling settle.
  const stable=await page.evaluate(async s=>{
   const panel=document.querySelector('.dialog-presentation'),copy=panel.querySelector('.dialog-copy'),button=panel.querySelector('[data-dialog-confirm]'),top=copy.scrollTop;let changes=0;
   const observer=new MutationObserver(rs=>changes+=rs.filter(r=>r.type==='childList').length);observer.observe(panel,{subtree:true,childList:true});
   for(let i=0;i<40;i++)dialog.update({...s,day:i});button.click();button.click();
   dialog.update({mode:'map',campaignPending:true});dialog.update(s);
   await new Promise(r=>requestAnimationFrame(r));observer.disconnect();
   return{same:copy===panel.querySelector('.dialog-copy'),top:top===copy.scrollTop,changes,visible:!panel.hidden,disabled:button.disabled,calls:calls.splice(0)};
  },state);
  assert(stable.same&&stable.top&&stable.changes===0&&stable.visible&&stable.disabled,JSON.stringify(stable));assert.deepEqual(stable.calls,[[1]],'Exactly one answer per query');
  await page.evaluate(s=>{dialog.update({mode:'map',campaignPending:false});if(document.querySelector('.dialog-presentation').hidden)throw Error('Transient final-state map frame flashed');dialog.update({...s,dialogPresentation:{...s.dialogPresentation,queryId:43,lines:['The quest continues.']}});},state);
  assert.equal(await confirm.isDisabled(),false);const b=await confirm.boundingBox();assert(b.width>=44&&b.height>=44&&b.x>=0&&b.y>=0&&b.x+b.width<=width+1&&b.y+b.height<=height+1,'Confirmation stays reachable');
  await page.screenshot({path:path.join(out,`${name}-${width}x${height}.png`)});
  await page.evaluate(async()=>{for(let i=0;i<9;i++){dialog.update({mode:'map',campaignPending:false});await new Promise(r=>setTimeout(r,20));}});assert.equal(await panel.isVisible(),false,'Repeated idle frames must not defer exit indefinitely');
  // A temporary suspension without a sent answer must restore the same buttons.
  await page.evaluate(s=>{dialog.update(s);dialog.update({mode:'map',campaignPending:true});dialog.update(s);},state);assert.equal(await confirm.isDisabled(),false);
  await page.evaluate(()=>dialog.update({mode:'map',campaignPending:false}));await page.waitForTimeout(160);
 }
 console.log('PASS',name,'seven sizes, real Chromium touch scroll, stable quest transitions, one answer per query');
 }finally{await browser.close();}
}
