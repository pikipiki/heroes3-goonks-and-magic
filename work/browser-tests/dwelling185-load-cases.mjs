import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import{DWELLING_CLOSURE}from'../../scripts/era-bridge/objects/stage-dwelling-closure.mjs';
export async function runDwelling185Actors({boot,combat,state,wait,page,out,report}){
 const bank=new Set([253,272,281,289,290,301,302,330,340,358]),ids=process.env.DWELLING_MIX_ALL==='1'?[...DWELLING_CLOSURE]:DWELLING_CLOSURE.filter(id=>!bank.has(id));
 for(let offset=0;offset<ids.length;offset+=6){
  const group=ids.slice(offset,offset+6),keys=group.map(id=>'tum-era:eraCreature'+id),army=[...keys.map(type=>({type,amount:2})),{type:'goonk:bubu',amount:3}];
  await boot({artifacts:{},army,battle:true,enemy:'core:gnoll',enemyAmount:1,dwelling185:{controls:{'core:gnoll':{hitPoints:1000000,speed:1,abilities:{fixtureInactive:{type:'NOT_ACTIVE',subtype:'core:blind'}}}}}});
  await combat(32);await wait(()=>goonkMobileState.canAct&&goonkMobileState.battleUnits?.length>=2);
  const s=await state(),allies=s.battleUnits.filter(u=>!u.enemy),occupied=allies.flatMap(u=>u.occupied);
  assert.equal(new Set(occupied).size,occupied.length,'Mixed native troop footprints do not overlap');
  assert(allies.some(u=>u.key==='goonk:bubu'&&u.count===3),'Goonk companion remains present');
  for(const id of group){const actor=allies.find(u=>u.key==='tum-era:eraCreature'+id);assert(actor,'Native actor '+id);assert.equal(actor.count,2);assert.equal(actor.experienceRank,0);report['actor'+id+'R0Load']={passed:true,scope:'Native mixed-army loading, rank0, Goonk coexistence and non-overlapping footprints; individual services have separate proofs',actor};}
  fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify({passed:true,report},null,2));await page().screenshot({path:path.join(out,'mixed-'+group.join('-')+'.png')});await page().close();console.log('PASS mixed native dwelling actors '+group.join(','));
 }
}
