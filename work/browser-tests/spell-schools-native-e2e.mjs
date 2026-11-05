import{chromium}from'playwright-core';import fs from'node:fs';import assert from'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox']}),context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),p=await context.newPage();p.setDefaultTimeout(120000);const errors=[];p.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message);});p.on('console',m=>{if(/Server encountered a problem|Assertion failed/.test(m.text()))errors.push(m.text());});
const wait=f=>p.waitForFunction(f,null,{timeout:120000}),command=(...args)=>p.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]);
try{
 await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8782')+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done');console.log('Native engine ready');
 await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/000-Goonk.vmap',new Uint8Array(bytes)),[...fs.readFileSync('maps/000-Goonk.vmap')]);await command(20,1);await wait(()=>goonkMobileState.maps?.some(m=>m.name.startsWith('000')));const index=await p.evaluate(()=>goonkMobileState.maps.find(m=>m.name.startsWith('000')).index);await command(24,index);await p.waitForTimeout(300);await command(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.heroName);await command(29,3);await command(6);await p.waitForTimeout(250);await p.evaluate(()=>Module._vcmiMobilePointer(433,281,4));await wait(()=>goonkMobileState.hasPath);await command(2);await wait(()=>goonkMobileState.mode==='battle');await command(15);await p.waitForTimeout(300);if(await p.evaluate(()=>goonkMobileState.canEndTactics))await command(35);await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.round>0&&goonkMobileState.canUseMagic&&goonkMobileState.heroCanCast);console.log('Native battle ready');

 await p.locator('[data-ui=battle-magic]').tap();await wait(()=>goonkMobileState.mode==='spellbook'&&goonkMobileState.spellbook?.spells?.length);
 for(const[index,school,spellId,label]of[[0,-1,null,'All'],[1,0,53,'Air'],[2,2,54,'Earth'],[3,1,43,'Fire'],[4,3,41,'Water']]){
 await p.locator('[data-school="'+index+'"]').tap();await p.waitForFunction(school=>goonkMobileState.spellbook?.school===school,school);
 assert.equal(await p.locator('.spell-schools [aria-pressed=true]').getAttribute('data-school'),String(index));
 if(spellId!==null)assert(await p.evaluate(id=>goonkMobileState.spellbook.spells.some(s=>s.id===id),spellId),label+' includes its expected level-one spell');
 console.log('PASS native school',label,school);
 }
 await p.setViewportSize({width:844,height:390});await p.locator('[data-school="2"]').tap();await wait(()=>goonkMobileState.spellbook.school===2);assert.equal(await p.locator('.spell-schools [aria-pressed=true]').getAttribute('data-school'),'2');await p.screenshot({path:'/private/tmp/goonk-schools-native-landscape.png'});assert.deepEqual(errors,[]);
 }finally{await browser.close();}
