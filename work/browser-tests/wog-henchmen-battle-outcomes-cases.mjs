import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function runBattleOutcomes({boot,sheet,state,command,wait,startBattle,resolve,page,report,output,save}){
 const choices=process.env.HENCH_OUTCOME_CONTROL==='1'?[false]:[false,true];
 for(const campaignTransfer of choices){
  const options={...(process.env.HENCH_OUTCOME_PORTRAIT==='1'?{viewport:{width:390,height:844}}:{}),retreatFixture:true,reserveHero:true,henchmanType:'core:archangel',
   settings:{campaignTransfer,battleExpStatic:100,battleExpRandom:0,battleHeroExpCoef:0,battleExpPerHeroLv:0,battleExpMin:0,battleExpMax:1000,bonusDaily:0,bonusHeroLvUp:0,stackExpEnabled:false}};
  await boot(options);const before=await sheet();assert.equal(before.henchman.experience,0);
  await command(63);await wait(()=>goonkMobileState.mode==='map');await startBattle();
  assert((await state()).battleUnits.some(u=>u.armySlot===-6&&!u.enemy&&u.alive!==false));
  await wait(()=>goonkMobileState.canRetreat);await command(38);await resolve();
  await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn&&goonkMobileState.autosaveAllowed);
  await command(5,0);await wait(()=>goonkMobileState.mode==='town');
  await page().locator('[data-ui=recruit-heroes]')[process.env.GROWTH_DESKTOP==='1'?'click':'tap']();
  await wait(()=>goonkMobileState.dialogKind==='tavern');
  const candidates=(await state()).tavernHeroes;
  const candidate=Object.entries(candidates).find(([,hero])=>hero.name===before.name);assert(candidate,JSON.stringify(candidates));
  await command(72,Number(candidate[0]));await wait(name=>goonkMobileState.mode==='hero'&&goonkMobileState.heroWindow?.name===name,before.name);
  const after=(await state()).heroWindow;fs.writeFileSync(path.join(output,`retreated-${campaignTransfer}.json`),JSON.stringify(after,null,2));
  const expected=process.env.HENCH_OUTCOME_CONTROL==='1'?0:campaignTransfer?0:100;
  assert.equal(after.henchman.experience,expected,'Original zero-gain reward has no winner-only guard');assert.equal(after.henchman.alive,true);
  assert.equal(after.experience,before.experience,'Retreat grants no hero XP');
  await command(63);await wait(()=>goonkMobileState.dialogKind==='tavern');await command(40);await wait(()=>goonkMobileState.mode==='town');
  const bytes=await save();fs.writeFileSync(path.join(output,`retreated-${campaignTransfer}.vsgm1`),bytes);
  await page().close();await boot({...options,save:[...bytes]});
  await command(5,0);await wait(()=>goonkMobileState.mode==='town');
  await page().locator('[data-ui=recruit-heroes]')[process.env.GROWTH_DESKTOP==='1'?'click':'tap']();await wait(()=>goonkMobileState.dialogKind==='tavern');
  const restoredCandidate=Object.entries((await state()).tavernHeroes).find(([,hero])=>hero.name===before.name);assert(restoredCandidate);
  await command(72,Number(restoredCandidate[0]));await wait(name=>goonkMobileState.mode==='hero'&&goonkMobileState.heroWindow?.name===name,before.name);
  const restored=(await state()).heroWindow;assert.equal(restored.henchman.experience,expected);assert.equal(restored.henchman.alive,true);
  report.scenarios.push({nativeSaveReload:true,outcome:'retreat',campaignTransfer,companionReward:expected,heroExperienceGain:0,alive:true,inspectedNativeTavernCandidate:true,viewport:page().viewportSize(),input:process.env.GROWTH_DESKTOP==='1'?'mouse':'touch'});
  await page().close();
 }
}
