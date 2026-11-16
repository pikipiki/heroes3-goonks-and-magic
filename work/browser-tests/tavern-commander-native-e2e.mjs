import {chromium} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {silenceTestAudio} from './silent-audio.mjs';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-tavern-commander';fs.mkdirSync(out,{recursive:true});
const fixture=execFileSync('python3',['-c',`import zipfile,json,io,sys
with zipfile.ZipFile('maps/000-Goonk.vmap') as src:
 entries={name:src.read(name) for name in src.namelist()}
objects=[o for o in json.loads(entries['objects.json']) if o.get('instanceName') in ['goonkTown','goonkHero','enemyTown']]
for o in objects:
 if o['instanceName']=='goonkHero':o['x']=7;o['y']=11
entries['objects.json']=json.dumps(objects).encode()
h=json.loads(entries['header.json']);h['name']='000 - Commander recruitment validation';entries['header.json']=json.dumps(h).encode()
for name in ['english.json','french.json']:
 t=json.loads(entries[name]);t['mapName']='000 - Commander recruitment validation';entries[name]=json.dumps(t).encode()
out=io.BytesIO()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for name,data in entries.items():z.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`]);
const browser=await chromium.launch({headless:true}),p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,bypassCSP:true}),errors=[];
await silenceTestAudio(p);p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>fs.appendFileSync(path.join(out,'console.log'),m.text().slice(0,2000)+'\n'));
const state=()=>p.evaluate(()=>goonkMobileState),wait=(f,a)=>p.waitForFunction(f,a,{timeout:180000}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]);
try{
 await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));
 await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8963')+'/game.html?mobile=1');await Promise.race([wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done'),p.waitForEvent('console',{predicate:m=>m.text().includes('Temporary game startup failed'),timeout:180000}).then(()=>{throw Error('Native startup failed; inspect native logs');})]);
 await p.evaluate(bytes=>{for(const name of ['001-Goonks.vmap','003-Goonks-WoG.vmap']){const file='/home/web_user/.local/share/vcmi/Maps/'+name;try{Module.FS.stat(file);Module.FS.writeFile(file,new Uint8Array(bytes));}catch{}}},[...fixture]);
 console.log('Native engine ready');await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady&&goonkMobileState.maps?.some(m=>m.name==='000 - Commander recruitment validation'));
 const map=(await state()).maps.find(m=>m.name==='000 - Commander recruitment validation');await p.locator('#mobile-map-select').selectOption(String(map.index),{force:true});await wait(()=>goonkMobileState.selectedMap==='000 - Commander recruitment validation');await p.locator('[data-ui=begin]').tap();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 console.log('Native map started');await cmd(5,0);await wait(()=>goonkMobileState.mode==='town');await p.locator('[data-ui=recruit-heroes]').tap();await wait(()=>goonkMobileState.dialogKind==='tavern'&&Object.keys(goonkMobileState.tavernHeroes||{}).length>0);
 console.log('Native tavern opened');const before=await state(),candidate=before.tavernHeroes[0],gold=before.resources[6],count=before.heroes.length;
 await p.locator('[data-tavern-equipment="0"]').tap();await wait(()=>goonkMobileState.mode==='hero'&&goonkMobileState.heroWindow?.owned===false);
 console.log('Hero equipment preview opened');assert(Number.isInteger((await state()).heroWindow.commanderIcon),'A hero for hire exposes its native commander icon');
 const button=p.locator('[data-hero-commander]');await button.scrollIntoViewIfNeeded();assert(await button.isEnabled());await button.tap();await wait(()=>goonkMobileState.dialogKind==='commander');
 console.log('Native commander preview opened');const preview=await state();assert.equal(preview.dialogPresentation.commanderTree.skills.length,6);assert(preview.dialogPresentation.commanderTree.skills.every(s=>!s.selectable),'Preview is inspection, not a level-up');
 assert.equal(preview.resources[6],gold,'Inspecting the commander costs no gold');assert.equal(preview.heroes.length,count,'Inspecting does not recruit the hero');
 const commander=preview.creatureUnit.name;
 for(const size of [{width:390,height:844},{width:844,height:390},{width:1024,height:768}]){await p.setViewportSize(size);await p.waitForTimeout(150);const close=p.locator('[data-dialog-confirm]');await close.scrollIntoViewIfNeeded();const box=await close.boundingBox();assert(box&&box.x>=0&&box.y>=0&&box.x+box.width<=size.width+1&&box.y+box.height<=size.height+1);await p.screenshot({path:path.join(out,'commander-'+size.width+'x'+size.height+'.png')});}
 await p.locator('[data-dialog-confirm]').tap();await wait(()=>goonkMobileState.mode==='hero');await p.locator('[data-hero-close]').tap();await wait(()=>goonkMobileState.dialogKind==='tavern');
 assert.equal((await state()).tavernHeroes[0].id,candidate.id);assert((await state()).tavern.canRecruit);
 await p.setViewportSize({width:390,height:844});await p.locator('[data-tavern-recruit="0"]').tap();await wait(expected=>goonkMobileState.heroes?.length===expected,count+1);assert.equal((await state()).resources[6],gold-before.tavern.cost,'Recruitment charges the native cost exactly once');
 if((await state()).dialogKind==='tavern')await cmd(40);if((await state()).mode==='town')await cmd(0);await wait(()=>goonkMobileState.mode==='map');
 const index=(await state()).heroes.findIndex(h=>h.name===candidate.name);assert(index>=0);await cmd(4,index);await cmd(55);await wait(name=>goonkMobileState.mode==='hero'&&goonkMobileState.heroWindow?.name===name,candidate.name);
 assert.equal((await state()).heroWindow.owned,true);await p.locator('[data-hero-commander]').scrollIntoViewIfNeeded();await p.locator('[data-hero-commander]').tap();await wait(()=>goonkMobileState.dialogKind==='commander');assert.equal((await state()).creatureUnit.name,commander,'The recruited hero keeps the commander inspected before hiring');
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,candidate:candidate.name,commander,nativeCost:before.tavern.cost,previewFree:true,portraitLandscapeAndIPad:true,errors},null,2));console.log('PASS native tavern commander preview, return, recruitment and owned hero access');
}catch(e){const native=await p.evaluate(()=>{try{const dir='/home/web_user/.cache/vcmi';return Object.fromEntries(Module.FS.readdir(dir).filter(n=>/log\.txt$/i.test(n)).map(n=>[n,Module.FS.readFile(dir+'/'+n,{encoding:'utf8'}).slice(-50000)]))}catch{return {}}});fs.writeFileSync(path.join(out,'native-logs.json'),JSON.stringify(native,null,2));fs.writeFileSync(path.join(out,'failure-state.json'),JSON.stringify(await state().catch(()=>null),null,2));await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw e;}finally{await browser.close();}
