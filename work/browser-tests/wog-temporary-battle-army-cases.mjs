import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
function program({loss=false,levelUp=false}={}){
 const n=number=>({kind:'number',access:'read',number});
 const message=text=>({receiver:'IF',selectors:[],conditions:[],operations:[{code:'M',args:[{kind:'string',access:'read',text}]}]});
 const value={originalMessages:['ZVSE private native companion town continuation'],initializers:[],blocks:[
  {kind:'trigger',receiver:'OB',selectors:[n(98)],conditions:[],commands:[
   message('BEFORE TEMPORARY ARMY'),
   {receiver:'HE',selectors:[n(-1)],conditions:[],operations:[{code:'T',args:[n(10),n(9),n(0),n(0),n(loss||levelUp?1000:1)]}]},
   message('AFTER TEMPORARY ARMY')]}]};
 value.sha256=createHash('sha256').update(JSON.stringify(value)).digest('hex');return value;
}
export async function runTemporaryBattleArmy({boot,sheet,state,command,wait,page,report,output,save}){
 const desktop=process.env.GROWTH_DESKTOP==='1';
 const press=selector=>page().locator(selector)[desktop?'click':'tap']();
 const offer=process.env.TEMP_ARMY_OFFER==='1',loss=process.env.TEMP_ARMY_LOSS==='1',levelUp=process.env.TEMP_ARMY_LEVEL_UP==='1';
 const options={scriptTown:true,scriptProgram:program({loss,levelUp}),enabled:offer,soloArmy:loss,archangels:levelUp?100:5,...(process.env.TEMP_ARMY_PORTRAIT?{viewport:{width:390,height:844}}:{})};
 if(process.env.TEMP_ARMY_LOAD_SAVE){
  await boot({...options,save:[...fs.readFileSync(process.env.TEMP_ARMY_LOAD_SAVE)],expectedDialog:'source-campaign'});
 }else{
 await boot(options);
 await page().mouse.move(400,300);await command(6);await page().waitForTimeout(150);
 await page().evaluate(()=>{const v=goonkMobileState.mapOverview.view;Module._vcmiMobilePointer(v.x+v.w/2,v.y+v.h/2-64,1);});
 await wait(()=>goonkMobileState.hasPath);await command(2);
 await wait(()=>goonkMobileState.dialogKind==='source-campaign');
 assert.match(await page().locator('.dialog-copy').innerText(),/BEFORE TEMPORARY ARMY/);
 const pending=await save();fs.writeFileSync(path.join(output,'before-temporary-army.vsgm1'),pending);
 if(process.env.TEMP_ARMY_EXPORT_ONLY){report.scenarios.push({saveVersion:938,preBattleSaveProduced:true});await page().close();return;}
 await page().close();await boot({...options,save:[...pending],expectedDialog:'source-campaign'});
 }
 await press('[data-dialog-confirm]');
 if(offer){await wait(()=>goonkMobileState.dialogKind==='henchman-offer');await press('[data-dialog-cancel]');}
 await wait(()=>goonkMobileState.mode==='battle');
 await command(15);await wait(()=>goonkMobileState.battleUnits?.some(u=>u.enemy));
 const enemies=(await state()).battleUnits.filter(u=>u.enemy);
 assert.equal(enemies.length,1);assert.equal(enemies[0].key,'core:pikeman');
 await page().waitForTimeout(400);await page().screenshot({path:path.join(output,`temporary-army-${desktop?'desktop':'touch'}.png`)});
 // Resolve the native battle and stop at the VM's completion witness. The
 // ordinary town visit must still be suspended until this message is closed.
 const progressionKinds=new Set();
 for(let tick=0;tick<400;++tick){
  const s=await state();
  if(s.dialogKind==='source-campaign'&&s.dialogPresentation?.lines?.some(x=>x.includes('AFTER TEMPORARY ARMY')))break;
  if(s.mode==='battle'&&s.canAutoCombat&&!s.autoCombat)await command(44,1);
  else if(s.mode==='dialog'){
   if(/level/.test(s.dialogKind))progressionKinds.add(s.dialogKind);
   if(s.dialogKind==='commander-level-up'){
    const choice=s.dialogPresentation?.choices?.find(c=>c.selectable&&Number.isInteger(c.skillId));if(choice)await command(96,choice.skillId);
   }
   await command(1);
  }
  await page().waitForTimeout(100);
 }
 assert.match(await page().locator('.dialog-copy').innerText(),/AFTER TEMPORARY ARMY/);
 if(levelUp)assert(progressionKinds.size>0,'Native progression must complete before the script resumes');
 const native=await page().evaluate(()=>Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'}));
 fs.writeFileSync(path.join(output,'temporary-army-packets.log'),native);
 const transitions=native.split('\n').filter(line=>line.includes('Sending to all clients:')&&line.includes('TemporaryBattleArmyChange'));
 assert.equal(transitions.length,2,'One replicated create and one release');
 assert(!native.split('\n').some(line=>line.includes('Sending to all clients:')&&line.includes('9NewObject')),'The scripted battle must not insert a map event');
 await press('[data-dialog-confirm]');
 if(loss)await wait(()=>goonkMobileState.mode==='map');
 else{await wait(()=>goonkMobileState.mode==='town');await command(0);await wait(()=>goonkMobileState.mode==='map');}
 let progressedHero=null;
 if(levelUp){const hero=await sheet();assert(hero.level>1);progressedHero={level:hero.level,experience:hero.experience};await command(63);await wait(()=>goonkMobileState.mode==='map');}
 const completed=await save();fs.writeFileSync(path.join(output,'after-temporary-army.vsgm1'),completed);
 await page().close();await boot({...options,save:[...completed]});assert.equal((await state()).mode,'map');
 report.scenarios.push({temporaryArmy:true,mapEventCreated:false,creationAndReleasePackets:transitions.length,companionPrompt:offer,progressionKinds:[...progressionKinds],progressedHero,preBattleSaveReload:true,postBattleSaveReload:true,nativeTownVisitResumed:!loss,defeatedHeroSkipsNativeVisit:loss,legacyInput:process.env.TEMP_ARMY_LOAD_SAVE?938:null,desktop});
 await page().close();
}
