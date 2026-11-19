import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

function program(){
 const n=number=>({kind:'number',access:'read',number});
 const cmd=(receiver,selectors,code,args)=>({receiver,selectors,conditions:[],operations:[{code,args}]});
 const result={originalMessages:['ZVSE private native companion AI reward'],initializers:[
  cmd('VR',[{kind:'named',access:'read',space:'i',name:'battleExpAIPct'}],'S',[n(100)])
 ],blocks:[{kind:'trigger',receiver:'GE',selectors:[n(2)],conditions:[],commands:[
  cmd('HE',[n(0)],'O',[n(0)]),cmd('HE',[n(0)],'C',[n(0),n(1),n(2),n(2)])
 ]}]};
 result.sha256=createHash('sha256').update(JSON.stringify(result)).digest('hex');return result;
}
export async function runAINoActor({boot,sheet,state,command,wait,startBattle,resolve,page,report,output,save}){
 for(const kind of ['none','dead'])for(const campaignTransfer of [false,true]){
  const scriptProgram=program();fs.writeFileSync(path.join(output,'program.json'),JSON.stringify(scriptProgram,null,2));
  const options={...(process.env.HENCH_NO_ACTOR_PORTRAIT==='1'?{viewport:{width:390,height:844}}:{}),scriptAI:true,enemyHero:true,reserveHero:true,henchmanType:'core:peasant',heroLevelLimit:1,aiNoActor:kind,scriptProgram,
   ...(process.env.HENCH_NO_ACTOR_PORTRAIT==='1'?{viewport:{width:390,height:844}}:{}),
   settings:{campaignTransfer,battleExpStatic:100,battleExpRandom:0,battleHeroExpCoef:0,battleExpPerHeroLv:0,
    battleExpMin:0,battleExpMax:1000,bonusDaily:0,bonusHeroLvUp:0,stackExpEnabled:false}};
  await boot(options);await startBattle();
  const units=(await state()).battleUnits;assert(!units.some(u=>u.enemy&&u.armySlot===-6));
  assert(units.some(u=>u.enemy&&u.key==='wake-of-gods.messengersandemissaries:emissaryOfWar'),JSON.stringify(units));
  await resolve();const day=(await state()).day;await command(3);
  await wait(day=>goonkMobileState.turn&&goonkMobileState.day>day&&(goonkMobileState.heroes?.some(h=>h.name==='Orrin')||goonkMobileState.mode==='dialog'),day);
  if((await state()).mode==='dialog'){await command(1);await wait(()=>goonkMobileState.mode==='map');}
  await wait(()=>goonkMobileState.heroes?.some(h=>h.name==='Orrin'));const target=(await state()).heroes.find(h=>h.name==='Orrin');await command(4,target.index);await wait(id=>goonkMobileState.heroId===id&&goonkMobileState.mode==='map',target.id);await page().evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  let hero=await sheet();assert.equal(hero.name,'Orrin');assert.equal(hero.experience,0);
  const reward=campaignTransfer||process.env.HENCH_NO_ACTOR_OLD==='1'?0:100;
  const expected=(kind==='none'?0:100)+reward;
  if(kind==='dead'){assert.equal(hero.henchman.experience,expected);assert.equal(hero.henchman.alive,false);assert.equal(hero.henchman.stackExperience,0);}
  else assert(!hero.henchman.unit);
  await command(63);await wait(()=>goonkMobileState.mode==='map');const bytes=await save();
  fs.writeFileSync(path.join(output,`${kind}-${campaignTransfer}.vsgm1`),bytes);await page().close();await boot({...options,save:[...bytes]});
  await command(4,(await state()).heroes.find(h=>h.name==='Orrin').index);await wait(id=>goonkMobileState.heroId===id&&goonkMobileState.mode==='map',target.id);await page().evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));hero=await sheet();assert.equal(hero.name,'Orrin');
  if(kind==='none'){
   assert(!hero.henchman.unit);const tab=page().locator('[data-hero-tab=henchman]');if(!await tab.isVisible())await page().locator('.hero-bag-tabs>.ui-overflow-trigger')[process.env.GROWTH_DESKTOP==='1'?'click':'tap']();await tab[process.env.GROWTH_DESKTOP==='1'?'click':'tap']();
   await page().locator('[data-henchman-slot="1"]')[process.env.GROWTH_DESKTOP==='1'?'click':'tap']();await wait(()=>goonkMobileState.heroWindow?.henchman?.unit);
   hero=(await state()).heroWindow;assert.equal(hero.henchman.unit.key,'core:archer');
  }
  assert.equal(hero.henchman.experience,expected);
  report.scenarios.push({kind,campaignTransfer,heroExperienceGain:0,companionReward:reward,viewport:page().viewportSize(),input:process.env.GROWTH_DESKTOP==='1'?'mouse':'touch',
   experience:hero.henchman.experience,noEnemyBattlefieldCompanion:true,nativeSaveReload:true,latentExperienceRevealedBySelection:kind==='none'});
  await page().close();
 }
}
