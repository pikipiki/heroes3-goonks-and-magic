/** Owner daily MAX, native banner equipment, and an unchanged Goonk stack. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
export async function runSulfideDailyCases({boot,sheet,state,cmd,wait,page,out,report}) {
 const key='tum-era:eraCreature339',observations=[];
 for(const include of [false,true]) {
  await boot({hero:'goonk:gardienGoonk',artifacts:include?{backpack:['wake-of-gods.stackartifacts:warlordsBannerAttack']}:{},
   sulfide:{},army:[...(include?Array.from({length:3},()=>({type:key,amount:1})):[]),{type:'goonk:bubu',amount:3}]});
  const before=await sheet(),goonk=before.armies[0].slots.find(u=>u?.key==='goonk:bubu');
  const stats=u=>Object.fromEntries(['attack','defense','damageMin','damageMax','health','speed'].map(k=>[k,u[k]]));
  const originalGoonkStats=stats(before.troopEquipment.troops.find(u=>u.key==='goonk:bubu'));
  assert(goonk);let equipped=null;
  if(include) {
   const troop=before.troopEquipment.troops.find(u=>u.key===key&&u.slot===0);
   const banner=troop.equipped||troop.inventory?.find(a=>a.name.includes('Attack'));
   assert(banner,'The real WoG banner must be available through existing troop equipment');
   const heroId=before.armies[0].id;
   if(!troop.equipped){await cmd(101,heroId,0,banner.backpackSlot,banner.id,-1);await wait(id=>goonkMobileState.troopEquipment.troops.find(t=>t.slot===0)?.equipped?.id===id,banner.id);}
   equipped=await state();
   assert.deepEqual(stats(equipped.troopEquipment.troops.find(u=>u.key==='goonk:bubu')),originalGoonkStats,'Banner equipped on339 cannot leak to the existing Goonk troop');
   assert.deepEqual(equipped.armies[0].slots.map(u=>u&&[u.key,u.count,u.experience]),before.armies[0].slots.map(u=>u&&[u.key,u.count,u.experience]),'Banner placement cannot replace stacks or alter earned XP');
  }
  await page().locator('[data-hero-close]').tap();await wait(()=>goonkMobileState.mode==='map');
  const mapBefore=await state(),day=mapBefore.day;
  await cmd(3);
  for(let n=0;n<600;n++) {
   const s=await state();
   if(s.mode==='dialog')await cmd(1);
   else if(s.mode==='map'&&s.turn&&s.day>day)break;
   await page().waitForTimeout(100);
  }
  const mapAfter=await state();assert.equal(mapAfter.mode,'map');assert(mapAfter.day>day);
  const after=await sheet(),afterGoonk=after.armies[0].slots.find(u=>u?.key==='goonk:bubu');
  assert.deepEqual(stats(after.troopEquipment.troops.find(u=>u.key==='goonk:bubu')),originalGoonkStats,'Daily source income cannot modify existing Goonk combat stats');
  assert.deepEqual([afterGoonk.key,afterGoonk.count,afterGoonk.experience],[goonk.key,goonk.count,goonk.experience]);
  if(include) {
   assert.equal(after.armies[0].slots.filter(u=>u?.key===key).length,3);
   const own=after.troopEquipment.troops.find(t=>t.slot===0);
   assert.equal(own.equipped.id,equipped.troopEquipment.troops.find(t=>t.slot===0).equipped.id);
  }
  const sulfur=mapAfter.resources[3]-mapBefore.resources[3];
  observations.push({include,delta:sulfur,before,mapBefore,mapAfter,after,equipped});
  report['sulfideDaily'+include]=observations.at(-1);
  await page().screenshot({path:path.join(out,'sulfide339-daily-'+include+'.png')});await page().close();
  fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify({passed:true,report},null,2));
 }
 assert.equal(observations[1].delta-observations[0].delta,1,'Three original339 stacks eachResGen3/1 yield owner MAX1 sulfur, not SUM3');
 report.sulfideDailyMaxDifference={baseline:observations[0].delta,threeStacks:observations[1].delta,sourceContribution:1};
}
