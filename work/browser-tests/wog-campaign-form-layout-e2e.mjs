import {chromium,webkit} from 'playwright-core';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-campaign-form-layout';fs.mkdirSync(out,{recursive:true});
for(const [name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});await silenceTestAudio(page);
 await page.route('**/web/**',route=>route.fulfill({path:path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1])}));
 await page.route('**/campaign-form-review',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html class="goonk-mobile"><meta name=viewport content="width=device-width,initial-scale=1"><meta charset=utf-8>${['mobile','h3-theme','mobile-review','mobile-refinement','mobile-followup','mobile-compact'].map(n=>'<link rel=stylesheet href=/web/'+n+'.css>').join('')}<style>#mobile-viewport{position:fixed;inset:0;container:goonk-viewport / size}#mobile-app{position:absolute;inset:0;--control-rail:180px}</style><div id=mobile-viewport><div id=mobile-app></div></div><script type=module>import{createDialogPresentation}from'/web/dialog-presentation.mjs';import{guardOnlineNameKeyboard}from'/web/online-login.mjs';window.calls=[];window.drafts=[];window.nativeKeys=0;guardOnlineNameKeyboard(window);window.addEventListener('keydown',()=>nativeKeys++,{capture:true});window.dialog=createDialogPresentation({root:document.querySelector('#mobile-app'),command:(...a)=>calls.push(['command',...a]),pointer:()=>{},scriptReply:answer=>{calls.push(answer);return true;},scriptDraft:answer=>{drafts.push(answer);return true;}});</script>`}));
 await page.goto('http://localhost/campaign-form-review');await page.waitForFunction(()=>window.dialog);
 for(const [width,height]of [[320,568],[390,844],[568,320],[844,390],[768,1024],[1024,768],[1180,820]]){
  await page.setViewportSize({width,height});
  const state={mode:'dialog',dialogKind:'source-campaign',campaignPending:true,dialogPresentation:{queryId:71,title:'Campaign question',lines:['Find the words that open the gate.'],choices:[],scriptDialog:{queryId:71,kind:'extended',inputLabel:'Your answer',canCancel:true,choices:[],selection:0}}};
  await page.evaluate(s=>dialog.update(s),state);const input=page.locator('[data-campaign-input]');await input.fill('Wake of Gods');await input.press('End');await input.press('!');
  assert.equal(await page.evaluate(()=>nativeKeys),0,'SDL does not receive the text keyboard');
  const stable=await page.evaluate(s=>{const node=document.querySelector('[data-campaign-input]');node.focus();for(let i=0;i<40;i++)dialog.update({...s,day:i});return node===document.querySelector('[data-campaign-input]')&&document.activeElement===node&&node.value==='Wake of Gods!';},state);assert(stable,'Typed answer and focus survive updates');assert.deepEqual(await page.evaluate(()=>drafts.at(-1)),{queryId:71,selection:0,text:'Wake of Gods!'});
  const confirm=page.locator('[data-dialog-confirm]'),box=await confirm.boundingBox();assert(box&&box.width>=44&&box.height>=44&&box.y>=0&&box.y+box.height<=height+1);
  await confirm.tap();await confirm.tap({force:true});assert.deepEqual(await page.evaluate(()=>calls.splice(0)),[{queryId:71,selection:0,text:'Wake of Gods!'}]);
  await page.evaluate(s=>dialog.update({...s,dialogPresentation:{...s.dialogPresentation,queryId:72,scriptDialog:{queryId:72,kind:'checklist',text:'Choose your rewards',multiple:true,initial:5,canCancel:false,choices:Array.from({length:12},(_,i)=>({value:1<<i,label:'Reward '+(i+1),hint:'This choice changes the quest reward.'}))}}}),state);
  assert.equal(await page.locator('[data-dialog-cancel]').count(),0);const last=page.locator('[data-campaign-choice="2048"]');await last.scrollIntoViewIfNeeded();await last.check();
  await confirm.tap();assert.deepEqual(await page.evaluate(()=>calls.splice(0)),[{queryId:72,selection:2053,text:''}]);
  await page.evaluate(s=>dialog.update({...s,dialogPresentation:{...s.dialogPresentation,queryId:73,scriptDialog:{queryId:73,kind:'pictures',canCancel:false,selection:1,pictures:[{rect:{x:1,y:1,w:82,h:82}},{rect:{x:100,y:1,w:82,h:82}}],choices:[{value:1,label:'Left artifact'},{value:0,label:'Right artifact'}]}}}),state);
  await page.locator('.campaign-dialog-form fieldset canvas').nth(1).tap();assert(await page.locator('[data-campaign-choice="0"]').isChecked(),'Tapping the illustration selects it');
  await confirm.tap();assert.deepEqual(await page.evaluate(()=>calls.splice(0)),[{queryId:73,selection:0,text:''}]);
  await page.screenshot({path:path.join(out,`${name}-${width}x${height}.png`)});
  await page.evaluate(()=>dialog.update({mode:'map',campaignPending:false}));await page.waitForTimeout(180);
  await page.evaluate(s=>dialog.update({...s,dialogPresentation:{...s.dialogPresentation,scriptDialog:{...s.dialogPresentation.scriptDialog,draft:{selection:0,text:'Saved answer'}}}}),state);assert.equal(await input.inputValue(),'Saved answer');
  await page.evaluate(()=>dialog.update({mode:'map',campaignPending:false}));await page.waitForTimeout(180);await page.evaluate(s=>dialog.update(s),state);assert.equal(await input.inputValue(),'','A reused query ID in a new game starts empty');
  await page.evaluate(()=>dialog.update({mode:'map',campaignPending:false}));await page.waitForTimeout(180);
 }
 console.log('PASS',name,'seven sizes, text keyboard isolation, stable draft/focus, twelve choices and single reply');
 }finally{await browser.close();}
}
