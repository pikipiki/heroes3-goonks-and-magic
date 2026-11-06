import {chromium,webkit} from 'playwright-core';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';
const repo=fileURLToPath(new URL('../..',import.meta.url));
const server=http.createServer((req,res)=>{let file=repo+new URL(req.url,'http://localhost').pathname;try{res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.mjs')?'text/javascript':'image/png');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
try{for(const kind of ['chromium','webkit']){
 let browser;try{browser=await(kind==='chromium'?chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})}):webkit.launch({headless:true,...(process.env.WEBKIT_PATH?{executablePath:process.env.WEBKIT_PATH}:{})}));}catch(e){throw new Error(kind+': '+e.message);}
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:3});
 await page.addInitScript(()=>{
  localStorage.setItem('heroes-goonk.language','fr');
  const strokeRect=CanvasRenderingContext2D.prototype.strokeRect;
  CanvasRenderingContext2D.prototype.strokeRect=function(...args){
   if(this.canvas.id==='battle-strategic-scene'&&this.getLineDash().length)window.overviewFrame=args;
   return strokeRect.apply(this,args);
  };
 });
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/touchfixture?mobile=1',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/web/mobile.css"><link rel="stylesheet" href="/web/h3-theme.css"><link rel="stylesheet" href="/web/mobile-upgrade.css"><canvas id="canvas" width="1600" height="1200"></canvas><script>window.calls=[];window.Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...a){calls.push(["command",...a])},_vcmiMobilePointer(...a){calls.push(["pointer",...a])}};const ctx=document.querySelector("canvas").getContext("2d");ctx.fillStyle="#456734";ctx.fillRect(0,0,1600,1200);</script><script type="module" src="/web/mobile.mjs"></script>'}));
 await page.goto(origin+'/touchfixture?mobile=1');await page.waitForSelector('#mobile-app');
 await page.evaluate(()=>{const cells=[];for(let r=0;r<11;r++)for(let c=1;c<16;c++)cells.push({hex:r*17+c,x:36+(r%2===0?22:0)+44*c,y:112+42*r,reachable:true});window.dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'battle',day:1,resources:[20,20,20,20,20,20,100],round:1,canAct:true,activeStack:1,activeUnit:{id:1,name:'Bobope',count:4},focus:{x:102,y:490},battleUnits:[{stackId:1,id:1,name:'Bobope',count:4,x:102,y:490,occupied:[154],enemy:false}],battleCells:cells}}));});
 await page.waitForTimeout(150);await page.locator('[data-ui=battle-view]').tap();await page.waitForTimeout(250);
 const update=patch=>page.evaluate(patch=>window.dispatchEvent(new CustomEvent('goonk-state',{detail:{...goonkMobileState,...patch}})),patch);
 await update({mode:'dialog'});await update({mode:'battle'});await page.waitForTimeout(150);if(await page.locator('#mobile-app').getAttribute('data-battle-layout')!=='dual')throw Error('Spellbook return lost the close view');
 const ally={stackId:1,id:1,name:'Bobope',count:4,x:102,y:490,occupied:[154],enemy:false},enemy={stackId:2,id:2,name:'Adversaire',count:7,x:718,y:196,enemy:true};
 await update({battleUnits:[ally,enemy],battleCamera:{sequence:1,active:true,kind:'move',actor:{...ally,x:300,y:364},path:[{x:102,y:490},{x:300,y:364}],destination:{x:300,y:364}}});await page.waitForTimeout(300);
 if(!(await page.locator('#battle-detail-description').textContent()).includes('Déplacement en cours'))throw Error('Movement follow label');
 await page.locator('#battle-strategic-scene').tap({position:{x:200,y:100}});await page.waitForTimeout(100);
 if(await page.locator('.battle-follow-action').count())throw Error('Unexpected follow button');
 if(!(await page.locator('#battle-detail-description').textContent()).includes('Exploration manuelle'))throw Error('Manual exploration label');
 await update({canAct:false});
 if(!(await page.locator('#battle-detail-description').textContent()).includes('Exploration manuelle'))throw Error('Repeated snapshot interrupted exploration');
 await update({canAct:false,battleCamera:{sequence:1,active:false}});
 await page.setViewportSize({width:430,height:740});
 await page.waitForTimeout(200);
 const mini=page.locator('#battle-strategic-scene');
 const field=await mini.evaluate(canvas=>{
  const {width,height}=canvas.getBoundingClientRect(),scale=Math.min(width/800,height/555);
  return {x:(width-800*scale)/2,y:(height-555*scale)/2,right:(width+800*scale)/2,scale};
 });
 const tapField=(x,y)=>mini.tap({position:{x:field.x+x*field.scale,y:field.y+y*field.scale}});
 const frameAt=(edge)=>page.waitForFunction(({edge,field})=>{
  const frame=window.overviewFrame;
  return frame&&Math.abs((edge==='right'?frame[0]+frame[2]:frame[0])-(edge==='right'?field.right:field.x))<2;
 },{edge,field},{timeout:2000});
 await tapField(25,350);
 await frameAt('left');
 await tapField(enemy.x,enemy.y-30);
 await frameAt('right');
 await tapField(25,350);
 await frameAt('left');
 if(field.x<=4)throw Error('The test needs a visible side margin');
 await mini.tap({position:{x:field.right+field.x/2,y:field.y+300*field.scale}});
 await frameAt('right');
 await update({canAct:true,battleUnits:[ally,{...enemy,canShootAt:true}]});
 await page.waitForFunction(()=>goonkMobileState.canAct);
 await tapField(enemy.x,enemy.y-30);
 await frameAt('right');
 const confirm=page.locator('.mobile-nav [data-ui=target]');
 if(!await confirm.isEnabled())throw Error('A valid troop remains selectable from the overview');
 await confirm.tap();
 const aimed=await page.evaluate(()=>calls.some(c=>c[0]==='pointer'&&c[1]===718&&c[2]===196&&c[3]===1));
 if(!aimed)throw Error('Confirm did not send the selected target');
 await update({battleCamera:{sequence:2,active:true,kind:'attack',actor:enemy,targets:[ally]}});await page.waitForTimeout(300);if(!(await page.locator('#battle-detail-description').textContent()).includes('Bobope'))throw Error('Enemy attack target');
 await update({battleCamera:{sequence:3,active:true,kind:'spell',actor:null,label:'Explosion',targets:[ally,enemy]}});await page.waitForTimeout(900);if(!(await page.locator('#battle-detail-description').textContent()).includes('2 cibles'))throw Error('Area spell targets');
 if(process.env.GOONK_TEST_OUTPUT)await page.screenshot({path:path.join(process.env.GOONK_TEST_OUTPUT,'battle-director-'+kind+'.png')});
 for(const [width,height] of [[320,568],[844,390],[390,844]]){
  await page.setViewportSize({width,height});
  await page.waitForTimeout(200);
  if(await page.locator('.mobile-calendar').isVisible())throw Error('Calendar in combat');
  if(await page.locator('.battle-view-label').count()||await page.locator('#battle-detail-description').isVisible())throw Error('Visible camera labels');
  const [play,mini,detail,panel]=await Promise.all(['.mobile-play','#battle-strategic-scene','#mobile-scene','.battle-panel'].map(s=>page.locator(s).boundingBox()));
  if(!mini?.height||!detail?.height||!panel?.height)throw Error('A battle panel has no space');
  const startsAt=width>height?play.y:mini.y+mini.height;
  if(Math.abs(mini.y-play.y)>1||Math.abs(detail.y-startsAt)>1||Math.abs(detail.y+detail.height-panel.y)>1)throw Error('Unused row between battle panes '+JSON.stringify({width,height,play,mini,detail,panel}));
 }
 await page.locator('[data-ui=battle-view]').tap();await page.waitForTimeout(100);if(await page.locator('.battle-follow-action').isVisible())throw Error('Follow button in whole view');
 if(await page.locator('.mobile-calendar').isVisible())throw Error('Calendar in full battlefield mode');
 await update({mode:'map'});
 await page.locator('.mobile-calendar').waitFor({state:'visible'});
 if(errors.length)throw Error(errors.join(';'));
 console.log(kind,'PASS: moving actor, enemy target, allied/area spells, manual exploration at the edges, target confirmation, automatic follow, full-height panes and rotations');
 await browser.close();
}
}finally{server.close();}
