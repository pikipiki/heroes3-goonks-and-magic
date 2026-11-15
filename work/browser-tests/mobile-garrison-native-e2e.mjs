/** Browser-only map fixture: ordinary owned garrison, no campaign VM. */
import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
import {readOriginalCampaign,readZip} from '../../scripts/era-bridge/campaigns/importer.mjs';
import {parseJsonc} from '../../scripts/era-bridge/artifacts/importer.mjs';
import {silenceTestAudio} from './silent-audio.mjs';
const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8879',out=process.env.REVIEW_OUTPUT||'/tmp/goonk-mobile-garrison';fs.mkdirSync(out,{recursive:true});
const members=readZip(fs.readFileSync('maps/003-Goonks-WoG.vmap')),header=JSON.parse(members['header.json']),objects=JSON.parse(members['objects.json']);
const templates=readOriginalCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc1.vcmp').maps.flatMap(m=>Object.values(parseJsonc(m.map['objects.json'].toString())));
const mineMode=process.argv.includes('--mine');
const guard=templates.find(o=>o.type==='garrisonHorizontal'&&o.template.animation==='AVCgar10');assert(guard);
const mine=readOriginalCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc4.vcmp').maps.flatMap(m=>Object.values(parseJsonc(m.map['objects.json'].toString()))).find(o=>o.type==='mine');assert(mine);
const heroTemplate=readOriginalCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc4.vcmp').maps.flatMap(m=>Object.values(parseJsonc(m.map['objects.json'].toString()))).find(o=>o.type==='hero').template;
header.name='Mobile garrison review';header.events=[];header.mapLevels.surface.width=header.mapLevels.surface.height=72;
for(const color of ['red','blue']){header.players[color].allowedFactions={anyOf:['core:castle']};header.players[color].randomFaction=false;header.players[color].canPlay=color==='red'?'PlayerOnly':'AIOnly';header.players[color].mainTown.generateHero=false;}
header.players.blue.mainTown={x:63,y:63,l:0,generateHero:false};header.players.red.mainHero='reviewHero';header.players.red.heroes={reviewHero:{type:'core:orrin'}};
const homes=objects.filter(o=>['redHome','blueHome'].includes(o.instanceName));Object.assign(homes.find(o=>o.instanceName==='blueHome'),{x:63,y:63});
const entries={'header.json':header,'objects.json':[...homes,{instanceName:'reviewHero',type:'hero',subtype:'knight',x:18,y:18,l:0,template:heroTemplate,options:{owner:'red',type:'core:orrin',gender:-1,army:[{type:'core:blackDragon',amount:10}]}},{...structuredClone(mineMode?mine:guard),instanceName:'reviewGarrison',x:21,y:18,l:0,options:{owner:'red',removableUnits:true,army:[{type:'core:pikeman',amount:15}]}}],'surface_terrain.json':Array.from({length:72},()=>Array(72).fill('gr0_')),'english.json':JSON.parse(members['english.json'])};
const map=execFileSync('python3',['-c',`import sys,json,zipfile,io
out=io.BytesIO()
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED) as z:
 for name,value in json.load(sys.stdin).items(): z.writestr(name,json.dumps(value))
sys.stdout.buffer.write(out.getvalue())`],{input:JSON.stringify(entries)});
const browser=await(process.env.GARRISON_BROWSER==='webkit'?webkit:chromium).launch({headless:true}),page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,bypassCSP:true});await silenceTestAudio(page);
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>fs.appendFileSync(out+'/console.log',m.text()+'\n'));
await page.addInitScript(bytes=>{sessionStorage.setItem('heroes-goonk.storage-failed','true');let current;Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{current=m;let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>main=f,get:()=>function(...args){m.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/000-Mobile-garrison.vmap',new Uint8Array(bytes));return main.apply(m,args);}});}});},[...map]);
const state=()=>page.evaluate(()=>goonkMobileState),cmd=(...a)=>page.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]),wait=(f,a,t=90000)=>page.waitForFunction(f,a,{timeout:t});
try{
 await page.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,60000);
 await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);const entry=(await state()).maps.find(m=>m.name==='Mobile garrison review');assert(entry);await page.locator('#mobile-map-select').selectOption(String(entry.index),{force:true});await wait(()=>goonkMobileState.selectedMap==='Mobile garrison review');await cmd(22);
 await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);assert(!(await state()).campaignPending,'Ordinary map without campaign VM');const hero=(await state()).heroes.find(h=>h.name==='Orrin');await cmd(4,hero.index);
 const mini=(await state()).mapOverview;await page.evaluate(m=>Module._vcmiMobilePointer(Math.round(m.rect.x+20*m.rect.w/m.width),Math.round(m.rect.y+18*m.rect.h/m.height),5),mini);await page.waitForTimeout(200);const view=(await state()).mapOverview.view;await page.evaluate(v=>Module._vcmiMobilePointer(Math.round(v.x+v.w/2),Math.round(v.y+v.h/2),1),view);await wait(()=>goonkMobileState.hasPath);await cmd(2);
 await wait(()=>goonkMobileState.mode==='hero-exchange'&&goonkMobileState.heroExchange?.garrison);const initial=await state();assert.equal(initial.heroExchange.heroes[0].army.slots[0].count,15);assert.equal(await page.locator('.exchange-troop-grid').count(),2);
 await page.locator('[data-exchange-slot="1:0"]').tap();await page.locator('[data-exchange-slot="0:1"]').tap();await page.locator('[data-exchange-quantity]').fill('2');
 for(const[width,height]of[[320,568],[568,320],[390,844],[844,390],[768,1024],[1024,768]]){await page.setViewportSize({width,height});await page.waitForTimeout(160);const box=await page.locator('[data-exchange-confirm]').boundingBox();assert(box&&box.width>=44&&box.height>=44&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1);assert.equal(await page.locator('[data-exchange-close]:visible').count(),1);await page.screenshot({path:out+`/garrison-${width}x${height}.png`});}
 await page.locator('[data-exchange-confirm]').tap();await wait(()=>goonkMobileState.heroExchange?.heroes[1].army.slots[0]?.count===8);assert.equal((await state()).heroExchange.heroes[0].army.slots[1].count,2);
 await page.locator('[data-exchange-slot="0:1"]').tap();await page.locator('[data-exchange-slot="1:0"]').tap();await page.locator('[data-exchange-confirm]').tap();await wait(()=>goonkMobileState.heroExchange?.heroes[1].army.slots[0]?.count===10);assert.equal((await state()).heroExchange.heroes[0].army.slots[1],null);
 await page.locator('[data-exchange-close]').tap();await wait(()=>goonkMobileState.mode==='map'&&!goonkMobileState.heroMoving);assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,engineSha256:crypto.createHash('sha256').update(fs.readFileSync('work/vcmi-wasm/emscripten/html5/vcmiclient.wasm')).digest('hex'),ordinaryGarrison:true,ownedMine:mineMode,splitAndMerge:true,sixLayouts:true,errors},null,2));console.log('PASS ordinary native garrison, split/merge, six mobile/iPad layouts and close');
}catch(error){fs.writeFileSync(out+'/native-log.txt',await page.evaluate(()=>{try{return Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'})}catch{return document.body.innerText}}).catch(()=>''));fs.writeFileSync(out+'/failure-state.json',JSON.stringify(await state().catch(()=>null),null,2));await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw error;}finally{await browser.close();}
