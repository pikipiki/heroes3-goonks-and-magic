/** Actual355 R10 earned through a casualty; independent p/a source rows. */
import assert from 'node:assert/strict';
import{clickNativeWorldTile}from'./native-map-coordinates.mjs';
const actor='tum-era:eraCreature355';
const spellRows={p21:{id:21,name:'fireball',damage:90},p23:{id:23,name:'meteorShower',damage:175},a17:{id:17,name:'lightningBolt',damage:125},a16:{id:16,name:'iceBolt',damage:110}};
export async function runConfluxExperienceCases({boot,combat,cmd,state,wait,page,sheet,resolve,finish,hp}){
 let baseline;
 for(const name of(process.env.CONFLUX_XP_CASES||'baseline,p21,p23,a17,a16,shield-a17,shield-a16').split(',')){
  const shield=name.startsWith('shield-'),selected=spellRows[shield?name.slice(7):name];
  const immunities=Object.fromEntries(Object.values(spellRows).filter(v=>v!==selected).map(v=>['fixtureImmunity'+v.id,{type:'SPELL_IMMUNITY',subtype:'core:'+v.name}]));
  const controls={
   [actor]:{speed:30,attack:0,defense:0,damage:{min:1,max:1},abilities:{fixtureNoMorale:{type:'NO_MORALE'},fixtureNoLuck:{type:'NO_LUCK'}}},
   'core:blackDragon':{speed:1,abilities:{fixtureNoMorale:{type:'NO_MORALE'},fixtureNoLuck:{type:'NO_LUCK'}}},
   'core:gnoll':{hitPoints:1000000,attack:0,defense:0,speed:1,damage:{min:1,max:1},abilities:{fixtureNoMorale:{type:'NO_MORALE'},fixtureNoLuck:{type:'NO_LUCK'},fixtureNoRetal:{type:'NO_RETALIATION'},fixtureInactive:{type:'NOT_ACTIVE'},...immunities,...(shield?{fixtureShield:{type:'FIRE_SHIELD',val:1000000}}:{})}}
  };
  await boot({seed:Number(process.env.CONFLUX_XP_SEED||84317),training:true,power:100000,spells:['core:implosion'],artifacts:{},army:[{type:actor,amount:3},{type:'core:blackDragon',amount:1}],controls});
  await combat();await cmd(14,0);await wait(()=>goonkMobileState.mode==='spellbook');await cmd(49,18);await wait(()=>goonkMobileState.spellTargeting);await cmd(14,3,(await state()).battleUnits.find(u=>u.enemy).occupied[0]);await resolve();
  const trained=await sheet();assert.equal(trained.armies[0].slots[0].experienceRank,10);assert.equal(trained.armies[0].slots[0].count,3);await cmd(63);await wait(()=>goonkMobileState.mode==='map');
  await cmd(6);await page().waitForTimeout(150);await clickNativeWorldTile(page(),12,11);await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='battle');await cmd(15);
  const turn=async()=>{for(let pass=0;pass<200;pass++){const s=await state();if(s.canAct&&s.activeUnit?.key===actor)return s;if(s.canAct)await cmd(13,s.activeStack,s.round);await page().waitForTimeout(100);}throw Error('Original355 turn unavailable');};
  let proc=false;const trace=[];
  for(let hit=0;hit<(selected?14:1);hit++){
   const before=await turn(),target=before.battleUnits.find(u=>u.enemy);assert.equal(before.battleUnits.find(u=>u.key===actor).count,3);
   assert(target.canMeleeAt,'Actual source355 can melee the original target');await cmd(14,4,target.occupied[0]);
   await wait(({id,health})=>{const u=goonkMobileState.battleUnits.find(u=>u.stackId===id);return u&&(u.count-1)*u.maximumHealth+u.currentHealth<health;},{id:target.stackId,health:hp(target)});await wait(()=>goonkMobileState.canAct&&goonkMobileState.activeUnit?.key==='core:blackDragon',null,120000);
   const after=await state(),enemy=after.battleUnits.find(u=>u.stackId===target.stackId),damage=hp(target)-hp(enemy),survived=after.battleUnits.some(u=>u.key===actor);trace.push({before,after,damage});
   if(name==='baseline'){baseline=damage;assert(baseline>40,'Baseline contains physical hit plus guaranteed MagicArrow40');break;}
   if(shield){
    assert.equal(survived,false,'Real FireShield kills the R10 source355 after the hit');
    // The dead manager stack contributes power0 to the separate AfterMelee15
    // (10), while its a17/a16 row has already run at pre-shield count3.
    const expectedBase=baseline-40+10;
    if(damage===expectedBase+selected.damage)proc=true;
    else assert.equal(damage,expectedBase,'BeforeShield a-row absent or its exact independent amount');
    break;
   }
   assert(survived);if(damage===baseline+selected.damage){proc=true;break;}
   assert.equal(damage,baseline,'Exactly one susceptible XP row; other rows stay independent and immune');
  }
  if(selected)assert(proc,'Real55% source row procs with its exact power3/mastery3 '+name);
  await finish('confluxXP-'+name,{sourceRows:spellRows,trained:trained.armies[0],baseline,trace});
 }
}
