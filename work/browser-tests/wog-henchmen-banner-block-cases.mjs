import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Private creature overrides isolate the incoming physical damage hook. No
// altered creature data or save is written into the distributed game.
export async function runBannerBlock({boot,startBattle,state,command,wait,page,report,output}){
 const health=unit=>(unit.count-1)*unit.maximumHealth+unit.currentHealth;
 for(const style of [-1,7]){
  await boot({henchmanType:'core:peasant',henchmanBanner:style,enemyHero:true,blockFixture:true,archangels:1});
  await startBattle();const samples=[];
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
   const factor=difference>=0?1+Math.min(4,difference*0.05):1/(1+Math.min(28,-difference)*0.025);
   const raw=Math.trunc(enemy.damageMin*enemy.count*factor),before=health(hench);
   const cell=current.battleCells.find(cell=>cell.hex===enemy.occupied[0]);
   assert.equal(cell?.actionLabel,'Attack');
   await command(14,4,enemy.occupied[0]);
   await wait(id=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct&&goonkMobileState.activeStack!==id,hench.stackId);
   const updated=(await state()).battleUnits.find(unit=>unit.stackId===hench.stackId);
   const damage=before-health(updated),half=Math.trunc(raw/2);
   assert(style===7?(damage===raw||damage===half):damage===raw,JSON.stringify({style,damage,raw,half,hench,enemy}));
   samples.push({damage,raw,half});
   fs.writeFileSync(path.join(output,`banner-block-${style}-samples.json`),JSON.stringify(samples,null,2));
   if(style<0?samples.length>=4:samples.some(s=>s.damage===s.raw)&&samples.some(s=>s.damage===s.half))break;
  }
  assert(samples.length>=1);
  if(style===7)assert(samples.some(s=>s.damage===s.half)&&samples.some(s=>s.damage===s.raw),'Observe both independent banner roll outcomes');
  else assert.equal(samples.length,4);
  report.scenarios.push(`native-banner-partial-block-${style}-retaliation-damage-${samples.map(s=>s.damage).join('-')}`);
  await page().close();
 }
}
