import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});
 try{
 const legacy=process.argv.includes('--legacy-container');
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,...(legacy?{userAgent:'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/90.0 Mobile Safari/537.36'}:{})}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await silenceTestAudio(page);
 await page.route('**/web/**',r=>{const file=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);if(!fs.existsSync(file))return r.abort();return legacy&&file.endsWith('.css')?r.fulfill({body:fs.readFileSync(file,'utf8').replaceAll('@container','@unsupported-container'),contentType:'text/css'}):r.fulfill({path:file});});
 await page.route('**/resources',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>Module={_vcmiMobileEnable(){},_vcmiMobileCommand(){}};</script><script type=module src=/web/mobile.mjs></script>'}));
 await page.route('**/mithril.png',r=>r.fulfill({path:path.resolve('mod/wake-of-gods/Mods/mithril/content/sprites/mithril/small.png')}));
 await page.goto('http://localhost/resources');await page.waitForSelector('#mobile-app');
 await page.evaluate(()=>{const b=document.createElement('button');b.id='game-menu-toggle';b.textContent='☰';document.querySelector('.mobile-brand').replaceWith(b);window.goonkAssetURLs=[{path:'Mods/wake-of-gods/Mods/mithril/content/sprites/mithril/small.png',url:'/mithril.png'}];});
 for(const width of [320,360,390,430]){
 await page.setViewportSize({width,height:844});
 await page.evaluate(()=>dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'map',turn:true,day:1,heroName:'Zydar',resources:[2200,2050,2200,2100,2100,2100,198500,200],weeklyRecruitsReady:true,resourceTypes:[...Array.from({length:7},(_,id)=>({id})),{id:7,key:'mithril',name:'Mithril',scope:'wake-of-gods.mithril',icon:'mithril/small.png'}]}})));
 await page.waitForTimeout(150);
 const metrics=await page.locator('.mobile-resources').evaluate(el=>{
 const r=el.getBoundingClientRect(),top=el.closest('header').getBoundingClientRect();
 const menu=document.querySelector('#game-menu-toggle').getBoundingClientRect(),calendar=document.querySelector('.mobile-calendar').getBoundingClientRect();const mithril=el.lastElementChild.querySelector('img').getBoundingClientRect();return {iconGap:calendar.top<r.bottom?calendar.left-mithril.right:null,firstRow:Math.abs(r.top-menu.top)<12,width:r.width,available:(calendar.top<r.bottom&&calendar.bottom>r.top?calendar.left:top.right)-menu.right,items:[...el.querySelectorAll('.resource-quantity')].map(e=>{const r=e.getBoundingClientRect();return {x:r.x,right:r.right,width:r.width,needed:e.scrollWidth}})};
 });
 assert(metrics.firstRow,'Resources stay on the first header row');if(metrics.iconGap!==null)assert(metrics.iconGap>=8,'Mithril has breathing room before Recruits');
 assert(metrics.width>=metrics.available-12,'Resources use the entire header width');assert.equal(metrics.items.length,8);
 for(let i=0;i<metrics.items.length;i++){const item=metrics.items[i];assert(item.x>=0&&item.right<=width,'Quantity remains on screen');assert(item.needed<=item.width+1,'Quantity is not clipped');if(i)assert(item.x>=metrics.items[i-1].right,'Quantities do not overlap');}
 if(width===390)await page.screenshot({path:'/tmp/resources-'+name+(legacy?'-android-legacy':'')+'.png'});
 }
 assert.deepEqual(errors,[]);console.log(name+(legacy?' Android without container queries':'')+': single-row resources passed at 320–430px');
 }finally{await browser.close();}
}
