// Check the original track is loaded by Heroes' native mixer, not a second
// overlay player, and that one mute control covers music and RTS effects.
import {chromium,webkit} from '../../../work/browser-tests/node_modules/playwright-core/index.mjs';
import {silenceTestAudio} from '../../../work/browser-tests/silent-audio.mjs';
import assert from 'node:assert/strict';
for(const [name,type] of Object.entries({chromium,webkit}).filter(([n])=>!process.env.CROSSOVER_BROWSER||n===process.env.CROSSOVER_BROWSER)){
 const browser=await type.launch({headless:true});try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await silenceTestAudio(page);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(/Failed to load.*music|Cannot open.*terran|Unable to play music/i.test(m.text())){errors.push(m.text());console.log(m.text());}});
  await page.goto(process.env.CROSSOVER_URL||'http://127.0.0.1:8784/heroes-starcraft/battle.html?mobile=1');
  await page.waitForFunction(()=>window.goonkMobileState?.mode==='menu',null,{timeout:180000});
  await page.evaluate(()=>{
   window.terranAudio={files:[],energy:0,samples:0};
   const open=Module.FS.open;Module.FS.open=function(path,...args){if(typeof path==='string'&&/terran1\.ogg$/i.test(path))terranAudio.files.push(path);return open.call(this,path,...args);};
  });
  await page.locator('#crossover-demo').click({timeout:90000});await page.locator('#crossover-field').waitFor({state:'visible',timeout:90000});
  await page.waitForFunction(()=>terranAudio.files.length>0,null,{timeout:20000});await page.waitForTimeout(5500);
  const rms=async()=>{await page.evaluate(()=>{terranAudio.energy=terranAudio.samples=0;const node=Module.SDL2.audio.scriptProcessorNode;if(!node.terranObserved){node.terranObserved=true;const render=node.onaudioprocess;node.onaudioprocess=function(event){render.call(this,event);const data=event.outputBuffer.getChannelData(0);for(const sample of data)terranAudio.energy+=sample*sample;terranAudio.samples+=data.length;};}});await page.waitForTimeout(650);return page.evaluate(()=>Math.sqrt(terranAudio.energy/Math.max(1,terranAudio.samples)));};
  const playing=await rms();assert(playing>.0001,'native Terran music produces real PCM audio while the simulation is paused');
  await page.locator('#crossover-sound').click();await page.waitForFunction(()=>goonkMobileState.audioMuted);await page.waitForTimeout(350);
  assert(await rms()<.00001,'RTS mute also silences the native music');
  await page.locator('#crossover-sound').click();await page.waitForFunction(()=>!goonkMobileState.audioMuted);assert(await rms()>.0001,'one sound control restores the native music');
  await page.locator('#crossover-cancel').click();await page.waitForFunction(()=>!document.querySelector('#crossover-arena')&&goonkMobileState.canAct,null,{timeout:30000});
  assert(await rms()>.0001,'music continues when returning to classic combat');
  const reads=await page.evaluate(()=>terranAudio.files.length);assert.equal(reads,1,'the same native track stays loaded across the presentation switch');assert.deepEqual(errors,[]);
  console.log(name+': native Terran music, mute, unmute, classic continuity verified; RMS='+playing);
 }finally{await browser.close();}
}
