import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

function program(percent){
 const n=number=>({kind:'number',access:'read',number});
 const cell=(name,space='i')=>({kind:'named',access:'read',space,name});
 const command=(receiver,selectors,code,args)=>({receiver,selectors,conditions:[],operations:[{code,args}]});
 const initializers=[command('VR',[cell('hench_battleExpAIPct')],'S',[n(900)])];
 if(percent!==null)initializers.push(command('VR',[cell('BaTtLeExPaIpCt')],'S',[n(percent)]));
 // The paired string must never be substituted for the integer cell.
 initializers.push(command('VR',[cell('battleExpAIPct','s')],'S',[{kind:'string',access:'read',text:'999'}]));
 const result={originalMessages:['ZVSE private native companion AI reward'],initializers,blocks:[
  {kind:'trigger',receiver:'GE',selectors:[n(2)],conditions:[],commands:[command('HE',[n(0)],'O',[n(0)])]},
  {kind:'trigger',receiver:'GE',selectors:[n(3)],conditions:[],commands:[command('HE',[n(0)],'O',[n(1)])]},
  {kind:'trigger',receiver:'GE',selectors:[n(4)],conditions:[],commands:[command('HE',[n(0)],'O',[n(0)]),command('HE',[n(0)],'O',[n(0)])]}
 ]};
 result.sha256=createHash('sha256').update(JSON.stringify(result)).digest('hex');return result;
}

export async function runAISharedReward({boot,sheet,state,command,wait,startBattle,resolve,page,report,output,save}){
 const values=process.env.HENCH_AI_PERCENT!==undefined?[Number(process.env.HENCH_AI_PERCENT)]:[null,150,-50,2147483647];
 for(const percent of values){
  const scriptProgram=program(percent),settings={battleExpStatic:100,battleExpRandom:0,battleHeroExpCoef:0,
   battleExpPerHeroLv:0,battleExpMin:0,battleExpMax:1000,battleExpAIPct:900,bonusDaily:0,bonusHeroLvUp:0};
  fs.writeFileSync(path.join(output,`program-${percent??'missing'}.json`),JSON.stringify(scriptProgram,null,2));
  const options={scriptAI:true,enemyHero:true,scriptProgram,settings};
  await boot(options);
  if(percent===150){
   const bytes=await save();fs.writeFileSync(path.join(output,'shared-variable-before-battle.vsgm1'),bytes);
   await page().close();await boot({...options,save:[...bytes]});
  }
  await startBattle();await resolve();
  const day=(await state()).day;await command(3);
  await wait(day=>goonkMobileState.turn&&goonkMobileState.day>day&&
   (goonkMobileState.heroes?.some(hero=>hero.name==='Orrin')||goonkMobileState.mode==='dialog'),day);
  if(process.env.HENCH_LEGACY_OWNER_UI){
   // Historical engines need a reload to rebuild the transferred hero list.
   // This changes the viewer only, leaving the saved AI reward authoritative.
   if((await state()).mode==='dialog'){await command(1);await wait(()=>goonkMobileState.mode==='map');}
   const bytes=await save();await page().close();await boot({...options,save:[...bytes]});
  }
  await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.heroes?.some(hero=>hero.name==='Orrin'));
  await command(4,0);const hero=await sheet();assert.equal(hero.name,'Orrin');assert(hero.experience>0);
  // The source clamps the wrapped signed 32-bit product only after division.
  const expected=100+Math.max(0,Math.trunc(Math.imul(100,percent??0)/100));
  assert.equal(hero.henchman.experience,expected);assert.equal(hero.henchman.unit.key,'core:archer');
  report.scenarios.push(`AI-victory-shared-integer-${percent??'missing'}-reward-${expected-100}-ignores-prefixed-and-string-cells`);
  if(percent===150){
   await command(63);await wait(()=>goonkMobileState.mode==='map');const bytes=await save();
   await page().close();await boot({...options,save:[...bytes]});await command(4,0);
   const resumed=await sheet();assert.equal(resumed.name,'Orrin');assert.equal(resumed.henchman.experience,expected);
   report.scenarios.push('transferred-winning-hero-and-shared-variable-reward-survive-native-save-reload');
   const id=resumed.id;await command(63);await wait(()=>goonkMobileState.mode==='map');
   let day=(await state()).day;await command(3);await wait(day=>goonkMobileState.turn&&goonkMobileState.day>day,day);
   let current=await state();assert.equal(current.mode,'map');assert(!(current.heroes||[]).some(hero=>hero.id===id));assert.notEqual(current.heroId,id);
   day=current.day;await command(3);await wait(day=>goonkMobileState.turn&&goonkMobileState.day>day,day);
   current=await state();assert.equal(current.mode,'map');assert.equal((current.heroes||[]).filter(hero=>hero.id===id).length,1);
   await command(4,0);const returned=await sheet();assert.equal(returned.henchman.experience,expected);
   report.scenarios.push('script-owner-loss-return-and-repeated-same-owner-assignment-update-the-live-hero-list-without-empty-dialogs-or-duplicates');
  }
  await page().close();
 }
}
