// Run against a prepared local site. Uses a fresh browser profile and keeps the
// same live game through lifecycle suspension; it never reloads to mask a hang.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),page=await context.newPage(),cdp=await context.newCDPSession(page),report={cycles:[],errors:[]};
page.on('pageerror',e=>report.errors.push(e.message));
await page.addInitScript(()=>{window.nativeStateEvents=0;window.addEventListener('goonk-state',()=>nativeStateEvents++);});
const wait=fn=>page.waitForFunction(fn,null,{timeout:120000}),click=name=>page.getByRole('button',{name,exact:true}).click();
async function resume(label,expected){
 const origin=await page.evaluate(()=>performance.timeOrigin);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('blur'));window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));});
 await cdp.send('Page.setWebLifecycleState',{state:'frozen'});
 await new Promise(r=>setTimeout(r,300));
 await cdp.send('Page.setWebLifecycleState',{state:'active'});await page.bringToFront();
 const count=await page.evaluate(()=>{delete document.hidden;delete document.visibilityState;document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('focus'));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));return nativeStateEvents;});
 await page.waitForFunction(n=>nativeStateEvents>n,count,{timeout:10000});
 const state=await page.evaluate(()=>({origin:performance.timeOrigin,mode:goonkMobileState.mode}));
 assert.equal(state.origin,origin,'Resume must retain the live page');if(expected)assert.equal(state.mode,expected);
 report.cycles.push({label,mode:state.mode});
}
try{
 await page.goto(process.env.GOONK_TEST_URL||'http://127.0.0.1:8767/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu');
 await click('Nouvelle aventure');await wait(()=>goonkMobileState.maps?.length);
 const map=await page.evaluate(()=>goonkMobileState.maps.find(m=>m.name.includes('Château Goonk')));assert(map);
 await page.locator('#mobile-map-select').selectOption(String(map.index));await page.waitForFunction(n=>goonkMobileState.selectedMap===n,map.name);await click('Commencer');await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.heroName);
 await resume('map','map');
 await page.evaluate(()=>Module._vcmiMobilePointer(433,281,4));await wait(()=>goonkMobileState.hasPath);await click('➤ Marcher');await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct);
 if(await page.evaluate(()=>goonkMobileState.tacticsMode)){await wait(()=>goonkMobileState.canEndTactics);await click('⚔ Combattre');}
 await wait(()=>goonkMobileState.round>=1&&goonkMobileState.canAct);await resume('manual battle','battle');
 await page.locator('[data-ui=battle-auto]').click();await wait(()=>goonkMobileState.autoCombat||goonkMobileState.mode==='dialog');
 for(let i=0;i<4;i++)await resume('autocombat '+i);
 await wait(()=>goonkMobileState.mode==='dialog');
 for(let i=0;i<3;i++)await resume('victory '+i,'dialog');
 await click('✓ Valider');await wait(()=>goonkMobileState.mode==='map');await resume('map after victory','map');
 assert.deepEqual(report.errors,[]);report.victoryRemainsInteractive=true;console.log(JSON.stringify(report));
}catch(e){report.failure=e.stack;throw e;}finally{
 if(process.env.GOONK_TEST_OUTPUT){fs.mkdirSync(process.env.GOONK_TEST_OUTPUT,{recursive:true});fs.writeFileSync(path.join(process.env.GOONK_TEST_OUTPUT,'background-resume.json'),JSON.stringify(report,null,2));}
 await browser.close();
}
