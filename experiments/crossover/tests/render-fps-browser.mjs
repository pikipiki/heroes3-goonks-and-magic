import {chromium,webkit} from '../../../work/browser-tests/node_modules/playwright-core/index.mjs';
import {silenceTestAudio} from '../../../work/browser-tests/silent-audio.mjs';import assert from 'node:assert/strict';
const entry=process.env.CROSSOVER_URL||'http://127.0.0.1:8784/heroes-starcraft/battle.html';
for(const [name,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true});try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await silenceTestAudio(page);
  await page.addInitScript(()=>{
   sessionStorage.setItem('heroes-goonk.storage-failed','true');
   const fills=CanvasRenderingContext2D.prototype.fillRect;
   globalThis.testRenderTimes=[];globalThis.testRenderPositions=[];
   CanvasRenderingContext2D.prototype.fillRect=function(...args){if(this.canvas.id==='crossover-field'&&args[0]===0&&args[1]===0&&args[2]===800&&args[3]===500)testRenderTimes.push(performance.now());return fills.apply(this,args);};
   const translate=CanvasRenderingContext2D.prototype.translate;
   CanvasRenderingContext2D.prototype.translate=function(x,y){if(this.canvas.id==='crossover-field')testRenderPositions.push([performance.now(),x,y]);return translate.call(this,x,y);};
  });
  await page.goto(entry);await page.locator('#crossover-demo').click({timeout:180000});await page.locator('#crossover-field').waitFor({state:'visible',timeout:180000});
  const sc=await(await page.locator('iframe[data-crossover-engine]').elementHandle()).contentFrame();assert(sc);
  await sc.evaluate(()=>{const api=openbwCrossover,original=api.sprite;globalThis.testSpriteReads=[];api.sprite=id=>{testSpriteReads.push([api.frame(),id]);return original.call(api,id);};});
  for(const viewport of [{width:390,height:844},{width:844,height:390}]){
   await page.setViewportSize(viewport);await page.evaluate(()=>{testRenderTimes=[];testRenderPositions=[];});await page.waitForTimeout(3200);
   const result=await page.evaluate(()=>{const times=testRenderTimes;return {frames:times.length,fps:(times.length-1)*1000/(times.at(-1)-times[0])};});
   assert(result.fps>=46&&result.fps<=53,`${name} ${viewport.width}×${viewport.height}: ${result.fps.toFixed(1)} fps`);
   console.log(name,viewport,result);
  }
  await page.evaluate(()=>{testRenderTimes=[];testRenderPositions=[];});
  await page.locator('#crossover-start').click();
  await page.locator('[data-crossover-group="1"]').click();
  const bounds=await page.locator('#crossover-field').boundingBox();assert(bounds);
  await page.locator('#crossover-field').click({position:{x:bounds.width*.08,y:bounds.height*.92}});
  await sc.waitForFunction(()=>openbwCrossover.frame()>80,null,{timeout:10000});
  const activeFps=await page.evaluate(()=>{const times=testRenderTimes;return (times.length-1)*1000/(times.at(-1)-times[0]);});
  assert(activeFps>=46&&activeFps<=53,`${name} active combat: ${activeFps.toFixed(1)} fps`);console.log(name+' active combat: '+activeFps.toFixed(1)+' fps');
  const reads=await sc.evaluate(()=>testSpriteReads);assert.equal(new Set(reads.map(([frame,id])=>frame+':'+id)).size,reads.length,'native sprites are captured only once per unit and native tick');
  const fractions=await page.evaluate(()=>testRenderPositions.filter(([,x,y])=>Math.abs(x-Math.round(x))>.01||Math.abs(y-Math.round(y))>.01).length);assert(fractions>0,'intermediate positions are rendered between integer native snapshots');
  console.log(name+': sub-tick movement and sprite-cache reuse verified');
 }finally{await browser.close();}
}
