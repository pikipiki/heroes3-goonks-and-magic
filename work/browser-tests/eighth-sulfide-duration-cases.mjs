/** One actual source cast, then no recasts: visible100-round HP lifecycle. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
export async function runSulfideDurationCases({boot,combat,state,cmd,wait,page,out,report}) {
 const key='tum-era:eraCreature339',targetKey='core:gnoll';
 const layout={attacker:[19,53,87,121,155,36,70],defender:[20,54,88,122,156,37,71]};
 await boot({artifacts:{},sulfide:{layout,fixtures:{[targetKey]:{
  hitPoints:1000000,attack:0,defense:20,speed:1,damage:{min:1,max:1},
  abilities:{causalInactive:{type:'NOT_ACTIVE',subtype:'core:blind'},causalNoMorale:{type:'NO_MORALE'}}
 }}},garrison:[{type:targetKey,amount:1}],army:[{type:key,amount:1}]});
 await combat();await wait(k=>goonkMobileState.canAct&&goonkMobileState.activeUnit?.key===k,key);
 const before=await state(),target=before.battleUnits.find(u=>u.key===targetKey),round=before.round;
 await cmd(14,4,target.occupied[0]);
 await wait(id=>goonkMobileState.battleUnits.find(u=>u.stackId===id)?.maximumHealth===450000,target.stackId);
 const trace=[];let last=-1;
 for(let attempt=0;attempt<6000;++attempt) {
  const s=await state();assert.equal(s.mode,'battle');
  const unit=s.battleUnits.find(u=>u.stackId===target.stackId);assert(unit);
  if(s.round!==last){trace.push({round:s.round,maximumHealth:unit.maximumHealth,currentHealth:unit.currentHealth,defense:unit.defense});last=s.round;}
  if(s.round>=round+101&&s.canAct)break;
  if(s.canAct)await cmd(13,s.activeStack,s.round); // Never cast/attack again.
  await page().waitForTimeout(80);
 }
 const at=offset=>trace.find(t=>t.round===round+offset);
 for(const [offset,hp]of [[0,450000],[1,400000],[2,350000],[3,300000],[4,250000],[98,250000],[99,250000],[100,1000000]]) {
  assert(at(offset),'Observe real round'+(round+offset));assert.equal(at(offset).maximumHealth,hp,'Source Poison progression/cap and100-round duration at offset'+offset);
 }
 assert(trace.filter(t=>t.round>=round+4&&t.round<round+100).every(t=>t.maximumHealth===250000));
 assert(trace.every(t=>t.defense===target.defense-3),'DisruptingRay80 source DEF reduction remains permanent after timed statuses expire');
 report.sulfideStatus100Rounds={before,trace,after:await state(),
  fixture:'One unchanged339R0 primary attack only; real Gnoll retains nature, controlled inactive/HP/stats; subsequent actions all Defend. No private status lifetime or health marker.',
  observations:'Poison starts10%, progresses10points per round to50% cap; Age halves; both originalpower100 timers expire after100rounds while source80DEF−3 remains.'};
 await page().screenshot({path:path.join(out,'sulfide339-native-100-round-status-expiry.png')});await page().close();
 fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify({passed:true,report},null,2));
}
