import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function runHenchmanPrompts({boot,approachEnemy,state,command,wait,resolve,page,report,output,desktop,save}){
 const press=async selector=>page().locator(selector)[desktop?'click':'tap']();
 await boot({fullArmy:true});await approachEnemy();
 await wait(()=>goonkMobileState.dialogKind==='henchman-offer');
 assert.match(await page().locator('[data-dialog-confirm]').innerText(),/Choose|Choisir/);
 assert.match(await page().locator('[data-dialog-cancel]').innerText(),/without|sans/);
 const offer=(await state()).dialogPresentation.queryId;
 await press('[data-dialog-confirm]');
 await wait(id=>goonkMobileState.dialogKind==='henchman-choice'&&goonkMobileState.dialogPresentation.queryId!==id,offer);
 assert.equal((await state()).dialogPresentation.choices.filter(choice=>choice.selectable).length,7);
 for(const viewport of desktop?[{width:1440,height:900},{width:1280,height:720}]:[{width:390,height:844},{width:844,height:390},{width:568,height:320},{width:1024,height:768}]){
  await page().setViewportSize(viewport);
  // Wait for the responsive layout before deciding whether a scroll gesture
  // is needed; the previous viewport can report overflow for one render.
  await page().waitForTimeout(350);
  const layout=await page().locator('.dialog-presentation').evaluate(panel=>({width:panel.clientWidth,scrollWidth:panel.scrollWidth,
   small:[...panel.querySelectorAll('button')].some(button=>button.getBoundingClientRect().height<44),
   cancels:panel.querySelectorAll('[data-dialog-cancel]').length}));
  assert(layout.scrollWidth<=layout.width+1&&!layout.small&&layout.cancels===1,JSON.stringify(layout));
  if(!desktop){
   const grid=page().locator('.dialog-choices');
   if(await grid.evaluate(node=>node.scrollHeight>node.clientHeight+20)){
    await grid.evaluate(node=>{node.scrollTop=0;});const box=await grid.boundingBox();assert(box&&box.height>80);
    const touch=await page().context().newCDPSession(page()),x=box.x+Math.min(box.width/2,100),start=box.y+box.height-20,end=box.y+20;
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:start}]});
    for(let step=1;step<=6;++step){await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:start+(end-start)*step/6}]});await page().waitForTimeout(40);}
    await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await wait(()=>document.querySelector('.dialog-choices').scrollTop>20);await touch.detach();
   }
  }
 }
 await page().screenshot({path:path.join(output,desktop?'prompt-desktop.png':'prompt-touch.png')});
 const slot=desktop?1:6;
 await press(`[data-dialog-choice="${slot}"]`);
 await wait(slot=>goonkMobileState.dialogPresentation?.choices?.[slot]?.selected,slot);
 await press('[data-dialog-confirm]');
 await wait(()=>goonkMobileState.mode==='battle');await command(15);
 await wait(()=>goonkMobileState.battleUnits?.some(unit=>unit.armySlot===-6&&!unit.enemy));
 const units=(await state()).battleUnits;
 assert.equal(units.find(unit=>unit.armySlot===-6&&!unit.enemy).key,desktop?'core:archangel':'core:swordsman');
 assert.equal(units.find(unit=>unit.armySlot===slot&&!unit.enemy).count,desktop?4:3);
 report.scenarios.push(desktop?'desktop-mouse-before-battle-question-and-seven-stack-choice-without-keyboard':'touch-before-battle-question-and-seven-stack-choice-without-keyboard');
 await page().close();if(desktop)return;

 // A refusal is persistent; cancelling only the creature chooser is not.
 for(const decline of [true,false]){
  await boot({twoGuards:true});await approachEnemy();await wait(()=>goonkMobileState.dialogKind==='henchman-offer');
  if(decline)await press('[data-dialog-cancel]');
  else{
   await press('[data-dialog-confirm]');await wait(()=>goonkMobileState.dialogKind==='henchman-choice');
   await press('[data-dialog-cancel]');
  }
  await wait(()=>goonkMobileState.mode==='battle');await command(15);await resolve();
  if(decline){const bytes=await save();await page().close();await boot({save:[...bytes]});}
  await approachEnemy(2);await wait(()=>goonkMobileState.mode==='battle'||goonkMobileState.dialogKind==='henchman-offer');
  assert.equal((await state()).dialogKind==='henchman-offer',!decline);
  report.scenarios.push(decline?'declining-companion-question-survives-save-reload-and-does-not-repeat':'cancelling-creature-choice-continues-battle-and-asks-at-next-encounter');
  await page().close();
 }
 for(const options of [{soloArmy:true},{enabled:false}]){
  await boot(options);await approachEnemy();await wait(()=>goonkMobileState.mode==='battle'||goonkMobileState.dialogKind==='henchman-offer');
  assert.equal((await state()).mode,'battle');
  report.scenarios.push(options.soloArmy?'last-army-creature-does-not-trigger-companion-question':'disabled-module-does-not-trigger-companion-question');
  await page().close();
 }
}
