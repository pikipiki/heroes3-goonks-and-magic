import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';
import {revealNativeAction} from './native-ui-actions.mjs';
export function fortlessTownsFixture(){
 const anchors=[[8,8],[28,8],[8,18],[28,18],[8,28],[28,28],[18,8],[18,28],[18,18]];
 const queries=step=>anchors.map(([ax,ay],i)=>{
  let s=`!!VRv${8400+i}:S-1;!!VRv${8420+i}:S-1;`;
  for(let y=ay-3;y<=ay;y++)for(let x=ax-5;x<=ax;x++){
   s+=`\n!!OB${x}/${y}/0:T?v900;!!VRv${8400+i}&v900=98:S0;`;
   for(const [building,bit]of [[7,1],[8,2],[9,4]])s+=`!!CA${x}/${y}/0&v900=98:B3/${building};!!VRv${8400+i}&v900=98/1:+${bit};`;
   s+=`!!CA${x}/${y}/0&v900=98:T?v${8420+i};`;
   if(i<2)s+=`!!VRv${8460+i*2}&v900=98:S${x};!!VRv${8461+i*2}&v900=98:S${y};`;
  }
  return s;
 }).join('\n')+`\n!!UN:P131/?v8431 P144/?v8444;\n!!IF:M^FORTS ${step} %V8431/%V8444 ${anchors.map((_,i)=>'%V'+(8400+i)).join('/')} types ${anchors.map((_,i)=>'%V'+(8420+i)).join('/')}^;`;
 const p=compileErm(`ZVSE2
!#UN:P131/?v8431 P144/?v8444;
!#IF:M^FORTS INIT %V8431/%V8444^;
!?GE1;
${queries('READY')}
!?GE2;
!!CAv8460/v8461/0:B1/7;
!!CAv8462/v8463/0:O0;
${queries('REBUILT')}
!?GE3;
${queries('RESTORED')}`,{source:'Private native source131/144 fortifications lifecycle'});
 p.originalMessages=['ZVSE private native mithril option query'];return p;
}
export async function runFortlessTowns({boot,state,command,wait,page,output,report,readCompletedNativeSave}){
 const mouse=process.env.CASES.endsWith('-desktop'),action=mouse?'click':'tap',portrait=process.env.FORTLESS_PORTRAIT==='1';
 if(process.env.FORTLESS_LEGACY==='1'){
  const old=process.env.FORTLESS_LEGACY_SAVE;
  const program=compileErm('ZVSE2\n!?GE1;\n!!IF:M^FORTS LEGACY READY^;\n!?GE2;\n!!IF:M^FORTS LEGACY NEXT^;',{source:'Private old-reader-compatible fortified town baseline'});program.originalMessages=['ZVSE private native mithril option query'];
  const options={enabled:false,fortlessFixture:true,scriptProgram:program,fortlessConfigured:!!old,preserveAiFortsConfigured:false};
  await boot({...options,...(old?{save:[...fs.readFileSync(old)]}:{expectedDialog:'source-campaign'})});
  if(!old){await wait(()=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.join(' ').includes('FORTS LEGACY READY'));await page().locator('[data-dialog-confirm]')[action]();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);}
  const inspect=async()=>{const town=(await state()).towns.find(t=>t.name.includes('Fortless goonk'));assert(town);await command(5,town.index);await wait(()=>goonkMobileState.mode==='town');const buildings=(await state()).buildings;assert.deepEqual([7,8,9].map(id=>!!buildings.find(b=>b.id===id)?.built),[true,true,true]);await command(0);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);};
  await inspect();const bytes=await readCompletedNativeSave(page(),command,{tag:856});fs.writeFileSync(path.join(output,'legacy-fortified-towns.vsgm1'),bytes);assert.equal(bytes.readInt32LE(4),old?927:926);
  if(old){await command(3);await wait(()=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.join(' ').includes('FORTS LEGACY NEXT'));await page().locator('[data-dialog-confirm]')[action]();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);await inspect();}
  report.scenarios.push({kind:old?'fortless-legacy-consumer':'fortless-legacy-producer',saveVersion:bytes.readInt32LE(4),...(old?{inputVersion:926,noRetroactiveFortRemoval:true,continuedNextDay:true}:{})});await page().close();return;
 }
 const matrix=[
  {name:'all-towns',configured:false,choice:1,preserveConfigured:false,preserveChoice:0,active:true,preserve:false},
  {name:'preserve-ai',configured:false,choice:1,preserveConfigured:false,preserveChoice:1,active:true,preserve:true},
  {name:'forced-off',configured:true,choice:0,preserveConfigured:true,preserveChoice:1,active:false,preserve:true},
  {name:'inherited-on',configured:true,choice:-1,preserveConfigured:true,preserveChoice:-1,active:true,preserve:true},
  {name:'inherited-off',configured:false,choice:-1,preserveConfigured:false,preserveChoice:-1,active:false,preserve:false},
 ];
 const initialRanks=[7,7,1,3,7,3,1,7,7],ai=new Set([1,4]);
 const acknowledge=async()=>{const old=(await state()).dialogPresentation.lines.join(' ');await page().locator('[data-dialog-confirm]')[action]();await wait(old=>goonkMobileState.mode!=='dialog'||goonkMobileState.dialogPresentation?.lines?.join(' ')!==old,old);};
 for(const row of matrix.filter(row=>!process.env.FORTLESS_ONLY||process.env.FORTLESS_ONLY.split(',').includes(row.name))){
  const scriptProgram=fortlessTownsFixture(),options={enabled:false,fortlessFixture:true,fortlessConfigured:row.configured,fortlessChoice:row.choice,preserveAiFortsConfigured:row.preserveConfigured,preserveAiFortsChoice:row.preserveChoice,scriptProgram,nativeSeed:11,...(portrait?{viewport:{width:390,height:844}}:{})};
  fs.writeFileSync(path.join(output,'program.json'),JSON.stringify(scriptProgram,null,2));
  await boot({...options,expectedDialog:'source-campaign'});
  assert((await state()).dialogPresentation.lines.join(' ').includes(`FORTS INIT ${+row.active}/${+row.preserve}`));await acknowledge();
  const query=async step=>{
   await wait(step=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.join(' ').includes('FORTS '+step+' '),step);
   const text=(await state()).dialogPresentation.lines.join(' '),match=text.match(/FORTS \w+ ([01])\/([01]) ([\d/]+) types ([\d/]+)/);assert(match,text);
   assert.equal(Number(match[1]),+row.active);assert.equal(Number(match[2]),+row.preserve);
   const ranks=match[3].split('/').map(Number),types=match[4].split('/').map(Number);assert.deepEqual(types,[0,1,2,3,4,5,6,7,8]);
   const expected=initialRanks.map((rank,i)=>row.active&&!(row.preserve&&ai.has(i))?0:rank);if(step!=='READY')expected[0]|=1;
   assert.deepEqual(ranks,expected,text);return {text,ranks,types};
  };
  const ready=await query('READY');await acknowledge();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
  const gold=(await state()).resources[6];assert.equal(gold,20000,'Initial fortification removal is free');
  const custom=(await state()).towns.find(t=>t.name.includes('Fortless goonk'));assert(custom,'Custom town with visiting hero remains owned');
  await command(5,custom.index);await wait(()=>goonkMobileState.mode==='town');
  const buildings=(await state()).buildings;assert.deepEqual([7,8,9].map(id=>!!buildings.find(b=>b.id===id)?.built),row.active?[false,false,false]:[true,true,true]);
  const visitor=(await state()).armies.find(a=>a.id===0&&a.name==='Christian');assert(visitor,'Fortification changes preserve the visiting hero');assert.equal(visitor.slots[0].key,'core:archangel');assert.equal(visitor.slots[0].count,10);
  await page().screenshot({path:path.join(output,row.name+'-custom-town.png')});await command(0);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
  const originalTown=(await state()).towns.find(t=>t.name.includes('Fortless castle'));assert(originalTown);
  await command(5,originalTown.index);await wait(()=>goonkMobileState.mode==='town');
  const recruitAction=await revealNativeAction(page(),'[data-ui=town-fort]',{mouse});await recruitAction[action]();await wait(()=>goonkMobileState.mode==='fort');
  const firstStock=(await state()).fortFamilies.find(f=>f.level===0)?.count;assert(firstStock>0,'Recruitment remains accessible without fortifications');
  await page().screenshot({path:path.join(output,row.name+'-recruitment.png')});await command(0);await wait(()=>goonkMobileState.mode==='town');await command(0);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
  const bytes=await readCompletedNativeSave(page(),command,{tag:854});fs.writeFileSync(path.join(output,row.name+'-ready.vsgm1'),bytes);assert.equal(bytes.readInt32LE(4),927);
  await page().close();await boot({...options,fortlessConfigured:!row.configured,preserveAiFortsConfigured:!row.preserveConfigured,save:[...bytes]});assert.equal((await state()).resources[6],gold);
  await command(3);const rebuilt=await query('REBUILT');await acknowledge();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
  const after=await readCompletedNativeSave(page(),command,{tag:855});await page().close();await boot({...options,fortlessConfigured:!row.configured,preserveAiFortsConfigured:!row.preserveConfigured,save:[...after]});
  await command(3);const restored=await query('RESTORED');await acknowledge();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
  report.scenarios.push({...row,ready,rebuilt,restored,firstStock,recruitmentAccessible:true,customFaction:true,visitingHeroPreserved:true,nativeSaveReload:true,reversedGlobalDefaults:true,rebuiltFortNotRemoved:true,capturedTownNotReprocessed:true,saveVersion:927,viewport:page().viewportSize(),input:mouse?'mouse':'touch'});await page().close();
 }
}
