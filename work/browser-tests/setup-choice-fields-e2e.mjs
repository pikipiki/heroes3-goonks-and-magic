import{chromium,webkit}from'playwright-core';import assert from'node:assert/strict';import fs from'node:fs';import path from'node:path';import{silenceTestAudio}from'./silent-audio.mjs';
for(const[name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
 const p=await browser.newPage({hasTouch:true,serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));await silenceTestAudio(p);
 await p.route('**/web/**',r=>{const file=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?r.fulfill({path:file}):r.abort();});
 await p.route('**/opfs-worker.js',r=>r.fulfill({contentType:'text/javascript',body:'export const opfsList=async()=>({}),opfsUnlink=async()=>{},opfsFlush=async()=>{};'}));
 await p.route('**/accordions?mobile=1',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/game-menu.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...args){calls.push(args)}};</script><script type=module src=/web/mobile.mjs></script><script type=module src=/web/game-menu.mjs></script>'}));
 await p.goto('http://127.0.0.1:8782/accordions?mobile=1');await p.waitForSelector('#game-menu-toggle');
 await p.evaluate(()=>{window.model={mode:'lobby',lobbyReady:true,lobbyHumanCount:1,selectedMap:'The King and Queen',selectedFaction:-1,difficulty:1,maps:[{index:0,name:'The King and Queen',width:144,height:144,players:2,castleChoice:true,humanSeats:1},{index:1,name:'Another map',width:72,height:72,players:4,humanSeats:1}],players:[{color:0,name:"Player one",incomePercent:80,faction:-1,factions:[]}],factions:[],wogOptionsEditable:true,wogOptions:Array(30).fill(-1)};window.send=()=>dispatchEvent(new CustomEvent('goonk-state',{detail:structuredClone(model)}));send();});

 for(const language of['fr','en'])for(const viewport of[{width:320,height:568},{width:360,height:659},{width:716,height:279},{width:568,height:320}]){
 await p.setViewportSize(viewport);await p.evaluate(async language=>{(await import('/web/i18n.mjs')).setLanguage(language);model.difficulty=1;model.players[0].incomePercent=80;send();},language);
 const summary=p.locator('.custom-game-options [data-ui-accordion-summary]');if(await summary.getAttribute('aria-expanded')!=='true'){await summary.click();await p.locator('.custom-game-options .MuiCollapse-entered').waitFor();}
 for(const [setting,value,command]of[['mobile-difficulty','2',25],['size','72',null],['income-0','85',1210]]){
 const group=p.locator(`[data-setting="${setting}"]`),input=group.locator(`[data-setup-choice][value="${value}"]`),label=input.locator('xpath=ancestor::label[1]');
 assert.equal(await group.locator('.MuiRadioGroup-root').count(),1,'Real MUI RadioGroup');assert.equal(await group.locator('button[data-tile-value]').count(),0);assert(await input.evaluate(n=>!!n.closest('.MuiRadio-root')),'Real MUI Radio');
 // Reset a local-only setting so every language/viewport tests an actual change.
 if(!command)await p.evaluate(()=>{const s=document.querySelector('[data-custom-size]');s.value='144';s.dispatchEvent(new Event('change',{bubbles:true}));});
 await label.scrollIntoViewIfNeeded();await p.waitForTimeout(50);await p.evaluate(()=>{window.beforeCalls=calls.length;});
 const measure=()=>input.evaluate(n=>{const box=n.closest('label').getBoundingClientRect(),setting=n.closest('.lobby-setting'),scroll=document.querySelector('.lobby-scroll');return{top:box.top,left:box.left,width:box.width,height:box.height,setting:setting.getBoundingClientRect().height,scroll:scroll.scrollTop,same:!window.originalChoice||originalChoice===n};});
 await input.evaluate(n=>window.originalChoice=n);const before=await measure();await label.tap();await p.waitForTimeout(50);
 assert(await input.isChecked(),'Optimistic selection remains checked');if(command){await p.evaluate(()=>send());await p.waitForTimeout(30);assert(await input.isChecked(),'Stale native state retains the pending choice');}const pending=await measure();
 assert.equal(await p.evaluate(()=>calls.length-beforeCalls),command?1:0,'Exactly one native command per selection');if(command)assert.equal((await p.evaluate(()=>calls.at(-1)))[0],command);
 await p.evaluate(({setting,value})=>{if(setting==='mobile-difficulty')model.difficulty=Number(value);if(setting==='income-0')model.players[0].incomePercent=Number(value);send();},{setting,value});await p.waitForTimeout(50);const after=await measure();
 for(const sample of[pending,after]){assert(sample.same,'Native acknowledgement retains the input');for(const key of['top','left','width','height','setting','scroll'])assert(Math.abs(sample[key]-before[key])<=1,`${name} ${language} ${viewport.width} ${setting}: ${key} moved ${JSON.stringify({before,sample})}`);}
 assert(await input.isChecked());assert(await input.isEnabled());
 }
 }
 await p.evaluate(()=>{model.difficulty=1;send();window.keyboardBefore=calls.length;});
 const keyboard=p.locator('[data-setting="mobile-difficulty"] [data-setup-choice][value="1"]');await keyboard.scrollIntoViewIfNeeded();await keyboard.focus();await keyboard.press('ArrowRight');
 assert.equal(await p.evaluate(()=>calls.length-keyboardBefore),1,'Radio keyboard navigation issues one command');assert.deepEqual((await p.evaluate(()=>calls.at(-1))).slice(0,2),[25,2]);
 await p.evaluate(()=>{model.difficulty=2;send();});assert(await p.locator('[data-setting="mobile-difficulty"] [data-setup-choice][value="2"]').isChecked());
 assert.deepEqual(errors,[]);console.log('PASS',name,'setup radio semantics, single commands and stable native acknowledgements FR/EN portrait/landscape');
 }finally{await browser.close();}
}
