import {chromium,webkit} from '../../../work/browser-tests/node_modules/playwright-core/index.mjs';
import {silenceTestAudio} from '../../../work/browser-tests/silent-audio.mjs';
import assert from 'node:assert/strict';
for(const [name,type]of Object.entries({chromium,webkit}).filter(([n])=>!process.env.CROSSOVER_BROWSER||n===process.env.CROSSOVER_BROWSER)){
 const browser=await type.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await silenceTestAudio(page);const errors=[];
  page.on('pageerror',error=>errors.push(error.message));page.on('crash',()=>errors.push('page crash'));
  await page.addInitScript(()=>{try{sessionStorage.setItem('heroes-goonk.storage-failed','true');}catch{}window.speedMagic=[];addEventListener('goonk-crossover-magic',e=>speedMagic.push(structuredClone(e.detail)));});
  await page.goto(process.env.CROSSOVER_URL||'http://127.0.0.1:8784/heroes-starcraft/battle.html');await page.waitForFunction(()=>window.goonkMobileState?.mode==='menu',null,{timeout:120000});
  await page.locator('#crossover-demo').click({timeout:180000});await page.locator('#crossover-field').waitFor({state:'visible',timeout:180000});
  const book=page.locator('#crossover-spellbook-root .mobile-spellbook');
  const cast=async id=>{
   const sc=await(await page.locator('iframe[data-crossover-engine]').elementHandle()).contentFrame();
   const ready=await page.evaluate(id=>[...speedMagic].reverse().find(r=>r.ok)?.catalogue.spells.find(s=>s.id===id&&s.caster===-1)?.ready||0,id);
   if(await sc.evaluate(()=>openbwCrossover.isPaused()))await sc.evaluate(()=>openbwCrossover.start());
   await sc.waitForFunction(ready=>openbwCrossover.frame()>=ready,ready,{timeout:15000});
   await page.locator('#crossover-spells').click();await book.waitFor({state:'visible'});await book.locator('[data-spell-caster-select]').selectOption('-1');await book.locator('[data-school="0"]').click();
   const spell=book.locator(`[data-spell-id="${id}"][data-spell-caster="-1"]`);
   for(let p=0;p<6&&!await spell.count();p++)await book.locator('[data-page="1"]').click();
   const previous=await page.evaluate(()=>speedMagic.length);await spell.click();await book.locator('[data-cast-spell]').click();
   await page.waitForFunction(({id,previous})=>speedMagic.slice(previous).some(r=>r.ok&&r.events?.some(e=>e.id===id)),{id,previous},{timeout:15000});
   return await page.evaluate(({id,previous})=>speedMagic.slice(previous).find(r=>r.ok&&r.events?.some(e=>e.id===id)),{id,previous});
  };
  const haste=await cast(53);assert(haste.groups.some(g=>g.creature.startsWith('tum-era:')&&g.movementScale>1000),'real native Haste accelerates Heroes');
  const slow=await cast(54);const scUnits=slow.groups.filter(g=>g.creature.startsWith('heroes-starcraft:')&&g.count>0);assert.equal(scUnits.length,6);assert(scUnits.every(g=>g.movementScale<1000),'real native Slow affects every StarCraft faction');
  console.log(name,'native Haste and Slow effects',slow.groups.map(g=>({creature:g.creature,scale:g.movementScale})));
  await page.locator('#crossover-cancel').click();await page.waitForFunction(()=>!document.querySelector('#crossover-arena')&&goonkMobileState.canAct,null,{timeout:30000});assert.equal(await page.locator('iframe[data-crossover-engine]').count(),0,'no new archive or engine allocation at classic return');
  await page.locator('#crossover-realtime').click();await page.locator('#crossover-field').waitFor({state:'visible',timeout:60000});
  const transferred=await page.evaluate(()=>[...speedMagic].reverse().find(r=>r.ok&&r.catalogue.frame===0));assert(transferred);for(const group of scUnits)assert.equal(transferred.groups.find(g=>g.id===group.id).movementScale,group.movementScale,'Slow remains active after classic round trip');
  assert(transferred.groups.some(g=>g.creature.startsWith('tum-era:')&&g.movementScale>1000),'Haste remains active on return to RTS');
  await cast(35);const dispel=await page.evaluate(()=>[...speedMagic].reverse().find(r=>r.ok&&r.events?.some(e=>e.id===35)));assert(dispel.groups.filter(g=>g.count>0).every(g=>g.movementScale===1000),'Dispel restores normal movement on both armies');
  assert.deepEqual(errors,[]);console.log(name,'Haste, Slow, native effects after mode switches and Dispel verified');
 }finally{await browser.close();}
}
