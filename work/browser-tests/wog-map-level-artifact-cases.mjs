import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';
export async function runLevelArtifacts({boot,sheet,state,command,wait,page,report,output,readCompletedNativeSave}){
 const historical=process.env.LEVEL_ARTIFACT_OLD==='1',legacy=process.env.LEVEL_ARTIFACT_LEGACY_SAVE,currentVersion=Number(process.env.GOONK_EXPECTED_SAVE_VERSION||937);
 const targetLevel=Number(process.env.LEVEL_ARTIFACT_LEVEL||4),experience=({4:3200,6:6200,12:20600})[targetLevel],rewardCount=targetLevel-1;assert(experience);const ids=targetLevel===4?[7,8,9]:[7,8,9,10];
 const choice=Number(process.env.LEVEL_ARTIFACT_CHOICE??(process.env.LEVEL_ARTIFACT_OFF==='1'?0:1)),configured=process.env.LEVEL_ARTIFACT_CONFIGURED==='1';
 const enabled=!legacy&&!historical&&(choice<0?configured:choice===1),press=process.env.GROWTH_DESKTOP==='1'?'click':'tap';
 const counts=base=>ids.map((id,i)=>`!!HE6:A2/${id}/?v${base+i}/?v8390;`).join('\n');
 const text=`ZVSE\n!?GE2;\n${counts(8300)}\n!!HE6:E${experience};\n${counts(8310)}\n!!HE6:E?v8320/?v8321;\n!!IF:M^LEVEL RESULT %V8320 %V8321 BEFORE ${ids.map((_,i)=>`%V${8300+i}`).join(' ')} AFTER ${ids.map((_,i)=>`%V${8310+i}`).join(' ')}^;\n!?GE3;\n!!HE6:E4600;\n${counts(8330)}\n!!IF:M^LEVEL DAY3 %V8330 %V8331 %V8332^;`;
 const program=compileErm(Buffer.from(text),{source:'Private source126 three-level reward and saved secondary skill choice'});program.originalMessages=['ZVSE private native companion town continuation'];fs.writeFileSync(path.join(output,'program.json'),JSON.stringify(program,null,2));
 const opts={enabled:false,scriptTown:true,scriptProgram:program,growthChoice:0,levelArtifactChoice:historical?null:legacy?1:choice,levelArtifactsConfigured:!!legacy||configured,artifactPoolFixture:{levelDay3:true,minor:targetLevel>=6,allowed:['core:centaurAxe','core:blackshardOfTheDeadKnight','core:greaterGnollsFlail',...(targetLevel>=6?['core:ogresClubOfHavoc']:[])]},...(process.env.LEVEL_ARTIFACT_VIEWPORT?{viewport:Object.fromEntries(process.env.LEVEL_ARTIFACT_VIEWPORT.split('x').map((n,i)=>[i?'height':'width',Number(n)]))}:!process.env.GROWTH_DESKTOP?{viewport:{width:390,height:844}}:{})};
 if(legacy){
  const input=fs.readFileSync(legacy);assert.equal(input.readInt32LE(4),936);
  await boot({...opts,save:[...input],expectedDialog:'any'});await wait(()=>goonkMobileState.dialogPresentation?.lines?.some(l=>l.startsWith('LEVEL RESULT ')));
  await page().locator('[data-dialog-confirm]')[press]();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);await command(3);
  await wait(()=>goonkMobileState.dialogPresentation?.title==='Level up');await page().locator('[data-dialog-choice="0"]')[press]();await page().locator('[data-dialog-confirm]')[press]();
  await wait(()=>goonkMobileState.dialogPresentation?.lines?.some(l=>l.startsWith('LEVEL DAY3 ')));
  const message=(await state()).dialogPresentation.lines.join(' '),old=JSON.parse(fs.readFileSync(path.join(path.dirname(legacy),'result.json')));const expected=old.scenarios[0].message.match(/-?\d+/g).map(Number).slice(5,8).reduce((s,n)=>s+n,0);assert.equal(message.match(/\d+/g).slice(1).map(Number).reduce((s,n)=>s+n,0),expected);
  const saved=await readCompletedNativeSave(page(),command);assert.equal(saved.readInt32LE(4),currentVersion);fs.writeFileSync(path.join(output,'legacy-resaved.vsgm1'),saved);
  await page().locator('[data-dialog-confirm]')[press]();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);const hero=await sheet();assert.equal(hero.level,5);
  report.scenarios.push({legacyInput:936,saveVersion:currentVersion,configured:true,oldMapRuleRemainsDisabled:true,message,level:hero.level});await page().close();return;
 }
 const equipmentPrimary=hero=>hero.slots.reduce((sum,slot)=>sum+({7:2,8:3,9:4,10:5}[slot.icon]||0),0);
 const ack=async()=>page().locator('[data-dialog-confirm]')[press]();
 await boot(opts);const initialHero=await sheet(),initialPrimary=initialHero.primarySkills,initialEquipmentPrimary=equipmentPrimary(initialHero);await command(63);await wait(()=>goonkMobileState.mode==='map');await command(3);await wait(()=>goonkMobileState.dialogPresentation?.title==='Level up');
 if(enabled){const saved=await readCompletedNativeSave(page(),command);assert.equal(saved.readInt32LE(4),currentVersion);fs.writeFileSync(path.join(output,'pending-first-skill.vsgm1'),saved);await page().close();await boot({...opts,levelArtifactsConfigured:!opts.levelArtifactsConfigured,save:[...saved],expectedDialog:'any'});await wait(()=>goonkMobileState.dialogPresentation?.title==='Level up');}
 let skills=0,summaries=0;const choices=[],summaryLayouts=[];
 for(let guard=0;guard<rewardCount+6;++guard){
  const s=await state(),d=s.dialogPresentation;
  if(d?.lines?.some(l=>l.startsWith('LEVEL RESULT ')))break;
  if(d?.title==='Level up'){
   const index=d.choices.findIndex(c=>c.selectable);assert(index>=0);choices.push(d.choices[index].label);await page().locator(`[data-dialog-choice="${index}"]`)[press]();await ack();++skills;
  }else if(d?.lines?.some(l=>/Level rewards|Récompenses de niveau/.test(l))){
   ++summaries;assert.equal(d.choices.length,Math.min(8,rewardCount-(summaries-1)*8));await wait(()=>document.querySelector('.dialog-presentation')?.dataset.nativeRewards==='true');await page().waitForTimeout(200);
   const visible=await page().evaluate(()=>{const panel=document.querySelector('.dialog-presentation'),list=panel.querySelector('.dialog-choices'),cards=[...list.querySelectorAll('.dialog-choice')];return {display:getComputedStyle(list).display,labels:cards.map(c=>c.querySelector('strong').textContent),count:cards.length,scrollable:getComputedStyle(list).overflowY,confirmVisible:(()=>{const r=panel.querySelector('[data-dialog-confirm]').getBoundingClientRect();return r.height>=48&&r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;})(),blockedTouchAncestor:(()=>{for(let n=list;n;n=n.parentElement)if(getComputedStyle(n).touchAction==='none')return n.className;return null;})()};});assert.equal(visible.display,'grid');assert.equal(visible.count,d.choices.length);assert(visible.labels.every(label=>label&&label!=='Reward'));assert.equal(visible.scrollable,'auto');assert(visible.confirmVisible);assert.equal(visible.blockedTouchAncestor,null);summaryLayouts.push(visible);
   const inspectIndex=d.choices.length>1?1:0;await page().locator(`[data-dialog-info="${inspectIndex}"]`)[press]();await wait(index=>document.querySelector(`[data-dialog-info="${index}"]`)?.getAttribute('aria-pressed')==='true',inspectIndex);assert((await page().locator('#dialog-choice-description').innerText()).length>10);assert.equal((await state()).dialogPresentation.queryId,d.queryId);

   await page().screenshot({path:path.join(output,`summary-${summaries}-${press}.png`)});
   const saved=await readCompletedNativeSave(page(),command);fs.writeFileSync(path.join(output,`pending-summary-${summaries}.vsgm1`),saved);await page().close();await boot({...opts,levelArtifactsConfigured:!opts.levelArtifactsConfigured,save:[...saved],expectedDialog:'any'});await wait(()=>goonkMobileState.dialogPresentation?.lines?.some(l=>/Level rewards|Récompenses de niveau/.test(l)));await ack();
  }else throw Error('Unexpected level reward dialog '+JSON.stringify(d));
  await page().waitForTimeout(250);
 }
 await wait(()=>goonkMobileState.dialogPresentation?.lines?.some(l=>l.startsWith('LEVEL RESULT ')));
 const message=(await state()).dialogPresentation.lines.join(' '),numbers=message.match(/-?\d+/g).map(Number);assert.equal(numbers[0],experience);assert.equal(numbers[1],targetLevel);if(targetLevel<=6)assert.equal(skills,rewardCount);else assert(skills>0&&skills<=rewardCount);assert.equal(summaries,enabled?Math.ceil(rewardCount/8):0);assert.equal(numbers.slice(2+ids.length).reduce((s,n)=>s+n,0)-numbers.slice(2,2+ids.length).reduce((s,n)=>s+n,0),enabled?rewardCount:0);if(enabled&&targetLevel>=6)assert(numbers[2+ids.length+3]-numbers[2+3]>=(targetLevel===6?1:6));
 const saved=await readCompletedNativeSave(page(),command);assert.equal(saved.readInt32LE(4),currentVersion);fs.writeFileSync(path.join(output,'result-pending.vsgm1'),saved);await page().close();await boot({...opts,levelArtifactsConfigured:!opts.levelArtifactsConfigured,save:[...saved],expectedDialog:'any'});await wait(message=>goonkMobileState.dialogPresentation?.lines?.includes(message),message);await ack();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);const hero=await sheet();assert.equal(hero.level,targetLevel);assert.equal(hero.experience,experience);assert.equal(hero.primarySkills.reduce((s,n)=>s+n,0),initialPrimary.reduce((s,n)=>s+n,0)+rewardCount+equipmentPrimary(hero)-initialEquipmentPrimary);
 report.scenarios.push({enabled,choice,configured,reversedDefaultsOnReload:true,targetLevel,rewardCount,message,summaryLayouts,touchArtifactInspection:true,initialPrimary,initialEquipmentPrimary,finalPrimary:hero.primarySkills,finalEquipmentPrimary:equipmentPrimary(hero),primaryGainsAppliedOnce:true,skills,summaries,choices,pendingSkillSaveReload:enabled,pendingSummarySaveReload:enabled,resultSaveReload:true,input:press==='tap'?'touch':'mouse',saveVersion:currentVersion});await page().close();
}
