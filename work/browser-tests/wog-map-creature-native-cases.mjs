import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
export async function runCreatureRules({boot,state,command,wait,readCompletedNativeSave,page,report,output}){
 const actorKey=process.env.RULE_ACTOR||'core:goblin',double=process.env.RULE_DOUBLE!=='0',breath=process.env.RULE_BREATH!=='0';
 const ai=!!process.env.RULE_AI;
 const options={enabled:false,ruleAiFight:ai,creatureRuleFixture:true,ruleActor:actorKey,allDoubleAttack:double,allBreath:breath};
 await boot(options);
 if(process.env.RULE_SAVE){
  const save=[...await readCompletedNativeSave(page(),command,{tag:830})];await page().close();
  await boot({...options,save,allDoubleAttack:false,allBreath:false});
 }
 await command(6);await page().waitForTimeout(150);const point=await page().evaluate(()=>{const v=goonkMobileState.mapOverview.view;return{x:v.x+v.w/2+32,y:v.y+v.h/2};});
 await page().evaluate(p=>Module._vcmiMobilePointer(p.x,p.y,1),point);await wait(()=>goonkMobileState.hasPath);await command(2);
 await wait(()=>goonkMobileState.mode==='battle');await command(15);
 for(let i=0;i<300;++i){const current=await state();if(current.canAct&&current.activeUnit?.key===actorKey)break;if(current.canAct){assert.equal(current.activeUnit?.key,'core:ballista');await command(13,current.activeStack,current.round);}await page().waitForTimeout(100);}
 await wait(key=>goonkMobileState.canAct&&goonkMobileState.activeUnit?.key===key,actorKey);
 const before=await state(),actor=before.battleUnits.find(u=>u.key===actorKey),primary=before.battleUnits.find(u=>u.enemy&&u.key==='core:gnoll'),collateral=before.battleUnits.find(u=>u.enemy&&u.key==='core:peasant');
 assert.equal(actor.occupied[0],19);assert.equal(primary.occupied[0],20);if(!ai)assert.equal(collateral.occupied[0],21);assert(primary.canMeleeAt);
 const abilities={};
 for(const unit of [actor,before.battleUnits.find(u=>u.key==='core:ballista')]){
  assert(unit);await command(114,unit.stackId);await wait(()=>goonkMobileState.mode==='creature');abilities[unit.key]=(await state()).creatureUnit.abilities||[];await command(0);await wait(()=>goonkMobileState.mode==='battle');
 }
 fs.writeFileSync(path.join(output,'abilities.json'),JSON.stringify(abilities,null,2));
 const excluded=actorKey.startsWith('wake-of-gods.commanders:');
 const attacks=(!excluded&&double)||actorKey==='core:hobgoblinWolfRider'?2:1,hasBreath=(!excluded&&breath)||actorKey==='core:greenDragon';
 assert.equal(abilities[actorKey].some(text=>text.startsWith('{Additional Attacks}')),attacks===2);
 assert.equal(abilities[actorKey].filter(text=>text.startsWith('{Breath Attack}')).length,hasBreath?1:0);
 assert(abilities['core:ballista'].every(text=>!text.startsWith('{Additional Attacks}')&&!text.startsWith('{Breath Attack}')));
 if(ai){
  for(let i=0;i<400;++i){const current=await state();if(current.round>before.round&&current.canAct&&current.activeUnit?.key===actorKey)break;if(current.canAct)await command(13,current.activeStack,current.round);await page().waitForTimeout(100);}
  const after=await state(),injured=after.battleUnits.find(u=>u.stackId===actor.stackId);assert(after.round>before.round);assert.equal(injured.maximumHealth-injured.currentHealth,double?2:1);
  fs.writeFileSync(path.join(output,'combat.json'),JSON.stringify({before,after},null,2));report.scenarios.push('map-creature-rules-ai-attacks-'+(double?'twice':'once'));await page().close();return;
 }
 const origin=before.battleCells.find(c=>c.hex===19);assert(origin);
 await page().evaluate(p=>Module._vcmiMobilePointer(p.x,p.y,0),origin);await page().waitForTimeout(100);await command(14,4,20);
 await wait(id=>goonkMobileState.battleUnits.find(u=>u.stackId===id)?.currentHealth<1000000,primary.stackId);
 await wait(()=>goonkMobileState.canAct&&goonkMobileState.activeUnit);await page().waitForTimeout(500);
 const after=await state(),p=after.battleUnits.find(u=>u.stackId===primary.stackId),c=after.battleUnits.find(u=>u.stackId===collateral.stackId),a=after.battleUnits.find(u=>u.stackId===actor.stackId);

 fs.writeFileSync(path.join(output,'combat.json'),JSON.stringify({before,after,attacks,hasBreath},null,2));
 assert.equal(p.maximumHealth-p.currentHealth,10*attacks,'Primary receives the expected number of melee strikes');
 assert.equal(c.maximumHealth-c.currentHealth,hasBreath?10*attacks:0,'The second hex receives physical breath damage only');
 assert.equal(a.maximumHealth-a.currentHealth,1,'The primary target retaliates once; collateral never retaliates');
 const label=actorKey.split(':')[1]+'-double'+Number(double)+'-breath'+Number(breath)+(process.env.RULE_SAVE?'-saved':'');
 fs.writeFileSync(path.join(output,'combat.json'),JSON.stringify({before,after,attacks,hasBreath},null,2));
 report.scenarios.push('map-creature-rules-'+label,'map-creature-rules-exclude-war-machines-in-native-ability-sheet');await page().close();
}
