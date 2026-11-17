import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function runTownResurrection({boot,sheet,state,command,wait,approachEnemy,page,report,output,desktop,save}){
 const press=selector=>page().locator(selector)[desktop?'click':'tap']();
 if(process.env.CASES==='town-resurrection-foreign'){
  await boot({foreignTown:true,dead:true});const gold=(await state()).resources[6];
  await page().mouse.move(400,300);await command(6);await page().waitForTimeout(150);
  await page().evaluate(()=>{const view=goonkMobileState.mapOverview.view;Module._vcmiMobilePointer(view.x+view.w/2,view.y+view.h/2-96,1);});
  await wait(()=>goonkMobileState.hasPath);await command(2);
  await wait(()=>goonkMobileState.mode==='battle'||goonkMobileState.dialogKind==='henchman-resurrection');
  assert.equal((await state()).mode,'battle');await command(15);await wait(()=>goonkMobileState.battleUnits?.length);
  assert(!(await state()).battleUnits.some(unit=>!unit.enemy&&unit.armySlot===-6));
  assert.equal((await state()).resources[6],gold);
  report.scenarios.push('enemy-town-starts-siege-without-resurrecting-or-charging-for-the-dead-companion');
  await page().close();return;
 }
 if(process.env.CASES==='town-resurrection-ai'){
  await boot({aiTown:true,enemyHero:true,poor:true});const day=(await state()).day;
  await command(3);await wait(day=>goonkMobileState.turn&&goonkMobileState.day>day,day);
  await page().mouse.move(400,300);await command(6);await page().waitForTimeout(150);
  await page().evaluate(()=>{const view=goonkMobileState.mapOverview.view;Module._vcmiMobilePointer(view.x+view.w/2-32,view.y+view.h/2-96,1);});
  await wait(()=>goonkMobileState.hasPath);await command(2);
  await wait(()=>goonkMobileState.mode==='battle'||goonkMobileState.dialogKind==='henchman-offer');
  if((await state()).dialogKind==='henchman-offer')await press('[data-dialog-cancel]');
  await wait(()=>goonkMobileState.mode==='battle');await command(15);
  await wait(()=>goonkMobileState.battleUnits?.length);
  // AI chooses its combat companion anew before every battle. Inspect the
  // earlier authoritative visit packets separately from that later choice.
  assert((await state()).battleUnits.some(unit=>unit.enemy&&unit.armySlot===-6&&unit.key==='core:archer'));
  const native=await page().evaluate(()=>Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'}));
  const start=native.indexOf('Hero hero.core.orrin.name visits Fort des gardes');assert(start>=0);
  const end=native.indexOf('Sending to all clients: 15HeroVisitCastle',start);assert(end>start);
  const visit=native.slice(start,end);assert(visit.includes('Sending to all clients: 14HenchmanChange'));
  assert(!visit.includes('SetResources'));fs.writeFileSync(path.join(output,'ai-town-visit-packets.log'),visit);
  report.scenarios.push('AI-owned-town-visit-applies-companion-revival-packet-without-resource-payment-before-ordinary-combat-selection');
  await page().close();return;
 }
 for(const [name,accept,poor] of desktop?[['paid',true,false]]:[['paid',true,false],['declined',false,false],['poor',true,true]]){
  await boot({dead:true,henchmanBanner:8,stackExperience:2500,poor});
  await page().mouse.move(400,300);await command(6);await page().waitForTimeout(150);
  await page().evaluate(()=>{const view=goonkMobileState.mapOverview.view;Module._vcmiMobilePointer(view.x+view.w/2,view.y+view.h/2-64,1);});
  await wait(()=>goonkMobileState.hasPath);await command(2);
  await wait(()=>goonkMobileState.dialogKind==='henchman-resurrection');
  const before=await state();
  for(const viewport of desktop?[{width:1440,height:900},{width:1280,height:720}]:[{width:390,height:844},{width:844,height:390},{width:568,height:320},{width:1024,height:768}]){
   await page().setViewportSize(viewport);
   const layout=await page().locator('.dialog-presentation').evaluate(panel=>({width:panel.clientWidth,scroll:panel.scrollWidth,
    cancels:panel.querySelectorAll('[data-dialog-cancel]').length,small:[...panel.querySelectorAll('button')].some(button=>button.getBoundingClientRect().height<44)}));
   assert(layout.scroll<=layout.width+1&&layout.cancels===1&&!layout.small,JSON.stringify(layout));
  }
  await page().waitForTimeout(300);
  await page().screenshot({path:path.join(output,`town-${desktop?'desktop':'touch'}-${name}.png`)});
  if(name==='paid'){
   fs.writeFileSync(path.join(output,'offer-state.json'),JSON.stringify(await state(),null,2));
   const native=await page().evaluate(()=>Module.canvas.toDataURL());
   fs.writeFileSync(path.join(output,'offer-native.png'),Buffer.from(native.split(',')[1],'base64'));
  }
  await press(accept?'[data-dialog-confirm]':'[data-dialog-cancel]');
  if(poor){
   await wait(()=>goonkMobileState.dialogKind!=='henchman-resurrection'&&goonkMobileState.mode==='dialog');
   assert.match(await page().locator('.dialog-copy').innerText(),/enough gold|assez d'or/);
   await press('[data-dialog-confirm]');
  }
  await wait(()=>goonkMobileState.mode==='town'&&goonkMobileState.turn);
  await command(0);await wait(()=>goonkMobileState.mode==='map');
  let hero=await sheet();
  assert.equal(hero.henchman.alive,accept&&!poor);assert.equal(hero.henchman.experience,100);
  assert.equal(hero.henchman.stackExperience,2500);assert.equal(hero.henchman.bannerStyle,8);
  assert.equal((await state()).resources[6],before.resources[6]-(accept&&!poor?hero.henchman.resurrectionCost:0));
  report.scenarios.push(`${desktop?'desktop-mouse':'touch'}-town-resurrection-${name}-preserves-companion-state`);
  if(name==='paid'){
   await command(63);await wait(()=>goonkMobileState.mode==='map');
   const bytes=await save();await page().close();await boot({save:[...bytes]});hero=await sheet();
   assert(hero.henchman.alive);assert.equal(hero.henchman.experience,100);assert.equal(hero.henchman.stackExperience,2500);
   report.scenarios.push('paid-town-resurrection-survives-native-save-reload');
  }
  await page().close();
 }
 if(desktop)return;
 for(const options of [{enabled:false,dead:true},{henchmanType:'core:peasant'}]){
  await boot({inTown:true,...options});assert.equal((await state()).mode,'map');
  const hero=await sheet();if(options.dead)assert(!hero.henchman?.alive);else assert(hero.henchman.alive);
  report.scenarios.push(options.dead?'disabled-module-does-not-offer-town-resurrection':'living-companion-does-not-offer-town-resurrection');
  await page().close();
 }
}
