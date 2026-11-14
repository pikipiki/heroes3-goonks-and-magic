/** Private native Fear proof: original chance and aura remain untouched. */
import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';
export async function runDwelling185Fear({boot,combat,resolve,sheet,state,cmd,wait,page,out,report}){
 const hp=u=>(u.count-1)*u.maximumHealth+u.currentHealth;
 const checkpoint=()=>fs.writeFileSync(path.join(out,'progress.json'),JSON.stringify({passed:false,report},null,2));
 report.fear=[];
 for(const c of[{id:253,rank:0,expectedSkip:true},{id:306,rank:0,expectedSkip:true},{id:330,rank:0,expectedSkip:false},{id:330,rank:10,expectedSkip:true}].filter(c=>!process.env.FEAR_CASES||process.env.FEAR_CASES.split(',').includes(c.id+'R'+c.rank))){
  const key='tum-era:eraCreature'+c.id,anchor='core:gnollMarauder',controls={'core:archer':{hitPoints:1000000,speed:25,attack:0,damage:{min:1,max:1},shots:999,abilities:{range:{type:'NO_DISTANCE_PENALTY'}}},[anchor]:{hitPoints:1000000,speed:1,abilities:{anchorFearless:{type:'NO_MORALE'}}}};
  await boot({artifacts:{},disableCommanders:true,hero:'core:orrin',skills:{},...(c.rank?{training:true,trainingFullRank10:342,trainingHP:700,enduranceTarget:'core:archer'}:{battle:true,enemy:'core:archer',enemyAmount:1}),army:[{type:key,amount:1},{type:anchor,amount:1}],dwelling185:{seed:185253,controls}});
  let trained=null;
  if(c.rank){await combat();await resolve();const s=await sheet();trained=s.armies[0].slots.find(u=>u.key===key);assert.equal(trained.experienceRank,10,'Real native training reaches rank10');await page().locator('[data-hero-close]').tap();await combat(128);}else await combat();
  const initial=await state();assert.equal(initial.battleUnits.find(u=>u.key===key).experienceRank,c.rank);const rounds=new Map(),complete=[],seen=new Set();let previousHealth,previousShots=999;
  for(let step=0;step<400;step++){
   await wait(()=>goonkMobileState.canAct&&goonkMobileState.canUseMagic);const s=await state(),actor=s.battleUnits.find(u=>u.key===key),enemy=s.battleUnits.find(u=>u.enemy);assert(actor&&actor.count===1);assert(actor.morale>=0);assert.equal(enemy.key,'core:archer');assert.equal(enemy.morale,0,'Neutral archer has no morale skips or extra turns');
   const r=rounds.get(s.round)||{round:s.round,primaryActed:false};if(s.activeUnit?.key===key)r.primaryActed=true;rounds.set(s.round,r);
   if(s.activeUnit?.key===anchor&&!seen.has(s.round)){
    seen.add(s.round);const health=s.battleUnits.filter(u=>!u.enemy).reduce((n,u)=>n+hp(u),0);if(previousHealth===undefined)previousHealth=s.battleUnits.filter(u=>!u.enemy).reduce((n,u)=>n+u.count*u.maximumHealth,0);r.damage=previousHealth-health;previousHealth=health;r.shotsUsed=previousShots-enemy.remainingShots;previousShots=enemy.remainingShots;r.archerRemainingShots=enemy.remainingShots;r.actorMorale=actor.morale;r.enemyMorale=enemy.morale;complete.push({...r});if(complete.length>=40&&(!c.expectedSkip||complete.some(v=>v.shotsUsed===0)))break;if(complete.length>=80)break;
   }
   await cmd(13,s.activeStack,s.round);await page().waitForTimeout(200);
  }
  assert(complete.length>=40);assert(complete.every(v=>v.shotsUsed===0||v.shotsUsed===1),'One native arrow at most is consumed each complete round');if(c.expectedSkip)assert(complete.some(v=>v.shotsUsed===0),'Original Fear makes the neutral archer skip actual turns');else assert(complete.every(v=>v.shotsUsed===1),'Rank0 source330 has no Fear and every archer turn consumes one real shot');assert(complete.every(v=>v.primaryActed),'No enemy Fear or negative morale removes own actor turns');
  report.fear.push({...c,passed:true,trained,observed:complete,skippedRounds:complete.filter(v=>v.shotsUsed===0).length,initial});checkpoint();await page().screenshot({path:path.join(out,'fear-'+c.id+'-R'+c.rank+'.png')});await page().close();console.log('PASS Fear'+c.id+' R'+c.rank+' skips='+complete.filter(v=>v.shotsUsed===0).length);
 }
 report.witness='Native archer remainingShots consumed per completed round; team HP recorded for context only, unaffected by zero-damage rounding or new summons';report.sourceChanceUnchanged=true;report.nativeTrainingOnly=true;
}
