import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
for(const kind of ['chromium','webkit']){
 const browser=await (kind==='chromium'?chromium:webkit).launch({headless:true,...(kind==='chromium'?{args:['--no-sandbox']}:{} )});
 try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/web/**',async r=>{const file=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?r.fulfill({path:file}):r.abort();});
 await page.route('**/mobile-review?mobile=1',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...a){calls.push(a)},_vcmiMobilePointer(...a){calls.push(['pointer',...a])}};const c=document.querySelector('canvas').getContext('2d');c.fillStyle='#556633';c.fillRect(0,0,800,600);</script><script type=module src=/web/mobile.mjs></script>`}));
 await (await import('./silent-audio.mjs')).silenceTestAudio(page);await page.goto('http://127.0.0.1:8776/mobile-review?mobile=1');await page.waitForSelector('#mobile-app');
 const send=s=>page.evaluate(s=>dispatchEvent(new CustomEvent('goonk-state',{detail:s})),s);
 const visible=async selector=>{for(const b of await page.locator(selector).all()){if(!await b.isVisible())continue;const r=await b.boundingBox(),v=page.viewportSize();assert(r.x>=-1&&r.y>=-1&&r.x+r.width<=v.width+1&&r.y+r.height<=v.height+1,selector+' within viewport '+JSON.stringify(r));assert(r.width>=43&&r.height>=43,selector+' touch target '+JSON.stringify(r));}};
 for(const [width,height] of [[390,844],[844,390],[320,568],[568,320],[1024,768],[768,1024],[390,844]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>{dispatchEvent(new Event('orientationchange'));dispatchEvent(new Event('focus'));dispatchEvent(new Event('pageshow'));});
  await send({mode:'map',turn:true,heroId:1,heroName:'Hero',heroes:[{id:1,name:'Hero'}],hasPath:true});await page.waitForTimeout(180);
  const buttons=await page.locator('.mobile-nav>button').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));if(width<=height)assert(buttons.every(b=>Math.abs(b.y-buttons[0].y)<1),'one portrait adventure action row');else assert(buttons.every(b=>b.x>=width-340-1),'landscape adventure actions on the right');await visible('.mobile-nav>button');
  const root=await page.locator('#mobile-app').boundingBox();assert(Math.abs(root.y)<1&&Math.abs(root.height-height)<1,'app fills viewport after rotation');
  await send({mode:'hero',turn:true,heroWindow:{id:1,name:'Hero',level:1,primarySkills:[1,2,3,4]},armies:[{id:1,name:'Hero',slots:[{id:1,name:'Pixie',count:10,attack:2,defense:2}]}]});await page.locator('[data-hero-tab=army]').tap();await page.waitForTimeout(80);
  await visible('.hero-bag-tabs button');
  for(const r of await page.locator('.hero-bag-tabs button').evaluateAll(es=>es.map(e=>({bottom:e.getBoundingClientRect().bottom,parent:e.parentElement.getBoundingClientRect().bottom}))))assert(r.bottom<=r.parent+.5,'full tab border visible');
  await page.locator('[data-army-slot="0"]').tap();await page.locator('[data-hero-army-details]').tap();assert.deepEqual((await page.evaluate(()=>calls.at(-1))).slice(0,3),[41,1,0]);
  await page.locator('[data-army-slot="0"] .hero-army-slot-art').tap();assert.deepEqual((await page.evaluate(()=>calls.at(-1))).slice(0,3),[41,1,0]);
 }
 await page.setViewportSize({width:390,height:844});
 const battle={mode:'battle',round:1,canAct:true,canAutoCombat:true,canRetreat:true,activeStack:1,activeUnit:{id:1,name:'Pixie',count:10},battleUnits:[{stackId:1,id:1,name:'Pixie',count:10,x:102,y:196,enemy:false},{stackId:2,id:2,name:'Enemy',count:5,x:718,y:196,enemy:true}],battleCells:[{hex:55,x:190,y:196,reachable:true}]};
 await send(battle);await page.waitForTimeout(200);assert.equal(await page.locator('#mobile-app').getAttribute('data-battle-layout'),'dual');
 await page.locator('#battle-strategic-scene').tap({position:{x:190/800*390,y:196/800*390}});await page.waitForTimeout(120);
 // A controlled flat framebuffer makes every added route/marker observable.
 const colored=await page.evaluate(()=>Object.fromEntries(['mobile-scene','battle-strategic-scene'].map(id=>{const c=document.getElementById(id),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i+3]&& (d[i]!==85||d[i+1]!==102||d[i+2]!==51))n++;return [id,n];})));
 assert.equal(colored['mobile-scene'],0,'following camera has no tactical overlays');assert(colored['battle-strategic-scene']>100,'action screen displays route and destination');
 await page.screenshot({path:'/tmp/mobile-review-'+kind+'.png'});
 for(const [width,height] of [[844,390],[568,320],[1024,768],[768,1024]]){await page.setViewportSize({width,height});await page.waitForTimeout(150);await visible('.mobile-top button,.mobile-nav>button');}
 assert.deepEqual(errors,[]);console.log('PASS',kind,'7 rotations, adventure row, army cards/details, intact tabs, action route, clean follow camera, accessible combat buttons');
 }finally{await browser.close();}
}
