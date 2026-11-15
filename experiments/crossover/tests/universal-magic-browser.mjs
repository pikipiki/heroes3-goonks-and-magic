import {chromium,webkit} from '../../../work/browser-tests/node_modules/playwright-core/index.mjs';
import {silenceTestAudio} from '../../../work/browser-tests/silent-audio.mjs';
import {battleView} from '../public/shared-field.js';
import assert from 'node:assert/strict';
const entry=process.env.CROSSOVER_URL||'http://127.0.0.1:8784/heroes-starcraft/battle.html';
for(const [name,type] of Object.entries({chromium,webkit}).filter(([name])=>!process.env.CROSSOVER_BROWSER||name===process.env.CROSSOVER_BROWSER)){
 const browser=await type.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});await silenceTestAudio(page);
 const errors=[];page.on('pageerror',error=>{errors.push(error.message);console.log(name,error.message);});
 await page.addInitScript(()=>{try{sessionStorage.setItem('heroes-goonk.storage-failed','true');}catch{}window.testMagic=[];window.addEventListener('goonk-state',event=>{if(event.detail.crossover&&!window.testOpeningPlan)window.testOpeningPlan=structuredClone(event.detail.crossover);});window.testHeroPoses=[];window.addEventListener('goonk-crossover-magic',event=>testMagic.push(structuredClone(event.detail)));const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(image===window.goonkCrossoverArt?.canvas&&args.length>=8)testHeroPoses.push(Math.floor(args[1]/(goonkCrossoverArt.cell||128))%6);return draw.call(this,image,...args);};});
 await page.goto(entry);await page.waitForFunction(()=>window.goonkMobileState?.mode==='menu',null,{timeout:120000});await page.locator('#crossover-demo').click({timeout:180000});await page.locator('#crossover-field').waitFor({state:'visible',timeout:180000});
 const sc=await(await page.locator('iframe[data-crossover-engine]').elementHandle()).contentFrame();assert(sc);
 const initialFrame=await sc.evaluate(()=>openbwCrossover.frame());
 await page.locator('#crossover-loadout').click();await page.locator('[data-edit-slot="0"]').click();await page.locator('[data-spell-caster="-1"][data-spell-id="54"]').click();await page.locator('#crossover-spell-cancel').click();
 assert.equal(await sc.evaluate(()=>openbwCrossover.frame()),initialFrame);assert(await sc.evaluate(()=>openbwCrossover.isPaused()));assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('heroes-starcraft.spell-loadout.v1')).length),5);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('heroes-starcraft.spell-loadout.v1'))[0].id),54);
 for(const viewport of [{width:390,height:844},{width:844,height:390}]){await page.setViewportSize(viewport);await page.waitForTimeout(100);const bounds=await page.locator('[data-quick-slot],#crossover-move,#crossover-attack,#crossover-stop,#crossover-select-all').evaluateAll(buttons=>buttons.map(b=>{const r=b.getBoundingClientRect();return {width:r.width,height:r.height,right:r.right};}));assert(bounds.every(r=>r.width>=44&&r.height>=44&&r.right<=viewport.width));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`/private/tmp/loadout-${name}-${viewport.width}.png`});}
 assert(await page.evaluate(()=>goonkCrossoverSpellIcons.rows.length>=60));console.log(name,'five precombat shortcuts, persistence, real icons and portrait/landscape touch layout verified');
 if(process.env.CROSSOVER_LOADOUT_ONLY==='1'){assert.deepEqual(errors,[]);continue;}
 const plan=await page.evaluate(()=>structuredClone(testOpeningPlan));assert.equal(plan.stacks.filter(s=>s.side===0).length,7);assert(plan.stacks.filter(s=>s.side===0).every(s=>s.count===5&&s.creature.startsWith('tum-era:')));
 const census=await sc.evaluate(()=>openbwCrossover.census()),camera=await sc.evaluate(()=>openbwCrossover.camera()),view=battleView(census.units.filter(u=>u.stackId>=0),camera);
 const enemies=census.units.filter(u=>u.owner===1&&u.hp>0);assert.equal(enemies.length,12);assert.deepEqual([...new Set(enemies.map(u=>u.type))].sort((a,b)=>a-b),[0,32,37,38,65,66]);
 assert(Object.values((await sc.evaluate(()=>openbwCrossover.battle())).upgrades).every(v=>v===3));assert(enemies.some(u=>u.maxShields===60)&&enemies.some(u=>u.maxShields===80));
 const heroSpells=plan.magic.spells.filter(s=>s.caster===-1);assert.equal(heroSpells.length,60);assert.deepEqual(heroSpells.map(s=>s.id).sort((a,b)=>a-b),Array.from({length:60},(_,i)=>i+10));
 assert(await page.evaluate(()=>new Set(goonkCrossoverSpellArt.rows.filter(r=>r.kind!=='obstacle').map(r=>r.id)).size>40));
 await sc.evaluate(()=>{const api=openbwCrossover,apply=api.applyMagic;window.testApplied=[];api.applyMagic=(rows,rules)=>{const before=api.census();apply.call(api,rows,rules);testApplied.push({before,after:api.census(),rows:structuredClone(rows)});};const sprite=api.sprite;window.testDeathSprites=[];api.sprite=id=>{const bytes=sprite.call(api,id),unit=api.census().units.find(u=>u.id===id);if(unit?.hp<=0){let hash=0;for(let i=0;i<bytes.length;i+=29)hash=(Math.imul(hash,31)+bytes[i])>>>0;testDeathSprites.push({id,frame:api.frame(),hash});}return bytes;};});
 const clickWorld=async(x,y)=>{const box=await page.locator('#crossover-field').boundingBox();assert(box);await page.mouse.click(box.x+(x*view.zoom+view.x)*box.width/800,box.y+(y*view.zoom+view.y)*box.height/500);};
 const book=page.locator('#crossover-spellbook-root .mobile-spellbook');
 const open=async()=>{await page.locator('#crossover-spells').click();await book.waitFor({state:'visible'});};
 const closeBook=()=>book.locator('[data-close-book]').click();
 const cast=async(id,caster=-1,targetId,point)=>{
  const ready=await page.evaluate(({id,caster})=>([...testMagic].reverse().find(r=>r.ok&&r.catalogue)?.catalogue||testOpeningPlan.magic).spells.find(s=>s.id===id&&s.caster===caster)?.ready||0,{id,caster});
  await sc.waitForFunction(ready=>openbwCrossover.frame()>=ready,ready,{timeout:12000});await open();await book.locator('[data-spell-caster-select]').selectOption(String(caster));await book.locator('[data-school="0"]').click();const button=book.locator(`[data-spell-caster="${caster}"][data-spell-id="${id}"]`);for(let i=0;i<6&&!await button.count();i++){const next=book.locator('[data-page="1"]');assert(await next.isEnabled(),'spell exists in book '+id);await next.click();}assert(await button.count(),id+' is in the book');
  const targetKind=await page.evaluate(({id,caster})=>([...testMagic].reverse().find(r=>r.ok&&r.catalogue)?.catalogue||testOpeningPlan.magic).spells.find(s=>s.id===id&&s.caster===caster)?.target,{id,caster});await button.click();assert(await book.locator('[data-cast-spell]').isEnabled(),id+' is available');await book.locator('[data-cast-spell]').click();if(targetKind==='none'){}else if(point)await clickWorld(point.x,point.y);else if(targetId!==undefined){const unit=await sc.evaluate(id=>openbwCrossover.census().units.find(u=>u.stackId===id&&u.hp>0),targetId);assert(unit);await clickWorld(unit.x-camera.x,unit.y-camera.y-30);}
  await page.waitForFunction(()=>document.querySelector('#crossover-spell-picker')?.hidden||document.querySelector('#crossover-selection')?.textContent.includes('refus'),null,{timeout:10000});assert(await page.locator('#crossover-spell-picker').isHidden(),await page.locator('#crossover-selection').innerText());
  return await page.evaluate(({id,caster})=>[...testMagic].reverse().find(r=>r.ok&&r.events?.some(e=>e.id===id&&e.caster===caster)),{id,caster});
 };
 await open();const paused=await sc.evaluate(()=>openbwCrossover.census());await page.waitForTimeout(650);assert.deepEqual(await sc.evaluate(()=>openbwCrossover.census()),paused);await closeBook();assert(await sc.evaluate(()=>openbwCrossover.isPaused()));
 const cherub=plan.stacks.find(s=>s.creature==='tum-era:cherub');assert(cherub);
 await page.locator('#crossover-start').click();await page.locator('[data-quick-slot="4"]').click();await page.waitForFunction(()=>document.querySelector('#crossover-spell-picker').hidden,null,{timeout:10000});const haste=await page.evaluate(()=>[...testMagic].reverse().find(r=>r.ok&&r.events?.some(e=>e.id===53&&e.caster===-1)));assert(haste,'shortcut casts native Haste');assert(haste.groups.find(g=>g.id===cherub.id).speed>cherub.speed);assert(!await sc.evaluate(()=>openbwCrossover.isPaused()));console.log(name,'60 hero spells, seven final factions × five, 12 max-upgrade SC, pause and Haste verified');
 // A real area spell creates wounds and casualties without editing either engine.
 const devil=plan.stacks.find(s=>s.creature==='tum-era:antichrist');assert(devil);
 let wounded=false,dead=false;
 for(let i=0;i<7;i++){
  const native=await sc.evaluate(()=>openbwCrossover.census()),group=native.units.filter(u=>u.stackId===devil.id&&u.hp>0);if(group.length<5){dead=true;break;}
  await open();const rows=await sc.evaluate(()=>testApplied.at(-1).rows),at=rows.find(r=>r.id===devil.id);await closeBook();
  const ring=await cast(20,-1,undefined,{x:at.x+44,y:at.y});assert(ring);wounded ||=ring.groups.some(g=>g.id===devil.id&&g.healthDelta<0);console.log(name,'Frost Ring',i+1,ring.groups.find(g=>g.id===devil.id)?.healthDelta);
 }
 assert(wounded&&dead,'native Frost Ring wounds and kills a member of the allied cohort');
 const beforeRez=await sc.evaluate(id=>openbwCrossover.census().units.filter(u=>u.stackId===id&&u.hp>0).length,devil.id);
 const rez=await cast(38,cherub.id,devil.id);assert(rez);assert(rez.groups.find(g=>g.id===devil.id).revived>0);
 const afterRez=await sc.evaluate(id=>openbwCrossover.census().units.filter(u=>u.stackId===id&&u.hp>0).length,devil.id);assert(afterRez>beforeRez&&afterRez<=5);
 assert((await page.evaluate(()=>testHeroPoses)).includes(3),'original Heroes wound pose rendered');assert((await page.evaluate(()=>testHeroPoses)).includes(4),'original Heroes death pose rendered');assert((await page.evaluate(()=>testHeroPoses)).includes(5),'original creature casting pose rendered');console.log(name,'real wounds, death, creature Resurrection and original animation poses verified');
 const summon=await cast(66);assert(summon.groups.some(g=>g.summoned&&g.count>0));
 const spawned=await sc.evaluate(()=>openbwCrossover.census().units.filter(u=>u.heroes&&u.stackId>12&&u.hp>0).length);assert(spawned>0);console.log(name,'native invocation spawned playable Heroes units',spawned);
 const dragoon=plan.stacks.find(s=>s.creature==='heroes-starcraft:dragoon');assert(dragoon);const beforeShield=await sc.evaluate(id=>openbwCrossover.census().units.filter(u=>u.stackId===id&&u.hp>0),dragoon.id);await cast(15,-1,dragoon.id);const afterShield=await sc.evaluate(id=>openbwCrossover.census().units.filter(u=>u.stackId===id&&u.hp>0),dragoon.id);assert.equal(afterShield.reduce((n,u)=>n+u.hp,0),beforeShield.reduce((n,u)=>n+u.hp,0),'Protoss shields absorb spell damage before health');assert(afterShield.reduce((n,u)=>n+u.shields,0)<beforeShield.reduce((n,u)=>n+u.shields,0));console.log(name,'real Protoss shields absorb native spell damage');
 const marine=plan.stacks.find(s=>s.creature==='heroes-starcraft:marine');const bolt=await cast(57,-1,marine.id);assert(bolt);await page.waitForTimeout(900);assert((await sc.evaluate(()=>testDeathSprites)).length>1,'native StarCraft death sprites keep rendering after damage');
 assert.deepEqual(errors,[]);console.log(name,'native SC damage and death animation, mana, hero and creature magic passed');
 }finally{await browser.close();}
}
