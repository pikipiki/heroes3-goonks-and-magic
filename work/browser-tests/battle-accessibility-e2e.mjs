import {chromium,webkit} from 'playwright-core';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import http from 'node:http';
const repo=fileURLToPath(new URL('../..',import.meta.url));
const server=http.createServer((req,res)=>{let file=repo+new URL(req.url,'http://localhost').pathname;try{res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.mjs')?'text/javascript':'image/png');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
try{for(const kind of ['chromium','webkit']){
 let browser;try{browser=await(kind==='chromium'?chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})}):webkit.launch({headless:true,...(process.env.WEBKIT_PATH?{executablePath:process.env.WEBKIT_PATH}:{})}));}catch(e){throw new Error(kind+': '+e.message);}
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:3});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/touchfixture?mobile=1',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/web/mobile.css"><link rel="stylesheet" href="/web/h3-theme.css"><link rel="stylesheet" href="/web/mobile-upgrade.css"><canvas id="canvas" width="1600" height="1200"></canvas><script>window.calls=[];window.Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...a){calls.push(["command",...a])},_vcmiMobilePointer(...a){calls.push(["pointer",...a])}};const ctx=document.querySelector("canvas").getContext("2d");ctx.fillStyle="#456734";ctx.fillRect(0,0,1600,1200);</script><script type="module" src="/web/mobile.mjs"></script>'}));
 await page.goto(origin+'/touchfixture?mobile=1');await page.waitForSelector('#mobile-app');
 await page.evaluate(()=>{const cells=[];for(let r=0;r<11;r++)for(let c=1;c<16;c++)cells.push({hex:r*17+c,x:36+(r%2===0?22:0)+44*c,y:112+42*r,reachable:true});window.dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'battle',round:1,canAct:true,canRetreat:true,canAutoCombat:true,activeStack:1,activeUnit:{id:1,name:'Bobope',count:4},focus:{x:102,y:490},battleUnits:[{stackId:1,id:1,name:'Bobope',count:4,x:102,y:490,occupied:[154],enemy:false}],battleCells:cells}}));});
 await page.waitForTimeout(150);await page.locator('[data-ui=battle-view]').tap();await page.waitForTimeout(250);
 const update=patch=>page.evaluate(patch=>window.dispatchEvent(new CustomEvent('goonk-state',{detail:{...goonkMobileState,...patch}})),patch);

 const auto=page.locator('[data-ui=battle-auto]'),view=page.locator('[data-ui=battle-view]');
 const countAuto=()=>page.evaluate(()=>calls.filter(c=>c[0]==='command'&&c[1]===44).length);
 // Safari's delayed click can land on a neighbor after a view/layout change.
 await auto.evaluate(b=>b.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,detail:1})));
 if(await countAuto()!==0)throw Error('View touch leaked into autocombat');
 await auto.tap();if(await countAuto()!==1)throw Error('Autocombat must activate exactly once');
 await view.evaluate(b=>b.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,detail:1})));
 if(await page.locator('#mobile-app').getAttribute('data-battle-camera')!=='close')throw Error('Auto touch changed view');
 await update({autoCombat:true});await auto.tap();if(await countAuto()!==2)throw Error('Stop auto must activate exactly once');await update({autoCombat:false});
 let v=await view.boundingBox(),a=await auto.boundingBox();await page.mouse.move(v.x+v.width/2,v.y+v.height/2);await page.mouse.down();await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.up();
 if(await countAuto()!==2)throw Error('Sliding between buttons must cancel');
 for(const [width,height]of [[390,844],[320,568],[568,320],[844,390],[390,844]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(180);
  const min=height>width&&height<650?48:52;
  for(const ui of ['battle-view','battle-auto','battle-retreat','target','targets','wait','defend']){
   const b=page.locator('[data-ui='+ui+']'),r=await b.boundingBox();if(!r||r.height<min||r.width<44||r.x<0||r.y<0||r.x+r.width>width+1||r.y+r.height>height+1)throw Error(ui+' has inaccessible bounds '+JSON.stringify(r));
   if(!await b.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}))throw Error(ui+' has an overlapping hit target');
  }
  const root=await page.locator('#mobile-app').evaluate(e=>({width:e.clientWidth,scroll:e.scrollWidth,height:e.clientHeight,scrollHeight:e.scrollHeight}));if(root.scroll>root.width+1||root.scrollHeight>root.height+1)throw Error('Overflow '+JSON.stringify(root));
  v=await view.boundingBox();a=await auto.boundingBox();if(v.x<a.x+a.width&&v.x+v.width>a.x&&v.y<a.y+a.height&&v.y+v.height>a.y)throw Error('View and auto overlap');
  await view.tap();const expected=await page.locator('#mobile-app').getAttribute('data-battle-camera');await auto.evaluate(b=>b.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,detail:1})));if(await countAuto()!==2)throw Error('Rotation/view retargeted click');
 }
 await view.focus();await page.keyboard.press('Enter');if(await countAuto()!==2)throw Error('Keyboard view activated auto');
 const pixel=await page.evaluate(async()=>{
  const {paintBattleFloor}=await import('/web/battle-floor.mjs'),c=document.createElement('canvas');c.width=800;c.height=555;const ctx=c.getContext('2d');ctx.fillStyle='rgb(20,30,40)';ctx.fillRect(0,0,800,555);ctx.fillStyle='rgb(20,50,220)';ctx.fillRect(280,210,40,90);
  const actor={stackId:1,x:102,y:112,enemy:false,occupied:[18]},state={mode:'battle',round:1,canAct:true,activeStack:1,battleUnits:[actor],battleCells:[{hex:54,x:300,y:280,reachable:true},{hex:55,x:420,y:280,reachable:true}]},layout={x:0,y:0,w:800,h:555,dx:0,dy:0,scale:1};
  paintBattleFloor(ctx,state,layout,[{stackId:9,x:280,y:210,w:40,h:90,renderX:300,renderY:280}]);
  const body=ctx.getImageData(280,210,40,90).data;let changed=0;for(let i=0;i<body.length;i+=4)if(body[i]!==20||body[i+1]!==50||body[i+2]!==220)changed++;
  const all=ctx.getImageData(380,245,80,75).data;let gold=0;for(let i=0;i<all.length;i+=4)if(all[i]>200&&all[i+1]>160&&all[i+2]<180)gold++;
  return{changed,gold};
 });if(pixel.changed!==0||!pixel.gold)throw Error('Grid body occlusion failed '+JSON.stringify(pixel));
 // A request sent just before a native transition must not need a second tap.
 await update({mode:'battle',round:1,autoCombat:false,canAutoCombat:true,canAct:true});
 const beforeRetry=await countAuto();await auto.tap();await update({canAutoCombat:false});
 if(await auto.getAttribute('aria-busy')!=='true'||!await auto.isDisabled())throw Error('Native transition discarded the first autocombat press');
 await page.waitForTimeout(600);if(await countAuto()!==beforeRetry+1)throw Error('Unavailable engine must not receive retries');
 await update({canAutoCombat:true});await page.waitForFunction(n=>calls.filter(c=>c[0]==='command'&&c[1]===44).length>=n,beforeRetry+2);
 await update({autoCombat:true});if(await auto.getAttribute('aria-busy')!=='false'||!await auto.isEnabled())throw Error('Autocombat acknowledgement must release the control');
 if(errors.length)throw Error(errors.join(';'));
 console.log(kind,'PASS: no retargeted clicks, auto once, drag cancellation, keyboard, large hit targets, rotations, zero grid pixels over corpse',pixel);
 await browser.close();
}
}finally{server.close();}
