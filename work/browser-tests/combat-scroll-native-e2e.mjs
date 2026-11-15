import {chromium} from 'playwright-core';import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {silenceTestAudio} from './silent-audio.mjs';
const out='/tmp/goonk-combat-scroll-native';fs.mkdirSync(out,{recursive:true});
const fixture=execFileSync('python3',['-c',`import zipfile,json,io,sys
out=io.BytesIO()
with zipfile.ZipFile('maps/000-Goonk.vmap') as src,zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as dst:
 for name in src.namelist():
  data=src.read(name)
  if name=='objects.json':
   objects=[o for o in json.loads(data) if o.get('instanceName')!='trainingOgre']
   for o in objects:
    if o.get('instanceName')=='goonkHero':o['x']=8;o['y']=9;o['options'].update({'type':'core:christian','spellBook':['core:magicArrow'],'artifacts':{'spellbook':'core:spellBook'},'army':[{'type':'core:archangel','amount':10}]})
    if o.get('instanceName')=='trainingGuard':o['x']=12;o['y']=9;o['options']['amount']=1
   data=json.dumps(objects).encode()
  dst.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`]);
const browser=await chromium.launch({headless:true}),p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,bypassCSP:true}),errors=[];await silenceTestAudio(p);p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>fs.appendFileSync(out+'/console.log',m.text()+'\n'));
const state=()=>p.evaluate(()=>goonkMobileState),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]),wait=(f,a)=>p.waitForFunction(f,a,{timeout:120000});
try{
 await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8767')+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done');
 await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture]);await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await cmd(21);await wait(()=>goonkMobileState.selectedMap?.startsWith('000'));await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 await cmd(29,3);await cmd(6);await p.waitForTimeout(350);await p.evaluate(()=>Module._vcmiMobilePointer(433,281,4));await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='battle');await cmd(15);await p.waitForTimeout(300);if((await state()).canEndTactics)await cmd(35);await wait(()=>goonkMobileState.canAct);
 await p.locator('.mobile-nav [data-ui=battle-magic]').tap();await wait(()=>goonkMobileState.mode==='spellbook'&&goonkMobileState.spellbook?.spells?.length);await p.locator('[data-school="0"]').tap();await wait(()=>goonkMobileState.spellbook.school===-1);const book=(await state()).spellbook;assert(book.scrollable);assert.equal(book.pages,1);assert.equal(await p.locator('[data-page],.spell-pagination').count(),0);const spell=book.spells.slice(24).reverse().find(s=>s.enabled&&s.target==='none');assert(spell,'Castable spell beyond the old first page');
 await p.locator('[data-spell="'+spell.id+'"]').scrollIntoViewIfNeeded();await p.locator('[data-spell="'+spell.id+'"]').tap();await p.screenshot({path:out+'/book-last-spell.png'});await p.locator('[data-cast-spell]').tap();await wait(()=>goonkMobileState.mode==='battle'&&!goonkMobileState.spellTargeting);await p.waitForTimeout(200);assert((await state()).heroMana<book.mana,'Native cast consumes mana');
 await wait(()=>goonkMobileState.canAutoCombat);await cmd(44,1);await wait(()=>goonkMobileState.dialogKind==='battle-result');const result=(await state()).battleResult;assert(result.sides.flatMap(s=>s.losses||[]).some(l=>l.count===1),'Real result contains exactly one lost creature');
 for(const[width,height]of[[320,568],[390,844],[568,320],[844,390],[768,1024],[1024,768]]){await p.setViewportSize({width,height});await p.waitForTimeout(120);const box=await p.locator('[data-result-confirm]').boundingBox();assert(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1);assert.equal(await p.locator('#mobile-app button:visible').count(),1);assert(await p.locator('.result-losses .unit-portrait').evaluateAll(nodes=>nodes.every(n=>n.getBoundingClientRect().height===44)));await p.screenshot({path:out+`/result-${width}x${height}.png`});}
 await p.locator('[data-result-confirm]').tap();await wait(()=>goonkMobileState.mode==='map');assert.deepEqual(errors,[]);fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,engineSha256:crypto.createHash('sha256').update(fs.readFileSync('work/vcmi-wasm/emscripten/html5/vcmiclient.wasm')).digest('hex'),spellCount:book.spells.length,castBeyondFirstPage:spell,oneCasualtyResult:result,sixLayouts:true,errors},null,2));console.log('PASS native full combat book, cast beyond old page, real single casualty and six result layouts');
}catch(error){fs.writeFileSync(out+'/failure-state.json',JSON.stringify(await state().catch(()=>null),null,2));await p.screenshot({path:out+'/failure.png'}).catch(()=>{});throw error;}finally{await browser.close();}
