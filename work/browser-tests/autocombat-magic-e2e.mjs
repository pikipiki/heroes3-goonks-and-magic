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

 const update=patch=>page.evaluate(patch=>dispatchEvent(new CustomEvent('goonk-state',{detail:{...goonkMobileState,...patch}})),patch);
 await update({heroHasSpellbook:true,heroCanCast:true,canUseMagic:true,manualControl:true});await page.waitForTimeout(200);const magic=page.locator('[data-ui=battle-magic]');if(!await magic.isEnabled())throw Error('Manual magic should be ready');
 await page.locator('[data-ui=battle-auto]').tap();if(!await magic.isDisabled())throw Error('Pending auto activation must immediately lock magic');
 await update({autoCombat:true,manualControl:false,canAct:true});if(!await magic.isDisabled())throw Error('Autocombat must lock magic even with a stale active actor');
 await page.locator('[data-ui=battle-auto]').tap();await update({autoCombat:false,manualControl:false,canAct:true});if(!await magic.isDisabled())throw Error('Stopping must wait for AI ownership release');
 await update({manualControl:true,heroCanCast:false,heroSpellCastLimitReached:true});if(!await magic.isDisabled())throw Error('Stopping auto must not grant another hero cast in the same round');if(!/next round/.test(await page.locator('.battle-selection').textContent()))throw Error('Round limit must be explained');
 await update({round:2,heroCanCast:true,heroSpellCastLimitReached:false});if(!await magic.isEnabled())throw Error('Magic must recover when native permission returns next round');await magic.tap();const cast=await page.evaluate(()=>calls.filter(c=>c[0]==='command'&&c[1]===14));if(cast.length!==1)throw Error('Only the final manual tap may open magic');
 if(errors.length)throw Error(errors.join(';'));console.log('PASS',kind,'auto start/stop locks magic during handoff and restores native round permission');await browser.close();
}}finally{server.close();}
