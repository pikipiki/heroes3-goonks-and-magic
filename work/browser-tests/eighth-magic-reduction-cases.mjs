/** Native source g controls, including registered/unregistered equipment mixtures. */
import assert from 'node:assert/strict';
import{clickNativeWorldTile}from'./native-map-coordinates.mjs';
export async function runMagicReductionCases({boot,combat,cmd,state,wait,page,sheet,resolve,finish,hp}){
 const cases={
  g0:{actor:'core:monk',sourceId:8,power:2,sorcery:true,any:30,expected:23},
  ordinary:{actor:'goonk:bubu',power:2,sorcery:true,any:30,expected:24},
  g50:{actor:'core:ironGolem',sourceId:32,power:3,expected:20},
  mixed:{actor:'core:ironGolem',sourceId:32,power:3,any:30,expected:14},
  banner:{actor:'core:ironGolem',sourceId:32,power:3,banner:true,expected:16},
  g95:{actor:'core:stoneGolem',sourceId:33,power:2,training:true,protection:true,expected:0},
  g95sorcery:{actor:'core:stoneGolem',sourceId:33,power:10,training:true,sorcery:true,expected:6},
  g100:{actor:'core:goldGolem',sourceId:116,power:2,training:true,expected:0},
  zeroWound:{actor:'tum-era:eraCreature355',sourceId:355,power:2,training:true,protection:true,zeroWound:true,expected:0}
 };
 for(const name of(process.env.MAGIC_REDUCTION_CASES||Object.keys(cases).join(',')).split(',')){
  const c=cases[name];assert(c,'Known numerical control required');
  const controls={[c.actor]:{...(c.zeroWound?{}:{hitPoints:1000000}),speed:30,abilities:{fixtureNoMorale:{type:'NO_MORALE'},fixtureNoLuck:{type:'NO_LUCK'},fixtureNoRetal:{type:'NO_RETALIATION'}}},'core:pikeman':{hitPoints:1000000,speed:c.zeroWound?25:2,damage:{min:c.zeroWound?100:1,max:c.zeroWound?100:1},attack:0,defense:0,abilities:{fixtureNoMorale:{type:'NO_MORALE'},fixtureNoLuck:{type:'NO_LUCK'}}}};
  await boot({hotseat:true,training:!!c.training,power:5,spells:['core:implosion','core:protectAir'],artifacts:c.banner?{backpack:['goonk:wardingBanner']}:c.any?{rightHand:'core:centaurAxe'}:{},enemyHero:{power:c.power,...(c.zeroWound?{army:[{type:'core:pikeman',amount:3}]}:{}),skills:c.sorcery?{'core:sorcery':'expert'}:{},spells:['core:magicArrow']},army:[{type:c.actor,amount:1}],magicReduction:{artifactAny:c.any},controls});
  let trained;
  if(c.banner){const h=await sheet(),troop=h.troopEquipment.troops.find(t=>t.key===c.actor),banner=troop.inventory.find(a=>a.name==='Warding Banner');assert(banner);await page().locator('[data-hero-tab=army]').tap();await page().locator('[data-hero-troop-equipment]').tap();await page().locator('[data-troop-select]').selectOption(String(troop.slot));await page().locator(`[data-troop-item="${banner.id}"]`).tap();await page().locator('[data-troop-confirm]').tap();await wait(({slot,id})=>goonkMobileState.troopEquipment.troops.find(t=>t.slot===slot).equipped?.id===id,{slot:troop.slot,id:banner.id});await page().locator('[data-troop-back]').tap();await page().locator('[data-hero-close]').tap();await wait(()=>goonkMobileState.mode==='map');}
  if(c.training){
   await combat();await cmd(14,0);await wait(()=>goonkMobileState.mode==='spellbook');await cmd(49,18);await wait(()=>goonkMobileState.spellTargeting);const target=(await state()).battleUnits.find(u=>u.enemy);await cmd(14,3,target.occupied[0]);await resolve();trained=await sheet();assert.equal(trained.armies[0].slots[0].experienceRank,10,'Real training casualty awards exact R10');await cmd(63);await wait(()=>goonkMobileState.mode==='map');
   await cmd(6);await page().waitForTimeout(150);await clickNativeWorldTile(page(),11,11);await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='battle');await cmd(15);await wait(()=>goonkMobileState.canAct&&goonkMobileState.battleUnits?.length);
  }else await combat(32);
  let red=await state();
  if(c.protection){
   assert.equal(red.activeUnit?.key,c.actor);const own=red.battleUnits.find(u=>u.key===c.actor),mana=red.heroMana;
   await cmd(14,0);await wait(()=>goonkMobileState.mode==='spellbook');await cmd(49,30);await wait(()=>goonkMobileState.spellTargeting);assert((await state()).battleCells.find(v=>v.hex===own.occupied[0])?.spellTarget);await cmd(14,3,own.occupied[0]);await wait(m=>goonkMobileState.heroMana<m&&goonkMobileState.mode==='battle'&&!goonkMobileState.spellTargeting,mana);
  }
  const redId=red.activeStack,redRound=red.round;
  for(let pass=0;pass<100;pass++){
   const s=await state();if(s.canAct&&s.activeUnit?.key==='core:pikeman')break;
   if(s.canAct)await cmd(c.zeroWound?12:13,redId,redRound);await page().waitForTimeout(120);
  }
  const before=await state();assert.equal(before.activeUnit?.key,'core:pikeman');
  const target=before.battleUnits.find(u=>u.key===c.actor);
  await cmd(14,0);await wait(()=>goonkMobileState.mode==='spellbook');await cmd(49,15);await wait(()=>goonkMobileState.spellTargeting);
  assert((await state()).battleCells.find(v=>v.hex===target.occupied[0])?.spellTarget,'Source g100 is still a valid zero-damage target; ordinary immunity rules stay separate');
  await cmd(14,3,target.occupied[0]);await wait(()=>goonkMobileState.mode==='battle'&&!goonkMobileState.spellTargeting&&goonkMobileState.heroMana<200);await page().waitForTimeout(500);
  const after=await state(),victim=after.battleUnits.find(u=>u.stackId===target.stackId),damage=hp(target)-hp(victim);
  assert.equal(damage,c.expected,'Independent source arithmetic '+name);
  if(c.zeroWound){
   const melee=async()=>{const before=await state(),mage=before.battleUnits.find(u=>u.key===c.actor),enemy=before.battleUnits.find(u=>u.key==='core:pikeman');for(let pass=0;pass<100;pass++){const turn=await state(),current=turn.battleUnits.find(u=>u.stackId===mage.stackId);if(hp(current)<hp(mage))break;if(turn.canAct&&turn.activeUnit?.key==='core:pikeman')await cmd(14,4,current.occupied[0]);await page().waitForTimeout(120);}await page().waitForTimeout(700);const after=await state(),lastMage=after.battleUnits.find(u=>u.stackId===mage.stackId),lastEnemy=after.battleUnits.find(u=>u.stackId===enemy.stackId),physical=hp(mage)-hp(lastMage),reflected=hp(enemy)-hp(lastEnemy);assert(physical>0);return{before,after,physical,reflected};};
   const first=await melee();assert.equal(first.reflected,Math.floor(first.physical*20/100),'A real zero-damage spell already applied basic Shield29 before this first physical hit');assert(first.reflected>0);
   const reposition=async()=>{const s=await state(),mage=s.battleUnits.find(u=>u.key===c.actor),enemy=s.battleUnits.find(u=>u.key==='core:pikeman'),cells=s.battleCells.filter(v=>v.reachable&&v.kind===0&&!mage.occupied.includes(v.hex)).sort((a,b)=>Math.hypot(a.x-enemy.x,a.y-enemy.y)-Math.hypot(b.x-enemy.x,b.y-enemy.y));assert(cells.length);await cmd(14,4,cells[0].hex);};
   await wait(()=>goonkMobileState.canAct&&goonkMobileState.round===1&&goonkMobileState.activeUnit?.key==='tum-era:eraCreature355');await reposition();await wait(()=>goonkMobileState.canAct&&goonkMobileState.round===2&&goonkMobileState.activeUnit?.key==='tum-era:eraCreature355');await reposition();await wait(()=>goonkMobileState.canAct&&goonkMobileState.activeUnit?.key==='core:pikeman');const expired=await melee();assert.equal(expired.reflected,0,'Source injured count1 Shield (not CURRENTenemycount3) expires on round2; next wound may only reapply it after this hit');await finish('magicReduction-zeroWound',{trained:trained.armies[0],zeroSpell:{before,after,damage},first,expired});continue;
  }
  await finish('magicReduction-'+name,{sourceId:c.sourceId,fixture:'Only source g migration, owned HP/speed controls, real hero skill/spell and real equipped CentaurAxe ANY control; no damage overrides',expected:c.expected,damage,trained:trained?.armies[0],before,after});
 }
}
