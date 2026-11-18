import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';

export function extraDwellingsFixture(){
 const exclusions=Array.from({length:6},(_,i)=>`!!DW${13+i*3}/11/0:M0/?v810/?v811 M1/?v812/?v813;\n!!IF:M^EXCLUDE ${i+1} %V810/%V811 %V812/%V813 option %V806^;`).join('\n');
 const code=`!#UN:M1;
!?OB17;
!!DW998:M0/?v800/?v801 M1/?v802/?v803;
!!VRv804:S-2;!!VRv805:S-2;
!!DW998&v802>=0:M2/?v804/?v805;
!!UN:P67/?v806;
!!IF:M^DW %V800/%V801 %V802/%V803 %V804/%V805 option %V806^;
${exclusions}
!?OB20;
!!DW998:M0/?v800/?v801 M1/?v802/?v803 M2/?v804/?v805;
!!UN:P67/?v806;
!!IF:M^DW %V800/%V801 %V802/%V803 %V804/%V805 option %V806^;`;
 const p=compileErm(Buffer.from(code),{source:'Private source rule117 dwelling stock queries'});
 p.originalMessages=['ZVSE private native mithril option query'];return p;
}

export async function runExtraDwellings({boot,state,command,wait,walk,nextDay,recruitmentStock,page,output,report,readCompletedNativeSave}){
 const scriptProgram=extraDwellingsFixture();fs.writeFileSync(path.join(output,'program.json'),JSON.stringify(scriptProgram,null,2));
 const desktop=process.env.CASES==='extra-dwellings-desktop',portrait=process.env.EXTRA_PORTRAIT==='1';
 const cases=process.env.EXTRA_OLD_PRODUCER||process.env.EXTRA_LEGACY_SAVE?[[false,null,false,false]]:process.env.EXTRA_PROBE==='1'?[[false,1,true,false]]:desktop||portrait?[[false,1,true,false],[true,0,false,false],[true,1,true,true]]:[[false,-1,false,false],[true,-1,true,false],[false,1,true,false],[true,0,false,false],[false,0,false,false],[true,1,true,true]];
 for(const[configured,choice,active,neutralTown]of cases){
  const options={enabled:false,scriptProgram,extraDwellingFixture:true,extraDwellingsConfigured:configured,extraDwellingChoice:choice,neutralTown,...(portrait?{viewport:{width:390,height:844}}:{})};
  if(process.env.EXTRA_OLD_PRODUCER){
   await boot(options);const bytes=await readCompletedNativeSave(page(),command);
   fs.writeFileSync(path.join(output,'legacy-sixteen-choice-dwellings.vsgm1'),bytes);
   report.scenarios.push({legacyProducer:true,nativeSaveVersion:bytes.readInt32LE(4)});
   await page().close();return;
  }
  if(process.env.EXTRA_LEGACY_SAVE)await boot({...options,extraDwellingsConfigured:true,neutralTown:true,save:[...fs.readFileSync(process.env.EXTRA_LEGACY_SAVE)]});
  else await boot(options);
  const listen=()=>page().evaluate(()=>{window.privateDwellingMessages=[];window.addEventListener('goonk-state',e=>{const t=e.detail.dialogPresentation?.lines?.join(' ');if((t?.startsWith('DW ')||t?.startsWith('EXCLUDE '))&&window.privateDwellingMessages.at(-1)!==t)window.privateDwellingMessages.push(t);});});
  await listen();await walk(2,0);
  const first=await recruitmentStock(),messages=await page().evaluate(()=>window.privateDwellingMessages);
  fs.writeFileSync(path.join(output,`first-${configured}-${choice}-${neutralTown}.json`),JSON.stringify({first,messages,state:await state()},null,2));
  assert(messages.length,'Native source query ran before the dwelling visit');
  if(active){assert.equal(first[neutralTown?'core:airElemental':'core:boar'],12);assert.equal(first['core:orc'],7);}
  assert.equal(first['core:archer'],9);
  assert.equal(messages[0],`DW 2/9 ${active?neutralTown?112:140:0}/${active?12:14} 88/7 option ${Number(neutralTown)}`);
  const closeRecruit=async()=>{if((await state()).mode==='recruit')await page().locator('[data-ui=cancel-recruit]:visible').first()[desktop?'click':'tap']();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);};
  const added=neutralTown?'core:airElemental':'core:boar';
  if(active){
   const unit=(await state()).previewUnits.find(row=>row.key===added);assert(unit);
   await page().evaluate(p=>Module._vcmiMobilePointer(p.x+p.w/2,p.y+p.h/2,1),unit.preview);
   await wait(key=>goonkMobileState.recruitUnit?.key===key,added);
   const slider=await page().locator('#recruit-range').boundingBox();assert(slider);
   const x=slider.x+8+(slider.width-16)/12,y=slider.y+slider.height/2;
   if(desktop)await page().mouse.click(x,y);else await page().touchscreen.tap(x,y);
   await wait(()=>goonkMobileState.recruitAmount===1);
   await page().locator('[data-ui=confirm-recruit]:visible')[desktop?'click':'tap']();
   await wait(key=>goonkMobileState.mode==='map'||goonkMobileState.recruitUnit?.key===key&&goonkMobileState.recruitUnit?.count===11,added);
  }
  await closeRecruit();
  const bytes=await readCompletedNativeSave(page(),command);fs.writeFileSync(path.join(output,`dwelling-day1-${configured}-${choice}-${neutralTown}.vsgm1`),bytes);
  await page().close();await boot({...options,extraDwellingsConfigured:!configured,neutralTown:!neutralTown,save:[...bytes]});await listen();
  await walk(-1,0);await walk(1,0);
  const restored=await recruitmentStock();
  assert.equal(restored['core:archer'],9);if(active){assert.equal(restored[added],11);assert.equal(restored['core:orc'],7);}
  const restoredMessages=await page().evaluate(()=>window.privateDwellingMessages);assert(restoredMessages.at(-1).endsWith('option '+Number(neutralTown)));
  await closeRecruit();
  const exclusions=restoredMessages.filter(text=>text.startsWith('EXCLUDE '));assert.equal(exclusions.length,6);
  for(const[index,text]of exclusions.entries()){
   const values=text.match(/^EXCLUDE (\d+) (-?\d+)\/(\d+) (-?\d+)\/(\d+) option ([01])$/);assert(values,text);
   if(index<5){assert.equal(Number(values[2]),[0,140,142,112,127][index]);assert.equal(Number(values[4]),-1,'Excluded dwelling never gets a second slot');assert.equal(Number(values[5]),0);}
   else assert.equal(Number(values[4]),33,'Special type20 keeps its existing iron golems');
  }
  await nextDay();assert.equal((await state()).day,2);
  await walk(-1,0);await walk(1,0);const dayTwo=await recruitmentStock();
  if(active)assert.equal(dayTwo[added],11,'Day2 never reapplies the initial stock');
  await closeRecruit();
  await page().screenshot({path:path.join(output,`dwelling-${configured}-${choice}-${neutralTown}.png`)});
  report.scenarios.push({configured,choice,active,neutralTown,legacySixteenChoiceSave:!!process.env.EXTRA_LEGACY_SAVE,first,messages,restored,restoredMessages,exclusions,dayTwo,nativeSaveReload:true,reversedGlobalDefault:true,oneCreatureRecruitedBySlider:active,noInitialStockReplay:true,nativeSaveVersion:bytes.readInt32LE(4),viewport:page().viewportSize(),input:desktop?'mouse':'touch'});
  await page().close();
 }
}
