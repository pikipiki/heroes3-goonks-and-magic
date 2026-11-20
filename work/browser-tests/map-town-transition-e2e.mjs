import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {silenceTestAudio} from './silent-audio.mjs';

const output=process.env.REVIEW_OUTPUT||'/tmp/goonk-map-town-transition';
fs.mkdirSync(output,{recursive:true});
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});
 try{
  for(const language of ['fr','en'])for(const viewport of [{width:360,height:659},{width:320,height:568},{width:716,height:279},{width:844,height:390}]){
   const page=await browser.newPage({viewport,hasTouch:true,serviceWorkers:'block'}),errors=[];
   page.on('pageerror',error=>errors.push(error.message));await silenceTestAudio(page);
   await page.route('**/web/**',route=>{const file=path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?route.fulfill({path:file}):route.abort();});
   await page.route('**/opfs-worker.js',route=>route.fulfill({contentType:'text/javascript',body:'export const opfsList=async()=>({}),opfsUnlink=async()=>{},opfsFlush=async()=>{};'}));
   await page.route('**/transition-fixture?mobile=1',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...args){calls.push(args)}};</script><script type=module src=/web/mobile.mjs></script>'}));
   await page.goto('http://localhost/transition-fixture?mobile=1');await page.waitForSelector('#mobile-app');
   await page.evaluate(async language=>{(await import('/web/i18n.mjs')).setLanguage(language);window.send=model=>dispatchEvent(new CustomEvent('goonk-state',{detail:structuredClone(model)}));},language);
   const map={mode:'map',turn:true,day:57,heroName:'Zydar',heroId:1,movement:1500,heroMana:0,heroManaLimit:10,hasPath:true,heroes:[{id:1,index:0,name:'Zydar',movement:1500,mana:0,manaLimit:10}],towns:[{id:1,index:0,name:'Goonkbourg'}],resources:[100,103,100,100,100,100,78830,100],mapOverview:{width:144,height:144,level:0,rect:{x:630,y:26,w:144,h:144},view:{x:7,y:7,w:594,h:546},viewport:{x:45,y:4,w:20,h:19}}};
   await page.evaluate(model=>send(model),map);await page.waitForTimeout(250);
   const measure=()=>{const nav=document.querySelector('.mobile-nav');return{mode:document.querySelector('#mobile-app').dataset.mode,nav:nav.getBoundingClientRect().toJSON(),buttons:[...nav.children].filter(n=>n.tagName==='BUTTON'&&!n.hidden).map(n=>({action:n.dataset.ui,r:n.getBoundingClientRect().toJSON(),overflow:n.scrollHeight>n.clientHeight||n.scrollWidth>n.clientWidth}))}};
   // Sample every rendered frame, starting with the first paint after the native state event.
   for(const model of [{...map,mode:'town',townName:'Goonkbourg',townId:1,buildings:[]},map]){
    const frames=await page.evaluate(async ({model,source})=>{const measure=(0,eval)(`(${source})`);send(model);const frames=[];for(let i=0;i<8;i++){await new Promise(requestAnimationFrame);frames.push(measure());}return frames;},{model,source:measure.toString()});
    const settled=frames.at(-1),painted=frames.filter(frame=>frame.mode===model.mode);
    assert(painted.length>0);
    for(const [index,frame]of painted.entries())assert.deepEqual(frame,settled,`${name} ${language} ${viewport.width} ${model.mode}: controls move on frame ${index}`);
    for(const button of settled.buttons){assert(button.r.height>=48,JSON.stringify(settled));assert(!button.overflow,JSON.stringify(settled));}
   }
   const landscape=viewport.width>viewport.height;
   for(const [action,label]of [['move',language==='fr'?'Marcher':'Move'],['endturn',language==='fr'?'Fin tour':'End turn']]){
    const button=page.locator(`.mobile-nav>[data-ui=${action}]`);assert.match(await button.innerText(),new RegExp(label));
    const parts=await button.evaluate(n=>[...n.children].filter(c=>!c.classList.contains('MuiTouchRipple-root')).map(c=>({text:c.textContent,r:c.getBoundingClientRect().toJSON()})));
    if(landscape)assert(parts[0].r.bottom<=parts[1].r.y+1,JSON.stringify(parts));
   }
   if(landscape){await page.locator('.mobile-nav>.ui-overflow-trigger').tap();await page.locator('.MuiMenu-paper:visible').waitFor();}
   const icons=await page.evaluate(()=>['heroes','towns'].map(action=>{const button=document.querySelector(`[data-ui=${action}]`),slot=button.querySelector('.ui-button-art'),img=slot.querySelector('img');return{slot:slot.getBoundingClientRect().toJSON(),img:img.getBoundingClientRect().toJSON()};}));
   for(const icon of icons){assert.equal(icon.slot.width,24);assert.equal(icon.slot.height,24);assert.equal(icon.img.width,24);assert.equal(icon.img.height,24);}
   assert(Math.abs(icons[0].slot.y-icons[1].slot.y)<1||landscape,'Map artwork shares vertical alignment');
   await page.screenshot({path:path.join(output,`${name}-${language}-${viewport.width}.png`)});
   assert.deepEqual(errors,[]);await page.close();
  }
  console.log('PASS',name,'town→map first-frame geometry, visible stacked labels and equal artwork slots in FR/EN portrait/landscape');
 }finally{await browser.close();}
}
