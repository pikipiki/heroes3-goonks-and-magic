import {chromium,webkit} from '../../../work/browser-tests/node_modules/playwright-core/index.mjs';
import {silenceTestAudio} from '../../../work/browser-tests/silent-audio.mjs';
import assert from 'node:assert/strict';
for(const [name,type] of Object.entries({chromium,webkit}).filter(([n])=>!process.env.CROSSOVER_BROWSER||n===process.env.CROSSOVER_BROWSER)){
 const browser=await type.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});await silenceTestAudio(page);
  const errors=[];let playing=false;page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('page crash'));page.on('framenavigated',f=>{if(playing&&f===page.mainFrame())errors.push('unexpected game reboot');});
  await page.addInitScript(()=>{
   window.startupStats={archiveGets:0,engineStarts:0,maxPixels:0,engineBytes:0,preparedBeforeEngine:false};
   const get=IDBObjectStore.prototype.get;IDBObjectStore.prototype.get=function(...args){if(this.name==='archives')startupStats.archiveGets++;return get.apply(this,args);};
   const Image=window.ImageData;window.ImageData=new Proxy(Image,{construct(target,args){const result=Reflect.construct(target,args);if(window.measureStartup)startupStats.maxPixels=Math.max(startupStats.maxPixels,result.width*result.height);return result;}});
   for(const method of ['instantiate','instantiateStreaming']){const original=WebAssembly[method].bind(WebAssembly);WebAssembly[method]=async(...args)=>{const result=await original(...args),instance=result.instance||result;if(instance.exports.openbw_frame){parent.startupStats.engineStarts++;window.startupNativeMemory=instance.exports.memory;startupStats.engineBytes=startupNativeMemory.buffer.byteLength;startupStats.preparedBeforeEngine=!!parent.goonkCrossoverArt?.ready;}return result;};}
   addEventListener('goonk-crossover-art',()=>{if(window.abortPreparation&&!window.goonkCrossoverArt?.ready){const cancel=document.querySelector('#crossover-cancel');if(cancel){window.abortPreparation=false;cancel.click();}}});
  });
  await page.goto(process.env.CROSSOVER_URL||'http://127.0.0.1:8784/heroes-starcraft/battle.html');await page.waitForFunction(()=>window.goonkMobileState?.mode==='menu',null,{timeout:120000});
  await page.evaluate(abort=>{window.measureStartup=true;window.abortPreparation=abort;},process.env.ABORT_PREP==='1');playing=true;
  await page.locator('#crossover-demo').click({timeout:180000});
  if(process.env.ABORT_PREP==='1'){
   await page.waitForFunction(()=>!window.abortPreparation&&!document.querySelector('#crossover-arena')&&goonkMobileState.mode==='battle'&&goonkMobileState.canAct,null,{timeout:60000});
   assert.equal(await page.evaluate(()=>startupStats.engineStarts),0,'cancel before allocating StarCraft');
   assert.equal(await page.locator('iframe[data-crossover-engine]').count(),0);
   await page.locator('#crossover-realtime').click();
  }
  await page.locator('#crossover-field').waitFor({state:'visible',timeout:60000});
  const sc=await(await page.locator('iframe[data-crossover-engine]').elementHandle()).contentFrame();
  const host=await sc.evaluate(()=>({...startupStats,engineBytes:startupNativeMemory.buffer.byteLength,units:openbwCrossover.census().units.filter(u=>u.hp>0).map(u=>({heroes:u.heroes,stackId:u.stackId}))})),state=await page.evaluate(()=>({stats:startupStats,heap:Module.HEAPU8.byteLength,ready:goonkCrossoverArt.ready,rows:goonkCrossoverArt.rows.map(r=>({id:r.id,width:r.canvas.width,height:r.canvas.height})),clips:goonkCrossoverSpellArt.rows.filter(row=>row.kind!=='obstacle'&&row.kind!=='weapon').length,spells:goonkCrossoverSpellIcons.rows.length}));
  assert.equal(host.units.filter(u=>u.heroes).length,7,'one Heroes creature per type');assert.equal(host.units.filter(u=>!u.heroes).length,12);
  assert.equal(host.archiveGets,3,'the host reads each archive only once');assert(host.preparedBeforeEngine,'Hero media is complete before allocating the RTS simulation');
  assert.equal(state.rows.length,7);assert(state.rows.every(r=>r.width*r.height<=2*1024*1024),'bounded creature sheets');assert(state.stats.maxPixels<=2*1024*1024,'no huge browser pixel transfer during startup');
  assert.equal(state.clips,0,'no bulk spell animation loading');assert(state.spells>=60,'full spell catalogue retained');
  await page.evaluate(()=>{window.startupClassicAtlas=window.goonkBattleAtlas;});
  const paused=await sc.evaluate(()=>openbwCrossover.isPaused());if(paused)await page.locator('#crossover-start').click();await sc.waitForFunction(()=>openbwCrossover.frame()>=120,null,{timeout:15000});
  assert(await page.evaluate(()=>window.goonkBattleAtlas===window.startupClassicAtlas),'hidden classic rendering stays suspended during RTS');
  await page.locator('#crossover-cancel').click();await page.waitForFunction(()=>!document.querySelector('#crossover-arena')&&goonkMobileState.canAct,null,{timeout:30000});
  assert.deepEqual(errors,[]);console.log(name,process.env.ABORT_PREP==='1'?'cancellable preparation':'automatic startup',JSON.stringify({host,...state}));
 }finally{await browser.close();}
}
