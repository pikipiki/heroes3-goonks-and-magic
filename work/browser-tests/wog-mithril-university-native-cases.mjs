import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
export function verifyUniversityGrantOrder(forms,events,{two=false,repeat=false}={}){
 const checks=[];
 const check=(offset,choice)=>{
  const price=forms[offset],lesson=forms[offset+(choice?2:1)];assert(price&&lesson);
  const created=id=>events.findIndex(line=>line.endsWith('Created a new query with id '+id));
  const answered=id=>events.findIndex(line=>line.includes('attempts answering query '+id+' with answer:'));
  const start=created(price.queryId),grant=events.findIndex((line,index)=>index>start&&/Sending a pack of type \d+SetSecSkill/.test(line));
  assert(start>=0&&grant>=0);
  if(choice){assert(answered(forms[offset+1].queryId)<grant);assert(grant<created(lesson.queryId));checks.push('chosen-skill-granted-before-lesson-acknowledgement');}
  else{assert(answered(lesson.queryId)>=0&&answered(lesson.queryId)<grant);checks.push('single-skill-granted-after-lesson-acknowledgement');}
 };
 check(0,two);if(repeat)check(two?3:2,false);return checks;
}
export async function verifyUniversityLesson({state,command,wait,walk,page,report,output,before}){
 const two=!!process.env.UNIVERSITY_TWO,poor=!!process.env.UNIVERSITY_POOR,decline=!!process.env.UNIVERSITY_DECLINE;
 const choice=Number(process.env.UNIVERSITY_CHOICE||0),forms=[];
 async function price(){
  await wait(()=>goonkMobileState.mode==='dialog'&&JSON.stringify(goonkMobileState.dialogPresentation||{}).includes('3000'));
  const form=(await state()).dialogPresentation;forms.push(form);assert(form.queryId>=0);assert.equal(form.cancel,!poor);
  assert(form.choices.some(row=>/3000/.test(row.label)&&/gold/i.test(row.label)));assert(form.choices.every(row=>!row.selectable));return form;
 }
 async function learn(hasChoice,index,priceForm,balance){
  await command(1);
  if(hasChoice){
   await wait(()=>goonkMobileState.dialogPresentation?.choices?.filter(row=>row.selectable).length===2);
   const form=(await state()).dialogPresentation;forms.push(form);assert.notEqual(form.queryId,priceForm.queryId);assert.equal(form.cancel,false);
   await command(98,index,form.queryId);await command(99,index,form.queryId);
  }
  await wait(()=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.some(line=>/master this skill/.test(line)));
  const form=(await state()).dialogPresentation;forms.push(form);assert.notEqual(form.queryId,priceForm.queryId);assert.equal(form.cancel,false);
  assert.equal(form.choices.length,1);assert.match(form.choices[0].label,/Advanced/);assert.equal((await state()).resources[6],balance,'Payment follows the lesson confirmation');
  await command(1);await wait(balance=>goonkMobileState.mode==='map'&&goonkMobileState.resources[6]===balance-3000,balance);
 }
 async function skills(){await page().locator('[data-ui=heroes]').tap();await wait(()=>goonkMobileState.heroWindow);return (await state()).heroWindow.skills;}
 const first=await price();
 if(poor||decline){
  if(poor)assert.equal(before,2999);await command(poor?1:0);await wait(()=>goonkMobileState.mode==='map');assert.equal((await state()).resources[6],before);
  const rows=(await skills()).filter(row=>/wisdom|air magic/i.test(row.name));assert.equal(rows.length,two?2:1);assert(rows.every(row=>/basic/i.test(row.mastery)));
  report.scenarios.push(poor?'advanced-university-insufficient-gold-preserves-skills-and-funds':'advanced-university-price-declined-without-skill-or-gold-change');
 }else{
  await learn(two,choice,first,before);const rows=await skills(),chosen=two&&choice===1?/air magic/i:/wisdom/i;
  assert(rows.some(row=>chosen.test(row.name)&&/advanced/i.test(row.mastery)),JSON.stringify(rows));
  if(two)assert(rows.some(row=>(chosen.test('Wisdom')?/air magic/i:/wisdom/i).test(row.name)&&/basic/i.test(row.mastery)),JSON.stringify(rows));
  report.scenarios.push(two?'advanced-university-two-skills-choice-'+choice:'advanced-university-post-visit-skill-and-3000-gold');
  report.scenarios.push('advanced-university-price-choice-and-lesson-use-native-query-stages');
  if(process.env.UNIVERSITY_REPEAT){
   assert(two);await command(63);await wait(()=>goonkMobileState.mode==='map');await walk(0,1);
   await command(6);await page().waitForTimeout(150);const point=await page().evaluate(()=>{const v=goonkMobileState.mapOverview.view;return{x:v.x+v.w/2,y:v.y+v.h/2-32};});
   await page().evaluate(p=>Module._vcmiMobilePointer(p.x,p.y,1),point);await wait(()=>goonkMobileState.hasPath);await command(2);await wait(()=>goonkMobileState.mode==='dialog');await command(1);
   const balance=(await state()).resources[6];await learn(false,0,await price(),balance);
   const again=(await skills()).filter(row=>/wisdom|air magic/i.test(row.name));assert.equal(again.length,2);assert(again.every(row=>/advanced/i.test(row.mastery)));
   assert.equal((await state()).resources[6],before-6000);report.scenarios.push('advanced-university-revisit-advances-second-basic-skill-for-second-payment');
  }
 }
 const events=await page().evaluate(()=>{const text=Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'});return text.split('\n').filter(line=>line.includes('[runServer]')&&/query|SetSecSkill/.test(line));});
 fs.writeFileSync(path.join(output,'university-server-events.json'),JSON.stringify(events,null,2));
 if(!poor&&!decline)report.universityGrantOrder=verifyUniversityGrantOrder(forms,events,{two,repeat:!!process.env.UNIVERSITY_REPEAT});
 fs.writeFileSync(path.join(output,'university-dialog-stages.json'),JSON.stringify(forms,null,2));
}
