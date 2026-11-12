import{chromium}from'playwright-core';import fs from'node:fs';import assert from'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox']}),context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),p=await context.newPage();p.setDefaultTimeout(120000);const errors=[];p.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message);});p.on('console',m=>{if(/Server encountered a problem|Assertion failed/.test(m.text()))errors.push(m.text());});
const wait=f=>p.waitForFunction(f,null,{timeout:120000}),command=(...args)=>p.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]);
try{
 await (await import('./silent-audio.mjs')).silenceTestAudio(p);await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8782')+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done');console.log('Native engine ready');
 await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/000-Goonk.vmap',new Uint8Array(bytes)),[...fs.readFileSync('maps/000-Goonk.vmap')]);await command(20,1);await wait(()=>goonkMobileState.maps?.some(m=>m.name.startsWith('000')));const index=await p.evaluate(()=>goonkMobileState.maps.find(m=>m.name.startsWith('000')).index);await command(24,index);await p.waitForTimeout(300);await command(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.heroName);await command(29,3);await command(6);await p.waitForTimeout(250);await p.evaluate(()=>Module._vcmiMobilePointer(433,281,4));await wait(()=>goonkMobileState.hasPath);await command(2);await wait(()=>goonkMobileState.mode==='battle');await command(15);await p.waitForTimeout(300);if(await p.evaluate(()=>goonkMobileState.canEndTactics))await command(35);await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.round>0&&goonkMobileState.canUseMagic&&goonkMobileState.heroCanCast);console.log('Native battle ready');

 await p.evaluate(()=>{window.autoCalls=[];const original=Module._vcmiMobileCommand;Module._vcmiMobileCommand=(...args)=>{if(args[0]===44)autoCalls.push(args);return original(...args);};});
 for(let i=0;i<3;i++){
 await p.locator('[data-ui=battle-auto]').tap();
 await wait(()=>goonkMobileState.autoCombat===true||goonkMobileState.mode!=='battle');if(await p.evaluate(()=>goonkMobileState.mode!=='battle'))break;
 await p.locator('[data-ui=battle-auto]').tap();await wait(()=>goonkMobileState.autoCombat===false&&goonkMobileState.canAutoCombat&&goonkMobileState.canAct);console.log('PASS native autocombat starts and stops with one press each, cycle',i+1);
 }
 assert.deepEqual(errors,[]);
 }catch(error){console.log('FAILED STATE',await p.evaluate(()=>window.goonkMobileState));throw error;}finally{await browser.close();}
