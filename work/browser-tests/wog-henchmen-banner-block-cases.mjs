import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Private creature overrides isolate the incoming physical damage hook. No
// altered creature data or save is written into the distributed game.
export async function runBannerBlock({boot,startBattle,state,command,wait,page,report,output,overlap=false,forced=false}){
 const health=unit=>(unit.count-1)*unit.maximumHealth+unit.currentHealth;
 for(const style of [-1,7]){
  await boot({henchmanType:overlap?'tum-era:eraCreature273':'core:peasant',stackExperience:overlap?70000:0,henchmanBanner:style,enemyHero:true,blockFixture:true,forcedBlock:forced,archangels:1});
  await startBattle();const samples=[];
  // A private L row with30% strength/100% chance forces simultaneous
  // success whenever the independent banner succeeds. The ordinary overlap
  // uses the original creature273 row (60% strength/25% chance at rank10).
  const reductions=forced?(style===7?[30,50]:[30]):overlap?(style===7?[0,50,60]:[0,60]):style===7?[0,50]:[0];
  for(let step=0;step<640;++step){
   await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct);
   const current=await state(),actor=current.battleUnits.find(unit=>unit.stackId===current.activeStack);
   const hench=current.battleUnits.find(unit=>unit.armySlot===-6&&!unit.enemy);
   const enemy=current.battleUnits.find(unit=>unit.enemy&&unit.armySlot>=0);
   assert(hench&&enemy,'Both isolated test actors must survive');
   if(actor?.stackId!==hench.stackId){await command(13);await page().waitForTimeout(150);continue;}
   assert.equal(enemy.remainingRetaliations,1);
   assert.equal(enemy.damageMin,enemy.damageMax);assert.equal(hench.morale,0);assert.equal(enemy.luck,0);
   const difference=enemy.attack-hench.defense;
   const factor=difference>=0?1+Math.min(4,difference*0.05):1-Math.min(0.7,-difference*0.025);
   const raw=Math.trunc(enemy.damageMin*enemy.count*factor),before=health(hench);
   const cell=current.battleCells.find(cell=>cell.hex===enemy.occupied[0]);
   assert.equal(cell?.actionLabel,'Attack');
   await command(14,4,enemy.occupied[0]);
   await wait(id=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct&&goonkMobileState.activeStack!==id,hench.stackId);
   const updated=(await state()).battleUnits.find(unit=>unit.stackId===hench.stackId);
   const damage=before-health(updated),half=Math.trunc(raw/2);
   assert(reductions.some(reduction=>damage===Math.trunc(raw*(100-reduction)/100)),JSON.stringify({style,damage,raw,half,hench,enemy}));
   if(overlap)assert.equal(hench.experienceRank,10);
   samples.push({damage,raw,half});
   fs.writeFileSync(path.join(output,`banner-block-${style}-samples.json`),JSON.stringify(samples,null,2));
   if(!overlap&&style<0?samples.length>=4:reductions.every(reduction=>samples.some(s=>s.damage===Math.trunc(s.raw*(100-reduction)/100))))break;
  }
  assert(samples.length>=1);
  if(overlap||style===7)assert(reductions.every(reduction=>samples.some(s=>s.damage===Math.trunc(s.raw*(100-reduction)/100))),'Observe each independent source protection outcome');
  else assert.equal(samples.length,4);
  report.scenarios.push(`native-banner-${forced?'controlled-simultaneous-defence-overlap':overlap?'intrinsic-defence-overlap':'partial-block'}-${style}-retaliation-damage-${samples.map(s=>s.damage).join('-')}`);
  await page().close();
 }
}
