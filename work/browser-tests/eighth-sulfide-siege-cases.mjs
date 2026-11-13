/** Real enemy-hero equipped Ballista, not a siege bonus grafted onto a Goonk. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
export async function runSulfideSiegeCases({boot,combat,state,cmd,wait,page,out,report}) {
 const key='tum-era:eraCreature339',targetKey='core:ballista';
 const layout={attacker:[19,53,87,121,155,36,70],defender:[54,88,122,156,37,71,105],defenderWarMachines:[20,32,168,134]};
 for(const orb of [false,true]) {
  if(process.env.SULFIDE_ORB&&process.env.SULFIDE_ORB!==(orb?'orb':'none'))continue;
  await boot({artifacts:orb?{misc1:'core:orbOfVulnerability'}:{},sulfide:{layout,fixtures:{[targetKey]:{
   hitPoints:1000000,attack:0,defense:20,damage:{min:1,max:1}
  }}},enemyHero:{army:[{type:'core:gnoll',amount:1}],spells:['core:haste'],artifacts:{mach1:'core:ballista'}},army:[{type:key,amount:1}]});
  await combat(32);await wait(k=>goonkMobileState.canAct&&goonkMobileState.activeUnit?.key===k,key);
  const before=await state(),actor=before.battleUnits.find(u=>u.key===key),target=before.battleUnits.find(u=>u.key===targetKey);
  assert(target,'Real hero machine slot must produce an actual Ballista stack');assert(target.canMeleeAt);
  assert(target.armySlot<0,'Ballista must be a real machine slot, not army-slot fixture');
  const physical=Math.floor(70*(1+0.05*Math.min(60,Math.max(0,actor.attack-target.defense))));
  await cmd(14,4,target.occupied[0]);
  await wait(({id,hp})=>goonkMobileState.battleUnits.find(u=>u.stackId===id)?.currentHealth<hp,{id:target.stackId,hp:target.currentHealth});
  await wait(()=>goonkMobileState.canAct&&goonkMobileState.activeUnit);await page().waitForTimeout(1000);
  const after=await state(),injured=after.battleUnits.find(u=>u.stackId===target.stackId);
  assert.equal(injured.maximumHealth,target.maximumHealth,'SIEGE rejects Age/Poison before Orb negation');
  assert.equal(injured.defense,target.defense-3,'SpellEffect8 separate DEF predicate still allows a real positive-DEF machine');
  assert.equal(target.currentHealth-injured.currentHealth,physical+35,'ATT_DISRUPT separate predicate keeps Acid35 against siege targets');
  report['sulfideRealSiege'+orb]={before,after,orb,physical,acid:35,
   fixture:'Real Blue hero equipped coreBallista in mach1, preserving original SIEGE_WEAPON/CPU/shooter nature; only machine durability and physical control stats changed.'};
  await page().screenshot({path:path.join(out,'sulfide339-real-ballista-'+orb+'.png')});await page().close();
  fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify({passed:true,report},null,2));
 }
}
