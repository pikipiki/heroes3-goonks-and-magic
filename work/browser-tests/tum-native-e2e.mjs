import {chromium} from 'playwright-core';
import fs from 'node:fs';import assert from 'node:assert/strict';
const browser=await chromium.connectOverCDP(process.env.CDP_URL||'http://127.0.0.1:9224'),context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),report={checks:[],errors:[],logs:[]};
page.on('console',m=>report.logs.push(m.text()));page.on('pageerror',e=>report.errors.push(e.message));
const wait=f=>page.waitForFunction(f,null,{timeout:180000}),click=n=>page.getByRole('button',{name:n,exact:true}).click();
try{
 await (await import('./silent-audio.mjs')).silenceTestAudio(page);await page.goto((process.env.GAME_ORIGIN||'http://127.0.0.1:8770')+'/?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu');console.log('Menu ready');
 await click('Nouvelle aventure');await wait(()=>goonkMobileState.maps?.length);
 const maps=await page.evaluate(()=>goonkMobileState.maps);const map=maps.find(m=>/1.*on.*1/i.test(m.name))||maps.find(m=>m.name==='Goonks');await page.locator('#mobile-map-select').selectOption(String(map.index));await page.waitForFunction(n=>goonkMobileState.selectedMap===n,map.name);
 const factions=await page.evaluate(()=>goonkMobileState.factions),necro=factions.find(f=>/necro/i.test(f.name));assert(necro);await page.locator('#mobile-faction-select').selectOption(String(necro.id));await page.waitForFunction(id=>goonkMobileState.selectedFaction===id,necro.id);await click('Commencer');await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.towns?.length);console.log('Game started');
 await click('♜ Villes');await page.locator('.sheet-body button').first().click();await wait(()=>goonkMobileState.mode==='town');report.town=await page.evaluate(()=>({townName:goonkMobileState.townName,townFaction:goonkMobileState.townFaction}));assert.equal(report.town.townFaction,'core:necropolis');
 await click('Construire');await click('Plan complet et évolutions TUM');await wait(()=>goonkMobileState.mode!=='town');await page.screenshot({path:'../../outputs/tum-build-plan.png'});report.checks.push('Necropolis native building plan opens from the mobile construction panel');
 console.log('Plan mode',await page.evaluate(()=>goonkMobileState.mode));
 // Return to town, then use the native all-buildings cheat to inspect full recruitment.
 await click('↩ Retour');await wait(()=>goonkMobileState.mode==='town');
 await page.locator('#game-menu-toggle').click();await page.locator('[data-menu=cheats]').click();
 const build=page.locator('[data-cheat="4"]');if(await build.count()){await build.first().click();await page.locator('[data-menu=close]').click();}else{await page.locator('[data-menu=close]').click();throw Error('All-buildings cheat button not found');}
 await page.waitForFunction(()=>goonkMobileState.recruits?.some(c=>c.name==='Red Bones Dragons'||c.name==='Red Bones Dragon'),null,{timeout:20000});report.recruits=await page.evaluate(()=>goonkMobileState.recruits.map(({name,level,variant,id})=>({name,level,variant,id})));report.checks.push('Fourth Necropolis dwelling enables Red Bones Dragon recruitment');
 await page.screenshot({path:'../../outputs/tum-necropolis.png'});
 await click('Recruter');await wait(()=>goonkMobileState.mode==='recruit');await page.locator('.recruit-choices [data-recruit-level="6"]').click();await page.waitForFunction(()=>goonkMobileState.recruitUnit?.name==='Red Bones Dragon');report.recruitUI=await page.evaluate(()=>goonkMobileState.recruitUnit);await page.locator('#recruit-number').fill('1');await page.waitForFunction(()=>goonkMobileState.recruitAmount===1);await click('Recruter');await page.waitForFunction(()=>goonkMobileState.mode==='town'&&goonkMobileState.armies?.some(a=>a.slots.some(u=>u?.name==='Red Bones Dragon')));report.checks.push('One Red Bones Dragon actually recruited into the town garrison');await page.screenshot({path:'../../outputs/tum-recruit.png'});
 assert.deepEqual(report.errors,[]);
}catch(e){report.failure=e.stack;console.log(e.stack);console.log((await page.locator('body').innerText()).slice(-3000));await page.screenshot({path:'../../outputs/tum-scenario-failure.png'});}
report.modValidation=report.logs.map(s=>s.replace(/\x1b\[[0-9;]*m/g,'')).filter(s=>/(Parsing|Loading) mod:/.test(s)&&/(third-upgrades|tum-era)/.test(s));delete report.logs;fs.writeFileSync('../../outputs/tum-native-e2e.json',JSON.stringify(report,null,2));await context.close();await browser.close();process.exitCode=report.failure?1:0;
