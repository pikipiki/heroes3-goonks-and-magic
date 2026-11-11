// Real WASM regression: hero navigation and adventure-spell targeting.
// All map changes live only in each isolated browser's in-memory filesystem.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8777';
const output=process.env.GOONK_REPORT_DIR||'/tmp/mobile-review-spells-native';
fs.mkdirSync(output,{recursive:true});
const report={scope:'real WASM, isolated temporary storage, memory-only map fixtures',cases:[]};
function fixture(withBoat){
 const bytes=execFileSync('python3',['-c',`import zipfile,json,io,sys
with_boat=sys.argv[1]=='1'
out=io.BytesIO()
with zipfile.ZipFile('maps/000-Goonk.vmap') as src,zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as dst:
 for name in src.namelist():
  data=src.read(name)
  if name=='objects.json':
   objects=json.loads(data)
   objects=[o for o in objects if o.get('instanceName') not in ['trainingGuard','trainingOgre']]
   for o in objects:
    if o.get('instanceName')=='goonkHero':
     o['options'].update({'type':'core:solmyr','spellBook':['preset','core:scuttleBoat'],'artifacts':{'spellbook':'core:spellBook'},'secondarySkills':{'core:wisdom':'expert','core:waterMagic':'expert'},'primarySkills':{'attack':1,'defence':1,'spellpower':3,'knowledge':50}})
   if with_boat:
    objects.append({'type':'core:boat','subtype':'core:boatCastle','instanceName':'reviewBoat','x':11,'y':12,'l':0,'template':{'animation':'AB02_.DEF','mask':['VVV','VAV'],'visitableFrom':['+++','+-+','+++']},'options':{'owner':'red'}})
   data=json.dumps(objects).encode()
  if name=='surface_terrain.json':
   terrain=json.loads(data)
   for y in range(12,16):
    for x in range(10,15):terrain[y][x]='wt0_'
   data=json.dumps(terrain).encode()
  dst.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`,withBoat?'1':'0']);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-spell-fixture-'));
 try{
  const file=path.join(dir,'fixture.vmap');fs.writeFileSync(file,bytes);
  execFileSync('python3',['scripts/normalize-map-instances.py',dir]);
  return fs.readFileSync(file);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,args:['--no-sandbox']});
