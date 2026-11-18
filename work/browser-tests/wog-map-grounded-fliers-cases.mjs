import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';

export function preGroundedFixture(){
 const p=compileErm(Buffer.from('!#MA:X4/d-2;'),{source:'Private source MA:X flight clear before WoG111'});
 p.originalMessages=['ZVSE private native mithril option query'];return p;
}

export async function runGroundedFliers({boot,state,command,wait,page,output,report,readCompletedNativeSave}){
 const desktop=process.env.CASES==='grounded-fliers-desktop',portrait=process.env.FLIGHT_PORTRAIT==='1';
 const cases=process.env.FLIGHT_PROBE==='1'?[[false,1,true,'core:griffin']]:process.env.FLIGHT_LEGACY_SAVE||process.env.FLIGHT_OLD_PRODUCER?[[false,null,false,'core:griffin']]:desktop||portrait?[[false,1,true,'core:griffin'],[true,0,false,'core:griffin'],[true,1,true,'core:griffin','grant']]:[
  [false,-1,false,'core:griffin'],[true,-1,true,'core:griffin'],[false,1,true,'core:griffin'],[true,0,false,'core:griffin'],[false,0,false,'core:griffin'],
  [true,1,true,'core:pikeman'],[true,1,true,'core:vampire'],[true,1,true,'core:griffin','pre-grounded'],
  [true,1,true,'core:griffin','grant'],[true,1,true,'wake-of-gods.commanders:astralSpirit1','excluded'],
 ];
 for(const [configured,choice,active,actorKey,control]of cases){
  const preGrounded=control==='pre-grounded',granted=control==='grant',excluded=control==='excluded';
  const options={enabled:false,creatureRuleFixture:true,ruleActor:actorKey,groundedFliersConfigured:configured,groundedFliersChoice:choice,
   ruleGrantedFlight:granted,ruleExcludedFlyer:excluded,...(preGrounded?{scriptProgram:preGroundedFixture()}:{}),...(portrait?{viewport:{width:390,height:844}}:{})};
  await boot(process.env.FLIGHT_LEGACY_SAVE?{...options,groundedFliersConfigured:true,save:[...fs.readFileSync(process.env.FLIGHT_LEGACY_SAVE)]}:options);
  const bytes=await readCompletedNativeSave(page(),command,{tag:831});
  fs.writeFileSync(path.join(output,`grounded-${report.scenarios.length}.vsgm1`),bytes);
  if(process.env.FLIGHT_OLD_PRODUCER){report.scenarios.push({legacyProducer:true,nativeSaveVersion:bytes.readInt32LE(4)});await page().close();return;}
  await page().close();await boot({...options,save:[...bytes],groundedFliersConfigured:!configured});
  await command(6);await page().waitForTimeout(150);
  const point=await page().evaluate(()=>{const v=goonkMobileState.mapOverview.view;return{x:v.x+v.w/2+32,y:v.y+v.h/2};});
  await page().evaluate(p=>Module._vcmiMobilePointer(p.x,p.y,1),point);await wait(()=>goonkMobileState.hasPath);await command(2);
  await wait(()=>goonkMobileState.mode==='battle');await command(15);
  for(let i=0;i<300;++i){const s=await state();if(s.canAct&&s.activeUnit?.key===actorKey)break;if(s.canAct){assert.equal(s.activeUnit?.key,'core:ballista');await command(13,s.activeStack,s.round);}await page().waitForTimeout(100);}
  await wait(key=>goonkMobileState.canAct&&goonkMobileState.activeUnit?.key===key,actorKey);
  const before=await state(),actor=before.battleUnits.find(u=>u.key===actorKey),primary=before.battleUnits.find(u=>u.enemy&&u.key==='core:gnoll');
  assert.equal(actor.occupied[0],19);assert.equal(primary.occupied[0],20);assert(primary.canMeleeAt);
  const naturalFlying=actorKey!=='core:pikeman',affected=active&&naturalFlying&&!excluded&&!preGrounded;
  assert.equal(actor.nativeFlags.flying,granted||naturalFlying&&!preGrounded&&!affected,'Only base flight is removed; later grants and excluded creatures survive');
  const abilities={};
  for(const unit of [actor,before.battleUnits.find(u=>u.key==='core:ballista')]){
   assert(unit);await command(114,unit.stackId);await wait(()=>goonkMobileState.mode==='creature');abilities[unit.key]=(await state()).creatureUnit.abilities||[];await command(0);await wait(()=>goonkMobileState.mode==='battle');
  }
  const origin=before.battleCells.find(c=>c.hex===19);assert(origin);
  await page().evaluate(p=>Module._vcmiMobilePointer(p.x,p.y,0),origin);await page().waitForTimeout(100);await command(14,4,20);
  await wait(id=>goonkMobileState.battleUnits.find(u=>u.stackId===id)?.currentHealth<1000000,primary.stackId);
  await wait(()=>goonkMobileState.canAct&&goonkMobileState.activeUnit);await page().waitForTimeout(500);
  const after=await state(),a=after.battleUnits.find(u=>u.stackId===actor.stackId),p=after.battleUnits.find(u=>u.stackId===primary.stackId);
  assert.equal(p.maximumHealth-p.currentHealth,10);
  const naturalNoRetaliation=actorKey==='core:vampire';
  assert.equal(a.maximumHealth-a.currentHealth,affected||naturalNoRetaliation?0:1,'The native target counterattacks exactly when allowed');
  assert.equal(p.remainingRetaliations,affected||naturalNoRetaliation?1:0);
  const summary={configured,choice,active,actorKey,control:control||null,affected,nativeSaveVersion:bytes.readInt32LE(4),nativeSaveReload:true,reversedGlobalDefault:true,
   legacySeventeenChoiceSave:!!process.env.FLIGHT_LEGACY_SAVE,flying:actor.nativeFlags.flying,actorDamage:a.maximumHealth-a.currentHealth,targetDamage:p.maximumHealth-p.currentHealth,remainingRetaliations:p.remainingRetaliations,abilities,viewport:page().viewportSize(),input:desktop?'mouse':'touch'};
  report.scenarios.push(summary);
  fs.writeFileSync(path.join(output,`combat-${report.scenarios.length}.json`),JSON.stringify({before,after},null,2));
  await page().screenshot({path:path.join(output,`combat-${report.scenarios.length}.png`)});await page().close();
 }
}
