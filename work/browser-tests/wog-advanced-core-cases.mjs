import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {mergeNativeInitializers} from '../../scripts/era-bridge/campaigns/native-compiler.mjs';
import {advancedClassPointsFixture} from './wog-advanced-class-points-cases.mjs';
import {advancedClassIdentityFixture} from './wog-advanced-class-identity-cases.mjs';
import {advancedClassSkillLevelsFixture,skillLevelInputs,skillLevelExpected} from './wog-advanced-class-skill-levels-fixture.mjs';
import {advancedClassPointsSource} from '../../scripts/era-bridge/gameplay/advanced-class-points.mjs';
import {advancedClassIdentitySource} from '../../scripts/era-bridge/gameplay/advanced-class-identity.mjs';
import {advancedClassSkillLevelsSource} from '../../scripts/era-bridge/gameplay/advanced-class-skill-levels.mjs';
export function advancedCoreFixture(){
 const programs=[advancedClassPointsFixture(),advancedClassIdentityFixture(),advancedClassSkillLevelsFixture()];
 const version=Math.max(...programs.map(p=>p.schemaVersion));
 const merged={schemaVersion:version,contract:'source-campaign-erm-ast-v'+version,source:'Private merged original Advanced Classes core probes',
  components:programs.map(p=>({source:p.source,sha256:p.sha256})),
  originalMessages:['ZVSE private native companion town continuation'],
  initializers:mergeNativeInitializers(programs),blocks:programs.flatMap(p=>p.blocks)};
 merged.sha256=createHash('sha256').update(JSON.stringify(merged)).digest('hex');return merged;
}
export async function runAdvancedCore({boot,state,wait,page,report,output,save}){
 const scriptProgram=advancedCoreFixture();fs.writeFileSync(path.join(output,'program.json'),JSON.stringify(scriptProgram,null,2));
 const options={enabled:false,scriptTown:true,scriptProgram,...(process.env.AC_PORTRAIT==='1'?{viewport:{width:390,height:844}}:{})};
 const read=async label=>{await wait(label=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.some(line=>line.includes(label)),label);return (await state()).dialogPresentation.lines.join(' ');};
 const ack=()=>page().locator('[data-dialog-confirm]')[process.env.GROWTH_DESKTOP==='1'?'click':'tap']();
 const reload=async name=>{const bytes=await save();fs.writeFileSync(path.join(output,name+'.vsgm1'),bytes);await page().close();await boot({...options,save:[...bytes],expectedDialog:'source-campaign'});};
 const shared={pendingNativeSaveReload:true,completedNativeSaveReload:true,mergedProgramSha256:scriptProgram.sha256,input:process.env.GROWTH_DESKTOP==='1'?'mouse':'touch'};
 await boot({...options,expectedDialog:'source-campaign'});await read('AC ENTRY');await reload('points-pending');await read('AC ENTRY');await ack();
 const markers=[];
 for(const [label,expected] of [['BASE',[11,12,12]],['SKILL-LEVELS',[11,12,12]],['MASTER-FLAGS',[13,14,14]],['EASY-27',[17,18,18]],['BACKPACK-BADGE',[17,18,18]],['REAL-BADGE',[18,19,19]],['CONTROLLED-KING',[22,23,23]],['CONTROLLED-SETS',[22,28,28]],['ARENA',[23,29,29]]]){
  const text=await read('AC '+label),match=text.match(new RegExp('AC '+label+' (-?\\d+)/(-?\\d+)/(-?\\d+)'));
  assert(match,text);assert.deepEqual(match.slice(1).map(Number),expected,label);assert(text.includes('skills 3 | class 0'),text);markers.push({label,text,day:(await state()).day});await ack();
 }
 assert((await read('AC FINISH')).includes('nested 123'));await ack();
 await read('CLASS ENTRY');await reload('class-pending');await read('CLASS ENTRY');await ack();
 const classes=[0,1,2,3,4,5,6,6],cases=[];
 for(const grandmaster of [0,1])for(let mask=0;mask<8;mask++){
  const text=await read(`CLASS ${grandmaster}/${mask}`),expected=[classes[mask],mask?grandmaster?5:4:0];assert(text.includes(`CLASS ${grandmaster}/${mask} ${expected.join('/')}`),text);cases.push({mask,grandmaster,expected,text});await ack();
 }
 assert((await read('CLASS NESTED')).includes('6/5/77'));await ack();assert((await read('CLASS OTHER-HERO')).includes('0/0'));await ack();
 await read('SKILL ENTRY');await ack();const skillCases=[];
 for(let index=0;index<skillLevelInputs.length;index++){
  const text=await read('SKILL '+index+' '),effective=skillLevelExpected[index];
  const expected=[Math.min(3,effective),effective,effective>=4?1:0,effective===5?1:0];
  assert(text.includes(`SKILL ${index} ${expected.join('/')}`),text);
  if(effective===5&&index===7){await reload('grandmaster-routing-pending');assert.equal(await read('SKILL '+index+' '),text);}
  skillCases.push({input:skillLevelInputs[index],expected,text});await ack();
 }
 assert((await read('SKILL STALE')).includes('SKILL STALE 2'));await ack();assert((await read('SKILL OTHER')).includes('SKILL OTHER 3'));await ack();
 const bounds=await read('BOUNDS ');assert(bounds.includes('BOUNDS 9/17/3/-2147483648'),bounds);await ack();
 await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);const bytes=await save();fs.writeFileSync(path.join(output,'finished.vsgm1'),bytes);
 await page().close();await boot({...options,save:[...bytes]});assert.equal((await state()).mode,'map');
 shared.viewport=page().viewportSize();
 report.scenarios.push({kind:'points',source:advancedClassPointsSource,scope:'Original point calculation; commander and set dependencies remain controlled stubs',markers,nativeHeroSkillReads:true,nativeBadgeQuery:true,...shared},
  {kind:'class',source:advancedClassIdentitySource,scope:'Original class lookup from controlled mastery flags; no promotion admission',cases,triggerLocalPools:true,nestedCallPreservesCaller:true,heroSpecificNames:true,...shared},
  {kind:'skill-level-routing',source:advancedClassSkillLevelsSource,scope:'Original get/set skill-level routing against real native Pathfinding, with controlled Pathfinding flag adapters; no full skill effects or source array-helper admission',cases:skillCases,staleFlagsDoNotOverrideAdvancedNativeSkill:true,otherSkillDoesNotInheritPathfindingFlags:true,integerBounds:bounds,...shared});
 await page().close();
}