try{
 for(const withBoat of [false,true]){
  if(process.env.GOONK_SPELL_CASE&&process.env.GOONK_SPELL_CASE!==(withBoat?'visible-boat':'no-boat'))continue;
  const context=await browser.newContext({viewport:{width:932,height:430},hasTouch:true,bypassCSP:true});
  const page=await context.newPage();page.setDefaultTimeout(60000);
  const item={name:withBoat?'visible-boat':'no-boat',errors:[]};report.cases.push(item);
  page.on('pageerror',error=>item.errors.push(error.message));
  const wait=(fn,arg)=>page.waitForFunction(fn,arg,{timeout:60000});
  const cmd=(...args)=>page.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]);
  const log=()=>page.evaluate(()=>{try{return Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'});}catch{return'';}});
  try{
   await page.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));
   await page.goto(origin+'/game.html?mobile=1');
   await page.waitForFunction(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,{timeout:180000});
   assert(await page.evaluate(()=>Module.goonkTemporaryStorage),'Use the isolated in-memory path');
   await page.keyboard.press('Shift');
   await page.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture(withBoat)]);
   await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);
   await cmd(21);await wait(()=>goonkMobileState.selectedMap?.startsWith('000'));
   await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn&&goonkMobileState.heroName);
   await cmd(6);await page.waitForTimeout(250); // center the native camera on the fixture hero at tile (8,11)
   await page.locator('[data-ui=heroes]').tap();await wait(()=>goonkMobileState.mode==='hero'&&goonkMobileState.heroWindow?.slots.length===19);
   const hero=await page.evaluate(()=>goonkMobileState.heroId);
   await page.locator('[data-hero-classic]').tap();
   await wait(()=>document.querySelector('#mobile-app').dataset.heroView==='classic');
   await page.locator('[data-ui=hero-back]').tap();
   await wait(()=>goonkMobileState.mode==='hero'&&document.querySelector('#mobile-app').dataset.heroView==='mobile');
   assert.equal(await page.evaluate(()=>goonkMobileState.heroId),hero);
   assert(await page.locator('.hero-equipment-page').isVisible(),'Classic Back returns to the same mobile hero sheet');
   await page.locator('[data-hero-slot="17"]').tap();await wait(()=>goonkMobileState.mode==='spellbook');
   await page.locator('[data-close-book]').tap();await wait(()=>goonkMobileState.mode==='hero');
   assert(await page.locator('.hero-equipment-page').isVisible(),'Ordinary book close preserves the hero sheet');
   await page.locator('[data-hero-slot="17"]').tap();await wait(()=>goonkMobileState.mode==='spellbook');
   if(await page.evaluate(()=>goonkMobileState.spellbook.combatSpells)){
    await page.locator('[data-spell-context="0"]').tap();await wait(()=>!goonkMobileState.spellbook.combatSpells);
   }
   await wait(()=>goonkMobileState.spellbook.spells.some(spell=>spell.id===1));
   await page.locator('[data-spell="1"]').tap();
   const before=await page.evaluate(()=>({mana:goonkMobileState.spellbook.mana,cost:goonkMobileState.spellbook.spells.find(spell=>spell.id===1).cost}));
   assert(await page.locator('[data-cast-spell]').isEnabled());item.before=before;
   await page.locator('[data-cast-spell]').tap();
   if(!withBoat){
    await wait(()=>goonkMobileState.mode==='dialog');
    const native=await log();
    assert(native.includes('Scuttle Boat is unavailable: no visible boat is in range of this hero.'),'An explicit native unavailable message is shown');
    assert.equal(await page.evaluate(()=>goonkMobileState.heroMana),before.mana,'An unavailable spell spends no mana');
    await cmd(1);await wait(()=>goonkMobileState.mode==='spellbook');
    assert.equal(await page.evaluate(()=>goonkMobileState.spellbook.mana),before.mana);
    await page.locator('[data-close-book]').tap();await wait(()=>goonkMobileState.mode==='hero');
    item.unavailableMessage=true;
   }else{
    await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.mapOverview);
    assert(await page.locator('.hero-equipment-page').isHidden(),'Casting reveals the map rather than equipment');
    const scene=await page.locator('#mobile-scene').boundingBox();
    const mini=await page.locator('#mobile-overview').boundingBox();
    item.mapGeometry={scene,mini,viewport:page.viewportSize()};
    assert(scene&&scene.y<=1&&scene.height>=page.viewportSize().height-1,'Native map fills the viewport height');
    assert(mini&&mini.height>=64,'Native overview remains readable');
    assert(mini.x>=scene.x+scene.width-1,'Native overview sits beside the map without covering it');

    assert.equal(await page.evaluate(()=>goonkMobileState.heroMana),before.mana,'Target selection itself spends no mana');
    // The boat's A cell is tile (10,12). Native view center is the hero's
    // visitable tile (8,11), at the unmodified native 32-pixel tile scale.
    // mapOverview.viewport rounds outward and adds two partial edge tiles;
    // its integer width must not be used as a linear pixel scale.
    const target=await page.evaluate(()=>{
     const m=goonkMobileState.mapOverview;
     return {x:Math.round(m.view.x+m.view.w/2+(10-8)*32),y:Math.round(m.view.y+m.view.h/2+(12-11)*32),overview:m};
    });
    item.target=target;
    assert(target.x>=target.overview.view.x&&target.x<target.overview.view.x+target.overview.view.w&&target.y>=target.overview.view.y&&target.y<target.overview.view.y+target.overview.view.h,'Visible boat is inside the native map viewport');
    await page.evaluate(({x,y})=>Module._vcmiMobilePointer(x,y,1),target);
    await wait(expected=>goonkMobileState.heroMana===expected,before.mana-before.cost);
    assert.equal(await page.evaluate(()=>goonkMobileState.mode),'map');
    item.afterMana=await page.evaluate(()=>goonkMobileState.heroMana);
    assert.equal(item.afterMana,before.mana-before.cost,'Native targeted cast spends its exact cost');
   }
   assert.deepEqual(item.errors,[]);item.passed=true;
   await page.screenshot({path:path.join(output,item.name+'.png')});
   console.log('PASS',item.name,'native hero return, book close and Scuttle Boat behavior');
  }catch(error){
   item.failure=error.stack;item.state=await page.evaluate(()=>window.goonkMobileState).catch(()=>null);
   item.nativeLog=(await log().catch(()=>'' )).slice(-18000);
   item.mapStyles=await page.evaluate(()=>Object.fromEntries(['#mobile-app','.mobile-play','#mobile-scene','#mobile-overview'].map(selector=>{const e=document.querySelector(selector),s=getComputedStyle(e);return[selector,{rect:e.getBoundingClientRect().toJSON(),display:s.display,position:s.position,gridRows:s.gridTemplateRows,gridRow:s.gridRow,gridColumns:s.gridTemplateColumns,height:s.height,width:s.width}];}))).catch(()=>null);
   await page.screenshot({path:path.join(output,item.name+'-failure.png')}).catch(()=>{});
   process.exitCode=1;console.error(item.name,error.stack);
  }finally{
   fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));await context.close();
  }
 }
}finally{await browser.close();}
