/** Actual hotseat Goonk primary -> source339 normal counter, no synthetic action. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
export async function runSulfideCounterCases({boot,combat,state,cmd,wait,page,out,report}) {
 const key='tum-era:eraCreature339',targetKey='goonk:bubu';
 const layout={attacker:[19,53,87,121,155,36,70],defender:[20,54,88,122,156,37,71]};
 await boot({artifacts:{},sulfide:{layout,fixtures:{[targetKey]:{
  hitPoints:1000000,attack:0,defense:20,speed:1,damage:{min:1,max:1},abilities:{causalNoMorale:{type:'NO_MORALE'}}
 }}},enemyHero:{army:[{type:targetKey,amount:1}],spells:['core:haste']},army:[{type:key,amount:1}]});
 await combat(32);let before;
 for(let attempt=0;attempt<400;++attempt) {
  const s=await state();assert.equal(s.mode,'battle');
  if(s.canAct&&s.activeUnit?.key===targetKey) {
   before=s;const red=s.battleUnits.find(u=>u.key===key);
   await cmd(14,4,red.occupied[0]);break;
  }
  if(s.canAct)await cmd(13,s.activeStack,s.round);
  await page().waitForTimeout(100);
 }
 assert(before,'The real hotseat Blue Bubu must make the primary melee action');
 const actor=before.battleUnits.find(u=>u.key===key),target=before.battleUnits.find(u=>u.key===targetKey);
 const appliedHandle=await wait(id=>{const u=goonkMobileState.battleUnits.find(u=>u.stackId===id);return u?.maximumHealth===450000?{round:goonkMobileState.round,maximumHealth:u.maximumHealth,currentHealth:u.currentHealth}:false;},target.stackId);
 const firstApplied=await appliedHandle.jsonValue();
 await wait(()=>goonkMobileState.canAct&&goonkMobileState.activeUnit);await page().waitForTimeout(1000);
 const after=await state(),counter=after.battleUnits.find(u=>u.stackId===actor.stackId),injured=after.battleUnits.find(u=>u.stackId===target.stackId);
 assert.equal(counter.attack,actor.attack-3,'Original Goonk after-attack Weakness remains before the normal retaliation');
 const physical=Math.floor(70*(1+0.05*Math.min(60,Math.max(0,counter.attack-target.defense))));
 const elapsedRounds=after.round-before.round;assert(elapsedRounds>=0&&elapsedRounds<=1);
 assert.equal(firstApplied.maximumHealth,450000,'Actual immediate source Age+Poison10% must be observed');
 assert.equal(injured.maximumHealth,450000-50000*elapsedRounds,'If Blue was last, the next actionable turn has already advanced Poison by10points');assert.equal(injured.defense,target.defense-3);
 assert.equal(injured.maximumHealth-injured.currentHealth,physical+35,'339 counter contributes physical/Acid35, then sourceAge+Poison and queuedDEF−3');
 report.sulfideNormalCounterGoonk={before,firstApplied,after,elapsedRounds,physical,acid:35,
  fixture:'Two-human hotseat. Unchanged source339R0; real Bubu primary retains original Weakness ability. Bubu durability/physical control stats only.',
  currentScope:'Normal441B62 hook runs before CURRENT side restore; this witness reaches that real branch without preemption or a proxy primary command.'};
 await page().screenshot({path:path.join(out,'sulfide339-real-goonk-primary-counter.png')});await page().close();
 fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify({passed:true,report},null,2));
}
