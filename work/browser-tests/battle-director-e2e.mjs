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
 await page.addInitScript(()=>localStorage.setItem('heroes-goonk.language','fr'));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/touchfixture?mobile=1',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/web/mobile.css"><link rel="stylesheet" href="/web/h3-theme.css"><canvas id="canvas" width="1600" height="1200"></canvas><script>window.calls=[];window.Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...a){calls.push(["command",...a])},_vcmiMobilePointer(...a){calls.push(["pointer",...a])}};const ctx=document.querySelector("canvas").getContext("2d");ctx.fillStyle="#456734";ctx.fillRect(0,0,1600,1200);</script><script type="module" src="/web/mobile.mjs"></script>'}));
 await page.goto(origin+'/touchfixture?mobile=1');await page.waitForSelector('#mobile-app');
 await page.evaluate(()=>{const cells=[];for(let r=0;r<11;r++)for(let c=1;c<16;c++)cells.push({hex:r*17+c,x:36+(r%2===0?22:0)+44*c,y:112+42*r,reachable:true});window.dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'battle',round:1,canAct:true,activeStack:1,activeUnit:{id:1,name:'Bobope',count:4},focus:{x:102,y:490},battleUnits:[{stackId:1,id:1,name:'Bobope',count:4,x:102,y:490,occupied:[154],enemy:false}],battleCells:cells}}));});
 await page.waitForTimeout(150);await page.locator('[data-ui=battle-view]').tap();await page.waitForTimeout(250);
 const update=patch=>page.evaluate(patch=>window.dispatchEvent(new CustomEvent('goonk-state',{detail:{...goonkMobileState,...patch}})),patch);
 await update({mode:'dialog'});await update({mode:'battle'});await page.waitForTimeout(150);if(await page.locator('#mobile-app').getAttribute('data-battle-layout')!=='dual')throw Error('Spellbook return lost the close view');
 const ally={stackId:1,id:1,name:'Bobope',count:4,x:102,y:490,occupied:[154],enemy:false},enemy={stackId:2,id:2,name:'Adversaire',count:7,x:718,y:196,enemy:true};
 await update({battleUnits:[ally,enemy],battleCamera:{sequence:1,active:true,kind:'move',actor:{...ally,x:300,y:364},path:[{x:102,y:490},{x:300,y:364}],destination:{x:300,y:364}}});await page.waitForTimeout(300);
 if(!(await page.locator('.battle-detail-label').textContent()).includes('Déplacement en cours'))throw Error('Movement follow label');
 await page.locator('#battle-strategic-scene').tap({position:{x:200,y:100}});await page.waitForTimeout(100);
 if(await page.locator('.battle-follow-action').count())throw Error('Unexpected follow button');
 if(!(await page.locator('.battle-detail-label').textContent()).includes('Exploration manuelle'))throw Error('Manual exploration label');
 await update({canAct:false});
 if(!(await page.locator('.battle-detail-label').textContent()).includes('Exploration manuelle'))throw Error('Repeated snapshot interrupted exploration');
 await update({battleCamera:{sequence:2,active:true,kind:'attack',actor:enemy,targets:[ally]}});await page.waitForTimeout(300);if(!(await page.locator('.battle-detail-label').textContent()).includes('Bobope'))throw Error('Enemy attack target');
 await update({battleCamera:{sequence:3,active:true,kind:'spell',actor:null,label:'Explosion',targets:[ally,enemy]}});await page.waitForTimeout(900);if(!(await page.locator('.battle-detail-label').textContent()).includes('2 cibles'))throw Error('Area spell targets');
 if(process.env.GOONK_TEST_OUTPUT)await page.screenshot({path:path.join(process.env.GOONK_TEST_OUTPUT,'battle-director-'+kind+'.png')});
 await page.setViewportSize({width:320,height:568});await page.waitForTimeout(200);await page.setViewportSize({width:844,height:390});await page.waitForTimeout(200);await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);
 await page.locator('[data-ui=battle-view]').tap();await page.waitForTimeout(100);if(await page.locator('.battle-follow-action').isVisible())throw Error('Follow button in whole view');
 if(errors.length)throw Error(errors.join(';'));
 console.log(kind,'PASS: moving actor, enemy target, allied/area spells, manual exploration, automatic follow and rotations');
 await browser.close();
}
}finally{server.close();}
