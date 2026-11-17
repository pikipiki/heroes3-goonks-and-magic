import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function runMithrilAi({boot,walk,panel,buy,state,command,wait,page,report,output}){
 const bars=Number(process.env.AI_MITHRIL||0),enabled=!process.env.AI_MODULE_OFF,upgraded=enabled&&!process.env.AI_UNIVERSITY_PLAIN;
 await boot({enabled,reroll:'university',universityAi:true,aiFunds:bars,goldFunds:0});
 if(upgraded){const offer=(await panel()).offers.find(row=>row.kind===3&&row.x===9&&row.y===11)|| (await panel()).offers.find(row=>row.kind===3&&row.id===7);assert(offer);await buy(offer);await page().locator('[data-mithril-close]').tap();}
 const red=(await state()).heroId;
 // Use the existing player console to control blue's interface. The server
 // player remains AI, so university and income take their actual AI branches.
 await command(55);await wait(()=>goonkMobileState.mode==='hero');await command(63);await wait(()=>goonkMobileState.mode==='map');
 const rect=(await state()).rect,css=await page().evaluate(()=>{Module._vcmiMobileEnable(2);const c=Module.canvas,s=c.style.cssText;c.style.setProperty('visibility','visible','important');c.style.position='absolute';c.style.left='-9999px';c.tabIndex=0;c.focus();return s;});
 await page().waitForTimeout(200);await page().evaluate(rect=>Module._vcmiMobilePointer(rect.x+100,rect.y+rect.h-35,1),rect);await page().waitForTimeout(200);await page().evaluate(()=>Module.canvas.focus());
 await page().keyboard.type('/controlai blue',{delay:20});await page().waitForTimeout(200);await command(1);await page().waitForTimeout(700);
 await page().evaluate(css=>{Module.canvas.style.cssText=css;Module._vcmiMobileEnable(1);},css);await page().waitForTimeout(300);
 const end=async old=>{await command(3);await wait(old=>goonkMobileState.mode==='map'&&goonkMobileState.turn&&goonkMobileState.heroId!==old,old);return state();};
 let blue=await end(red);const hero=blue.heroId,before=blue.resources[6];assert(before<3000);assert.equal(blue.resources[7],bars);
 fs.writeFileSync(path.join(output,'blue-before.json'),JSON.stringify(blue,null,2));
 await walk(1);await walk(0,-2);assert.equal((await state()).resources[6],before,'AI lessons do not charge gold');
 await command(55);await wait(()=>goonkMobileState.heroWindow);const skills=(await state()).heroWindow.skills;
 for(const [name,mastery] of [[/wisdom/i,upgraded?/advanced/i:/basic/i],[/air magic/i,upgraded?/advanced/i:/basic/i],[/earth magic/i,/basic/i],[/fire magic/i,/expert/i]])assert(skills.some(row=>name.test(row.name)&&mastery.test(row.mastery)),JSON.stringify(skills));
 await command(63);await wait(()=>goonkMobileState.mode==='map');const day1=(await state()).resources[6];
 const redNext=await end(hero);blue=await end(redNext.heroId);
 const expected=1500+(enabled?bars*100:0),income=blue.resources[6]-day1;assert.equal(income,expected,'Daily AI income includes 100 gold per unspent mithril only when enabled');assert.equal(blue.resources[7],bars);
 report.ai={enabled,upgraded,bars,before,day1,day2:blue.resources[6],income,expected,skills};
 report.scenarios.push(upgraded?'ai-university-advances-first-two-basic-skills-for-free':'ai-university-preserves-skills-without-active-upgrade');
 report.scenarios.push(enabled?'ai-mithril-compensation-100-gold-per-retained-bar':'disabled-mithril-preserves-normal-ai-income');
 await page().close();
}
