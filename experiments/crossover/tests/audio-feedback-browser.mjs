import {chromium,webkit} from '../../../work/browser-tests/node_modules/playwright-core/index.mjs';
import {battleView} from '../public/shared-field.js';
import {silenceTestAudio} from '../../../work/browser-tests/silent-audio.mjs';
import assert from 'node:assert/strict';
const entry=process.env.CROSSOVER_URL||'http://127.0.0.1:8784/heroes-starcraft/battle.html';
for(const [name,type]of Object.entries({chromium,webkit}).filter(([name])=>!process.env.CROSSOVER_BROWSER||name===process.env.CROSSOVER_BROWSER)){
 const browser=await type.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await silenceTestAudio(page);
  await page.addInitScript(()=>{
   sessionStorage.setItem('heroes-goonk.storage-failed','true');localStorage.setItem('openbw-muted','0');
   if(!location.pathname.includes('/starcraft/'))return;
   // Observe original MPQ-backed native sound buffers, not the confirmation tones.
   const stats={nativeSounds:0,nonzeroSamples:0,positiveVolumeSounds:0,tones:0};globalThis.testBattleAudio=stats;
   const links=new WeakMap(),connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(destination,...args){links.set(this,destination);return connect.call(this,destination,...args);};
   const start=AudioBufferSourceNode.prototype.start;
   AudioBufferSourceNode.prototype.start=function(...args){stats.nativeSounds++;if(links.get(this)?.gain?.value>0)stats.positiveVolumeSounds++;if(this.buffer&&this.buffer.getChannelData(0).some(value=>Math.abs(value)>.0001))stats.nonzeroSamples++;return start.apply(this,args);};
   const tone=OscillatorNode.prototype.start;OscillatorNode.prototype.start=function(...args){stats.tones++;return tone.apply(this,args);};
  });
  console.log(name+': loading the Heroes menu');
  page.on('pageerror',error=>console.log(name+': '+error.message));
  await page.goto(entry);
  await page.waitForFunction(()=>window.goonkMobileState?.mode==='menu'||document.querySelector('#hosting-retry')?.hidden===false,null,{timeout:90000});
  if(await page.locator('#hosting-retry:visible').count())throw Error(await page.locator('#hosting-status').innerText());
  await page.locator('#crossover-demo').click({timeout:30000});
  console.log(name+': demo requested');
  await page.locator('#crossover-field').waitFor({state:'visible',timeout:180000});
  const sc=await(await page.locator('iframe[data-crossover-engine]').elementHandle()).contentFrame();assert(sc);
  console.log(name+': battlefield ready');
  await page.locator('#crossover-select-all').click();
  await page.locator('#crossover-attack').click();
  assert.equal(await page.locator('#crossover-attack').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#crossover-field').getAttribute('data-attack-mode'),'armed');
  assert.match(await page.locator('#crossover-selection').innerText(),/touche un ennemi/);
  await sc.waitForFunction(()=>openbwCrossover.audioState().state==='running',null,{timeout:5000});
  const census=await sc.evaluate(()=>openbwCrossover.census()),camera=await sc.evaluate(()=>openbwCrossover.camera());
  const view=battleView(census.units.filter(unit=>unit.stackId>=0),camera),enemy=census.units.find(unit=>unit.owner===1);assert(enemy);
  const box=await page.locator('#crossover-field').boundingBox();
  await page.mouse.click(box.x+((enemy.x-camera.x)*view.zoom+view.x)*box.width/800,box.y+((enemy.y-camera.y)*view.zoom+view.y)*box.height/500);
  assert.equal(await page.locator('#crossover-field').getAttribute('data-order-feedback'),'attack');
  assert.equal(await page.locator('#crossover-attack').getAttribute('aria-pressed'),'false');
  assert.match(await page.locator('#crossover-selection').innerText(),/ordre d’attaque envoyé/);
  assert.match(await page.locator('#crossover-selection').innerText(),/Commencer le combat/);
  console.log(name+': attack order confirmed and audio running');
  const before=await sc.evaluate(()=>testBattleAudio.nativeSounds);
  await page.locator('#crossover-start').click();
  await sc.waitForFunction(()=>openbwCrossover.census().units.some(unit=>unit.hp<unit.maxHp),null,{timeout:15000});
  await sc.waitForFunction(before=>testBattleAudio.nativeSounds>before&&testBattleAudio.nonzeroSamples>0&&testBattleAudio.positiveVolumeSounds>0,before,{timeout:15000});
  assert((await sc.evaluate(()=>testBattleAudio.tones))>=3);
  await page.locator('#crossover-sound').click();assert.equal(await sc.evaluate(()=>openbwCrossover.audioState().muted),true);
  await page.locator('#crossover-sound').click();assert.equal(await sc.evaluate(()=>openbwCrossover.audioState().muted),false);
  console.log(name+': parent gestures unlock running native audio; real attack sound buffers, confirmation tones, attack marker and mute control verified');
 }finally{await browser.close();}
}
