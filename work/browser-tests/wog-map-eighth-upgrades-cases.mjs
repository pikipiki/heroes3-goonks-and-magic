import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {selectHeroTab} from './native-ui-actions.mjs';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';
const pairs=[['core:archangel','wake-of-gods.level8units:supremeArchangel'],['core:goldDragon','wake-of-gods.level8units:diamondDragon'],['core:titan','wake-of-gods.level8units:lordOfThunder'],['core:archDevil','wake-of-gods.level8units:hellBaron'],['core:ghostDragon','wake-of-gods.level8units:bloodDragon'],['core:blackDragon','wake-of-gods.level8units:darknessDragon'],['core:ancientBehemoth','wake-of-gods.level8units:ghostBehemoth'],['core:chaosHydra','wake-of-gods.level8units:hellHydra'],['core:phoenix','wake-of-gods.level8units:sacredPhoenix']];
export function eighthUpgradeProgram({historical=false}={}){
 const query=prefix=>`${historical?'VRv8200:S0;':'UN:P125/?v8200;'}\n${prefix}HE0:C0/0/?v8201/?v8202;\n${prefix}HE1:C0/0/?v8203/?v8204;\n${prefix}IF:M^EIGHTH DAY AI %V8201/%V8202 POOL %V8203/%V8204 RULE %V8200^;`;
 const p=compileErm(Buffer.from(`ZVSE\n!#${query('!#')}\n!?GE2;\n!!${query('!!')}\n!?GE3;\n!!${query('!!')}\n`),{source:'Private source125 AI/pool and player army witnesses'});p.originalMessages=['ZVSE private native companion town continuation'];return p;
}
export async function runEighthUpgrades({boot,sheet,state,command,wait,approachEnemy,resolve,page,report,output,readCompletedNativeSave}){
 const historical=process.env.EIGHTH_OLD_CONTROL==='1',legacy=process.env.EIGHTH_LEGACY_SAVE;
 const expectedVersion=historical?933:934;
 const portrait=process.env.EIGHTH_PORTRAIT==='1',press=process.env.GROWTH_DESKTOP==='1'?'click':'tap';
 const row=process.env.EIGHTH_ROW||'first',battle=process.env.EIGHTH_BATTLE==='1';
 const choice=historical?null:Number(process.env.EIGHTH_CHOICE??1),configured=process.env.EIGHTH_CONFIGURED==='1',active=!historical&&!legacy&&(choice<0?configured:choice===1);
 const wrapped=process.env.EIGHTH_WRAP_SKIP==='1';
 const species=wrapped?['core:archangel','core:archangel','core:archangel','core:archangel','core:pikeman',pairs[0][1],'core:archer']:row==='first'?[...pairs.slice(0,6).map(p=>p[0]),pairs[0][1]]:[...pairs.slice(6).map(p=>p[0]),pairs[0][0],pairs[0][0],pairs[0][1],'core:pikeman'];
 const counts=wrapped?[1073741824,1073741824,1073741824,1073741824,1,1,1]:row==='first'?[battle?100000:12,10,7,9,8,6,5]:[9,8,7,3,4,2,6];
 const scriptProgram=eighthUpgradeProgram({historical:historical||!!legacy});fs.writeFileSync(path.join(output,'program.json'),JSON.stringify(scriptProgram,null,2));
 const options={enabled:false,scriptTown:true,enemyHero:true,scriptProgram,growthChoice:0,growthConfigured:false,eighthUpgradeChoice:choice,eighthUpgradeConfigured:configured,eighthUpgradeFixture:{army:species.map((type,i)=>({type,amount:counts[i]})),battle,repairCount:process.env.EIGHTH_ZERO_REWARD==='1'?1:100,paid:process.env.EIGHTH_PAID==='1'},settings:{ai:{adventureEnemyAI:'EmptyAI',adventureAlliedAI:'EmptyAI'}},...(portrait?{viewport:{width:390,height:844}}:{})};
 const ack=async()=>{await page().locator('[data-dialog-confirm]')[press]();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);};
 const witness=async(after)=>{await wait(()=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.join(' ').startsWith('EIGHTH DAY '));const text=(await state()).dialogPresentation.lines.join(' ');assert.equal(text,`EIGHTH DAY AI ${after&&active?150:13}/50 POOL ${after&&active?151:27}/100 RULE ${Number(active)}`);return text;};
 const army=async()=>{const hero=await sheet(),s=await state(),army=s.armies.find(a=>a.id===hero.id);assert(army);const result=structuredClone(army.slots);await command(63);await wait(()=>goonkMobileState.mode==='map');return result;};
 if(legacy||process.env.EIGHTH_START_SAVE)await boot({...options,save:[...fs.readFileSync(legacy||process.env.EIGHTH_START_SAVE)]});else{await boot({...options,expectedDialog:'source-campaign'});await witness(false);await ack();}
 if(battle&&!process.env.EIGHTH_START_SAVE){await approachEnemy();await wait(()=>goonkMobileState.mode==='battle');await command(15);await resolve();}
 const before=await army();assert.equal(before.length,7);if(!battle){assert.deepEqual(before.map(u=>u.key),species);assert.deepEqual(before.map(u=>u.count),counts);}else{for(let i=0;i<7;i++)if(before[i]){assert.equal(before[i].key,species[i]);assert(before[i].count>0&&before[i].count<=counts[i]);assert(before[i].experiencePerUnit>0);}}
 const prior=await readCompletedNativeSave(page(),command);assert.equal(prior.readInt32LE(4),expectedVersion);fs.writeFileSync(path.join(output,'day1-complete.vsgm1'),prior);await page().close();
 await boot({...options,eighthUpgradeConfigured:!configured,save:[...prior]});await command(3);const dayTwoText=await witness(true);
 const pending=await readCompletedNativeSave(page(),command);fs.writeFileSync(path.join(output,'day2-pending.vsgm1'),pending);await page().close();
 await boot({...options,eighthUpgradeConfigured:!configured,save:[...pending],expectedDialog:'source-campaign'});assert.equal(await witness(true),dayTwoText);await ack();
 const day2=await army();const profiles=JSON.parse(fs.readFileSync('mod/tum-era/content/config/era-bridge-experience.json')).creatures;
 for(let slot=0;slot<7;++slot){if(!before[slot]){assert.equal(day2[slot],null);continue;}const quantity=before[slot].count;const target=active&&!(wrapped&&species[slot]==='core:archangel')?pairs.find(p=>p[0]===species[slot])?.[1]:undefined;assert.equal(day2[slot].key,target||species[slot]);assert.equal(day2[slot].count,quantity);let xp=before[slot].experiencePerUnit;if(target){const profile=profiles[target];xp=Math.min(Math.trunc(Math.imul(xp,quantity)/quantity),profile.fullRank10+profile.rank11Extra);}assert.equal(day2[slot].experiencePerUnit,xp);assert.equal(day2[slot].experience,xp*quantity);}
 if(active&&battle&&process.env.EIGHTH_MERGE==='1'){
  await sheet();await selectHeroTab(page(),'army',{mouse:press==='click'});
  const id=(await state()).armies.find(a=>a.slots?.[0]?.key===day2[0].key).id;
  const button=slot=>page().locator(`.hero-army-slot[data-army-slot="${slot}"] .hero-army-slot-num`);
  const total=day2[0].count+day2[6].count;
  await button(6)[press]();await button(0)[press]();
  await wait(({id,total})=>goonkMobileState.armies.find(a=>a.id===id)?.slots[0]?.count===total,{id,total});
  const merged=(await state()).armies.find(a=>a.id===id).slots[0];
  const expected=Math.trunc(((Math.imul(day2[0].experiencePerUnit,day2[0].count)+Math.imul(day2[6].experiencePerUnit,day2[6].count))|0)/total);assert.equal(merged.experiencePerUnit,expected);assert(expected<0);
  await button(0)[press]();await page().locator('.hero-army-split-toggle')[press]();await page().waitForFunction(()=>document.querySelector('#hero-army-split')?.checked);
  const separated=Math.floor(total/2);
  await button(6)[press]();await wait(({id,separated})=>goonkMobileState.armies.find(a=>a.id===id)?.slots[6]?.count===separated,{id,separated});
  const split=(await state()).armies.find(a=>a.id===id).slots;assert.equal(split[0].count,total-separated);assert.equal(split[0].experiencePerUnit,expected);assert.equal(split[6].experiencePerUnit,expected);
  report.signedTransfer={mergedAverage:expected,splitCounts:[total-separated,separated],averagePreserved:true,input:press==='click'?'mouse':'touch'};
  await command(63);await wait(()=>goonkMobileState.mode==='map');
 }
 if(active&&battle&&process.env.EIGHTH_PAID==='1'){
  assert(day2[0].experiencePerUnit<0);const h=await sheet();await command(41,h.id,0);
  await wait(()=>goonkMobileState.mode==='creature'&&goonkMobileState.creatureUpgrades?.some(u=>u.key==='tum-era:cherub'));
  const before=await state(),upgrade=before.creatureUpgrades.find(u=>u.key==='tum-era:cherub');assert(upgrade.affordable);assert.deepEqual(upgrade.cost,[0,0,0,0,0,0,day2[0].count,0]);
  await page().locator(`[data-upgrade="${upgrade.id}"]`)[press]();await wait(value=>goonkMobileState.resources[6]===value,before.resources[6]-upgrade.cost[6]);
  await command(43);await command(63);await wait(()=>goonkMobileState.mode==='map');
  const upgraded=(await army())[0];assert.equal(upgraded.key,'tum-era:cherub');assert.equal(upgraded.count,day2[0].count);assert.equal(upgraded.experiencePerUnit,Math.trunc(day2[0].experiencePerUnit*.75));
  report.paidUpgrade={before:day2[0].experiencePerUnit,after:upgraded.experiencePerUnit,goldPaid:upgrade.cost[6],quantity:upgraded.count,sourceCoefficient:.75,independentArmyAndPaymentCheck:true};
 }
 if(active&&battle){assert(day2[0].experiencePerUnit<0);assert.equal(day2[0].experienceRank,0);const beforeRepair=(await army())[0].experiencePerUnit;await approachEnemy(2);await wait(()=>goonkMobileState.mode==='battle');await command(15);await resolve();const repaired=await army();assert(repaired[0].experiencePerUnit>=0);if(process.env.EIGHTH_ZERO_REWARD==='1')assert.equal(repaired[0].experiencePerUnit,0);report.postBattleRepair={before:beforeRepair,after:repaired[0].experiencePerUnit,rank:repaired[0].experienceRank};}
 const stable=await army();await command(3);await witness(true);await ack();const day3=await army();assert.deepEqual(day3.map(u=>u&&[u.key,u.count,u.experience]),stable.map(u=>u&&[u.key,u.count,u.experience]));
 const complete=await readCompletedNativeSave(page(),command);fs.writeFileSync(path.join(output,'complete.vsgm1'),complete);await page().close();await boot({...options,save:[...complete]});assert.deepEqual((await army()).map(u=>u&&[u.key,u.count,u.experience]),stable.map(u=>u&&[u.key,u.count,u.experience]));
 report.scenarios.push({row,battle,choice,configured,active,wrappedPrecheckSkip:wrapped,historicalEngineControl:historical,legacyInput:legacy?933:null,saveVersion:complete.readInt32LE(4),before,day2,day3,aiHero:true,pooledHero:true,dayOneUnchanged:true,slotsNotMerged:true,pendingNativeSaveReload:true,completedNativeSaveReload:true,reversedGlobalDefault:true,noReplay:true,input:press==='click'?'mouse':'touch',viewport:page().viewportSize()});await page().close();
}
