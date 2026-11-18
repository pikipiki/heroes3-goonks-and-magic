import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';
export function mithrilDisplayFixture(){
 const p=compileErm(`ZVSE2
!#UN:P36/?v7136 P149/?v7149 P170/?v7170 P171/?v7171;
!#IF:M^DISPLAY INIT %V7136/%V7149/%V7170/%V7171^;
!?GE2;
!!UN:P36/?v7136 P149/?v7149 P170/?v7170 P171/?v7171;
!!IF:M^DISPLAY NEXT %V7136/%V7149/%V7170/%V7171^;`,{source:'Private native source149 sequential option snapshot'});
 p.originalMessages=['ZVSE private native mithril option query'];return p;
}
export async function runMithrilDisplay({boot,state,command,wait,panel,page,output,report,readCompletedNativeSave}){
 if(process.env.MITHRIL_DISPLAY_LEGACY_SAVE){
  const bytes=fs.readFileSync(process.env.MITHRIL_DISPLAY_LEGACY_SAVE);await boot({enabled:true,save:[...bytes]});
  const before=(await state()).resources.slice();assert.equal(!!(await state()).mithrilDisplayEnabled,false);
  const saved=await readCompletedNativeSave(page(),command,{tag:850});assert.equal(saved.readInt32LE(4),925);assert.equal(bytes.readInt32LE(4),924);assert.deepEqual((await state()).resources,before);
  report.scenarios.push({kind:'mithril-display-legacy-save',inputVersion:924,outputVersion:925,noRetroactiveDisplay:true,resourcesPreserved:true});await page().close();return;
 }
 const expectedSaveVersion=Number(process.env.MITHRIL_DISPLAY_SAVE_VERSION||925);
 const classic=process.env.CASES==='display-classic',mouse=classic||process.env.CASES.endsWith('-desktop');
 const language=process.env.MITHRIL_DISPLAY_LANGUAGE||'en';
 const choices=[
  {name:'display-only',enhancements:0,display:1,replacement:0,weekly:0,funds:1},
  {name:'enhancements-force-display',enhancements:1,display:0,replacement:0,weekly:0,funds:100},
  {name:'replacement-forces-live-only',enhancements:0,display:0,replacement:1,weekly:0,funds:0},
  {name:'weekly-independent',enhancements:0,display:0,replacement:0,weekly:1,funds:2},
  {name:'all-disabled',enhancements:0,display:0,replacement:0,weekly:0,funds:0},
  {name:'display-and-replacement',enhancements:0,display:1,replacement:1,weekly:1,funds:0},
 ];
 for(const row of choices.filter(r=>!process.env.MITHRIL_DISPLAY_ONLY||process.env.MITHRIL_DISPLAY_ONLY.split(',').includes(r.name))){
  const expectedDisplay=!!(row.display||row.enhancements),live=!!(expectedDisplay||row.replacement);
  const opts={enabled:false,displayMithrilChoice:row.display,wogChoice:row.enhancements,resourceMithrilChoice:row.replacement,weeklyMithrilChoice:row.weekly,funds:row.funds,nativeSeed:11,scriptProgram:mithrilDisplayFixture(),...(process.env.MITHRIL_DISPLAY_PORTRAIT==='1'?{viewport:{width:390,height:844}}:{})};
  await boot({...opts,expectedDialog:'source-campaign'});
  const expected=`${row.enhancements}/${+live}/${row.replacement}/${row.weekly}`;
  assert((await state()).dialogPresentation.lines.join(' ').includes('DISPLAY INIT '+expected));
  await command(1);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
  assert.equal(!!(await state()).mithrilDisplayEnabled,expectedDisplay);
  const before=(await state()).resources.slice();
  if(classic){
   await page().evaluate(()=>Module._vcmiMobileEnable(2));
   const position=await page().evaluate(()=>{const c=Module.canvas,b=c.getBoundingClientRect();const m=goonkMobileState.mapOverview.rect;return{x:b.x+(m.x+64)*b.width/c.width,y:b.y+(m.y+186)*b.height/c.height};});
   await page().mouse.click(position.x,position.y,{button:'right'});
   if(expectedDisplay){
    await wait(()=>goonkMobileState.mode==='dialog');
    const presentation=(await state()).dialogPresentation;
    assert(presentation.lines.join(' ').includes(String(row.funds)));
    assert.equal(presentation.cancel,!!row.enhancements);
    await page().screenshot({path:path.join(output,row.name+'-classic-total.png')});
    if(row.enhancements){await command(1);await wait(title=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.join(' ').includes(title),language==='fr'?'Tarifs du mithril':'Mithril price list');await page().screenshot({path:path.join(output,row.name+'-classic-prices.png')});}
    await command(1);await wait(()=>goonkMobileState.mode==='map');
   }else{await page().waitForTimeout(250);assert.equal((await state()).mode,'map');await page().evaluate(()=>Module._vcmiMobilePointer(0,0,3));}
  }else if(expectedDisplay){
   const data=await panel();assert.equal(data.amount,row.funds);assert(data.information.total.includes(String(row.funds)));
   assert.equal(data.information.prices?.length||0,row.enhancements?11:0);
   const prices=page().locator('[data-mithril-prices]');assert.equal(await prices.count(),row.enhancements?1:0);
   if(row.enhancements){
    await prices[mouse?'click':'tap']();await page().locator('#mithril-price-list').waitFor({state:'visible'});
    assert.equal(await page().locator('#mithril-price-list li').count(),11);
    const final=page().locator('#mithril-price-list li').last();await final.scrollIntoViewIfNeeded();assert(await final.isVisible());
    await page().screenshot({path:path.join(output,row.name+'-prices.png')});
    await prices.scrollIntoViewIfNeeded();await prices[mouse?'click':'tap']();assert(await page().locator('#mithril-price-list').isHidden());
   }
   await page().locator('[data-mithril-close]')[mouse?'click':'tap']();
  }else assert.equal(await page().locator('[data-mithril-open]:visible').count(),0);
  assert.deepEqual((await state()).resources,before,'Viewing information never spends resources');
  const bytes=await readCompletedNativeSave(page(),command,{tag:849});fs.writeFileSync(path.join(output,row.name+'.vsgm1'),bytes);assert.equal(bytes.readInt32LE(4),expectedSaveVersion);
  await page().close();await boot({...opts,enabled:true,save:[...bytes]});
  assert.equal(!!(await state()).mithrilDisplayEnabled,expectedDisplay);
  await command(3);await wait(()=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.join(' ').includes('DISPLAY NEXT '));
  const after=(await state()).dialogPresentation.lines.join(' ');assert(after.includes('DISPLAY NEXT '+expected),after);
  await command(1);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
  report.scenarios.push({...row,language,input:mouse?'mouse':'touch',viewport:page().viewportSize(),expectedDisplay,liveSource149:live,saveVersion:expectedSaveVersion,frozenAfterChangedGlobalDefault:true,sourceOptionsBeforeAndAfterReload:true,readOnly:true,classic});await page().close();
 }
}
