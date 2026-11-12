import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
const kind=process.env.BROWSER||'chromium',browser=await(kind==='webkit'?webkit:chromium).launch(kind==='webkit'?{}:{executablePath:process.env.CHROME_PATH});const context=await browser.newContext({viewport:{width:390,height:740},hasTouch:true,bypassCSP:true,serviceWorkers:'block'});const p=await context.newPage();p.setDefaultTimeout(120000);await silenceTestAudio(p);await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));const cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]);const wait=f=>p.waitForFunction(f,null,{timeout:120000});
try{
 await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8777')+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done');await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.maps?.some(m=>/bow.*hope/i.test(m.name)));const map=await p.evaluate(()=>goonkMobileState.maps.find(m=>/bow.*hope/i.test(m.name)));await cmd(24,map.index);await wait(()=>/bow.*hope/i.test(goonkMobileState.selectedMap)&&goonkMobileState.lobbyReady);await cmd(22);await wait(()=>goonkMobileState.turn);for(let n=0;n<10;n++){if(await p.evaluate(()=>goonkMobileState.mode==='map'))break;await cmd(1);await p.waitForTimeout(400);}await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);await cmd(5,0);await wait(()=>goonkMobileState.mode==='town'&&goonkMobileState.buildings?.length>0);

 await p.locator('[data-ui=town-fort]').tap();await wait(()=>goonkMobileState.mode==='fort');assert(await p.locator('.hall-families [data-family-select]').count()>0);

 const position=()=>p.locator('.hall-families').evaluate(e=>({top:e.scrollTop,step:e.firstElementChild.getBoundingClientRect().height+parseFloat(getComputedStyle(e).rowGap)}));
 for(const size of [{width:390,height:740},{width:844,height:390},{width:768,height:1024}]){
  await p.setViewportSize(size);await p.waitForTimeout(300);const card=p.locator('.hall-family').last().locator('.hall-form').first();await card.tap();const before=await position();assert(before.top>0);await p.waitForTimeout(1200);const updated=await position();assert(Math.abs(updated.top-before.top*updated.step/before.step)<3,'Native preview keeps the deep tier in view');
  await p.locator('.hall-actions [data-type-info]').tap();await wait(()=>goonkMobileState.mode==='creature');await p.locator('[data-presentation-close]').tap();await wait(()=>goonkMobileState.mode==='fort');await p.waitForTimeout(500);const after=await position();assert(Math.abs(after.top-before.top*after.step/before.step)<3,'Native details return preserves recruitment scroll');
 }
 console.log('PASS',kind,'native deep-tier recruitment preview and details preserve scroll on phone and iPad');
}finally{await browser.close();}
