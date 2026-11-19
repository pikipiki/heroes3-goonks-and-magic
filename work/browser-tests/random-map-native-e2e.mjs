import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {silenceTestAudio} from './silent-audio.mjs';
const report=[];
// Native WebKit can be selected explicitly; its wasm startup depends on the
// host's shared-memory support, independently of the UI fixture matrix.
const requested=process.env.GOONK_NATIVE_ENGINE||'chromium';
for(const[name,engine]of Object.entries({chromium,webkit}).filter(([name])=>name===requested)){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:430,height:932},hasTouch:true}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));page.on('crash',()=>errors.push('Page crashed'));
  await silenceTestAudio(page);
  console.log('BOOT',name);await page.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8784')+'/game.html?mobile=1');
  const wait=predicate=>page.waitForFunction(predicate,null,{timeout:180000});
  await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done');console.log('READY',name);
  await page.locator('[data-action="20"]').tap();
  await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady&&!!document.querySelector('[data-ui=begin]:enabled'));
  console.log('LOBBY',name);await page.locator('.custom-game-options [data-ui-accordion-summary]').tap();
  for(let i=0;i<3;i++)await page.locator('[data-setting=players] [data-counter="1"]').tap();
  await page.locator('[data-setting=humans] [data-counter="1"]').tap();
  await page.locator('[data-setting=size] label:has([value="72"])').tap();
  // Distinguish preparation from launch. All settings including WoG remain in
  // place until native acknowledgement; there is one deliberate final action.
  const position=await page.evaluate(()=>{const generator=document.querySelector('.custom-game-options'),wog=document.querySelector('.wog-options');return !wog||!!(wog.compareDocumentPosition(generator)&Node.DOCUMENT_POSITION_FOLLOWING);});assert(position,'Generator follows WoG choices');
  await page.evaluate(()=>{window.nativeRandomCalls=[];const native=Module._vcmiMobileCommand;Module._vcmiMobileCommand=(...args)=>{nativeRandomCalls.push(args);return native(...args);};window.nativeRandomPhases=[];addEventListener('goonk-state',event=>nativeRandomPhases.push({mode:event.detail.mode,session:event.detail.sessionState,custom:event.detail.customMap,config:event.detail.customMapOptions}));});
  console.log('GENERATE',name);await page.locator('[data-custom-generate]').tap();
  await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn||goonkMobileState.mode==='dialog'&&goonkMobileState.sessionState===6&&!!goonkMobileState.dialogPresentation);console.log('FIRST_GAMEPLAY',name,JSON.stringify(await page.evaluate(()=>({mode:goonkMobileState.mode,session:goonkMobileState.sessionState,day:goonkMobileState.day,dialog:goonkMobileState.dialogPresentation?.lines}))));if(await page.evaluate(()=>goonkMobileState.mode==='dialog')){await page.screenshot({path:`/tmp/random-map-first-dialog-${name}.png`});await page.evaluate(()=>Module._vcmiMobileCommand(1));}await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
  const result=await page.evaluate(()=>({calls:nativeRandomCalls,phases:nativeRandomPhases,mode:goonkMobileState.mode,loading:document.querySelector('#mobile-app').dataset.uiLoading}));
  assert.deepEqual(result.calls.filter(call=>call[0]===48).map(call=>call.slice(0,5)),[[48,5,2,72,0]]);
  assert.equal(result.calls.filter(call=>call[0]===22).length,1,'One launch');assert(result.calls.some(call=>call[0]===24),'Reopened lobby selects a scenario before configuration');
  assert.equal(result.loading,'false');assert.equal(result.mode,'map');assert.deepEqual(errors,[]);
  await page.screenshot({path:`/tmp/random-map-native-${name}.png`});report.push({engine:name,...result});
  console.log('PASS',name,'native random map 5 players / 2 humans / medium, reopened lobby, automatic launch and active map');
 }finally{await browser.close();}
}
fs.writeFileSync('/tmp/random-map-native-report.json',JSON.stringify(report,null,2));
