/** Source71D939 checks alive once before the independent p21/p23 loop. */
import assert from 'node:assert/strict';
import {clickNativeWorldTile} from './native-map-coordinates.mjs';
export async function runConfluxPreDeathCases({boot,combat,cmd,state,wait,page,sheet,resolve,finish,hp}){
 const actor='tum-era:eraCreature355',trials=[];
 for(const seed of(process.env.PREDEATH_SEEDS||'84317,98765,1729,77123,193').split(',').map(Number)){
  const quiet={noMorale:{type:'NO_MORALE'},noLuck:{type:'NO_LUCK'}},enemy={hitPoints:1000000,attack:0,defense:0,speed:1,damage:{min:1,max:1},abilities:{...quiet,inactive:{type:'NOT_ACTIVE'},noRetal:{type:'NO_RETALIATION'},immuneFirst:{type:'SPELL_IMMUNITY',subtype:'core:fireball'}}};
  await boot({seed,training:true,power:117,skills:{'core:wisdom':'expert','core:fireMagic':'expert'},spells:['core:implosion','core:armageddon'],artifacts:{},army:[{type:actor,amount:1},{type:'core:blackDragon',amount:1}],enduranceArmy:[{type:'core:gnoll',amount:1},{type:'core:pikeman',amount:1}],controls:{[actor]:{speed:30,attack:0,defense:0,damage:{min:1,max:1},abilities:quiet},'core:blackDragon':{speed:1,abilities:quiet},'core:gnoll':{...enemy,abilities:Object.fromEntries(Object.entries(enemy.abilities).filter(([k])=>k!=='immuneFirst'))},'core:pikeman':enemy}});
  await combat();await cmd(14,0);await wait(()=>goonkMobileState.mode==='spellbook');await cmd(49,18);await wait(()=>goonkMobileState.spellTargeting);await cmd(14,3,(await state()).battleUnits.find(u=>u.enemy).occupied[0]);await resolve();
  const trained=await sheet();assert.equal(trained.armies[0].slots[0].experienceRank,10);assert.equal(trained.armies[0].slots[0].count,1);await cmd(63);await wait(()=>goonkMobileState.mode==='map');await cmd(6);await page().waitForTimeout(150);await clickNativeWorldTile(page(),12,11);await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='battle');await cmd(15);await wait(k=>goonkMobileState.canAct&&goonkMobileState.activeUnit?.key===k,actor);
  const fresh=await state(),mage=fresh.battleUnits.find(u=>u.key===actor);assert.equal(hp(mage),300,'Real R10 sourceHP, no owned health override');
  await cmd(14,0);await wait(()=>goonkMobileState.mode==='spellbook');await cmd(49,26);await wait(()=>goonkMobileState.mode==='battle'&&!goonkMobileState.spellTargeting);await wait(k=>{const u=goonkMobileState.battleUnits?.find(u=>u.key===k);return u&&u.currentHealth<300;},actor);await wait(k=>goonkMobileState.canAct&&goonkMobileState.activeUnit?.key===k,actor);
  const wounded=await state(),live=wounded.battleUnits.find(u=>u.key===actor);assert.equal(hp(live),2,'Real expertArmageddon raw5970, sourceg95 trunc298 leaves exactly2HP');
  const primary=wounded.battleUnits.find(u=>u.key==='core:gnoll'),observer=wounded.battleUnits.find(u=>u.key==='core:pikeman');assert(primary.canMeleeAt);
  await cmd(14,4,primary.occupied[0]);await wait(()=>goonkMobileState.canAct&&goonkMobileState.activeUnit?.key==='core:blackDragon',null,120000);
  const after=await state(),other=after.battleUnits.find(u=>u.stackId===observer.stackId),damage=hp(observer)-hp(other),dead=!after.battleUnits.some(u=>u.key===actor);trials.push({seed,trained:trained.armies[0],fresh,wounded,after,observerDamage:damage,dead});
  //125 means p23 ran at count1 (p21 did not kill first);0 means no second
  //proc. Only100 proves a subsequent p23 at current count0 after p21 death.
  assert([0,100,125].includes(damage),'Observer receives only exact source expertMeteor amount');
  if(dead&&damage===100){await finish('preDeath',{passed:true,trials,proof:'First p21 raw70 reduces3HP under sourceg95 and kills the2HP caster; independent p23 still executes at CURRENT count0, expertbase100 on the observer.'});return;}
  await finish('preDeath-trial-'+seed,{scope:'Seeded execution witness, not probability-rate validation',trial:trials.at(-1)});
 }
 assert.fail('No positive first-p death witness among declared seeds; preserve trials and do not claim this edge validated');
}
