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
  const ally={stackId:1,id:1,name:'Ally',count:4,commander:true,attack:6,defense:7,damageMin:6,damageMax:12,speed:4,health:40,x:102,y:490,occupied:[154],enemy:false},enemy={stackId:2,id:2,name:'Enemy',count:2,attack:8,defense:5,damageMin:2,damageMax:4,speed:5,health:20,x:718,y:196,occupied:[35],enemy:true,canShootAt:true};
  window.dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'battle',day:1,resources:[20,20,20,20,20,20,100],round:1,canAct:true,activeStack:1,activeUnit:ally,focus:ally,battleUnits:[ally,enemy],battleCells:[{hex:154,x:102,y:490,reachable:true},{hex:35,x:718,y:196,actionLabel:'Shoot',reachable:false}]}}));
 });
 await p.waitForFunction(()=>document.querySelector('#mobile-app').dataset.mode==='battle');
 await p.evaluate(()=>{
  const [ally,enemy]=goonkMobileState.battleUnits;
  const canvas=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
  window.goonkBattlePlanes={ground:canvas(800,600),effects:canvas(800,600)};window.goonkBattleAtlas=canvas(1024,128);window.goonkBattleAtlasIds=new Map([[1,0],[2,1]]);window.goonkBattleSpriteBounds=[ally,enemy].map(u=>({stackId:u.stackId,x:u.x-20,y:u.y-60,w:40,h:60,renderX:u.x,renderY:u.y}));
 });
 const checkPanel=async()=>{
  const facts=p.locator('.battle-unit-stats');assert.equal(await facts.locator('.battle-stat-pill').count(),4);
  assert.equal(await facts.evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),2,'Two facts per row '+JSON.stringify(await facts.evaluate(e=>({html:e.innerHTML,display:getComputedStyle(e).display,cols:getComputedStyle(e).gridTemplateColumns,items:[...e.children].map(i=>({column:getComputedStyle(i).gridColumn,row:getComputedStyle(i).gridRow}))}))));
  const {canvas,panel}=await p.evaluate(()=>({canvas:document.querySelector('#battle-creature-detail').getBoundingClientRect().toJSON(),panel:document.querySelector('.battle-panel').getBoundingClientRect().toJSON()}));
  assert(canvas.y>=panel.y&&canvas.y+canvas.height<=panel.y+panel.height+1,'The complete portrait stays within its panel '+JSON.stringify({canvas,panel}));
  const values=await facts.locator('.battle-stat-pill').evaluateAll(items=>items.map(e=>e.getBoundingClientRect().toJSON()));
  for(const r of values)assert(r.y>=panel.y&&r.y+r.height<=panel.y+panel.height+1,'All four facts are visible '+JSON.stringify({r,panel,layout:await p.locator('.battle-panel-card').evaluate(e=>({rect:e.getBoundingClientRect().toJSON(),rows:getComputedStyle(e).gridTemplateRows,html:e.innerHTML,children:[...e.children].map(c=>({cls:c.className,rect:c.getBoundingClientRect().toJSON(),min:getComputedStyle(c).minHeight,margin:getComputedStyle(c).margin,padding:getComputedStyle(c).padding}))}))}));
  assert(Math.abs(values[0].y-values[1].y)<1&&values[2].y>values[0].y&&Math.abs(values[2].y-values[3].y)<1,'Facts form a 2 by 2 grid');
 };
 const check=async()=>{
  await p.waitForFunction(()=>document.querySelector('#mobile-app').dataset.battleLayout==='dual');await p.waitForTimeout(350);await checkPanel();
  const a=await p.locator('#battle-strategic-scene').boundingBox(),b=await p.locator('#mobile-scene').boundingBox();
  assert(a.height>100);assert(b.height>=139,JSON.stringify({a,b,style:await p.locator('.mobile-play').evaluate(e=>({height:e.clientHeight,rows:getComputedStyle(e).gridTemplateRows,display:getComputedStyle(e).display})),vertical:await p.locator('#mobile-app').getAttribute('data-vertical-battle')}));assert(Math.abs(a.y+a.height-b.y)<4);assert(b.y+b.height<= (await p.locator('.mobile-play').boundingBox()).y+(await p.locator('.mobile-play').boundingBox()).height+2);
  await p.locator('.action-tag').waitFor({state:'visible'});await p.locator('.close-tag').waitFor({state:'visible'});
  const writes=await p.evaluate(async()=>{let count=0;const observer=new MutationObserver(records=>count+=records.length);observer.observe(document.querySelector('.map-center'),{childList:true,subtree:true,characterData:true});await new Promise(r=>setTimeout(r,150));observer.disconnect();return count;});assert.equal(writes,0,'Combat frames do not rewrite a hidden map button and force layout');
 };
 for(const size of [{width:390,height:844},{width:768,height:1024},{width:1024,height:1366}]){
  await p.setViewportSize(size);await check();
  // Reproduce the reported normal portrait -> landscape transition directly.
  await p.setViewportSize({width:size.height,height:size.width});await p.waitForTimeout(250);
  await checkPanel();const geometry=await p.evaluate(()=>{const play=document.querySelector('.mobile-play').getBoundingClientRect(),scene=document.querySelector('#mobile-scene').getBoundingClientRect();return{top:scene.top-play.top,left:scene.left-play.left,w:scene.width,pw:play.width,h:scene.height,ph:play.height};});
  assert(Math.abs(geometry.top)<2&&Math.abs(geometry.left)<2&&Math.abs(geometry.w-geometry.pw)<2&&Math.abs(geometry.h-geometry.ph)<2,'Landscape canvas fills field after normal portrait rotation '+JSON.stringify(geometry));
  await p.setViewportSize(size);await check();
  await p.locator('[data-ui=battle-view]').tap();await p.waitForTimeout(150);await checkPanel();assert.equal(await p.locator('#mobile-app').getAttribute('data-battle-layout'),'native');await p.locator('.close-tag').waitFor({state:'hidden'});
  assert.equal(await p.locator('#mobile-app').getAttribute('data-vertical-battle'),'true');
  const hit=await p.evaluate(async()=>{const {verticalBattleGeometry}=await import('/web/battle-vertical.mjs');const c=document.querySelector('#mobile-scene'),g=verticalBattleGeometry(c.clientWidth,c.clientHeight),u=goonkMobileState.battleUnits[1],p=g.project(u);return{x:p.x+18*g.scale,y:p.y-8*g.scale};});
  await p.locator('#mobile-scene').tap({position:hit});await p.waitForTimeout(100);
  assert(await p.locator('.mobile-nav [data-ui=battle-action]').isEnabled(),'Vertical target remains selectable');
  await p.waitForFunction(()=>window.verticalTrajectoryPainted===true);
  await p.setViewportSize({width:size.height,height:size.width});await p.waitForTimeout(200);assert.equal(await p.locator('#mobile-app').getAttribute('data-battle-layout'),'native');
  await p.setViewportSize(size);await p.waitForTimeout(150);assert.equal(await p.locator('#mobile-app').getAttribute('data-battle-layout'),'native');await p.locator('[data-ui=battle-view]').tap();await check();
 }

 for(const viewport of [{width:740,height:280},{width:640,height:260},{width:1180,height:720}]){await p.setViewportSize(viewport);await p.waitForTimeout(250);await checkPanel();await p.screenshot({path:'/tmp/goonk-ui163-battle-'+kind+'-'+viewport.width+'x'+viewport.height+'.png'});}
 const counters=await p.evaluate(async()=>{
  const {paintVerticalBattle,resetVerticalBattle}=await import('/web/battle-vertical.mjs');const result=[];
  for(const [width,height]of[[320,310],[390,500],[390,850],[768,780]]){
   resetVerticalBattle();const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d'),ground=document.createElement('canvas'),effects=document.createElement('canvas'),atlas=document.createElement('canvas');ground.width=effects.width=800;ground.height=effects.height=600;atlas.width=1024;atlas.height=128;effects.getContext('2d').fillStyle='#f00';effects.getContext('2d').fillRect(0,0,800,600);
   const order=[],boxes=[],draw=ctx.drawImage.bind(ctx),text=ctx.fillText.bind(ctx),fill=ctx.fillRect.bind(ctx);
   ctx.drawImage=(image,...args)=>{order.push(image===effects?'effect':'image');draw(image,...args);};ctx.fillText=(label,...args)=>{order.push('count');text(label,...args);};ctx.fillRect=(x,y,w,h)=>{if(ctx.fillStyle==='#3b2675')boxes.push({x,y,w,h});fill(x,y,w,h);};
   const units=[{stackId:1,x:36,y:66,count:12345,enemy:false},{stackId:2,x:58,y:550,count:7,enemy:false}];const bounds=units.map(u=>({stackId:u.stackId,x:u.x-20,y:u.y-60,w:40,h:60,renderX:u.x,renderY:u.y}));
   paintVerticalBattle(ctx,width,height,{mode:'battle',battleUnits:units,battleCells:[]},null,{ground,effects},atlas,new Map([[1,0],[2,1]]),bounds);
   result.push({width,height,boxes,order});
  }return result;
 });
 for(const r of counters){assert.equal(r.boxes.length,2);assert(r.order.indexOf('count')>r.order.indexOf('effect'),'Counters are drawn above spell effects');for(const b of r.boxes)assert(b.x>=0&&b.y>=0&&b.x+b.w<=r.width&&b.y+b.h<=r.height,'Every complete counter stays within the canvas');}
 assert.deepEqual(errors,[]);console.log(kind+': portrait phone/iPad cameras, vertical trajectories/targeting without follow camera and rotations passed');
 }finally{await browser.close();}
}}finally{server.close();}
