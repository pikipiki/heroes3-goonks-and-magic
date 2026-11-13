/** Real casualty awards, canonical43 stats and separate source hate targets. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {clickNativeWorldTile} from './native-map-coordinates.mjs';
export async function runFamiliar43Cases({boot,combat,cmd,state,wait,page,sheet,resolve,finish,hp}){
 const actor='core:familiar',effectiveFlags=process.env.EXPECT_EFFECTIVE_FLAGS==='1';
 for(const rank of(process.env.FAMILIAR43_RANKS??'0,5,8,10').split(',').filter(Boolean).map(Number)){
  const profile={fullRank10:rank===5?500:rank===8?250:100,rank11Extra:1,battlePercent:rank===5?36:rank===8?70:100,experienceMultiplier:1,upgradeMultiplier:0.75};
  await boot({familiar43:true,heroLevelLimit:1,seed:86143,training:rank>0,trainingProfile:profile,...(!rank&&effectiveFlags?{garrison:[{type:'core:gnoll',amount:1}]}:{}),power:100000,spells:['core:implosion'],artifacts:{},army:[{type:actor,amount:1},{type:'core:blackDragon',amount:1}]});
  if(rank){await combat();await cmd(14,0);await wait(()=>goonkMobileState.mode==='spellbook');await cmd(49,18);await wait(()=>goonkMobileState.spellTargeting);await cmd(14,3,(await state()).battleUnits.find(u=>u.enemy).occupied[0]);await resolve();}
  const hero=await sheet(),unit=hero.armies[0].slots[0];assert.equal(unit.experienceRank,rank,'A real casualty with declared battle cap earns the requested rank');assert.equal(unit.health,4);assert.equal(unit.attack,4);assert.equal(unit.defense,4);assert.equal(unit.damageMin,1);assert.equal(unit.damageMax,2);assert.equal(unit.speed,7,'Army slots expose canonical creature speed; effective stack is checked separately');assert.equal(unit.nativeFlags.flying,effectiveFlags&&rank>=5,'Flight snapshot matches the declared bridge version');const effective=hero.troopEquipment.troops.find(u=>u.key===actor);assert.equal(effective.speed,rank===10?9:rank>=5?8:7);if(effectiveFlags)assert.equal(effective.nativeFlags.flying,rank>=5);assert.equal(unit.cost[6],60);assert.equal(unit.growth,15);assert.equal(unit.nativeFlags.living,true);
  if(rank||effectiveFlags){
   await cmd(63);await wait(()=>goonkMobileState.mode==='map');
   if(rank){await cmd(6);await page().waitForTimeout(150);await clickNativeWorldTile(page(),12,11);await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='battle');await cmd(15);}
   else await combat();
   await wait(()=>goonkMobileState.battleUnits?.some(u=>u.key==='core:familiar'));
   if(effectiveFlags){for(let pass=0;pass<60;pass++){const turn=await state();if(turn.canAct&&turn.activeUnit?.key===actor)break;if(turn.canAct&&turn.activeUnit)await cmd(13,turn.activeStack,turn.round);await page().waitForTimeout(100);}}
   const battle=await state(),familiar=battle.battleUnits.find(u=>u.key===actor);assert.equal(familiar.speed,rank===10?9:rank>=5?8:7);
   if(rank)assert.equal(familiar.luck,2,'Source Fortune advanced/expert bothgrant2luck; absolute mastery avoids stale legacybasic1');
   if(effectiveFlags){assert.equal(battle.activeUnit?.key,actor);assert.equal(battle.activeUnit.nativeFlags.flying,rank>=5);assert.equal(familiar.nativeFlags.flying,rank>=5);}
   await finish('familiar43-R'+rank,{profile,hero,battle,effectiveFlags});
  }else await finish('familiar43-R0',{hero});
 }
 if(process.env.FAMILIAR43_HATE==='0')return;
 const targets=['core:gnoll','core:masterGremlin','core:gremlin','third-upgrades:tumGrandmasterGremlin'],quiet={noMorale:{type:'NO_MORALE'},noLuck:{type:'NO_LUCK'}},enemy={hitPoints:1000000,attack:0,defense:0,speed:1,damage:{min:1,max:1},abilities:{...quiet,inactive:{type:'NOT_ACTIVE'},noRetal:{type:'NO_RETALIATION'}}};
 await boot({familiar43:true,heroLevelLimit:1,seed:86144,training:true,power:100000,spells:['core:implosion'],artifacts:{},army:[{type:actor,amount:1},{type:'core:blackDragon',amount:1}],enduranceArmy:targets.map(type=>({type,amount:1})),controls:{[actor]:{attack:0,damage:{min:10,max:10},abilities:quiet},'core:blackDragon':{speed:1,abilities:quiet},...Object.fromEntries(targets.map(k=>[k,enemy]))}});
 await combat();await cmd(14,0);await wait(()=>goonkMobileState.mode==='spellbook');await cmd(49,18);await wait(()=>goonkMobileState.spellTargeting);await cmd(14,3,(await state()).battleUnits.find(u=>u.enemy).occupied[0]);await resolve();const trained=await sheet();assert.equal(trained.armies[0].slots[0].experienceRank,10);await cmd(63);await wait(()=>goonkMobileState.mode==='map');await cmd(6);await page().waitForTimeout(150);await clickNativeWorldTile(page(),12,11);await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='battle');await cmd(15);
 const trace=[];let baseline;
 for(const key of [targets[0],targets[2],targets[1],targets[3]]){
  for(let pass=0;pass<100;pass++){const s=await state();if(s.canAct&&s.activeUnit?.key===actor)break;if(s.canAct&&s.activeUnit)await cmd(13,s.activeStack,s.round);await page().waitForTimeout(100);}
  const before=await state(),target=before.battleUnits.find(u=>u.key===key);assert.equal(before.activeUnit?.key,actor);assert(target.canMeleeAt);await cmd(14,4,target.occupied[0]);await wait(()=>goonkMobileState.canAct&&goonkMobileState.activeUnit?.key==='core:blackDragon');const after=await state(),damage=hp(target)-hp(after.battleUnits.find(u=>u.stackId===target.stackId));if(key===targets[0]){baseline=damage;fs.writeFileSync((process.env.REVIEW_OUTPUT||'/tmp')+'/familiar43-hate-baseline.json',JSON.stringify({before,after,damage},null,2));assert(baseline>=10);}else assert.equal(damage,baseline+(key===targets[3]?200:5),'Source flatPersonalHate255+200; independent R10h28/h29+50% adds5 to owned fixedbase10, preserving identical hero/attack factors');trace.push({key,before,after,damage});fs.writeFileSync((process.env.REVIEW_OUTPUT||'/tmp')+'/familiar43-hate-trace.json',JSON.stringify(trace,null,2));const next=await state();await cmd(13,next.activeStack,next.round);
 }
 await finish('familiar43-hate',{trained,trace});
}
