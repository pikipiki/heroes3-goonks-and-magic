/** Canonical0.8% source queries: real wall movement and real134/356 casting. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {clearIntrinsicEquipment} from './eighth-intrinsic-equipment.mjs';
export async function runPositiveQueries165Cases({boot,combat,sheet,state,cmd,wait,page,out,report,hp}) {
 assert.equal(process.env.CONFLUX_PRODUCTION,'1','Production355/356 and source134 registry required');
 const blue={hero:'core:thorgrim',experience:2555722,skills:{'core:resistance':'expert'},spells:['core:haste'],army:[{type:'core:battleDwarf',amount:1},{type:'core:unicorn',amount:1}]};
 const passTurn=async name=>{await cmd(3);for(let n=0;n<300;n++){const s=await state();if(s.mode==='dialog')await cmd(1);else if(s.mode==='map'&&s.turn&&s.heroName===name)return;await page().waitForTimeout(80);}throw Error('Hotseat owner did not arrive '+name);};
 const checkpoint=()=>fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify({passed:true,report},null,2));
 const cleanSheet=async()=>{await sheet();return clearIntrinsicEquipment({state,cmd,wait});};
 const part=process.env.POSITIVE_QUERY_CASE;
 if(!part||part==='wall') {
  const actorKey='tum-era:eraCreature355';
  await boot({positive355:{wall:true},artifacts:{},army:[{type:actorKey,amount:1}],enemyHero:blue});
  await passTurn('Thorgrim');const blueEquipment=await cleanSheet(),hero=blueEquipment.state;assert.equal(hero.heroWindow.level,39);
  await page().locator('[data-hero-close]').tap();await wait(()=>goonkMobileState.mode==='map');await passTurn('Christian');
  const redEquipment=await cleanSheet();await page().locator('[data-hero-close]').tap();await wait(()=>goonkMobileState.mode==='map');await combat(32);
  await wait(k=>goonkMobileState.canAct&&goonkMobileState.activeUnit?.key===k,actorKey);
  const initial=await state();await cmd(13,initial.activeStack,initial.round);
  let before;
  for(let n=0;n<300;n++) {
   const s=await state();
   if(s.canAct&&s.activeUnit?.key==='core:battleDwarf'){before=s;break;}
   if(s.canAct)await cmd(13,s.activeStack,s.round);
   await page().waitForTimeout(100);
  }
  assert(before,'Blue BattleDwarf receives a real hotseat movement turn');
  const dwarf=before.battleUnits.find(u=>u.key==='core:battleDwarf');
  assert(before.battleCells.find(c=>c.hex===2)?.reachable,'Real dwarf can step one hex onto355 wall');
  await cmd(14,4,2);
  await wait(({id,health})=>goonkMobileState.battleUnits.find(u=>u.stackId===id)?.currentHealth<health,{id:dwarf.stackId,health:dwarf.currentHealth});
  await page().waitForTimeout(1000);const after=await state(),injured=after.battleUnits.find(u=>u.stackId===dwarf.stackId);
  assert(injured.occupied.includes(2));assert.equal(hp(dwarf)-hp(injured),20,'Source wall0.8% eligibility passes without resistance lottery; original355count1 wall deals20');
  report.positiveWall355={hero,blueStartingArtifactsMoved:blueEquipment.moved,redStartingArtifactsMoved:redEquipment.moved,initial,before,after,loss:20,
   fixture:'Original355R0 Defend creates its real source wall. RealThorgrim39Expert+BattleDwarf40+Unicorn20 remain native; Unicorn is adjacent before and after movement to2. Only target durability/physical control stats/layout changed.'};
  await page().screenshot({path:path.join(out,'positive-query355-wall-native.png')});await page().close();checkpoint();
 }
 for(const id of [134,356]) {
  if(part&&part!==String(id))continue;
  const key=id===134?'core:fairieDragon':'tum-era:eraCreature356';let hero;const movedStartingEquipment=[];
  if(id===134) {
   await boot({positive355:true,artifacts:{},army:[{type:key,amount:1}],enemyHero:blue});
   await passTurn('Thorgrim');const blueEquipment=await cleanSheet();hero=blueEquipment.state;movedStartingEquipment.push(...blueEquipment.moved);assert.equal(hero.heroWindow.level,39);
   await page().locator('[data-hero-close]').tap();await wait(()=>goonkMobileState.mode==='map');await passTurn('Christian');
   const redEquipment=await cleanSheet();movedStartingEquipment.push(...redEquipment.moved);await page().locator('[data-hero-close]').tap();await wait(()=>goonkMobileState.mode==='map');
  } else {
   // Catalyst requires a caster-side hero. A real human garrison without a
   // hero supplies source356 while RedThorgrim supplies the resisting target.
   await boot({positive355:{faerieDefender:true},artifacts:{},hero:'core:thorgrim',experience:2555722,skills:{'core:resistance':'expert'},
    army:blue.army,garrison:[{type:key,amount:1}],garrisonOwner:'blue'});
   const redEquipment=await cleanSheet();hero=redEquipment.state;movedStartingEquipment.push(...redEquipment.moved);assert.equal(hero.heroWindow.level,39);
   await page().locator('[data-hero-close]').tap();await wait(()=>goonkMobileState.mode==='map');
  }
  await combat(id===356?64:32);let before;
  for(let n=0;n<400;n++) {
   const s=await state();if(s.canAct&&s.activeUnit?.key===key){before=s;break;}
   if(s.canAct)await cmd(13,s.activeStack,s.round);
   await page().waitForTimeout(100);
  }
  assert(before,'Original source caster must receive a real human-controlled turn');
  const actor=before.battleUnits.find(u=>u.key===key),dwarf=before.battleUnits.find(u=>u.key==='core:battleDwarf');
  assert.equal(actor.count,1);assert.equal(actor.experienceRank,0);assert(actor.remainingCasts>0);
  await cmd(14,1);await wait(()=>goonkMobileState.creatureSpellTargeting);
  const targeting=await state();assert(targeting.selectedSpell);
  assert(targeting.battleCells.find(c=>c.hex===dwarf.occupied[0])?.spellTarget,'Strictly positive0.8% remains a legal primary regardless of selected native pool spell');
  await cmd(14,3,dwarf.occupied[0]);
  await wait(({key,count})=>goonkMobileState.battleUnits.find(u=>u.key===key)?.remainingCasts===count-1,{key,count:actor.remainingCasts});
  await page().waitForTimeout(1000);const after=await state();
  report['positiveFaerie'+id]={hero,movedStartingEquipment,before,targeting,after,selectedSpell:targeting.selectedSpell,
   actualChargeDebit:1,observedPrimaryLoss:hp(dwarf)-hp(after.battleUnits.find(u=>u.stackId===dwarf.stackId)),
   fixture:id===134?'Original134 pool/stats/charges unchanged; real enemyThorgrim39+Dwarf40+Unicorn20.':'Original356 defending a real Blue-human garrison without hero. Catalyst hero-precondition is legitimately absent; RedThorgrim39+Dwarf40+Unicorn20 unchanged.',
   scope:'Primary FLOAT eligibility only. Native single/area/chain dispatch keeps its separately verified integer lotteries; zero inner damage is valid for a primary whose integer accuracy is0.'};
  await page().screenshot({path:path.join(out,'positive-query-faerie-'+id+'.png')});await page().close();checkpoint();
 }
}
