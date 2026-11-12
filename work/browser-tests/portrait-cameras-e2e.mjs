import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
const web=process.env.GOONK_TEST_WEB_ROOT||path.resolve('web');
const server=http.createServer((req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname.replace(/^\/web\//,'');res.setHeader('Content-Type',name.endsWith('.css')?'text/css':name.endsWith('.mjs')?'text/javascript':'image/png');res.end(fs.readFileSync(path.join(web,name)));}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
try{for(const [kind,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});
 try{
 const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
 await silenceTestAudio(p);await p.addInitScript(()=>{const stroke=CanvasRenderingContext2D.prototype.stroke;CanvasRenderingContext2D.prototype.stroke=function(...a){if(this.canvas.id==='mobile-scene'&&this.strokeStyle==='#ffad91')window.verticalTrajectoryPainted=true;return stroke.apply(this,a);};});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/fixture?mobile=1',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/web/mobile.css"><link rel="stylesheet" href="/web/h3-theme.css"><link rel="stylesheet" href="/web/mobile-upgrade.css"><canvas id="canvas" width="800" height="600"></canvas><script>window.calls=[];window.Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...a){calls.push(a)},_vcmiMobilePointer(...a){calls.push(['pointer',...a])}};const c=document.querySelector('canvas');c.getContext('2d').fillRect(0,0,800,600);</script><script type="module" src="/web/mobile.mjs"></script>`}));
 await p.goto(`http://127.0.0.1:${server.address().port}/fixture?mobile=1`);await p.waitForSelector('#mobile-app');
 await p.evaluate(()=>{
  const ally={stackId:1,id:1,name:'Ally',count:4,x:102,y:490,occupied:[154],enemy:false},enemy={stackId:2,id:2,name:'Enemy',count:2,x:718,y:196,occupied:[35],enemy:true,canShootAt:true};
  window.dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'battle',day:1,resources:[20,20,20,20,20,20,100],round:1,canAct:true,activeStack:1,activeUnit:ally,focus:ally,battleUnits:[ally,enemy],battleCells:[{hex:154,x:102,y:490,reachable:true},{hex:35,x:718,y:196,actionLabel:'Shoot',reachable:false}]}}));
 });
 await p.waitForFunction(()=>document.querySelector('#mobile-app').dataset.mode==='battle');
 await p.evaluate(()=>{
  const [ally,enemy]=goonkMobileState.battleUnits;
  const canvas=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
  window.goonkBattlePlanes={ground:canvas(800,600),effects:canvas(800,600)};window.goonkBattleAtlas=canvas(1024,128);window.goonkBattleAtlasIds=new Map([[1,0],[2,1]]);window.goonkBattleSpriteBounds=[ally,enemy].map(u=>({stackId:u.stackId,x:u.x-20,y:u.y-60,w:40,h:60,renderX:u.x,renderY:u.y}));
 });
 const check=async()=>{
  await p.waitForFunction(()=>document.querySelector('#mobile-app').dataset.battleLayout==='dual');await p.waitForTimeout(150);
  const a=await p.locator('#battle-strategic-scene').boundingBox(),b=await p.locator('#mobile-scene').boundingBox();
  assert(a.height>100);assert(b.height>=139,JSON.stringify({a,b,style:await p.locator('.mobile-play').evaluate(e=>({height:e.clientHeight,rows:getComputedStyle(e).gridTemplateRows,display:getComputedStyle(e).display})),vertical:await p.locator('#mobile-app').getAttribute('data-vertical-battle')}));assert(Math.abs(a.y+a.height-b.y)<4);assert(b.y+b.height<= (await p.locator('.mobile-play').boundingBox()).y+(await p.locator('.mobile-play').boundingBox()).height+2);
  await p.locator('.action-tag').waitFor({state:'visible'});await p.locator('.close-tag').waitFor({state:'visible'});
 };
 for(const size of [{width:390,height:844},{width:768,height:1024},{width:1024,height:1366}]){
  await p.setViewportSize(size);await check();
  await p.locator('[data-ui=battle-view]').tap();await p.waitForTimeout(150);assert.equal(await p.locator('#mobile-app').getAttribute('data-battle-layout'),'native');await p.locator('.close-tag').waitFor({state:'hidden'});
  assert.equal(await p.locator('#mobile-app').getAttribute('data-vertical-battle'),'true');
  const hit=await p.evaluate(async()=>{const {verticalBattleGeometry}=await import('/web/battle-vertical.mjs');const c=document.querySelector('#mobile-scene'),g=verticalBattleGeometry(c.clientWidth,c.clientHeight),u=goonkMobileState.battleUnits[1],p=g.project(u);return{x:p.x+18*g.scale,y:p.y-8*g.scale};});
  await p.locator('#mobile-scene').tap({position:hit});await p.waitForTimeout(100);
  assert(await p.locator('.mobile-nav [data-ui=battle-action]').isEnabled(),'Vertical target remains selectable');
  await p.waitForFunction(()=>window.verticalTrajectoryPainted===true);
  await p.setViewportSize({width:size.height,height:size.width});await p.waitForTimeout(200);assert.equal(await p.locator('#mobile-app').getAttribute('data-battle-layout'),'native');
  await p.setViewportSize(size);await p.waitForTimeout(150);assert.equal(await p.locator('#mobile-app').getAttribute('data-battle-layout'),'native');await p.locator('[data-ui=battle-view]').tap();await check();
 }
 assert.deepEqual(errors,[]);console.log(kind+': portrait phone/iPad cameras, vertical trajectories/targeting without follow camera and rotations passed');
 }finally{await browser.close();}
}}finally{server.close();}
