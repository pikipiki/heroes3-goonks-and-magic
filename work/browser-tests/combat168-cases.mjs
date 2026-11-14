/** Combat168 causal witnesses. Production policies; only HP/speed fixture changes. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

export async function runCombat168(ctx) {
 const {boot,combat,sheet,state,cmd,wait,page,out,report}=ctx;
 const normalize=async()=>{await sheet();const {clearIntrinsicEquipment}=await import('./eighth-intrinsic-equipment.mjs');await clearIntrinsicEquipment({state,cmd,wait});await page().locator('[data-hero-close]').tap();await wait(()=>goonkMobileState.mode==='map');};
 const handoff=async name=>{await cmd(3);for(let n=0;n<250;++n){const s=await state();if(s.mode==='dialog')await cmd(1);else if(s.mode==='map'&&s.turn&&s.heroName===name)return;await page().waitForTimeout(70);}throw Error('Hotseat handoff '+name);};
 const castHero=async(sid,hex)=>{const sequence=(await state()).battleCamera.sequence;await cmd(14,0);await wait(()=>goonkMobileState.mode==='spellbook');await cmd(51,0);for(let n=0;n<8&&!(await state()).spellbook.spells.some(s=>s.id===sid);++n)await cmd(50,1);assert((await state()).spellbook.spells.some(s=>s.id===sid&&s.enabled),'Actual hero spell enabled '+sid);await cmd(49,sid);await page().waitForTimeout(100);if((await state()).spellTargeting){assert.notEqual(hex,undefined);await cmd(14,3,hex);}await wait(seq=>goonkMobileState.mode==='battle'&&!goonkMobileState.spellTargeting&&!goonkMobileState.battleCamera?.active&&goonkMobileState.battleCamera?.sequence>seq,sequence);};
 const hp=u=>(u.count-1)*u.maximumHealth+u.currentHealth;
 const power=Number(process.env.COMBAT168_POWER||1);assert(Number.isInteger(power)&&power>=1&&power<=100,'COMBAT168_POWER integer1..100');const rawDamage=25*power+10;
 const filters=process.env.COMBAT168_FILTER?.split(',');
 if(!process.env.COMBAT168_CASES||process.env.COMBAT168_CASES.split(',').includes('285'))for(const [key,protectedAir,expected] of [
  ['tum-era:eraCreature285',true,Math.trunc(Math.trunc(rawDamage/4)*70/100)],
  ['tum-era:eraCreature285',false,Math.trunc(rawDamage/4)],
  // VCMI IDs are historically inverted. Production metadata opts this real Iron Golem33 into source g75 even atR0.
  ['core:stoneGolem',true,Math.trunc(Math.trunc(rawDamage*25/100)*70/100)],
  // Unregistered Goonk keeps ordinary school protection without source innate/XP reduction.
  ['goonk:bobope',true,Math.trunc(rawDamage*70/100)],
 ]){
  const label=(key.includes('285')?'source285':key==='core:stoneGolem'?'sourceMetadataIronGolem':'ordinaryGoonk')+(protectedAir?'Protected':'Bare');if(filters&&!filters.includes(label))continue;
  await boot({artifacts:{},disableCommanders:true,power,spells:['core:protectAir'],combat168Controls:{[key]:{speed:100,hitPoints:1000},'goonk:bubu':{speed:90,hitPoints:1000},'core:gnoll':{speed:1,hitPoints:1000}},enemyHero:{power,army:[{type:'core:gnoll',amount:1}],spells:['core:lightningBolt']},army:[{type:key,amount:1},{type:'goonk:bubu',amount:1}]});
  await normalize();await handoff('Orrin');await normalize();await handoff('Christian');await combat(32);
  await wait(k=>goonkMobileState.canAct&&!goonkMobileState.battleCamera?.active&&goonkMobileState.activeUnit?.key===k,key);
  const initial=await state(),target=initial.battleUnits.find(u=>u.key===key);assert(target);if(key==='core:stoneGolem')assert.equal(target.id,33,'VCMI historic stoneGolem key is Iron Golem33 with75% reduction');assert.equal(target.experienceRank,0);assert(!initial.battleUnits.some(u=>u.key.startsWith('wake-of-gods.commanders:')));
  if(protectedAir){await castHero(30,target.occupied[0]);const protectedTarget=(await state()).battleUnits.find(u=>u.stackId===target.stackId);assert(protectedTarget.spellEffects.some(e=>e.id===30),'Real base Protection from Air exists');}
  for(let n=0;n<30;++n){const s=await state();if(s.canAct&&!s.battleCamera?.active&&s.activeUnit?.key==='core:gnoll')break;if(s.canAct&&!s.battleCamera?.active)await cmd(13,s.activeStack,s.round);await page().waitForTimeout(80);}
  await wait(()=>goonkMobileState.canAct&&!goonkMobileState.battleCamera?.active&&goonkMobileState.activeUnit?.key==='core:gnoll');
  const before=await state(),victim=before.battleUnits.find(u=>u.stackId===target.stackId);await castHero(17,victim.occupied[0]);const after=await state(),post=after.battleUnits.find(u=>u.stackId===target.stackId),loss=hp(victim)-hp(post);
  assert.equal(loss,expected,'SP'+power+' LightningBolt raw'+rawDamage+': '+label);
  report[label]={passed:true,power,rawDamage,expected,loss,initial,before,after,scope:'Actual hero LightningBolt17; base Protection from Air30; production policies unchanged (Iron Golem33 already carries source g75 atR0); HP/speed-only private fixture'};
  fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify({passed:true,report},null,2));await page().screenshot({path:path.join(out,label+'.png')});await page().close();
 }
 if(process.env.COMBAT168_CASES?.split(',').includes('clone296')){
  const {runCombat168Clone}=await import('./combat168-clone-cases.mjs');await runCombat168Clone(ctx);
 }
}
