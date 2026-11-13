/** Real kill-earned ranks and chance50 regeneration, with unchanged339 stats. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {clearIntrinsicEquipment} from './eighth-intrinsic-equipment.mjs';
const trainingHealth={4:31,5:40,6:51,7:64,8:76,10:400};
const regen={0:0,4:25,5:50,6:75,7:125,8:250,10:250};
const speeds=[0,0,0,0,1,1,2,2,2,2,3];
export async function runSulfideProgressionCases({boot,combat,resolve,sheet,state,cmd,wait,page,out,report}) {
 const key='tum-era:eraCreature339';
 const probe=process.env.SULFIDE_HEALTH_PROBE==='1';
 const checkpoint=()=>fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify({passed:!report.sourceHealthDiagnostics?.length,report},null,2));
 for(const rank of [0,4,5,6,7,8,10]) {
  if(process.env.SULFIDE_RANK&&Number(process.env.SULFIDE_RANK)!==rank)continue;
  if(process.env.SULFIDE_RANKS&&!process.env.SULFIDE_RANKS.split(',').map(Number).includes(rank))continue;
  const trained=rank>0;
  await boot({artifacts:{},sulfide:{...(trained?{progression:{fullRank10:100,rank11Extra:10,battlePercent:100,experienceMultiplier:1,upgradeMultiplier:0.75}}:{}),fixtures:{'core:gnoll':{
   hitPoints:1000000,attack:0,defense:0,speed:1,damage:{min:1,max:1},
   abilities:{causalInactive:{type:'NOT_ACTIVE',subtype:'core:blind'},causalNoMorale:{type:'NO_MORALE'}}
  }}},training:trained,trainingHP:trainingHealth[rank],
   battle:!trained,enemy:'core:gnoll',enemyAmount:1,
   power:6,skills:{'core:wisdom':'expert'},spells:['core:armageddon'],army:[{type:key,amount:1}]});
  await sheet();const initialEquipment=await clearIntrinsicEquipment({state,cmd,wait});
  await page().locator('[data-hero-close]').tap();await wait(()=>goonkMobileState.mode==='map');
  if(trained){await combat();await resolve();}
  const profile=await page().evaluate(()=>JSON.parse(Module.FS.readFile('/home/web_user/.local/share/vcmi/Mods/tum-era/content/config/era-bridge-experience.json',{encoding:'utf8'})).creatures['tum-era:eraCreature339']);
  assert.equal(profile.fullRank10,trained?100:147000,'Private progression must survive the source-stage installation order');
  const armySheet=await sheet(),troop=armySheet.troopEquipment.troops.find(u=>u.key===key);
  assert(troop);assert.equal(armySheet.armies[0].slots.find(u=>u?.key===key)?.experienceRank,rank,'Actual training kill must earn the requested rank');
  const expected={health:Math.floor((850*(100+5*rank)+50)/100),attack:35+rank,defense:35+rank,
   damageMin:70+rank,damageMax:70+rank,speed:20+speeds[rank]};
  for(const [field,value] of Object.entries(expected)){
   if(probe&&field==='health'&&troop[field]!==value){report.sourceHealthDiagnostics??=[];report.sourceHealthDiagnostics.push({scope:'heroSheet',rank,expected:value,actual:troop[field],profile,army:armySheet.armies[0],troop});}
   else assert.equal(troop[field],value,'Original339 R'+rank+' '+field);
  }
  report['sulfideStatsR'+rank]={troop,expected,profile,initialEquipment,army:armySheet.armies[0],
   fixture:'Original actor CFG/XP bonuses unchanged. Private progression scale100 and real training kill only.'};checkpoint();
  await page().locator('[data-hero-close]').tap();await wait(()=>goonkMobileState.mode==='map');
  await combat(trained?128:32);
  await wait(k=>goonkMobileState.canAct&&goonkMobileState.activeUnit?.key===k,key);
  const before=await state(),actor=before.battleUnits.find(u=>u.key===key);
  if(probe&&actor.currentHealth!==expected.health){report.sourceHealthDiagnostics??=[];report.sourceHealthDiagnostics.push({scope:'battle',rank,expected:expected.health,actual:actor.currentHealth,unit:actor});}
  else assert.equal(actor.currentHealth,expected.health);
  await cmd(14,0);await wait(()=>goonkMobileState.mode==='spellbook');await cmd(49,26);
  await wait(()=>goonkMobileState.mode==='battle'&&!goonkMobileState.spellTargeting);
  await wait(id=>{const u=goonkMobileState.battleUnits?.find(u=>u.stackId===id);return u&&u.currentHealth<u.maximumHealth;},actor.stackId);
  await page().waitForTimeout(800);
  const wounded=(await state()).battleUnits.find(u=>u.stackId===actor.stackId);
  assert.equal(wounded.count,1);assert(wounded.maximumHealth-wounded.currentHealth>250,'Actual Armageddon wound must exceed all source r50 values');
  let previous=wounded.currentHealth,observed=null;const trace=[];
  for(let attempt=0;attempt<600;++attempt) {
   const s=await state();assert.equal(s.mode,'battle');
   const unit=s.battleUnits.find(u=>u.stackId===actor.stackId);assert(unit);
   if(unit.currentHealth!==previous) {
    const delta=unit.currentHealth-previous;assert.equal(delta,regen[rank],'First actual proc must heal exactly the source rank amount');
    observed={round:s.round,unit,delta};break;
   }
   if(s.canAct){trace.push({round:s.round,active:s.activeUnit?.key,health:unit.currentHealth});await cmd(13,s.activeStack,s.round);}
   if(s.round>=before.round+(rank===0?6:14))break;
   await page().waitForTimeout(100);
  }
  if(rank===0)assert.equal(observed,null,'R0 source schedule is0 even after multiple real rounds');
  else assert(observed,'A real chance50 proc must be observed; retain trace if the deterministic test stream gives none');
  report['sulfideRegenR'+rank]={before,wounded,expectedAmount:regen[rank],sourceChancePercent:50,observed,trace};checkpoint();
  await page().screenshot({path:path.join(out,'sulfide339-regeneration-r'+rank+'.png')});await page().close();
 }
 if(report.sourceHealthDiagnostics?.length)throw Error('Source health parity remains incomplete; diagnostic run is deliberately NOT a passing native admission');
}
