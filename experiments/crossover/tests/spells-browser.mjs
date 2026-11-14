import {chromium,webkit} from '../../../work/browser-tests/node_modules/playwright-core/index.mjs';
import {silenceTestAudio} from '../../../work/browser-tests/silent-audio.mjs';
import {battleView} from '../public/shared-field.js';
import assert from 'node:assert/strict';
for(const [name,type] of Object.entries({chromium,webkit}).filter(([name])=>!process.env.CROSSOVER_BROWSER||process.env.CROSSOVER_BROWSER===name)){
 const browser=await type.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await silenceTestAudio(page);
 await page.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));
 page.on('pageerror',e=>console.log(name,e.message));
 await page.goto(process.env.CROSSOVER_URL||'http://127.0.0.1:8784/heroes-starcraft/battle.html');
 await page.waitForFunction(()=>window.goonkMobileState?.mode==='menu',null,{timeout:120000});
 await page.locator('#crossover-demo').click({timeout:180000});await page.locator('#crossover-field').waitFor({state:'visible',timeout:180000});
 const sc=await(await page.locator('iframe[data-crossover-engine]').elementHandle()).contentFrame();
 const caster=await page.evaluate(()=>goonkMobileState.crossover.stacks.find(s=>s.spells?.length));assert(caster);assert(await page.evaluate(id=>goonkCrossoverSounds.rows.some(r=>r.id===id&&r.kind==='spell:21'&&r.bytes.length>44),caster.id));
 await page.locator(`[data-crossover-group="${caster.id}"]`).click();await page.locator('#crossover-spells').click();
 assert(await sc.evaluate(()=>openbwCrossover.isPaused()));await page.locator('#crossover-spell-cancel').click();assert(await sc.evaluate(()=>openbwCrossover.isPaused()));assert(await page.locator('#crossover-start').isVisible());
 await page.locator('#crossover-start').click();await sc.waitForFunction(()=>openbwCrossover.frame()>2);
 await page.locator('#crossover-spells').click();const before=await sc.evaluate(()=>({frame:openbwCrossover.frame(),units:openbwCrossover.census().units}));await page.waitForTimeout(850);assert.deepEqual(await sc.evaluate(()=>({frame:openbwCrossover.frame(),units:openbwCrossover.census().units})),before);
 await page.locator('#crossover-spell-cancel').click();await sc.waitForFunction(f=>openbwCrossover.frame()>f,before.frame);
 await page.locator('#crossover-spells').click();await page.locator('[data-spell-id]').first().click();
 assert.equal(await sc.evaluate(id=>openbwCrossover.cast(id,21,799,499),caster.id),false,'empty ground must not consume a cast');
 const frozen=await sc.evaluate(()=>openbwCrossover.frame());await page.waitForTimeout(850);assert.equal(await sc.evaluate(()=>openbwCrossover.frame()),frozen);
 const state=await sc.evaluate(()=>({census:openbwCrossover.census(),camera:openbwCrossover.camera(),battle:openbwCrossover.battle()}));const view=battleView(before.units.filter(u=>u.stackId>=0),state.camera),enemy=state.census.units.find(u=>u.owner===1);assert(enemy);
 const box=await page.locator('#crossover-field').boundingBox();
 await page.mouse.click(box.x+((enemy.x-state.camera.x)*view.zoom+view.x)*box.width/800,box.y+((enemy.y-state.camera.y-45)*view.zoom+view.y)*box.height/500);
 assert.match(await page.locator('#crossover-selection').innerText(),/lancé/);assert.equal(await sc.evaluate(()=>openbwCrossover.isPaused()),false);
 const after=await sc.evaluate(()=>({battle:openbwCrossover.battle(),units:openbwCrossover.census().units}));assert.equal(after.battle.groups.find(g=>g.id===caster.id).casts,state.battle.groups.find(g=>g.id===caster.id).casts-1);
 assert(after.units.filter(u=>u.owner===1).reduce((s,u)=>s+u.hp,0)<state.census.units.filter(u=>u.owner===1).reduce((s,u)=>s+u.hp,0));
 console.log(name,'native pause, initial cancel, running cancel, targeting pause, damage and charge verified');
 }finally{await browser.close();}
}
