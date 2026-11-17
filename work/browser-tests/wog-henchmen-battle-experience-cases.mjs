import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
function program(stage){
 const n=number=>({kind:'number',access:'read',number});
 const v=(index,access='read')=>({kind:'variable',space:'v',index:n(index),access});
 const command=(receiver,selectors,code,args)=>({receiver,selectors,conditions:[],operations:[{code,args}]});
 const block={kind:'trigger',receiver:stage==='before'?'BA':'BR',selectors:stage==='before'?[n(0)]:[],
  conditions:stage==='before'?[]:[{any:[{left:v(997),comparison:'=',right:n(0)}]}],
  commands:[command('BA',[],'H',[n(0),v(41,'write')]),command('HE',[v(41)],'E',[n(400),n(1)])]};
 const result={originalMessages:['ZVSE private native companion town continuation'],initializers:[],blocks:stage==='none'?[]:[block]};
 result.sha256=createHash('sha256').update(JSON.stringify(result)).digest('hex');return result;
}
export async function runBattleStartExperience({boot,sheet,state,command,wait,startBattle,resolve,page,report,output,save}){
 const stages=process.env.HENCH_EXPERIENCE_STAGE?[process.env.HENCH_EXPERIENCE_STAGE]:['none','before','during'];
 for(const stage of stages){
  const scriptProgram=program(stage),options={scriptTown:true,scriptProgram,henchmanType:'core:archangel',settings:{battleExpStatic:0,battleExpRandom:0,battleHeroExpCoef:100,battleExpPerHeroLv:0,battleExpMin:0,battleExpMax:1000,bonusDaily:0,bonusHeroLvUp:0,stackExpEnabled:false}};
  fs.writeFileSync(path.join(output,`experience-program-${stage}.json`),JSON.stringify(scriptProgram,null,2));
  await boot(options);const before=await sheet();assert.equal(before.experience,0);
  await command(63);await wait(()=>goonkMobileState.mode==='map');
  if(stage==='during'){
   const bytes=process.env.HENCH_BATTLE_OLD_SAVE?fs.readFileSync(process.env.HENCH_BATTLE_OLD_SAVE):await save();fs.writeFileSync(path.join(output,'before-scripted-battle.vsgm1'),Buffer.from(bytes));
   await page().close();await boot({...options,save:[...bytes]});
  }
  await startBattle();await resolve();const after=await sheet();assert(after.henchman.alive);
  const heroExperience=stage==='none'?1:401;
  assert.equal(after.experience,heroExperience,'Actual native Peasant battle XP plus source HE:E assignment');
  const expected=stage==='during'?20:1;
  assert.equal(after.henchman.experience-before.henchman.experience,expected,'Companion reward uses placement-time hero XP, including later source changes only');
  await command(63);await wait(()=>goonkMobileState.mode==='map');const bytes=await save();
  await page().close();await boot({...options,save:[...bytes]});const restored=await sheet();assert.equal(restored.henchman.experience,after.henchman.experience);assert.equal(restored.experience,after.experience);
  report.scenarios.push({stage,heroExperience,companionReward:expected,sourceMutation:stage!=='none',nativeSaveReload:true});
  await page().close();
 }
}
