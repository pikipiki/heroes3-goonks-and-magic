import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';

export function doubleArtifactsProgram(row){
 const type=row.typeId??7;
 const override=row.marker===undefined?'':`!!PO998:N${row.marker};`;
 const preferWorn=row.existing==='bag'||row.existing==='none'||row.existing==='full'?1:0;
 const source=`ZVSE
!#HE0:A2/${type}/?v98/?v99;
!#VRv98:-${row.before?.[0]??0};
!#HE0&v98>0:A3/${type}/v98/${preferWorn};
!#UN:P119/?v10;
!#HE0:A2/${type}/?v11/?v12;
!#IF:M^DART INIT %V10/%V11/%V12^;
!?OB5;
${override}
!!PO998:N?v20;
!!HE0:A2/${type}/?v21/?v22;
!!IF:M^DART PRE %V20/%V21/%V22^;
!$OB5;
!!PO998:N?v30;
!!HE0:A2/${type}/?v31/?v32;
!!IF:M^DART POST %V30/%V31/%V32^;
!!UN:P119/?v40;
!!PO998:N?v41;
!!HE0:A2/${type}/?v42/?v43;
!!IF:M^DART RESTORED %V40/%V41/%V42/%V43^;`;
 const p=compileErm(Buffer.from(source),{source:'Private native source119 artifact pickup'});
 p.originalMessages=['ZVSE private native companion town continuation'];return p;
}
export async function runDoubleArtifacts({boot,sheet,state,command,wait,approachEnemy,page,report,output,save}){
 if(process.env.DOUBLE_ARTIFACTS_FAILED_PRIMARY==='1'){
  const {runFailedPrimary}=await import('./wog-map-double-artifacts-failed-primary-cases.mjs');
  await runFailedPrimary({boot,sheet,state,command,wait,approachEnemy,page,report,output,save});return;
 }
 if(process.env.DOUBLE_ARTIFACTS_AI==='1'){
  const {runDoubleArtifactsAI}=await import('./wog-map-double-artifacts-ai-cases.mjs');
  await runDoubleArtifactsAI({boot,sheet,state,command,wait,page,report,output,save});return;
 }
 if(process.env.DOUBLE_ARTIFACTS_LEGACY_PRODUCER==='1'||process.env.DOUBLE_ARTIFACTS_LEGACY_SAVE){
  const {runDoubleArtifactsCompatibility}=await import('./wog-map-double-artifacts-compatibility-cases.mjs');
  await runDoubleArtifactsCompatibility({boot,sheet,state,command,wait,approachEnemy,page,report,output,save});return;
 }
 const rows=[
  {name:'first-copy',choice:1,configured:false,existing:'none',before:[0,0],after:[2,1]},
  {name:'forced-off',choice:0,configured:true,existing:'none',before:[0,0],after:[1,1],marker:15},
  {name:'inherited-on',choice:-1,configured:true,existing:'none',before:[0,0],after:[2,1]},
  {name:'inherited-off',choice:-1,configured:false,existing:'none',before:[0,0],after:[1,1]},
  {name:'existing-backpack',choice:1,configured:false,existing:'bag',before:[1,0],after:[2,1]},
  {name:'existing-equipped',choice:1,configured:false,existing:'worn',before:[1,1],after:[2,1]},
  {name:'two-existing',choice:1,configured:false,existing:'two',before:[2,1],after:[3,1]},
  {name:'equipped-combination',choice:1,configured:false,existing:'combo',type:'core:ringOfLife',typeId:95,animation:'AVA0095.def',before:[0,0],after:[2,0]},
  {name:'backpack-combination',choice:1,configured:false,existing:'combo-bag',type:'core:ringOfLife',typeId:95,animation:'AVA0095.def',before:[0,0],after:[2,1]},
  {name:'full-backpack',choice:1,configured:false,existing:'full',before:[0,0],after:[1,1]},
  {name:'zero-marker',choice:1,configured:false,existing:'none',marker:0,before:[0,0],after:[1,1]},
  {name:'custom-marker',choice:1,configured:false,existing:'none',marker:7,before:[0,0],after:[2,1]},
  {name:'guard-decline-and-win',choice:1,configured:false,existing:'none',guarded:true,before:[0,0],after:[2,1]},
 ];
 for(const row of rows.filter(r=>!process.env.DOUBLE_ARTIFACTS_CASES||process.env.DOUBLE_ARTIFACTS_CASES.split(',').includes(r.name))){
  const active=row.choice===1||row.choice===-1&&row.configured;
  const marker=row.marker??(active?15:0),afterMarker=active&&marker===15?0:marker;
  const scriptProgram=doubleArtifactsProgram(row);fs.writeFileSync(path.join(output,row.name+'-program.json'),JSON.stringify(scriptProgram,null,2));
  const options={enabled:false,scriptTown:true,scriptProgram,artifactFixture:row,doubleArtifactChoice:row.choice,doubleArtifactsConfigured:row.configured,
   artifactLanguage:process.env.DOUBLE_ARTIFACTS_LANGUAGE||'en',...(process.env.AC_PORTRAIT==='1'?{viewport:{width:390,height:844}}:{})};
  const read=async text=>{await wait(text=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.join(' ')===text,text);assert.equal((await state()).dialogPresentation.lines.join(' '),text);};
  const press=process.env.GROWTH_DESKTOP==='1'?'click':'tap';
  const ack=async()=>{
   const s=await state(),before={text:s.dialogPresentation?.lines?.join(' ')||'',token:s.windowToken,query:s.dialogPresentation?.queryId};
   await page().locator('[data-dialog-confirm]')[press]();
   await wait(before=>goonkMobileState.mode!=='dialog'||goonkMobileState.dialogPresentation?.queryId!==before.query||(goonkMobileState.dialogPresentation?.lines?.join(' ')||'')!==before.text,before);
  };
  await boot({...options,expectedDialog:'source-campaign'});await read(`DART INIT ${Number(active)}/${row.before.join('/')}`);await ack();
  await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
  const messages=[];let attempts=0;
  const pick=async(decline=false)=>{
   await approachEnemy(attempts++?1:2);let refused=false;
   for(let tick=0;tick<600;tick++){
    const s=await state(),text=s.dialogPresentation?.lines?.join(' ')||'';
    if(s.mode==='dialog'){
     if(s.dialogKind==='battle-result'){
      await page().locator('[data-result-confirm]')[press]();
      await wait(()=>goonkMobileState.dialogKind!=='battle-result');continue;
     }
     if(text.startsWith('DART POST '))return text;
     if(text.startsWith('DART PRE '))assert.equal(text,`DART PRE ${marker}/${row.before.join('/')}`);
     else if(decline&&!refused&&s.dialogPresentation?.cancel&&await page().locator('[data-dialog-cancel]:visible, .dialog-presentation:not([hidden]) [data-ui-header-close=true]:visible').first().isVisible()){
      const before={text,query:s.dialogPresentation?.queryId};await page().locator('[data-dialog-cancel]:visible, .dialog-presentation:not([hidden]) [data-ui-header-close=true]:visible').first()[press]();
      await wait(before=>goonkMobileState.mode!=='dialog'||goonkMobileState.dialogPresentation?.queryId!==before.query||(goonkMobileState.dialogPresentation?.lines?.join(' ')||'')!==before.text,before);refused=true;continue;
     }else messages.push(text);
     await ack();
    }else if(s.mode==='battle'&&s.canAutoCombat&&!s.autoCombat)await command(44,1);
    await page().waitForTimeout(50);
   }
   throw Error('Missing post-pickup source witness '+row.name);
  };
  if(row.guarded){
   assert.equal(await pick(true),`DART POST 15/${row.before.join('/')}`);await ack();
   await read(`DART RESTORED 1/15/${row.before.join('/')}`);await ack();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
  }
  const expected=`DART POST ${afterMarker}/${row.after.join('/')}`;assert.equal(await pick(),expected);
  const pending=await save();assert.equal(pending.readInt32LE(4),Number(process.env.GOONK_EXPECTED_SAVE_VERSION||929));fs.writeFileSync(path.join(output,row.name+'-pending.vsgm1'),pending);
  await page().close();await boot({...options,doubleArtifactsConfigured:!row.configured,save:[...pending],expectedDialog:'source-campaign'});await read(expected);await ack();
  await read(`DART RESTORED ${Number(active)}/${afterMarker}/${row.after.join('/')}`);await ack();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
  const hero=await sheet();assert.equal(hero.name,'Orrin');
  const all=[...(hero.slots||[]),...(hero.backpack||[])];
  const copies=all.filter(a=>a.name&&a.icon===(row.typeId??7)&&!(row.existing==='combo'&&a.locked));
  assert.equal(copies.length,row.after[0],JSON.stringify(all));
  if(row.existing==='full')assert.equal(hero.backpack.filter(a=>a.name).length,64);
  fs.writeFileSync(path.join(output,row.name+'-hero.json'),JSON.stringify(hero,null,2));
  report.scenarios.push({name:row.name,active,before:row.before,after:row.after,markerBefore:marker,markerAfter:afterMarker,
   nativePostVisitWitness:true,pendingNativeSaveReload:true,frozenChoiceAfterGlobalReversal:true,independentInventoryCheck:true,guardDeclinePreserved:!!row.guarded,
   viewport:page().viewportSize(),input:press==='click'?'mouse':'touch',messages});
  await page().close();
 }
}
