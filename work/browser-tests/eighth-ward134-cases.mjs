/** Existingsource254 intrinsicAge20% vsrealWard134; actual earnedR10 Poison. */
import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';
export async function runWard134Cases({boot,combat,resolve,sheet,state,cmd,wait,page,out,report}){
 const key='tum-era:necrossDragon',layout={attacker:[19,53,87,121,155,36,70],defender:[20,54,88,122,156,37,71]};
 for(const ward of[true,false]){if(process.env.WARD134_CASE&&process.env.WARD134_CASE!==(ward?'ward':'control'))continue;
  await boot({ward134:true,training:true,trainingHP:400,artifacts:{},sulfide:{layout,fixtures:{'core:archangel':{hitPoints:400,attack:0,defense:0,speed:1,damage:{min:1,max:1},abilities:{noMorale:{type:'NO_MORALE'}}},'core:gnoll':{hitPoints:1000000,attack:0,defense:20,speed:1,damage:{min:1,max:1},abilities:{noMorale:{type:'NO_MORALE'}}}}},enemyHero:{army:[{type:'core:gnoll',amount:1}],spells:['core:haste'],artifacts:ward?{torso:'core:powerOfTheDragonFather'}:{}},army:[{type:key,amount:1}]});
  await combat();await resolve();const trained=await sheet();report.wardTraining=trained;report.wardTrainingConfig=await page().evaluate(()=>JSON.parse(Module.FS.readFile('/home/web_user/.local/share/vcmi/Mods/tum-era/content/config/era-bridge-experience.json',{encoding:'utf8'})).creatures['tum-era:necrossDragon']);assert.equal(trained.armies[0].slots[0].experienceRank,10,'ActualArchangel sourcefightValue5019 kill earnsR10 under private progressioncap; source actor abilities unchanged');await page().locator('[data-hero-close]').tap();await wait(()=>goonkMobileState.mode==='map');await combat(64);
  const snapshots=[];let sawAge=false,sawPoison=false,attacks=0;
  for(let n=0;n<1200;n++){const s=await state();assert.equal(s.mode,'battle');if(!s.canAct){await page().waitForTimeout(80);continue;}const target=s.battleUnits.find(u=>u.key==='core:gnoll'),active=s.battleUnits.find(u=>u.stackId===s.activeStack);assert(target&&target.count===1);snapshots.push({round:s.round,active:active.key,enemy:active.enemy,max:target.maximumHealth,first:target.currentHealth});
   if(ward)assert([1000000,500000].includes(target.maximumHealth),'Ward134blocksPoison71level0; onlyAge75level5 mayhalveHP');
   if(target.maximumHealth===500000)sawAge=true;
   if(![1000000,500000].includes(target.maximumHealth))sawPoison=true;
   if((ward&&sawAge&&attacks>=12)||(!ward&&sawPoison&&attacks>=6))break;
   if(active.key===key){assert(target.canMeleeAt,'OriginalNecross primaryremainsadjacent');await cmd(14,4,target.occupied[0]);++attacks;}else await cmd(13,s.activeStack,s.round);
   await page().waitForTimeout(150);
   if(attacks>=40)break;
  }
  if(ward){assert(sawAge,'Real source intrinsicAge20% mustpass134 on at leastone actualattack');assert(!sawPoison);}else assert(sawPoison,'R10Poison actualpositivecontrol withoutWard');
  report['ward134'+(ward?'AgePassPoisonBlocked':'PoisonControl')]={trained,attacks,sawAge,sawPoison,snapshots,after:await state(),fixture:'Existing originalsource254, nativeR10 earnedbykill; realenemyhero artifact134 equippedtorso. OnlytargetGnoll durability/speed/attack controls, no100%syntheticAge orPoison bonus.'};await page().screenshot({path:path.join(out,'ward134-'+(ward?'age-pass-poison-blocked':'poison-positive')+'.png')});await page().close();fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify({passed:true,report},null,2));console.log('PASS original254 '+(ward?'Age75passesWard134/Poison71blocked':'R10Poisonpositivecontrol'));
 }
}
