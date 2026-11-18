import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';
import {compileAdvancedClassPoints,advancedClassPointsBindings,advancedClassPointsSource} from '../../scripts/era-bridge/gameplay/advanced-class-points.mjs';
export function advancedClassPointsFixture(){
 const body=fs.readFileSync('tests/fixtures/era-gameplay/advanced-class-points-1.1.erm');
 compileAdvancedClassPoints(body);
 const call=label=>`!#FU(Calc_Class_Points_Original):P7/0/?v901/?v902/?v903/?v904/?v905/?v906/?v907/?v909/?v910/?v911/?v912/?v913;
 !#SN:W^Number_Of_Hero_Skills^/?v914;
 !#HE7:B2/?v915;
 !#IF:M^AC ${label} %V901/%V902/%V903 | details %V904/%V905/%V906/%V907/%V909/%V910/%V911/%V912/%V913 | skills %V914 | class %V915^;`;
 const source=Buffer.concat([body,Buffer.from(`
!?FU(Check_Com_Masteries);
!!VRx3:Sv8001; !!VRx5:Sv8002;
!?FU(Count_Set_Pieces_2);
!!VRx4:Sv8003; !!VRx5:Sv8004; !!VRx6:Sv8005;
!#SN:W^Expert_Level_Global_Value^/20;
!#SN:W^Master_Level_Global_Value^/35;
!#SN:W^Grandmaster_Level_Global_Value^/58;
${Array.from({length:28},(_,i)=>`!#HE7:S${i}/0;`).join('\n')}
!#HE7:S0/1; !#HE7:S1/2; !#HE7:S7/3;
!#VRv900:S1;
!#if&v900=1;
 !#VRv900:S0;
 !#IF:M^AC ENTRY^;
 !#if&v900=0;
  !#VRv908:S123;
 !#el;
  !#VRv908:S999;
 !#en;
!#el;
 !#IF:M^AC WRONG BRANCH^;
!#en;
${call('BASE')}
!#HE7:S0/3; !#HE7:S1/1; !#HE7:S7/2;
${call('SKILL-LEVELS')}
!#SN:W^H3_Pathfinding_0_Hero7^/1;
!#SN:W^H3_Archery_0_Hero7^/1;
!#SN:W^H3_Wisdom_0_Hero7^/1;
${call('MASTER-FLAGS')}
!#SN:W^Easier_Class_option^/1;
!#HE7:E?y1/27/1;
${call('EASY-27')}
!#HE7:A49;
${call('BACKPACK-BADGE')}
!#HE7:A1/49/9;
${call('REAL-BADGE')}
!#VRv8001:S100; !#VRv8002:S16;
${call('CONTROLLED-KING')}
!#VRv8003:S3; !#VRv8004:S0; !#VRv8005:S3;
${call('CONTROLLED-SETS')}
!#SN:W^Arena_Reward_7_Warrior_Class_Point^/1;
!#SN:W^Arena_Reward_7_Mage_Class_Point^/1;
!#SN:W^Arena_Reward_7_Adeventurer_Class_Point^/1;
${call('ARENA')}
!#IF:M^AC FINISH nested %V908^;
`)]);
 const program=compileErm(source,{source:'Private native Advanced Classes calculation probe',dialect:'era3',bindings:advancedClassPointsBindings});
 program.originalMessages=['ZVSE private native companion town continuation'];return program;
}
export async function runAdvancedClassPoints({boot,state,command,wait,page,report,output,save}){
 const scriptProgram=advancedClassPointsFixture();
 fs.writeFileSync(path.join(output,'program.json'),JSON.stringify(scriptProgram,null,2));
 const options={enabled:false,scriptTown:true,scriptProgram,...(process.env.AC_PORTRAIT==='1'?{viewport:{width:390,height:844}}:{})};
 const markers=[];
 const until=async label=>{
  await wait(label=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.some(line=>line.includes('AC '+label)),label);
  const s=await state(),text=s.dialogPresentation.lines.join(' ');markers.push({label,text,day:s.day});return text;
 };
 const ack=async()=>{const button=page().locator('[data-dialog-confirm]');assert(await button.count());await button[process.env.GROWTH_DESKTOP==='1'?'click':'tap']();};
 await boot({...options,expectedDialog:'source-campaign'});
 await until('ENTRY');
 const bytes=await save();fs.writeFileSync(path.join(output,'entry-pending.vsgm1'),bytes);
 await page().close();await boot({...options,save:[...bytes],expectedDialog:'source-campaign'});
 await until('ENTRY');await ack();
 for(const [label,expected] of [['BASE',[11,12,12]],['SKILL-LEVELS',[11,12,12]],['MASTER-FLAGS',[13,14,14]],['EASY-27',[17,18,18]],['BACKPACK-BADGE',[17,18,18]],['REAL-BADGE',[18,19,19]],['CONTROLLED-KING',[22,23,23]],['CONTROLLED-SETS',[22,28,28]],['ARENA',[23,29,29]]]){
  const text=await until(label),match=text.match(new RegExp('AC '+label+' (-?\\d+)/(-?\\d+)/(-?\\d+)'));
  assert(match,text);assert.deepEqual(match.slice(1).map(Number),expected,label);
  assert(text.includes('skills 3 | class 0'),text);if(label==='BASE')await page().screenshot({path:path.join(output,'base.png')});await ack();
 }
 assert((await until('FINISH')).includes('nested 123'));await ack();
 await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 const final=await save();fs.writeFileSync(path.join(output,'finished.vsgm1'),final);
 await page().close();await boot({...options,save:[...final]});
 assert.equal((await state()).mode,'map','Completed original calculation does not replay on reload');
 report.scenarios.push({source:advancedClassPointsSource,scope:'Original point calculation; commander class and artifact sets are controlled dependency stubs, not admitted pack mechanics',markers,nativeHeroSkillReads:true,nativeBadgeQuery:true,pendingNativeSaveReload:true,completedNativeSaveReload:true,viewport:page().viewportSize(),input:process.env.GROWTH_DESKTOP==='1'?'mouse':'touch'});
 await page().close();
}
