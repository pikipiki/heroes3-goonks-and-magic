import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';
import {compileAdvancedClassIdentity,advancedClassIdentityBindings,advancedClassIdentitySource} from '../../scripts/era-bridge/gameplay/advanced-class-identity.mjs';
export function advancedClassIdentityFixture(){
 const body=fs.readFileSync('tests/fixtures/era-gameplay/advanced-class-identity-1.1.erm');
 compileAdvancedClassIdentity(body);
 const probes=[];
 for(const grandmaster of [0,1])for(let mask=0;mask<8;mask++){
  const setters=['Warrior','Mage','Adventurer'].map((branch,index)=>
   `!#SN:W^Master_${branch}_Hero7^/${(mask>>index)&1};\n!#SN:W^Grandmaster_${branch}_Hero7^/${index===0?grandmaster:0};`).join('\n');
  probes.push(`${setters}
!#FU(acm_GetHeroClass):P7/?v901/?v902;
!#IF:M^CLASS ${grandmaster}/${mask} %V901/%V902^;`);
 }
 // A nested call changes local allocations but must not overwrite its caller.
 const source=Buffer.concat([Buffer.from('ZVSE2\n'),body,Buffer.from(`
!?FU(Outer);
!#VA(hero:x); !#VA(result:x); !#VA(level:x);
!!VR(kept:y):S77;
!!FU(acm_GetHeroClass):P(hero)/?(result)/?(level);
!!VRv903:S(kept);
!#IF:M^CLASS ENTRY^;
${probes.join('\n')}
!#FU(Outer):P7/?v901/?v902;
!#IF:M^CLASS NESTED %V901/%V902/%V903^;
!#FU(acm_GetHeroClass):P4/?v901/?v902;
!#IF:M^CLASS OTHER-HERO %V901/%V902^;
`)]);
 const program=compileErm(source,{source:'Private native original Advanced Classes class lookup',bindings:{...advancedClassIdentityBindings,Outer:9404}});
 program.originalMessages=['ZVSE private native companion town continuation'];return program;
}
export async function runAdvancedClassIdentity({boot,state,wait,page,report,output,save}){
 const scriptProgram=advancedClassIdentityFixture();
 fs.writeFileSync(path.join(output,'program.json'),JSON.stringify(scriptProgram,null,2));
 const options={enabled:false,scriptTown:true,scriptProgram,...(process.env.AC_PORTRAIT==='1'?{viewport:{width:390,height:844}}:{})};
 const read=async label=>{await wait(label=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.some(line=>line.includes('CLASS '+label)),label);return (await state()).dialogPresentation.lines.join(' ');};
 const ack=()=>page().locator('[data-dialog-confirm]')[process.env.GROWTH_DESKTOP==='1'?'click':'tap']();
 await boot({...options,expectedDialog:'source-campaign'});await read('ENTRY');
 const pending=await save();fs.writeFileSync(path.join(output,'pending.vsgm1'),pending);
 await page().close();await boot({...options,save:[...pending],expectedDialog:'source-campaign'});
 await read('ENTRY');await ack();
 const cases=[],classes=[0,1,2,3,4,5,6,6];
 for(const grandmaster of [0,1])for(let mask=0;mask<8;mask++){
  const text=await read(`${grandmaster}/${mask}`),expected=[classes[mask],mask?grandmaster?5:4:0];
  assert(text.includes(`CLASS ${grandmaster}/${mask} ${expected.join('/')}`),text);
  cases.push({mask,grandmaster,expected,text});await ack();
 }
 assert((await read('NESTED')).includes('6/5/77'));await ack();
 assert((await read('OTHER-HERO')).includes('0/0'));await ack();
 await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 const done=await save();fs.writeFileSync(path.join(output,'done.vsgm1'),done);
 await page().close();await boot({...options,save:[...done]});assert.equal((await state()).mode,'map');
 report.scenarios.push({source:advancedClassIdentitySource,scope:'Original class lookup from controlled source mastery flags; promotion, extra skill levels and full profile remain unadmitted',cases,triggerLocalPools:true,nestedCallPreservesCaller:true,heroSpecificNames:true,pendingNativeSaveReload:true,completedNativeSaveReload:true,viewport:page().viewportSize(),input:process.env.GROWTH_DESKTOP==='1'?'mouse':'touch'});
 await page().close();
}
