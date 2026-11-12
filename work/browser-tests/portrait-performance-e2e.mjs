import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
const web=path.resolve(process.env.GOONK_TEST_WEB_ROOT||'web'),baseline=process.env.GOONK_PORTRAIT_BASELINE;
const server=http.createServer((req,res)=>{try{const url=new URL(req.url,'http://localhost'),file=url.pathname==='/web/portrait-baseline.mjs'?baseline:path.join(web,url.pathname.replace(/^\/web\//,''));res.setHeader('Content-Type',file.endsWith('.mjs')?'text/javascript':file.endsWith('.webp')?'image/webp':'text/plain');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const report={};
try{for(const [name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});
 try{
 const results=[];
 for(const variant of baseline?['baseline','optimized']:['optimized']){
  const p=await browser.newPage({viewport:{width:393,height:851},deviceScaleFactor:3,hasTouch:true});await silenceTestAudio(p);const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/fixture',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><style>canvas{width:64px;height:64px}</style><main id="portraits"></main>'}));await p.goto(`http://127.0.0.1:${server.address().port}/fixture`);
  if(name==='chromium'){const cdp=await p.context().newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});}
  const result=await p.evaluate(async variant=>{
   const {paintCreaturePortraits,creaturePortrait}=await import('/web/'+(variant==='baseline'?'portrait-baseline.mjs':'creature-portraits.mjs'));
   const {default:data}=await import('/web/goonk-hd-portraits-data.mjs'),{hdCreaturePortrait}=await import('/web/goonk-hd-portraits.mjs');
   const key='goonk:'+Object.keys(data)[0],root=document.querySelector('#portraits');
   window.goonkPortraitAtlas=Object.assign(document.createElement('canvas'),{width:768,height:96});window.goonkPortraitIds=new Map([[999,0]]);goonkPortraitAtlas.getContext('2d').fillRect(0,0,768,96);
   root.innerHTML=Array.from({length:40},(_,i)=>creaturePortrait({id:i%2?999:1,key:i%2?'':key,name:'Portrait'})).join('');
   while(!hdCreaturePortrait({key}))await new Promise(r=>setTimeout(r,20));
   const frame=()=>new Promise(requestAnimationFrame),settle=async()=>{await frame();paintCreaturePortraits(root);await frame();await frame();};await settle();
   let reads=0,queries=0;const rect=Element.prototype.getBoundingClientRect,query=root.querySelectorAll.bind(root);
   Element.prototype.getBoundingClientRect=function(...a){if(this.matches?.('[data-creature-portrait]'))reads++;return rect.apply(this,a);};root.querySelectorAll=(...a)=>{queries++;return query(...a);};
   const started=performance.now();for(let i=0;i<120;i++)paintCreaturePortraits(root);const duration=performance.now()-started;
   Element.prototype.getBoundingClientRect=rect;root.querySelectorAll=query;
   const snapshot=()=>[...root.children].map(c=>({w:c.width,h:c.height,pixels:c.toDataURL()}));
   const initial=snapshot();root.style.setProperty('--size','90px');for(const c of root.children)c.style.width=c.style.height='90px';await settle();paintCreaturePortraits(root);const resized=snapshot();
   root.firstElementChild.dataset.creaturePortrait='999';root.firstElementChild.dataset.creatureKey='';await settle();const changed=snapshot()[0];
   root.innerHTML=creaturePortrait({id:1,key,name:'New'});await settle();const replacement=snapshot();
   return {reads,queries,duration,initial,resized,changed,replacement};
  },variant);
  assert.deepEqual(errors,[]);assert.equal(result.initial[0].w,192);assert.equal(result.initial[1].w,96);assert.equal(result.resized[0].w,270);assert.equal(result.changed.w,96);assert.equal(result.replacement[0].w,192);
  if(variant==='optimized'){assert.equal(result.reads,0,'Stable portraits must not force layout');assert.equal(result.queries,0,'Stable rosters must not rescan the DOM');}
  results.push(result);await p.close();
 }
 if(results.length===2)for(const key of ['initial','resized','changed','replacement'])assert.deepEqual(results[0][key],results[1][key],'Artwork/geometry unchanged: '+key);
 report[name]=results.map(({reads,queries,duration})=>({reads,queries,duration}));console.log(name,JSON.stringify(report[name]));
 }finally{await browser.close();}
}if(process.env.GOONK_PERFORMANCE_REPORT)fs.writeFileSync(process.env.GOONK_PERFORMANCE_REPORT,JSON.stringify(report,null,2));}finally{server.close();}
