/** Native positive Paralyze74 from original chance3/101, observed via real hotseat turns. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
export async function runSulfideParalyzeCases({boot,combat,state,cmd,wait,page,out,report}) {
 const key='tum-era:eraCreature339',targetKey='core:gnoll';
 const layout={attacker:[19,53,87,121,155,36,70],defender:[20,54,88,122,156,37,71]};
 await boot({artifacts:{},sulfide:{layout,fixtures:{[targetKey]:{
  hitPoints:1000000,attack:0,defense:20,speed:1,damage:{min:1,max:1},abilities:{causalNoMorale:{type:'NO_MORALE'}}
 }}},enemyHero:{army:[{type:targetKey,amount:1}],spells:['core:haste']},army:[{type:key,amount:1}]});
 await combat(32);const initial=await state(),turns=new Set(),trace=[];let lastAttackRound=null,attacks=0,observed=null;
 for(let attempt=0;attempt<8000;++attempt) {
  const s=await state();assert.equal(s.mode,'battle');
  const actor=s.battleUnits.find(u=>u.key===key),target=s.battleUnits.find(u=>u.key===targetKey);
  assert(actor&&target&&actor.count===1&&target.count===1);
  if(s.canAct) {
   trace.push({round:s.round,active:s.activeUnit?.key,target:target.currentHealth,maximum:target.maximumHealth});
   if(s.activeUnit?.key===key) {
    if(lastAttackRound!==null&&s.round===lastAttackRound+1&&!turns.has(lastAttackRound)) {
     observed={round:lastAttackRound,nextRound:s.round,after:s,attacks};break;
    }
    if(attacks>=160)break;
    assert(target.canMeleeAt);lastAttackRound=s.round;
    await cmd(14,4,target.occupied[0]);attacks++;
   } else {
    if(s.activeUnit?.key===targetKey)turns.add(s.round);
    await cmd(13,s.activeStack,s.round);
   }
  }
  await page().waitForTimeout(100);
 }
 fs.writeFileSync(path.join(out,'sulfide339-paralyze-hotseat-trace.json'),JSON.stringify(trace,null,2));
 assert(observed,'Original chance3/101 must produce one visible skipped Blue Gnoll turn; no synthetic100% bonus is allowed');
 report.sulfideParalyzePositive={initial,observed,attacks,blueActionRounds:[...turns],trace,
  fixture:'Two human players, unchanged339R0 and originalCFG3>Randint(0,100). Real Gnoll has controlled durability/stats and noMorale only, no NOT_ACTIVE. Every non339 turn is manually Defended, so a missing BlueGnoll turn after a real339 attack witnesses Paralyze74.'};
 await page().screenshot({path:path.join(out,'sulfide339-real-paralyze-positive.png')});await page().close();
 fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify({passed:true,report},null,2));
}
