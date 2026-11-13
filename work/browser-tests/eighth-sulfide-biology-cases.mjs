/** Future whole339 controls. Unexecuted until the owner grants a browser slot. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

export async function runSulfideBiologyCases({boot, combat, state, cmd, wait, page, out, report}) {
 const actorKey='tum-era:eraCreature339';
 const layout={attacker:[19,53,87,121,155,36,70],defender:[20,54,88,122,156,37,71]};
 // All three are real actors with original nature flags retained. Gargoyle's
 // explicit30/31 rejection is independent of its native nonliving treatment.
 for(const targetKey of ['core:skeleton','core:stoneGargoyle','tum-era:eraCreature349']) {
  if(process.env.SULFIDE_TARGET&&process.env.SULFIDE_TARGET!==targetKey)continue;
  for(const orb of [false,true]) {
  if(process.env.SULFIDE_ORB&&process.env.SULFIDE_ORB!==(orb?'orb':'none'))continue;
  await boot({artifacts:orb?{misc1:'core:orbOfVulnerability'}:{},sulfide:{layout,fixtures:{[targetKey]:{
   hitPoints:1000000,attack:0,defense:20,speed:1,damage:{min:1,max:1},
   abilities:{causalNoMorale:{type:'NO_MORALE'}}
  }}},garrison:[{type:targetKey,amount:1}],army:[{type:actorKey,amount:1}]});
  await combat();let before;
  for(let n=0;n<200;n++) {
   const s=await state();
   if(s.canAct&&s.activeUnit?.key===actorKey){before=s;break;}
   if(s.canAct)await cmd(12,s.activeStack,s.round);
   await page().waitForTimeout(100);
  }
  assert(before,'Source339 must have a real actionable turn');
  const actor=before.battleUnits.find(u=>u.key===actorKey);
  const target=before.battleUnits.find(u=>u.enemy&&u.key===targetKey);
  assert(target?.canMeleeAt);assert.equal(actor.experienceRank,0);
  assert.equal(actor.damageMin,70);assert.equal(actor.damageMax,70);
  const physical=Math.floor(70*(1+0.05*Math.min(60,Math.max(0,actor.attack-target.defense))));
  await cmd(14,4,target.occupied[0]);
  await wait(id=>goonkMobileState.battleUnits.find(u=>u.stackId===id)?.maximumHealth<1000000,target.stackId);
  await wait(()=>goonkMobileState.canAct&&goonkMobileState.activeUnit);
  await page().waitForTimeout(1000);
  const after=await state(),injured=after.battleUnits.find(u=>u.stackId===target.stackId);
  assert.equal(injured.maximumHealth,500000,'Source Age75 passes nature; source Poison71 rejects this real actor');
  assert.equal(injured.defense,target.defense-3,'Queued DisruptingRay80 has its separate source predicate');
  assert.equal(injured.maximumHealth-injured.currentHealth,physical+35);
  report['sulfideBiology'+targetKey+orb]={before,after,targetKey,orb,physical,acid:35,
   expectedMaximum:500000,privateHealthMarkerAdded:false,
   fixture:'Original339R0 and real target abilities/nature retained; only durability, physical control stats and noMorale changed.'};
  await page().screenshot({path:path.join(out,'sulfide339-biology-'+targetKey.replace(':','-')+'-'+orb+'.png')});
  await page().close();
  fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify({passed:true,report},null,2));
  }
 }
}
