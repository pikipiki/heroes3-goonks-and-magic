import {chromium} from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {fitNativeBattle} from '../../web/battle-scene.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),args:['--no-sandbox']});
const report={errors:[],views:[]},output=process.env.GOONK_TEST_OUTPUT||'/private/tmp';
const fixture=tactics=>execFileSync('python3',['-c',`import zipfile,json,io,sys
out=io.BytesIO()
with zipfile.ZipFile(sys.argv[1]) as src,zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as dst:
 for name in src.namelist():
  data=src.read(name)
  if name=='objects.json':
   objects=json.loads(data)
   for obj in objects:
    if obj.get('instanceName')=='goonkHero':obj['options']['secondarySkills']={'core:tactics':'advanced'} if sys.argv[2]=='yes' else {'core:leadership':'basic'}
   data=json.dumps(objects).encode()
  dst.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`,path.join(root,'maps/000-Goonk.vmap'),tactics?'yes':'no']);
async function run(tactics){
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),page=await context.newPage();
 page.on('pageerror',error=>report.errors.push(error.message));
 const wait=fn=>page.waitForFunction(fn,null,{timeout:120000}),click=name=>page.getByRole('button',{name,exact:true}).click();
 async function inspect(label){
  await page.waitForTimeout(250);
  const head=await page.locator('.mobile-top').boundingBox(),sceneBox=await page.locator('#mobile-scene').boundingBox();for(const ui of ['battle-retreat','battle-auto']){const button=page.locator('[data-ui='+ui+']');assert.equal(await button.count(),1);const box=await button.boundingBox();assert(box&&box.y>=head.y&&box.y+box.height<=head.y+head.height+1&&box.y+box.height<=sceneBox.y+1,'Team commands must remain above the battlefield');assert(box.width>=44&&box.height>=44,'Team controls must be touch sized');}assert.equal(await page.locator('.battle-panel [data-ui=battle-retreat]').count(),0);
  const info=await page.evaluate(()=>({state:goonkMobileState,width:document.querySelector('#mobile-scene').clientWidth,height:document.querySelector('#mobile-scene').clientHeight,label:document.querySelector('#mobile-scene').getAttribute('aria-label'),summary:document.querySelector('.battle-selection').textContent,taps:window.battlePointerCalls,confirmDisabled:document.querySelector('[data-ui=target]').disabled}));
  const actor=info.state.battleUnits.find(u=>u.stackId===info.state.activeStack);assert(actor&&!actor.enemy);assert.equal(info.taps,0,'No battlefield pointer input should be needed for guidance');assert(info.confirmDisabled,'Showing reachability must not prepare a move');
  const occupied=new Set(info.state.battleUnits.flatMap(u=>u.occupied)),cells=info.state.battleCells.filter(c=>c.reachable&&!occupied.has(c.hex));assert(cells.length>0);assert(info.summary.includes(cells.length+' case'));assert(info.label.includes(actor.name));
  const layout=fitNativeBattle(info.width,info.height,info.state.focus),x=layout.dx+(actor.x-layout.x)*layout.scale,y=layout.dy+(actor.y-layout.y)*layout.scale;
  assert(x>=0&&x<=info.width&&y>=0&&y<=info.height,'Active creature must be on screen');
  const boxes=info.state.battleUnits.map(u=>({left:u.x-44,right:u.x+44,top:u.y-88,bottom:u.y+16}));
  const cell=cells.find(c=>!boxes.some(b=>c.x+22>b.left&&c.x-22<b.right&&c.y+26>b.top&&c.y-26<b.bottom)&&c.x>layout.x+24&&c.x<layout.x+layout.w-24&&c.y>layout.y+30&&c.y<layout.y+layout.h-30);assert(cell,'A legal unoccupied square must be visible');
  const points=[{x,y:y+14*layout.scale,rx:29*layout.scale,ry:12*layout.scale},{x:layout.dx+(cell.x-layout.x)*layout.scale,y:layout.dy+(cell.y+26-layout.y)*layout.scale,rx:5,ry:5}];
  const gold=await page.evaluate(points=>{const canvas=document.querySelector('#mobile-scene'),ctx=canvas.getContext('2d'),ratio=canvas.width/canvas.clientWidth;return points.map(p=>{const left=Math.max(0,Math.floor((p.x-p.rx)*ratio)),top=Math.max(0,Math.floor((p.y-p.ry)*ratio)),width=Math.min(canvas.width-left,Math.ceil(p.rx*2*ratio)),height=Math.min(canvas.height-top,Math.ceil(p.ry*2*ratio));const data=ctx.getImageData(left,top,width,height).data;let n=0;for(let i=0;i<data.length;i+=4)if(data[i]>250&&data[i+1]>=218&&data[i+1]<=230&&data[i+2]>=124&&data[i+2]<=138)n++;return n;});},points);
  assert(gold[0]>10,'Active creature needs a visible gold ground marker');assert(gold[1]>0,'Reachable squares must be visibly highlighted without a tap');
  await page.screenshot({path:path.join(output,'goonk-guidance-'+label+'.png')});report.views.push({label,actor:actor.name,stack:actor.stackId,reachable:cells.length,gold,width:info.width,height:info.height});return actor.stackId;
 }
 try{
  await page.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8775')+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu');
  await page.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/000-Goonk.vmap',new Uint8Array(bytes)),Array.from(fixture(tactics)));
  await click('Nouvelle aventure');await wait(()=>goonkMobileState.maps?.length);const map=await page.evaluate(()=>goonkMobileState.maps.find(m=>m.name.includes('Château Goonk')));await page.locator('#mobile-map-select').selectOption(String(map.index));await page.waitForFunction(name=>goonkMobileState.selectedMap===name,map.name);await click('Commencer');await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.heroName);
  await page.evaluate(()=>{window.battlePointerCalls=0;const pointer=Module._vcmiMobilePointer;Module._vcmiMobilePointer=(...args)=>{if(goonkMobileState.mode==='battle')battlePointerCalls++;return pointer(...args);};Module._vcmiMobilePointer(433,281,4);});await wait(()=>goonkMobileState.hasPath);await click('➤ Marcher');
  if(tactics){
   await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.tacticsMode&&goonkMobileState.canEndTactics&&goonkMobileState.activeStack!==undefined);const first=await inspect('initial-placement');
   await click('Suivante');await page.waitForFunction(id=>goonkMobileState.activeStack!==undefined&&goonkMobileState.activeStack!==id,first);await inspect('next-placement');
   await page.setViewportSize({width:844,height:390});await inspect('placement-landscape');await page.setViewportSize({width:390,height:844});await inspect('placement-portrait-return');
   await click('⚔ Combattre');
  }
  await wait(()=>goonkMobileState.mode==='battle'&&!goonkMobileState.tacticsMode&&goonkMobileState.round>=1&&goonkMobileState.canAct);const first=await inspect(tactics?'first-turn':'without-placement');
  if(!tactics){await page.locator('[data-ui=battle-auto]').click();await wait(()=>goonkMobileState.autoCombat===true||goonkMobileState.mode==='dialog');await wait(()=>goonkMobileState.mode==='dialog');await page.screenshot({path:path.join(output,'goonk-autocombat-result.png')});await click('✓ Valider');await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.heroName);report.autocombatCompletesBattle=true;}
  if(tactics){
   await click('Retraite');await wait(()=>goonkMobileState.mode==='dialog');await click('↩ Retour');await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct);report.topRetreatCancelsSafely=true;
   await page.locator('[data-ui=battle-auto]').click();await wait(()=>goonkMobileState.autoCombat===true&&!goonkMobileState.canAct);assert(await page.locator('[data-ui=battle-auto]').isEnabled(),'Auto must be stoppable while AI owns creature actions');
   await page.evaluate(()=>{Module._vcmiMobileCommand(44,1,0,0,0,0);Module._vcmiMobileCommand(44,1,0,0,0,0);});await page.waitForTimeout(50);assert.equal(await page.evaluate(()=>goonkMobileState.autoCombat),true,'Duplicate start must not toggle auto off');
   await page.locator('[data-ui=battle-auto]').click();await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.autoCombat===false&&goonkMobileState.canAct);report.autoStartsAndStopsWithoutCreatureFocus=true;await inspect('manual-after-autocombat');
   const waiting=await page.evaluate(()=>goonkMobileState.activeStack);await click('◷ Attendre');await page.waitForFunction(id=>goonkMobileState.canAct&&goonkMobileState.activeStack!==undefined&&goonkMobileState.activeStack!==id,waiting);await inspect('next-turn');await page.setViewportSize({width:320,height:568});await inspect('small-portrait');await page.setViewportSize({width:844,height:390});await inspect('combat-landscape');}
 }catch(error){await page.screenshot({path:path.join(output,'goonk-guidance-failure.png')});throw error;}finally{await context.close();}
}
try{if(process.env.GOONK_TEST_CASES!=='without-placement')await run(true);await run(false);assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report));}catch(error){report.failure=error.stack;throw error;}finally{fs.writeFileSync(path.join(output,'goonk-guidance-native-report.json'),JSON.stringify(report,null,2));await browser.close();}
