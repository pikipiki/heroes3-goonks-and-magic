import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';
import{DWELLING_CLOSURE}from'../../scripts/era-bridge/objects/stage-dwelling-closure.mjs';
export async function runDwelling185Actors({boot,combat,sheet,state,cmd,wait,page,out,report}){
 const bank=new Set([253,272,281,289,290,301,302,330,340,358]),all=DWELLING_CLOSURE.filter(id=>!bank.has(id)),selected=process.env.DWELLING_ACTORS?process.env.DWELLING_ACTORS.split(',').map(Number):all;
 const companion='goonk:bubu',target='core:gnoll';
 const normalize=async()=>{await sheet();const{clearIntrinsicEquipment}=await import('./eighth-intrinsic-equipment.mjs');await clearIntrinsicEquipment({state,cmd,wait});await page().locator('[data-hero-close]').tap();await wait(()=>goonkMobileState.mode==='map');};
 for(const id of selected){assert(all.includes(id));const key='tum-era:eraCreature'+id;
  await boot({artifacts:{},dwelling185:{controls:{[key]:{speed:100},[target]:{hitPoints:1000000,speed:1,abilities:{fixtureInactive:{type:'NOT_ACTIVE',subtype:'core:blind'}}},[companion]:{speed:1}}},battle:true,enemy:target,enemyAmount:1,army:[{type:key,amount:2},{type:companion,amount:3}]});
  await normalize();await combat(32);await wait(k=>goonkMobileState.canAct&&goonkMobileState.activeUnit?.key===k,key);const before=await state(),actor=before.battleUnits.find(u=>u.key===key);assert(actor);assert.equal(actor.count,2);assert.equal(actor.experienceRank,0);assert(before.battleUnits.some(u=>u.key===companion));
  report['actor'+id+'R0Load']={passed:true,scope:'Native loading, rank0 and coexistence with a Goonk troop; this alone does not validate every actor service',actor,before};
  if([262,264,288].includes(id)){
   assert(actor.remainingCasts>0,'Original fixed caster has real charges');await cmd(14,1);await wait(()=>goonkMobileState.creatureSpellTargeting);const targeting=await state(),ally=targeting.battleUnits.find(u=>u.key===companion),enemy=targeting.battleUnits.find(u=>u.enemy);
   assert(targeting.battleCells.find(c=>c.hex===ally.occupied[0]).spellTarget,'Friendly source target mode allows Goonk');assert(!targeting.battleCells.find(c=>c.hex===enemy.occupied[0]).spellTarget,'Friendly target mode rejects enemy');
   await cmd(14,3,ally.occupied[0]);await wait(({key,charges})=>goonkMobileState.battleUnits.find(u=>u.key===key)?.remainingCasts===charges-1,{key,charges:actor.remainingCasts});await wait(()=>!goonkMobileState.battleCamera?.active&&!goonkMobileState.creatureSpellTargeting);
   const after=await state(),post=after.battleUnits.find(u=>u.key===companion);assert.equal(id===262?post.morale:post.luck,Math.min(3,(id===262?ally.morale:ally.luck)+2),'Advanced Mirth/Fortune applies +2 within the source cap3');report['fixedCaster'+id]={passed:true,before,targeting,after};
  }
  fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify({passed:true,report},null,2));await page().screenshot({path:path.join(out,'actor-'+id+'-r0.png')});await page().close();console.log('PASS dwelling'+id+' native load'+([262,264,288].includes(id)?' and active fixed spell':''));
 }
}
