/** Real244 alias plus original102/103: identity proof does not assert whole244 parity. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {clearIntrinsicEquipment} from './eighth-intrinsic-equipment.mjs';
export async function runSulfideHateCases({boot,combat,resolve,sheet,state,cmd,wait,page,out,report}) {
 const key='tum-era:eraCreature339',layout={attacker:[19,53,87,121,155,36,70],defender:[20,54,88,122,156,37,71]};
 for(const targetKey of ['core:gnoll','core:gorgon','core:mightyGorgon','third-upgrades:tumCatopleba']) {
  if(process.env.SULFIDE_TARGET&&process.env.SULFIDE_TARGET!==targetKey)continue;
  await boot({artifacts:{},sulfide:{layout,progression:{fullRank10:100,rank11Extra:10,battlePercent:100,experienceMultiplier:1,upgradeMultiplier:0.75},fixtures:{[targetKey]:{
   hitPoints:1000000,attack:0,defense:20,speed:1,damage:{min:1,max:1},abilities:{causalNoMorale:{type:'NO_MORALE'}}
  }}},training:true,trainingHP:400,enduranceTarget:targetKey,army:[{type:key,amount:1},{type:'core:blackDragon',amount:1}]});
  await sheet();const initialEquipment=await clearIntrinsicEquipment({state,cmd,wait});await page().locator('[data-hero-close]').tap();await wait(()=>goonkMobileState.mode==='map');
  await combat();await resolve();const trained=await sheet();
  assert.equal(trained.armies[0].slots[0].experienceRank,10);
  await page().locator('[data-hero-close]').tap();await wait(()=>goonkMobileState.mode==='map');await combat(128);
  await wait(k=>goonkMobileState.canAct&&goonkMobileState.activeUnit?.key===k,key);
  const before=await state(),actor=before.battleUnits.find(u=>u.key===key),target=before.battleUnits.find(u=>u.enemy&&u.key===targetKey);
  assert(target?.canMeleeAt);assert.equal(actor.experienceRank,10);assert.equal(actor.damageMin,80);assert.equal(actor.damageMax,80);
  const hate=targetKey==='core:gnoll'?0:0.9;
  const physical=Math.floor(80*(1+0.05*Math.min(60,Math.max(0,actor.attack-target.defense))+hate));
  await cmd(14,4,target.occupied[0]);
  await wait(id=>goonkMobileState.battleUnits.find(u=>u.stackId===id)?.maximumHealth<1000000,target.stackId);
  await wait(()=>goonkMobileState.canAct&&goonkMobileState.activeUnit);await page().waitForTimeout(1000);
  const after=await state(),injured=after.battleUnits.find(u=>u.stackId===target.stackId);
  assert.equal(injured.maximumHealth,450000);assert.equal(injured.count,1);
  assert.equal(injured.maximumHealth-injured.currentHealth,physical+40,'R10 HATE90 adds attackfactor only for exact source102/103/244; Acid80/2 remains40');
  report['sulfideHate'+targetKey]={trained:trained.armies[0],initialEquipment,before,after,physical,acid:40,hatePercent:Math.round(hate*100),
   identityScope:targetKey==='third-upgrades:tumCatopleba'?'Existing native Town/save identity244 proven independently; target control stats are explicit and do not assert whole244 source parity.':'Existing real native creature.',
   fixture:'Original339R10 earned by a real training kill. Target nature/abilities retained; only durability and physical control stats changed.'};
  await page().screenshot({path:path.join(out,'sulfide339-hate-'+targetKey.replace(':','-')+'.png')});await page().close();
  fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify({passed:true,report},null,2));
 }
}
