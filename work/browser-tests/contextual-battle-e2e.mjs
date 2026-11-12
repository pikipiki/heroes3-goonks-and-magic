import {execFileSync} from 'node:child_process';
import{chromium}from'playwright-core';import fs from'node:fs';import assert from'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox']}),context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,bypassCSP:true,serviceWorkers:'block'}),p=await context.newPage();p.setDefaultTimeout(120000);const errors=[];p.on('pageerror',e=>{errors.push(e.stack);console.log('PAGE ERROR',e.stack);});p.on('console',m=>{if(/Server encountered a problem|Assertion failed/.test(m.text()))errors.push(m.text());});
const wait=f=>p.waitForFunction(f,null,{timeout:120000}),command=(...args)=>p.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]);
try{
 await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));
 await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8777')+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done');console.log('Native engine ready');
 const fixture=execFileSync('python3',['-c',`import zipfile,json,io,sys
out=io.BytesIO()
with zipfile.ZipFile('maps/000-Goonk.vmap') as src,zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as dst:
 for name in src.namelist():
  data=src.read(name)
  if name=='objects.json':
   objects=[o for o in json.loads(data) if o.get('instanceName')!='trainingOgre']
   for o in objects:
    if o.get('instanceName')=='goonkTown':
     o['subtype']='core:castle';o['template']['animation']='AVCCAST0.DEF';o['options']['name']='Castellatus';o['options']['buildings']={'allOf':['core:villageHall','core:tavern','core:fort','core:dwellingLvl1','core:blacksmith']}
    if o.get('instanceName')=='goonkHero':o['x']=8;o['y']=9;o['options'].update({'type':'core:christian','spellBook':['core:magicArrow'],'artifacts':{'spellbook':'core:spellBook'},'army':[{'type':'core:archangel','amount':1},{'type':'core:pikeman','amount':20}]})
    if o.get('instanceName')=='trainingGuard':o['x']=12;o['y']=9;o['options']['amount']=50
   data=json.dumps(objects).encode()
  dst.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`]);
 await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture]);
 await command(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await command(21);await wait(()=>goonkMobileState.selectedMap?.startsWith('000'));await command(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);console.log('Native fixture ready');await command(29,3);await command(6);await p.waitForTimeout(250);await p.evaluate(()=>Module._vcmiMobilePointer(433,281,4));await wait(()=>goonkMobileState.hasPath);await command(2);await wait(()=>goonkMobileState.mode==='battle');await command(15);await p.waitForTimeout(300);if(await p.evaluate(()=>goonkMobileState.canEndTactics))await command(35);await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.round>0&&goonkMobileState.canAct);console.log('Native battle ready');

 console.log('CONTEXT',JSON.stringify(await p.evaluate(()=>({active:goonkMobileState.activeUnit,canCast:goonkMobileState.creatureCanCast,spell:goonkMobileState.creatureSpellName,units:goonkMobileState.battleUnits.map(u=>({name:u.name,enemy:u.enemy,x:u.x,y:u.y})),actions:goonkMobileState.battleCells.filter(c=>c.actionLabel&&c.actionLabel!=='Move')}))));
 for(const viewport of [{width:390,height:844},{width:844,height:390}]){
  await p.setViewportSize(viewport);await p.waitForTimeout(500);
  const buttons=p.locator('.mobile-nav>button');assert.equal(await buttons.count(),5);
  assert.equal(await p.locator('.mobile-nav [data-ui=battle-confirm-spell]').count(),0);
  assert.equal(await p.locator('.mobile-nav [data-ui=battle-confirm-move]').count(),0);
  const boxes=await buttons.evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return {text:b.textContent,x:r.x,y:r.y,w:r.width,h:r.height};}));
  assert(Math.abs(boxes[0].y-boxes[2].y)<2);assert(boxes[3].y>boxes[0].y);assert(Math.abs(boxes[3].y-boxes[4].y)<2);
  assert(boxes.every(b=>b.h>=44));console.log('LAYOUT',viewport,boxes);
  await p.screenshot({path:'/tmp/contextual-battle-'+viewport.width+'.png'});
 }
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(500);
 const units=await p.evaluate(()=>goonkMobileState.battleUnits);
 for(const unit of units){
  await p.locator('.mobile-nav [data-ui=targets]').tap();
  await p.locator('[data-ui='+ (unit.enemy?'battle-enemies':'battle-allies')+']').tap();
  const target=p.locator('.mobile-nav [data-battle-target="'+unit.x+','+unit.y+'"]');
  if(await target.count()){
   await target.first().tap();
   const cell=await p.evaluate(u=>goonkMobileState.battleCells.find(c=>c.x===u.x&&c.y===u.y),unit);
   const button=p.locator('.mobile-nav [data-ui=battle-action]');
   const fallback=await p.evaluate(u=>!u.enemy&&goonkMobileState.creatureCanCast&&goonkMobileState.creatureSpellName?'Cast '+goonkMobileState.creatureSpellName:'Move',unit);
   assert.equal(await button.textContent(),cell?.actionLabel||fallback);
   assert.equal(await button.isEnabled(),!!cell?.actionLabel);
   console.log('TARGET',unit.name,cell?.actionLabel||'unavailable');
  }else await p.locator('[data-ui=target-picker-back]').tap();
 }

 await p.locator('.mobile-nav [data-ui=battle-magic]').tap();
 await p.locator('[data-ui=cast-hero-spell]').tap();
 await wait(()=>goonkMobileState.mode==='spellbook');
 await p.locator('[data-spell="15"]').tap();await p.locator('[data-cast-spell]').tap();
 await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.spellTargeting);
 const mana=await p.evaluate(()=>goonkMobileState.heroMana);
 assert.equal(await p.locator('.mobile-nav [data-ui=battle-magic]').textContent(),'Magic');
 await p.locator('.mobile-nav [data-ui=battle-magic]').tap();
 await wait(()=>!goonkMobileState.spellTargeting&&goonkMobileState.canAct);
 assert.equal(await p.evaluate(()=>goonkMobileState.heroMana),mana);
 console.log('PASS Magic exits targeting without spending mana or adding Cancel spell');
 const enemy=await p.evaluate(()=>goonkMobileState.battleUnits.find(u=>u.enemy&&goonkMobileState.battleCells.some(c=>c.x===u.x&&c.y===u.y&&c.actionLabel==='Attack')));
 if(enemy){
  const actor=await p.evaluate(()=>goonkMobileState.activeStack);
  await p.locator('.mobile-nav [data-ui=targets]').tap();await p.locator('[data-ui=battle-enemies]').tap();await p.locator('.mobile-nav [data-battle-target="'+enemy.x+','+enemy.y+'"]').tap();
  await p.locator('.mobile-nav [data-ui=battle-action]').tap();
  await wait(()=>!goonkMobileState.canAct||goonkMobileState.autoCombat||goonkMobileState.mode!=='battle');
  await p.waitForFunction(id=>goonkMobileState.mode!=='battle'||goonkMobileState.activeStack!==id,null===actor?null:actor,{timeout:120000});
  console.log('PASS contextual attack executes in native engine');
  await wait(()=>goonkMobileState.mode!=='battle'||goonkMobileState.canAct);
  const healing=await p.evaluate(()=>goonkMobileState.battleCells?.find(c=>c.actionLabel?.startsWith('Cast ')));
  if(healing){
   const ally=await p.evaluate(c=>goonkMobileState.battleUnits.find(u=>!u.enemy&&u.x===c.x&&u.y===c.y),healing);
   if(ally){
    await p.locator('.mobile-nav [data-ui=targets]').tap();await p.locator('[data-ui=battle-allies]').tap();await p.locator('.mobile-nav [data-battle-target="'+ally.x+','+ally.y+'"]').tap();
    const casting=p.locator('.mobile-nav [data-ui=battle-action]');assert.equal(await casting.textContent(),healing.actionLabel);assert(await casting.isEnabled());
    const actor=await p.evaluate(()=>goonkMobileState.activeStack);await casting.tap();
    await p.waitForFunction(id=>goonkMobileState.mode!=='battle'||goonkMobileState.activeStack!==id,actor,{timeout:120000});
    console.log('PASS contextual allied spell executes in native engine',healing.actionLabel);
   }
  }

 }
 console.log('PASS native contextual labels and compact layouts');assert.deepEqual(errors,[]);
}catch(error){console.log('STATE',await p.evaluate(()=>({mode:window.goonkMobileState?.mode,recovery:window.goonkSessionRecovery,status:document.querySelector('#status')?.textContent,text:document.body.innerText.slice(-1500)})));await p.screenshot({path:'/tmp/contextual-battle-failed.png'});throw error;}finally{await browser.close();}
