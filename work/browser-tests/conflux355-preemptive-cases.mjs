/** Pending actual55% p witness; no fabricated chance100 or FIRST_STRIKE bonus. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {clearIntrinsicEquipment} from './eighth-intrinsic-equipment.mjs';
export async function runConflux355PreemptiveCases({boot,combat,resolve,sheet,state,cmd,wait,page,out,report}){
 const key='tum-era:eraCreature355',victimKey='tum-era:eraCreature280',trials=[];let positive=false;
 for(let trial=0;trial<12&&!positive;trial++){
  await boot({artifacts:{},conflux355Preemptive:true,training:true,trainingHP:400,enduranceTarget:victimKey,army:[{type:key,amount:1},{type:'goonk:bubu',amount:3}]});
  await sheet();const equipment=await clearIntrinsicEquipment({state,cmd,wait});await page().locator('[data-hero-close]').tap();await wait(()=>goonkMobileState.mode==='map');await combat(32);await resolve();
  const trained=await sheet(),army=trained.armies[0],troop=army.slots.find(u=>u?.key===key);assert.equal(troop?.experienceRank,10,'Real training kill must establish source55%p rank10');assert.equal(troop.count,1);await page().locator('[data-hero-close]').tap();await wait(()=>goonkMobileState.mode==='map');await combat(128);await wait(k=>goonkMobileState.canAct&&goonkMobileState.activeUnit?.key===k,key);const before=await state(),actor=before.battleUnits.find(u=>u.key===key),target=before.battleUnits.find(u=>u.key===victimKey);assert.equal(actor.experienceRank,10);assert.equal(target.maximumHealth,1);assert.equal(target.damageMin,1000000);assert(target.canMeleeAt);assert.equal(actor.count,1);
  await page().evaluate(()=>{window.conflux355PreemptiveTrace=[];window.conflux355PreemptiveTimer=setInterval(()=>{const s=window.goonkMobileState;if(!s)return;const actor=s.battleUnits?.find(u=>u.key==='tum-era:eraCreature355'),target=s.battleUnits?.find(u=>u.key==='tum-era:eraCreature280');if(window.conflux355PreemptiveTrace.length<128)window.conflux355PreemptiveTrace.push({mode:s.mode,round:s.round,actorCount:actor?.count,actorHealth:actor?.currentHealth,targetCount:target?.count,targetHealth:target?.currentHealth});},10);});
  await cmd(14,4,target.occupied[0]);await page().waitForTimeout(1500);let current=await state();for(let i=0;i<250&&current.mode==='battle'&&!current.canAct;i++){await page().waitForTimeout(60);current=await state();}const trace=await page().evaluate(()=>{clearInterval(window.conflux355PreemptiveTimer);return window.conflux355PreemptiveTrace;});
  const liveActor=current.battleUnits?.find(u=>u.key===key),liveTarget=current.battleUnits?.find(u=>u.key===victimKey);let finalArmy=null;
  if(current.mode!=='battle'){await resolve();const final=await sheet();finalArmy=final.armies[0];positive=finalArmy.slots.some(u=>u?.key===key&&u.count===1);}
  else positive=!!liveActor?.count&&!liveTarget?.count;
  trials.push({trial,positive,before,after:current,trace,finalArmy,startingEquipmentMoved:equipment.moved});
  if(positive){report.conflux355BeforeFirstStrike={passed:true,sourceChancePerRow:55,sourceRows:[21,23],targetPolicy:'Real source280 preventive-strike unchanged; only HP1/speed1 and lethal physical damage1m controlled',definitionChanceChanged:false,trials};await page().screenshot({path:path.join(out,'conflux355-xp-before-first-strike.png')});}
  await page().close();fs.writeFileSync(path.join(out,'preemptive-trials.json'),JSON.stringify(trials,null,2));
 }
 assert(positive,'Retain negative trials; actual55% p must prevent source280 lethal preemption in at least one real witness');
}
