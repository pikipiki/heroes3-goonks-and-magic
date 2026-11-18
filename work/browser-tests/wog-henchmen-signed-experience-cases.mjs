import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
export function signedExperienceProgram(before,after){
 const n=number=>({kind:'number',access:'read',number});
 const v=(index,access='read')=>({kind:'variable',space:'v',index:n(index),access});
 const command=(receiver,selectors,code,args)=>({receiver,selectors,conditions:[],operations:[{code,args}]});
 const block=(receiver,value)=>({kind:'trigger',receiver,selectors:receiver==='BA'?[n(0)]:[],conditions:receiver==='BA'?[]:[{any:[{left:v(997),comparison:'=',right:n(0)}]}],commands:[command('BA',[],'H',[n(0),v(41,'write')]),command('HE',[v(41)],'E',[n(value),n(1)])]});
 const p={originalMessages:['ZVSE private native companion town continuation'],initializers:[],blocks:[...(before?[block('BA',before)]:[]),block('BR',after)]};
 p.sha256=createHash('sha256').update(JSON.stringify(p)).digest('hex');return p;
}
export async function runSignedExperience({boot,sheet,command,wait,startBattle,resolve,page,report,output,save}){
 // Native level-cap handling leaves zero unchanged but the wrapped value
 // receives one battle XP. The mobile record exposes the signed word.
 const cases=[{name:'wrapped-positive',before:0,after:-1294967296,nativeAfter:-1294967295,gain:-1294967295,stack:0},{name:'negative',before:400,after:0,nativeAfter:0,gain:-400,stack:134750}];
 for(const row of cases)for(const campaignTransfer of [true,false]){
  const scriptProgram=signedExperienceProgram(row.before,row.after);
  const options={...(process.env.HENCH_SIGNED_PORTRAIT==='1'?{viewport:{width:390,height:844}}:{}),heroLevelLimit:1,scriptTown:true,scriptProgram,henchmanType:'core:archangel',settings:{campaignTransfer,battleExpStatic:100,battleExpRandom:0,battleHeroExpCoef:100,battleExpPerHeroLv:0,battleExpMin:0,battleExpMax:1000,bonusDaily:0,bonusHeroLvUp:0,stackExpEnabled:row.name==='negative',bannerEnabled:false}};
  fs.writeFileSync(path.join(output,row.name+'-program.json'),JSON.stringify(scriptProgram,null,2));
  await boot(options);const before=await sheet();assert.equal(before.experience,0);assert.equal(before.henchman.experience,0);
  await command(63);await wait(()=>goonkMobileState.mode==='map');await startBattle();await resolve();const after=await sheet();
  assert.equal(after.experience,row.nativeAfter,'Native hero XP assigned during battle at level cap');assert(after.henchman.alive);
  const expected=campaignTransfer?0:100;assert.equal(after.henchman.experience,expected,'Signed source gain controls campaign guard and square-root reward');
  assert.equal(after.henchman.stackExperience,campaignTransfer?0:row.stack,'Negative source stack gain reaches the source experience cap');
  await command(63);await wait(()=>goonkMobileState.mode==='map');const bytes=await save();fs.writeFileSync(path.join(output,`${row.name}-${campaignTransfer}.vsgm1`),bytes);await page().close();await boot({...options,save:[...bytes]});const restored=await sheet();
  assert.equal(restored.henchman.experience,expected);assert.equal(restored.henchman.stackExperience,after.henchman.stackExperience);assert.equal(restored.experience,after.experience);
  report.scenarios.push({kind:'henchmen-signed-experience',name:row.name,campaignTransfer,sourceSignedGain:row.gain,heroExperience:after.experience,companionReward:expected,stackExperience:after.henchman.stackExperience,nativeSaveReload:true,programSha256:scriptProgram.sha256});await page().close();
 }
}
