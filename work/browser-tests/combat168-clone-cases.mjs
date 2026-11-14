/** Private native witness: actual Clone, enemy MagicArrow, rebirth and drain.
 * Only pre-launch HP/speed fixtures; no source policy, RNG or battle-state edits.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

export async function runCombat168Clone({boot,combat,sheet,state,cmd,wait,page,out,report}) {
 const key='tum-era:eraCreature296',companion='goonk:bubu';
 const shooter='core:archer',victimKey='core:peasant';
 const hp=u=>u?(u.count-1)*u.maximumHealth+u.currentHealth:0;
 const checkpoint=()=>fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify({report},null,2));
 const normalize=async()=>{
  await sheet();
  const {clearIntrinsicEquipment}=await import('./eighth-intrinsic-equipment.mjs');
  await clearIntrinsicEquipment({state,cmd,wait});
  await page().locator('[data-hero-close]').tap();
  await wait(()=>goonkMobileState.mode==='map');
 };
 const castHero=async(sid,hex)=>{
  const sequence=(await state()).battleCamera.sequence;
  await cmd(14,0);await wait(()=>goonkMobileState.mode==='spellbook');await cmd(51,0);
  for(let n=0;n<8&&!(await state()).spellbook.spells.some(s=>s.id===sid);++n)await cmd(50,1);
  assert((await state()).spellbook.spells.some(s=>s.id===sid&&s.enabled),'Actual hero spell is available: '+sid);
  await cmd(49,sid);await page().waitForTimeout(100);
  if((await state()).spellTargeting){assert.notEqual(hex,undefined);await cmd(14,3,hex);}
  await wait(seq=>goonkMobileState.mode==='battle'&&!goonkMobileState.spellTargeting&&!goonkMobileState.battleCamera?.active&&goonkMobileState.battleCamera?.sequence>seq,sequence);
 };
 const handoff=async name=>{
  await cmd(3);
  for(let n=0;n<250;++n){
   const s=await state();
   if(s.mode==='dialog')await cmd(1);
   else if(s.mode==='map'&&s.turn&&s.heroName===name)return;
   await page().waitForTimeout(70);
  }
  throw Error('Clone296 hotseat handoff '+name);
 };
 const advanceUntil=async(predicate,label,preserveReadyStack=-1)=>{
  for(let n=0;n<300;++n){
   const s=await state();assert.equal(s.mode,'battle',label+' keeps battle alive');
   if(s.canAct&&!s.battleCamera?.active){
    if(predicate(s))return s;
    if(s.activeStack===preserveReadyStack){
     // Source rebirth excludes DONE. DEFEND would set that bit before the
     // enemy spell; actual WAIT preserves eligibility until the later phase.
     assert(s.canWait,'Clone must wait without consuming its source DONE bit');
     await cmd(12,s.activeStack,s.round);
    }else await cmd(13,s.activeStack,s.round);
   }
   await page().waitForTimeout(70);
  }
  throw Error('Clone296 activation '+label);
 };

 await boot({
  artifacts:{},disableCommanders:true,power:2,spells:['core:clone'],
  combat168Controls:{
   [key]:{speed:100},[companion]:{speed:90,hitPoints:1000000},
   [shooter]:{speed:80,hitPoints:100000},[victimKey]:{speed:1,hitPoints:6}
  },
  enemyHero:{army:[{type:shooter,amount:1},{type:victimKey,amount:1}],spells:['core:magicArrow']},
  army:[{type:key,amount:10},{type:companion,amount:1}]
 });
 await normalize();await handoff('Orrin');await normalize();await handoff('Christian');
 await combat(32);
 const before=await advanceUntil(s=>s.activeUnit?.key===key,'original skeleton');
 const original=before.battleUnits.find(u=>u.key===key&&!u.cloned);
 assert(original);assert.equal(original.maximumHealth,3,'Original296 HP is not overridden');
 assert.equal(original.experienceRank,0);assert.equal(original.count,10);assert.equal(hp(original),30);
 assert.equal(original.remainingCasts,3,'Source296 retains original three rebirth charges');
 await castHero(65,original.occupied[0]);
 const clonedState=await state();
 const clone=clonedState.battleUnits.find(u=>u.key===key&&u.cloned);
 assert(clone,'A real hero Clone creates the native fragile clone');
 assert.notEqual(clone.stackId,original.stackId);assert.equal(hp(clone),30);
 report.clone296={passed:false,before,clonedState};checkpoint();

 const enemyTurn=await advanceUntil(s=>s.activeUnit?.key===shooter,'enemy archer',clone.stackId);
 const liveClone=enemyTurn.battleUnits.find(u=>u.stackId===clone.stackId);
 assert(liveClone?.cloned);assert.equal(hp(liveClone),30);
 await castHero(15,liveClone.occupied[0]);
 const rebornState=await state(),reborn=rebornState.battleUnits.find(u=>u.stackId===clone.stackId);
 assert(reborn,'The destroyed clone is retained by actual source rebirth');
 assert.equal(reborn.cloned,true,'Rebirth preserves fragile-clone identity');
 assert.equal(reborn.maximumHealth,3); // Native clone DTO has no adventure XP field.
 assert.equal(reborn.count,8);assert.equal(hp(reborn),24,'R0 configured rebirth returns floor(30*(.3+.5))=24HP');
 assert.equal(reborn.remainingCasts,2,'Actual configured rebirth consumes one source charge');
 report.clone296={...report.clone296,enemyTurn,rebornState};checkpoint();

 const attackState=await advanceUntil(s=>s.round>enemyTurn.round&&s.activeStack===clone.stackId,'reborn clone next round');
 const attacker=attackState.battleUnits.find(u=>u.stackId===clone.stackId);
 const victim=attackState.battleUnits.find(u=>u.key===victimKey);
 assert(attacker?.cloned);assert.equal(hp(attacker),24);
 assert(victim);assert.equal(victim.count,1);assert.equal(hp(victim),6);
 assert(attackState.battleUnits.some(u=>u.key===shooter),'Enemy anchor prevents victory from hiding healed clone');
 //8 source Skeletons deal at least8 raw damage before the Peasant's defense.
 //The six-HP living victim dies, avoiding a retaliation that would destroy the
 //fragile clone again before its healed state could be observed.
 const origin=attackState.battleCells.find(c=>c.hex===attacker.occupied[0]);
 assert(origin);await page().evaluate(c=>Module._vcmiMobilePointer(c.x,c.y,0),origin);
 await cmd(14,4,victim.occupied[0]);
 await wait(id=>goonkMobileState.canAct&&!goonkMobileState.battleCamera?.active&&goonkMobileState.activeStack!==id,clone.stackId);
 const healedState=await state(),healed=healedState.battleUnits.find(u=>u.stackId===clone.stackId);
 assert(!healedState.battleUnits.some(u=>u.stackId===victim.stackId),'Real melee kills the six-HP living victim');
 assert(healed?.cloned,'Source drain keeps the clone fragile');
 assert.equal(hp(healed),30,'Actual source drain restores sixHP and caps at initial30HP');
 assert.equal(healed.count,10);assert.equal(healed.remainingCasts,2,'Drain consumes no rebirth charge');
 const expiredState=await advanceUntil(s=>s.round>=3,'original clone lifetime expires');
 assert(!expiredState.battleUnits.some(u=>u.stackId===clone.stackId),'Original two-round duration expires without renewal after rebirth');
 report.clone296={...report.clone296,passed:true,attackState,healedState,expiredState,
  scope:'Real SP2 hero Clone65 expires at round3; enemy hero MagicArrow15; R0 source296 configured80% rebirth; next-round real melee against living Peasant; source-policy/RNG unchanged; only authored HP/speed controls.'};
 checkpoint();await page().screenshot({path:path.join(out,'clone296-reborn-drain.png')});
 await page().close();
}
