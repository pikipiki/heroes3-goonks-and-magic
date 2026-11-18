import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';

export function mapGrailsFixture(count=8){
 const anchors=[[8,8],[28,8],[8,18],[28,18],[8,28],[28,28],[18,8],[18,28],[18,18]];
 const queries=step=>Array.from({length:count},(_,i)=>{
  const [ax,ay]=anchors[i];let text=`!!VRv${800+i}:S-1;!!VRv${820+i}:S-1;`;
  for(let y=ay-3;y<=ay;y++)for(let x=ax-5;x<=ax;x++){
   text+=`\n!!OB${x}/${y}/0:T?v900;!!CA${x}/${y}/0&v900=98:B3/26;!!VRv${800+i}&v900=98:S0;!!VRv${800+i}&v900=98/1:S1;!!CA${x}/${y}/0&v900=98:T?v${820+i};`;
   if(i===0)text+=`!!VRv860&v900=98:S${x};!!VRv861&v900=98:S${y};`;
  }
  return text;
 }).join('\n')+`\n!!IF:M^GRAILS ${step} ${Array.from({length:count},(_,i)=>'%V'+(800+i)).join('/')} types ${Array.from({length:count},(_,i)=>'%V'+(820+i)).join('/')}^;`;
 const source=`!?GE1;\n${queries(1)}\n!?GE2;\n!!CAv860/v861/0:B3/26;!!CAv860/v861/0&1:B2/26;\n${queries(2)}\n!?GE3;\n${queries(3)}`;
 const p=compileErm(Buffer.from(source),{source:'Private native town Grail lifecycle query',dialect:'era3'});
 p.originalMessages=['ZVSE private native mithril option query'];return p;
}
export async function runMapGrails({boot,state,command,wait,page,output,report,readCompletedNativeSave}){
 if(process.env.GRAIL_OLD_SAVE){
  const bytes=fs.readFileSync(process.env.GRAIL_OLD_SAVE),options={enabled:false,grailsConfigured:true,save:[...bytes]};
  await boot(options);const day=(await state()).day;
  const inspect=async()=>{await command(5,0);await wait(()=>goonkMobileState.mode==='town');const grail=(await state()).buildings.find(b=>b.id===26);assert(grail&&!grail.built,'Old saved rules never inherit a newly enabled global Grail rule');await command(0);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);};
  await inspect();await command(3);
  for(let tick=0;tick<200;tick++){const current=await state();if(current.mode==='dialog')await command(1);else if(current.mode==='map'&&current.turn&&current.day>day)break;await page().waitForTimeout(100);}
  await wait(day=>goonkMobileState.mode==='map'&&goonkMobileState.turn&&goonkMobileState.day>day,day);await inspect();
  report.scenarios.push({legacyFourteenChoiceSave:true,globalGrailRule:true,grailRemainsDisabled:true,continuedNextDay:true});await page().close();return;
 }
 const desktop=process.env.CASES==='grails-desktop',portrait=process.env.GRAIL_PORTRAIT==='1',control=process.env.CASES==='grails-control';
 const matrix=control?[[true,null,false,null]]:desktop?[[true,-1,true,null],[true,1,false,'neutral']]:portrait?[[false,1,true,null],[true,0,false,null]]:
  [[false,-1,false,null],[true,-1,true,null],[false,1,true,null],[true,0,false,null],[false,0,false,null],[true,1,true,null],
   [true,1,false,'neutral'],[true,1,false,'red'],[true,1,false,'blue']];
 const ack=async()=>{const previous=(await state()).dialogPresentation.lines.join(' ');await page().locator('[data-dialog-confirm]')[desktop?'click':'tap']();await wait(previous=>goonkMobileState.mode!=='dialog'||goonkMobileState.dialogPresentation?.lines?.join(' ')!==previous,previous);};
 for(const [configured,choice,active,conflux]of matrix){
  const count=conflux?9:8,scriptProgram=mapGrailsFixture(count);
  const options={enabled:false,grailsConfigured:configured,grailChoice:choice,grailFixture:{conflux},scriptProgram,...(portrait?{viewport:{width:390,height:844}}:{})};
  fs.writeFileSync(path.join(output,`program-${count}.json`),JSON.stringify(scriptProgram,null,2));
  await boot({...options,expectedDialog:'source-campaign'});
  const query=async step=>{
   await wait(step=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.some(line=>line.startsWith('GRAILS '+step+' ')),step);
   const text=(await state()).dialogPresentation.lines.join(' '),match=text.match(/^GRAILS \d+ ([01/]+) types ([\d/]+)$/);assert(match,text);
   const values=match[1].split('/').map(Number),types=match[2].split('/').map(Number);
   assert.deepEqual(types,Array.from({length:count},(_,i)=>i),'Native faction identities at authored town positions');
   const expected=Array.from({length:count},(_,i)=>i===1||active&&(step===1||i!==0)?1:0);
   assert.deepEqual(values,expected,text);return{text,values,types};
  };
  const initial=await query(1),gold=(await state()).resources[6];await ack();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
  await command(5,0);await wait(()=>goonkMobileState.mode==='town');
  const guild=(await state()).buildings.find(b=>b.key?.endsWith('mageGuild1'));assert(guild?.allowed,'Free Grail does not consume the one-building daily allowance');
  await command(54);await wait(()=>goonkMobileState.mode==='fort');
  const firstStock=(await state()).fortFamilies.find(f=>f.level===0).count;
  await command(0);await wait(()=>goonkMobileState.mode==='town');await command(0);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
  const bytes=await readCompletedNativeSave(page(),command);fs.writeFileSync(path.join(output,`grails-${configured}-${choice}-${conflux}.vsgm1`),bytes);
  await page().close();await boot({...options,grailsConfigured:!configured,save:[...bytes]});
  assert.equal((await state()).resources[6],gold,'Grail construction and save/load do not spend starting gold');
  await command(3);const removed=await query(2);await ack();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
  const day2Gold=(await state()).resources[6];
  if(active){
   const removedBytes=await readCompletedNativeSave(page(),command);fs.writeFileSync(path.join(output,`grails-removed-${configured}-${choice}.vsgm1`),removedBytes);
   await page().close();await boot({...options,grailsConfigured:!configured,save:[...removedBytes]});assert.equal((await state()).resources[6],day2Gold);
  }
  await command(3);const next=await query(3);await ack();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
  const halls=conflux==='red'?4:3;assert.equal(day2Gold-gold,halls*500+(active?15000:0));assert.equal((await state()).resources[6]-day2Gold,halls*500+(active?10000:0));
  report.scenarios.push({configured,choice,active,conflux,initial,removed,next,startingGold:gold,day2Gold,day3Gold:(await state()).resources[6],
   nativeSaveReload:true,reversedGlobalDefault:true,existingGrailPreserved:true,removedGrailNotRebuilt:true,freeConstructionPreservesDailyAllowance:true,firstStock,postRemovalNativeSaveReload:active,
   viewport:page().viewportSize(),input:desktop?'mouse':'touch'});
  await page().close();
 }
}
