import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';
export async function runLevelArtifactVisit({boot,sheet,state,command,wait,page,report,output,readCompletedNativeSave}){
 const object=process.env.LEVEL_ARTIFACT_OBJECT==='1',manaAfter=object?7:18;
 const press=process.env.GROWTH_DESKTOP==='1'?'click':'tap';
 const program=compileErm(Buffer.from('ZVSE\n!?GE2;\n!!HE6:I0;\n!!IF:M^VISIT READY^;'),{source:'Private town reward remainder after three native level choices'});program.originalMessages=['ZVSE private native companion town continuation'];
 const opts={enabled:false,scriptTown:true,scriptProgram:program,growthChoice:0,levelArtifactChoice:1,levelArtifactVisitFixture:object?'object':'town',artifactPoolFixture:{allowed:['core:centaurAxe','core:blackshardOfTheDeadKnight','core:greaterGnollsFlail']},...(!process.env.GROWTH_DESKTOP?{viewport:{width:390,height:844}}:{})};
 const ack=async()=>page().locator('[data-dialog-confirm]')[press]();
 await boot(opts);await command(3);await wait(()=>goonkMobileState.dialogPresentation?.lines?.includes('VISIT READY'));await ack();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);assert.equal((await state()).heroMana,0);
 await page().mouse.move(400,300);await command(6);await page().waitForTimeout(150);await page().evaluate(object=>{const m=goonkMobileState.mapOverview,v=m.view;Module._vcmiMobilePointer(object?v.x+(10-m.viewport.x+.5)*32:v.x+v.w/2,object?v.y+v.h/2:v.y+v.h/2-64,1);},object);await wait(()=>goonkMobileState.hasPath);await command(2);await wait(()=>goonkMobileState.dialogPresentation?.title==='Level up');
 assert.equal((await state()).campaignPending,false);
 const first=await readCompletedNativeSave(page(),command);fs.writeFileSync(path.join(output,'pending-town-first-skill.vsgm1'),first);await page().close();await boot({...opts,save:[...first],expectedDialog:'any'});await wait(()=>goonkMobileState.dialogPresentation?.title==='Level up');
 let skills=0,summaries=0;
 for(let guard=0;guard<12;++guard){
  const s=await state(),d=s.dialogPresentation;
  if(d?.title==='Level up'){
   const index=d.choices.findIndex(c=>c.selectable);assert(index>=0);await page().locator(`[data-dialog-choice="${index}"]`)[press]();await ack();++skills;
  }else if(d?.lines?.some(l=>/Level rewards|Récompenses de niveau/.test(l))){
   ++summaries;assert.equal(d.choices.length,3);const saved=await readCompletedNativeSave(page(),command);fs.writeFileSync(path.join(output,'pending-town-summary.vsgm1'),saved);await page().close();await boot({...opts,save:[...saved],expectedDialog:'any'});await wait(()=>goonkMobileState.dialogPresentation?.lines?.some(l=>/Level rewards|Récompenses de niveau/.test(l)));await ack();
  }else if(s.mode==='map'||s.mode==='town')break;
  else throw Error('Unexpected town level continuation '+JSON.stringify(d));
  await page().waitForTimeout(300);
 }
 await wait(mana=>['map','town'].includes(goonkMobileState.mode)&&goonkMobileState.heroMana===mana,manaAfter);assert.equal(skills,3);assert.equal(summaries,1);
 if((await state()).mode==='town'){await command(0);await wait(()=>goonkMobileState.mode==='map');}
 const hero=await sheet();assert.equal(hero.level,4);assert.equal(hero.experience,3200);assert.equal(hero.mana,manaAfter);await command(63);await wait(()=>goonkMobileState.mode==='map');
 const saved=await readCompletedNativeSave(page(),command);fs.writeFileSync(path.join(output,'completed-town.vsgm1'),saved);await page().close();await boot({...opts,save:[...saved]});assert.equal((await state()).heroMana,manaAfter);
 report.scenarios.push({object,skills,summaries,manaBefore:0,manaAfter,pendingSkillSaveReload:true,pendingSummarySaveReload:true,nonzeroSelectedRewardRestored:true,remainingTownBuildingVisited:!object,sourceCampaignNotHoldingVisit:true,completedSaveReload:true,input:press==='tap'?'touch':'mouse'});await page().close();
}
