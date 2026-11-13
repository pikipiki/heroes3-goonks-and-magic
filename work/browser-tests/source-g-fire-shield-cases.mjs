/** Source440858 reflects raw physical damage; typed g% does not intercept443DB0. */
import assert from 'node:assert/strict';
import{clickNativeWorldTile}from'./native-map-coordinates.mjs';
export async function runSourceGFireShieldCases({boot,combat,cmd,state,wait,page,sheet,resolve,finish,hp}){
 const cases={g0:{actor:'core:monk',expected:20},g50:{actor:'core:ironGolem',expected:20},g95:{actor:'core:stoneGolem',training:true,expected:20},sourceGear:{actor:'core:ironGolem',any:30,expected:20},ordinary:{actor:'goonk:paingpaing',expected:23},ordinaryGear:{actor:'goonk:paingpaing',any:30,expected:16}};
 for(const name of(process.env.SOURCE_G_SHIELD_CASES||Object.keys(cases).join(',')).split(',')){
  const c=cases[name];assert(c,'Known FireShield witness required');
  const controls={[c.actor]:{hitPoints:1000000,attack:0,defense:0,speed:30,damage:{min:1,max:1},abilities:{fixtureFlying:{type:'FLYING'},fixtureNoMorale:{type:'NO_MORALE'},fixtureNoLuck:{type:'NO_LUCK'}}},'core:blackDragon':{speed:1,abilities:{fixtureNoMorale:{type:'NO_MORALE'},fixtureNoLuck:{type:'NO_LUCK'}}},'core:gnoll':{hitPoints:1000000,attack:0,defense:0,speed:2,damage:{min:1,max:1},abilities:{fixtureNoMorale:{type:'NO_MORALE'},fixtureNoLuck:{type:'NO_LUCK'},fixtureNoRetal:{type:'NO_RETALIATION'},fixtureShield:{type:'FIRE_SHIELD',val:20},fixtureInactive:{type:'NOT_ACTIVE'}}}};
  await boot({seed:84591,layout:{attacker:[93,129,18,52,86,120,154],defender:[94,95,160,49,83,117,151]},hotseat:true,training:!!c.training,power:100000,spells:['core:implosion'],artifacts:c.any?{rightHand:'core:centaurAxe'}:{},...(c.any?{magicReduction:{artifactAny:c.any}}:{}),enemyHero:{power:5,skills:{'core:sorcery':'expert'},spells:['core:magicArrow'],army:[{type:'core:gnoll',amount:1}]},army:[{type:c.actor,amount:100},{type:'core:blackDragon',amount:1}],controls});
  let trained;
  if(c.training){
   await combat();await cmd(14,0);await wait(()=>goonkMobileState.mode==='spellbook');await cmd(49,18);await wait(()=>goonkMobileState.spellTargeting);await cmd(14,3,(await state()).battleUnits.find(u=>u.enemy).occupied[0]);await resolve();trained=await sheet();assert.equal(trained.armies[0].slots[0].experienceRank,10);await cmd(63);await wait(()=>goonkMobileState.mode==='map');await cmd(6);await page().waitForTimeout(150);await clickNativeWorldTile(page(),11,11);await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='battle');await cmd(15);
  }else await combat(32);
  await wait(actor=>goonkMobileState.canAct&&goonkMobileState.activeUnit?.key===actor,c.actor);
  const before=await state(),actor=before.battleUnits.find(u=>u.key===c.actor),target=before.battleUnits.find(u=>u.key==='core:gnoll');assert(target?.canMeleeAt,'Real original actor can strike the shield holder');assert.equal(target.canShootAt,false,'Adjacent shield holder forces a melee attack, including original Monk');
  await cmd(14,4,target.occupied[0]);
  await wait(({id,health})=>{const u=goonkMobileState.battleUnits.find(u=>u.stackId===id);return u&&(u.count-1)*u.maximumHealth+u.currentHealth<health;},{id:actor.stackId,health:hp(actor)});
  await wait(()=>goonkMobileState.canAct&&goonkMobileState.activeUnit?.key==='core:blackDragon');
  const after=await state(),incoming=hp(target)-hp(after.battleUnits.find(u=>u.stackId===target.stackId)),reflected=hp(actor)-hp(after.battleUnits.find(u=>u.stackId===actor.stackId));
  assert(incoming>0,'Real physical input precedes reflection');
  const raw=Math.trunc(incoming*20/100),nativeSorcery=Math.trunc(raw*115/100),expected=c.actor==='goonk:paingpaing'?Math.trunc(nativeSorcery*(100-(c.any||0))/100):raw;
  if(process.env.SOURCE_G_SHIELD_OBSERVE!=='1')assert.equal(reflected,expected,'Raw source reflection versus ordinary Sorcery/gear correction '+name);
  await finish('sourceGFireShield-'+name,{sourceExpected:expected,rawShieldAmount:raw,incoming,reflected,training:trained?.armies[0],before,after,observationOnly:process.env.SOURCE_G_SHIELD_OBSERVE==='1'});
 }
}
