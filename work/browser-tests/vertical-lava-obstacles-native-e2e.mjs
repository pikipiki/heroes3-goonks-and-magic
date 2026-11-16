import {chromium,webkit} from 'playwright-core';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const kind=process.env.BROWSER||'chromium',out=process.env.REVIEW_OUTPUT||'/tmp/goonk-lava-native';fs.mkdirSync(out,{recursive:true});
const browser=await(kind==='webkit'?webkit:chromium).launch({headless:true,...(kind==='chromium'?{args:['--no-sandbox']}: {})});
const p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true,serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message);});
let phase='boot';p.on('console',m=>{if(m.type()==='error'||/Map.+error|Error loading/i.test(m.text()))console.log('ENGINE',m.text().slice(0,300));});
const wait=f=>p.waitForFunction(f,null,{timeout:90000}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]);
try{
 await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));
 await (await import('./silent-audio.mjs')).silenceTestAudio(p);await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8777')+'/game.html?mobile=1');
 await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done');
 const fixture=execFileSync('python3',['-c',`import zipfile,json,io,sys
out=io.BytesIO()
with zipfile.ZipFile('maps/000-Goonk.vmap') as src,zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as dst:
 for name in src.namelist():
  data=src.read(name)
  if name=='surface_terrain.json':
   data=json.dumps([['lv0_' for tile in row] for row in json.loads(data)]).encode()
  if name=='objects.json':
   objects=[o for o in json.loads(data) if o.get('instanceName')!='trainingOgre']
   for o in objects:
    if o.get('instanceName')=='goonkTown':
     o['subtype']='core:castle';o['template']['animation']='AVCCAST0.DEF';o['options']['name']='Castellatus';o['options']['buildings']={'allOf':['core:villageHall','core:tavern','core:fort','core:dwellingLvl1','core:blacksmith']}
    if o.get('instanceName')=='goonkHero':o['x']=8;o['y']=9;o['options'].update({'type':'core:christian','spellBook':['core:lightningBolt'],'artifacts':{'spellbook':'core:spellBook'},'army':[{'type':'core:pikeman','amount':20},{'type':'core:archer','amount':10}]})
    if o.get('instanceName')=='trainingGuard':o['x']=12;o['y']=9;o['options']['amount']=50
   data=json.dumps(objects).encode()
  dst.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`]);
 await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture]);
 await p.bringToFront();await p.waitForTimeout(1000);
 phase='lobby';await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);console.log('PASS lobby ready');phase='select';await cmd(21);await wait(()=>goonkMobileState.selectedMap?.startsWith('000'));console.log('PASS map selected');phase='begin';await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);console.log('PASS native fixture starts');
 phase='battle';await cmd(6);await p.waitForTimeout(250);await p.evaluate(()=>Module._vcmiMobilePointer(433,281,4));await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='battle');await cmd(15);await p.waitForTimeout(200);if(await p.evaluate(()=>goonkMobileState.canEndTactics))await cmd(35);
 await p.setViewportSize({width:390,height:740});
 assert.equal(await p.locator('#mobile-app').getAttribute('data-vertical-battle'),'false');await p.locator('.battle-view').tap();
 await wait(()=>document.querySelector('#mobile-app').dataset.verticalBattle==='true'&&window.goonkBattlePlanes?.version>2&&window.goonkBattleSpriteBounds?.length>2);
 await wait(()=>goonkMobileState.canAct&&!goonkMobileState.animating);

 const obstacleCells=await p.evaluate(()=>goonkMobileState.battleCells.filter(c=>c.kind===2));
 assert(obstacleCells.length,'Lava fixture has native blocking obstacles');
 const coverage=await p.evaluate(()=>{const c=goonkBattlePlanes.ground,d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let total=0,painted=0;for(const cell of goonkMobileState.battleCells.filter(c=>c.kind===2))for(let dy=-10;dy<=10;dy++)for(let dx=-10;dx<=10;dx++){const x=Math.round((cell.x+dx)*c.width/800),y=Math.round((cell.y+dy)*c.height/600);if(x>=0&&x<c.width&&y>=0&&y<c.height){total++;painted+=d[(y*c.width+x)*4+3]>0;}}return {painted,total,ratio:painted/total};});
 assert(coverage.ratio>.75,'Ground obstacle artwork follows its native blocked footprint');
 const samples=[];
 for(let i=0;i<16;i++){
  samples.push(await p.evaluate(()=>{const c=goonkBattlePlanes.ground,d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let visible=0;for(let n=3;n<d.length;n+=4)visible+=d[n]>0;return visible;}));
  if(i===0||i===15)await p.screenshot({path:out+'/'+kind+'-lava-'+i+'.png'});
  await p.waitForTimeout(100);
 }
 assert(Math.min(...samples)>Math.max(...samples)*.65,'Obstacle layer stays present across animation frames');
 const cell=await p.evaluate(()=>{const s=goonkMobileState,a=s.battleUnits.find(u=>u.stackId===s.activeStack);return s.battleCells.filter(c=>c.reachable&&c.kind===0&&!s.battleUnits.some(u=>Math.hypot(u.x-c.x,u.y-c.y)<65)&&Math.hypot(c.x-a.x,c.y-a.y)>50).sort((a,b)=>a.x-b.x)[0];});assert(cell);
 const actorUnit=await p.evaluate(()=>goonkMobileState.battleUnits.find(u=>u.stackId===goonkMobileState.activeStack));assert.equal(actorUnit.nativeFlags.flying,false,'Test actor is a ground creature');
 const actor=actorUnit.stackId;
 const screen=await p.locator('#mobile-scene').evaluate(async(c,point)=>{const {verticalBattleGeometry}=await import('./web/battle-vertical.mjs'),g=verticalBattleGeometry(c.clientWidth,c.clientHeight),p=g.project(point),r=c.getBoundingClientRect();return{x:r.x+p.x,y:r.y+p.y};},cell);
 await p.mouse.click(screen.x,screen.y);await p.waitForTimeout(700);await p.mouse.click(screen.x,screen.y);
 await p.waitForFunction(({id,hex})=>goonkMobileState.battleUnits.some(u=>u.stackId===id&&u.occupied.includes(hex)),{id:actor,hex:cell.hex},{timeout:15000});
 const occupied=await p.evaluate(id=>goonkMobileState.battleUnits.find(u=>u.stackId===id).occupied,actor);
 assert(occupied.every(hex=>!obstacleCells.some(c=>c.hex===hex)),'Ground creature lands outside native blocked footprint');
 await p.screenshot({path:out+'/'+kind+'-lava-after-move.png'});
 fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,coverage,samples,obstacleCells:obstacleCells.map(c=>c.hex),destination:cell.hex,occupied},null,2));
 assert.deepEqual(errors,[]);console.log('PASS lava footprint, stable obstacle layer and two-click ground movement');
}catch(e){console.error('FAILED PHASE',phase);fs.writeFileSync(out+'/failure-state.json',JSON.stringify(await p.evaluate(()=>window.goonkMobileState),null,2));await p.screenshot({path:out+'/failure.png'});throw e;}finally{await browser.close();}
