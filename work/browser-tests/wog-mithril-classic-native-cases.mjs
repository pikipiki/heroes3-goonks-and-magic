import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function runMithrilClassic({boot,state,command,wait,page,report,output}){
 const poor=!!process.env.CLASSIC_POOR,disabled=!!process.env.CLASSIC_MODULE_OFF;
 const onMine=!!process.env.CLASSIC_HERO_ON_MINE;
 await boot({enabled:!disabled,funds:poor?3:100,heroOnMine:onMine});
 await page().evaluate(()=>Module._vcmiMobileEnable(2));
 await page().mouse.move(400,300);await page().waitForTimeout(200);
 await command(6);await page().waitForTimeout(300);
 const before=await state();
 fs.writeFileSync(path.join(output,'classic-before.json'),JSON.stringify(before,null,2));
 const click=async(dx,dy)=>{
  // Keep the pointer inside the map before centering: border scrolling would
  // otherwise move the camera while the keyboard modifier is held.
  const point=await page().evaluate(({dx,dy})=>{const v=goonkMobileState.mapOverview.view;return{x:v.x+v.w/2+32*dx,y:v.y+v.h/2+32*dy};},{dx,dy});
  const target=await page().evaluate(point=>{const box=Module.canvas.getBoundingClientRect();return{x:box.x+point.x*box.width/Module.canvas.width,y:box.y+point.y*box.height/Module.canvas.height};},point);
  if(process.env.CLASSIC_CTRL){await page().evaluate(()=>{Module.canvas.tabIndex=0;Module.canvas.focus();});await page().keyboard.down('Control');await page().waitForTimeout(200);}
  await page().mouse.click(target.x,target.y,{button:process.env.CLASSIC_CTRL?'left':'right'});
  if(process.env.CLASSIC_CTRL){await page().waitForTimeout(200);await page().keyboard.up('Control');}
  await page().waitForTimeout(200);
  await page().screenshot({path:path.join(output,'classic-click.png')});
 };
 if(process.env.CLASSIC_TOWN){
  await command(1201,1);await wait(()=>goonkMobileState.mithril?.offers?.some(row=>row.kind===8));
  const town=(await state()).mithril.offers.find(row=>row.kind===8);
  fs.writeFileSync(path.join(output,'classic-town-offers.json'),JSON.stringify((await state()).mithril,null,2));await command(1201,0);
  await click(town.x-8,town.y-11);await wait(()=>goonkMobileState.mode==='dialog'&&goonkMobileState.rect.h>400);
  await page().screenshot({path:path.join(output,'classic-terrain-list.png')});
  await page().evaluate(()=>{Module.canvas.tabIndex=0;Module.canvas.focus();});
  await page().keyboard.press('End');await page().keyboard.press('Enter');
  await wait(()=>goonkMobileState.dialogPresentation?.lines?.some(row=>/3 Mithril/.test(row)));
  assert.equal((await state()).dialogPresentation.cancel,true);await command(1);
  await wait(balance=>goonkMobileState.resources[7]===balance-3,before.resources[7]);
  report.scenarios.push('classic-mithril-nine-terrain-selection-and-last-choice-payment');await page().close();return;
 }
 await click(onMine?0:4,0);
 if(disabled){await page().waitForTimeout(300);assert(!(await state()).dialogPresentation?.lines?.some(row=>/Mithril/.test(row)));await page().evaluate(()=>Module._vcmiMobilePointer(0,0,3));report.scenarios.push('classic-mithril-disabled-preserves-object-popup');}
 else{
  await wait(()=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.some(row=>/Mithril/.test(row)),null,15000);
  await page().screenshot({path:path.join(output,'classic-confirmation.png')});
  const form=(await state()).dialogPresentation;assert.equal(form.cancel,!poor);
  if(poor){await command(1);await wait(()=>goonkMobileState.mode==='map');assert.equal((await state()).resources[7],3);report.scenarios.push('classic-mithril-insufficient-balance-does-not-send-purchase');}
  else{
   await command(0);await wait(()=>goonkMobileState.mode==='map');assert.equal((await state()).resources[7],before.resources[7]);
   await click(onMine?0:4,0);await wait(()=>goonkMobileState.mode==='dialog');await command(1);await wait(balance=>goonkMobileState.resources[7]===balance-7,before.resources[7]);
   report.scenarios.push(process.env.CLASSIC_CTRL?(onMine?'classic-mithril-control-click-through-hero-confirmation-cancel-and-purchase':'classic-mithril-control-click-confirmation-cancel-and-purchase'):'classic-mithril-entrance-right-click-confirmation-cancel-and-purchase');
   await click(onMine?0:4,0);await page().waitForTimeout(300);assert(!(await state()).dialogPresentation?.lines?.some(row=>/Mithril/.test(row)));await page().evaluate(()=>Module._vcmiMobilePointer(0,0,3));
   report.scenarios.push('classic-mithril-active-mine-does-not-offer-duplicate-purchase');
  }
 }
 await page().close();
}
