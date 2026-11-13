import {chromium,webkit} from 'playwright-core';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const kind=process.env.BROWSER||'chromium',out=process.env.REVIEW_OUTPUT||'/tmp/goonk-max-combat-151';fs.mkdirSync(out,{recursive:true});
const browser=await(kind==='webkit'?webkit:chromium).launch({headless:true,...(kind==='chromium'?{args:['--no-sandbox']}: {})});
const p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,deviceScaleFactor:3,isMobile:true,bypassCSP:true,serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message);});
let phase='boot';p.on('console',m=>{if(m.type()==='error'||/Map.+error|Error loading/i.test(m.text()))console.log('ENGINE',m.text().slice(0,300));});
const wait=f=>p.waitForFunction(f,null,{timeout:90000}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]);
try{
 await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));
 await (await import('./silent-audio.mjs')).silenceTestAudio(p);await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8777')+'/game.html?mobile=1');
 await wait(()=>window.goonkMobileState?.mode==='menu');
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
    if o.get('instanceName')=='goonkHero':o['x']=8;o['y']=9;o['options'].update({'type':'core:zydar','primarySkills':{'attack':0,'defence':100,'spellpower':1,'knowledge':10},'spellBook':['core:lightningBolt'],'artifacts':{'spellbook':'core:spellBook'},'army':[{'type':'goonk:'+name,'amount':10000 if name=='bubuExalted' else 1000} for name in ['paingpaingExalted','picpiqueExalted','zinzeclairExalted','bubuExalted','glouglouExalted','bobopeExalted','maillemailleSolar']]})
    if o.get('instanceName')=='trainingGuard':o['x']=12;o['y']=9;o['subtype']='core:titan';o['options']['amount']=10000
   data=json.dumps(objects).encode()
  dst.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`]);
 await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture]);
 phase='lobby';await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);console.log('PASS lobby ready');await wait(()=>goonkMobileState.maps?.some(m=>/bow.*hope/i.test(m.name)));const mapPath=await p.evaluate(()=>goonkMobileState.maps.find(m=>/bow.*hope/i.test(m.name))?.path);assert(mapPath);const preview=await p.evaluate(async path=>{const {scenarioPreview}=await import('./web/scenario-preview.mjs');return scenarioPreview(path);},mapPath);assert(preview.length>0);fs.writeFileSync(out+'/'+kind+'-map-preview.png',Buffer.from(preview[0].split(',')[1],'base64'));const bow=await p.evaluate(()=>goonkMobileState.maps.find(m=>/bow.*hope/i.test(m.name)));await cmd(24,bow.index);await wait(()=>/bow.*hope/i.test(goonkMobileState.selectedMap));await p.locator('.lobby-map-emblem[data-preview-ready=true]').waitFor({state:'visible'});assert.equal(await p.locator('.lobby-map-emblem').getAttribute('src'),preview[0]);console.log('PASS native full terrain preview in map selection UI');phase='select';await cmd(21);await wait(()=>goonkMobileState.selectedMap?.startsWith('000'));console.log('PASS map selected');phase='begin';await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);console.log('PASS native fixture starts');
 await p.locator('#game-menu-toggle').tap();await p.locator('[data-menu=settings]').tap();await p.locator('[data-default-battle-view]').selectOption('vertical');await p.screenshot({path:out+'/'+kind+'-settings.png'});await p.locator('#game-menu [data-menu=close]').tap();await p.setViewportSize({width:390,height:740});await p.waitForTimeout(300);
 phase='battle';await cmd(6);await p.waitForTimeout(250);await p.evaluate(()=>Module._vcmiMobilePointer(433,281,4));await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='battle');await cmd(15);await p.waitForTimeout(200);if(await p.evaluate(()=>goonkMobileState.canEndTactics))await cmd(35);
 await p.setViewportSize({width:390,height:740});
 await wait(()=>document.querySelector('#mobile-app').dataset.verticalBattle==='true');
 await wait(()=>document.querySelector('#mobile-app').dataset.verticalBattle==='true'&&window.goonkBattlePlanes?.version>2&&window.goonkBattleSpriteBounds?.length>2);
 await wait(()=>goonkMobileState.canAct&&!goonkMobileState.animating);
 const report={browser:kind,actions:[],rayHits:{}};const rays=['goonk:bubuExalted','goonk:glouglouExalted','goonk:maillemailleSolar'];
 const acted=new Set();
 for(let turn=0;turn<32&&rays.some(k=>!report.rayHits[k]);turn++){
  await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct&&!goonkMobileState.animating);
  const info=await p.evaluate(()=>({unit:goonkMobileState.battleUnits.find(u=>u.stackId===goonkMobileState.activeStack),enemy:goonkMobileState.battleUnits.find(u=>u.enemy&&u.canShootAt)}));
  if(info.unit?.key?.startsWith('goonk:')&&info.enemy){
   await p.evaluate(({id,key})=>{window.rayReview={id,key,hits:0,pixels:0,frames:0};window.rayReviewTimer=setInterval(()=>{const c=window.goonkBattlePlanes?.effects,b=window.goonkBattleSpriteBounds?.find(b=>b.stackId===id);if(!c||!b)return;const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let hits=0,pixels=0,minX=c.width,maxX=-1;
    const left=b.renderX-(b.y+b.h-b.renderY),right=b.renderX-(b.y-b.renderY),top=b.renderY+(b.x-b.renderX),bottom=b.renderY+(b.x+b.w-b.renderX);
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const a=(y*c.width+x)*4;const ray=rayReview.key.includes('maillemaille')?d[a]>d[a+1]*1.25&&d[a+1]>d[a+2]*1.1:/bubu|glouglou/.test(rayReview.key)?d[a+1]>d[a]*1.05&&d[a+1]>d[a+2]*1.2:true;if(ray&&d[a+3]>60&&Math.max(d[a],d[a+1],d[a+2])>100){pixels++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);const nx=x*800/c.width,ny=y*600/c.height;if(nx>=left-6&&nx<=right+6&&ny>=top-6&&ny<=bottom+6)hits++;}}if(pixels>rayReview.pixels){rayReview.plane=c.toDataURL();rayReview.rect={left,right,top,bottom,b};rayReview.image=document.querySelector('#mobile-scene').toDataURL();}rayReview.frames++;if(!/bubu|glouglou|maillemaille/.test(rayReview.key)||maxX-minX>c.width*.4)rayReview.hits=Math.max(rayReview.hits,hits);rayReview.pixels=Math.max(rayReview.pixels,pixels);if(hits>0)rayReview.image=document.querySelector('#mobile-scene').toDataURL();},30);},{id:info.enemy.stackId,key:info.unit.key});
   const hit=await p.evaluate(async u=>{const {verticalBattleGeometry}=await import('./web/battle-vertical.mjs');const c=document.querySelector('#mobile-scene'),g=verticalBattleGeometry(c.clientWidth,c.clientHeight),p=g.project(u);return{x:p.x+18*g.scale,y:p.y-8*g.scale};},info.enemy);await p.locator('#mobile-scene').tap({position:hit});await p.waitForTimeout(220);await p.locator('[data-ui=battle-action]').tap();await p.waitForTimeout(2000);await wait(()=>!goonkMobileState.animating);
   const shot=await p.evaluate(()=>{clearInterval(rayReviewTimer);return rayReview;});console.log('SHOT',info.unit.key,shot.hits,shot.pixels);report.actions.push({unit:info.unit.key,frames:shot.frames,pixels:shot.pixels,hits:shot.hits});acted.add(info.unit.key);
   if(rays.includes(info.unit.key)){fs.writeFileSync(out+'/'+kind+'-'+info.unit.key.split(':')[1]+'-debug.json',JSON.stringify(shot));if(shot.plane)fs.writeFileSync(out+'/'+kind+'-'+info.unit.key.split(':')[1]+'-plane.png',Buffer.from(shot.plane.split(',')[1],'base64'));assert(shot.hits>0,'Laser reaches upright target: '+info.unit.key);report.rayHits[info.unit.key]=shot.hits;if(shot.image)fs.writeFileSync(out+'/'+kind+'-'+info.unit.key.split(':')[1]+'.png',Buffer.from(shot.image.split(',')[1],'base64'));}
  }else{await cmd(13);await p.waitForTimeout(300);}
 }
 assert(rays.every(k=>report.rayHits[k]>0),'Every Goonk laser reaches its target');assert.deepEqual(errors,[]);fs.writeFileSync(out+'/'+kind+'-report.json',JSON.stringify(report,null,2));console.log('PASS Goonk maximum evolution battle',JSON.stringify(report));
}catch(e){console.log('FAILED STATE',await p.evaluate(()=>({mode:goonkMobileState.mode,active:goonkMobileState.activeUnit,round:goonkMobileState.round,units:goonkMobileState.battleUnits})));await p.screenshot({path:out+'/'+kind+'-failed.png'});throw e;}finally{await browser.close();}
