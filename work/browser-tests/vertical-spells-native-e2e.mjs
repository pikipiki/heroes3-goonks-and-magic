import {chromium,webkit} from 'playwright-core';import {execFileSync} from 'node:child_process';import fs from 'node:fs';import assert from 'node:assert/strict';import {silenceTestAudio} from './silent-audio.mjs';
const root=process.env.SPELL_REVIEW_ROOT||'/tmp/goonk-spells',out=process.env.SPELL_REVIEW_OUTPUT||'/tmp/vertical-spell-review';fs.mkdirSync(out,{recursive:true});
const all=JSON.parse(fs.readFileSync(root+'/spell-visual-catalog.json')),mechanics=process.env.SPELL_REVIEW_MECHANICS==='1',catalog=mechanics?(process.env.SPELL_REVIEW_CASES||'quicksand,landMine,forceField,removeObstacle,fireWall,teleport,clone').split(',').map(name=>all.find(r=>r.source==='core'&&r.spell===name)):all.filter(r=>Object.keys(r.animation).length&&(!process.env.SPELL_REVIEW_VISUAL_CASES||process.env.SPELL_REVIEW_VISUAL_CASES.split(',').includes(r.spell))),kind=process.env.BROWSER||'chromium',browser=await(kind==='webkit'?webkit:chromium).launch({headless:true}),p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,bypassCSP:true,serviceWorkers:'block'});
const targetTeam=process.env.SPELL_REVIEW_TARGET||'enemy';
const errors=[];p.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.message);});p.on('console',m=>{if(m.type()==='error')console.log('ENGINE',m.text().slice(0,180));});
const report={browser:kind,targetTeam,scope:mechanics?'Unmodified original spells, native obstacles/teleport/clone/summons':'Original animation definitions in native renderer with visual-only spell payloads; does not substitute for spell-rule tests',cases:[]},wait=f=>p.waitForFunction(f,null,{timeout:120000}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]);
try{
 await silenceTestAudio(p);await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8780')+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done');console.log('PASS review engine ready');
 const fixture=execFileSync('python3',['-c',`import zipfile,json,io,sys
out=io.BytesIO()
siege=sys.argv[2]=='1'
with zipfile.ZipFile('maps/000-Goonk.vmap') as src,zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as dst:
 for name in src.namelist():
  data=src.read(name)
  if name=='objects.json':
   objects=[o for o in json.loads(data) if o.get('instanceName')!='trainingOgre' and not(siege and o.get('instanceName')=='trainingGuard')]
   for o in objects:
    if o.get('instanceName')=='goonkHero':o['x']=8;o['y']=9;o['options'].update({'type':'core:christian','spellBook':json.loads(sys.argv[1]),'artifacts':{'spellbook':'core:spellBook','catapult':'core:catapult'},'primarySkills':{'attack':0,'defence':50,'spellpower':0,'knowledge':100},'secondarySkills':{'core:wisdom':'expert','core:airMagic':'expert','core:waterMagic':'expert','core:earthMagic':'expert','core:fireMagic':'expert'},'army':[{'type':'core:archangel','amount':10000}]})
    if o.get('instanceName')=='goonkHero' and 'core:destroyUndead' in json.loads(sys.argv[1]):o['options']['army'].append({'type':'core:skeleton','amount':1000})
    if siege and o.get('instanceName')=='goonkTown':o['subtype']='core:castle';o['template']['animation']='AVCCAST0.DEF';o['options']['buildings']={'allOf':['core:villageHall','core:tavern','core:fort']}
    if siege and o.get('instanceName')=='enemyTown':o['x']=15;o['y']=9;o['options']['buildings']={'allOf':['core:villageHall','core:tavern','core:castle']};o['options']['army']=[{'type':'core:harpyHag','amount':1000}]
    if o.get('instanceName')=='trainingGuard':o['x']=12;o['y']=9;o['subtype']='core:harpyHag';o['options']['amount']=1000
   data=json.dumps(objects).encode()
  dst.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`,JSON.stringify(catalog.map(r=>mechanics?'core:'+r.spell:'goonk:'+r.key)),process.env.SPELL_REVIEW_SIEGE==='1'?'1':'0']);
 await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture]);await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await cmd(21);await wait(()=>goonkMobileState.selectedMap?.startsWith('000'));await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);if(process.env.SPELL_REVIEW_SIEGE==='1'){await cmd(29,2);await p.waitForTimeout(500);}await cmd(6);await p.waitForTimeout(250);await p.evaluate(siege=>Module._vcmiMobilePointer(siege?497:433,281,4),process.env.SPELL_REVIEW_SIEGE==='1');await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='battle');await cmd(15);await p.waitForTimeout(200);if(await p.evaluate(()=>goonkMobileState.canEndTactics))await cmd(35);await wait(()=>goonkMobileState.canAct&&!goonkMobileState.animating);await p.locator('.battle-view').tap();await wait(()=>document.querySelector('#mobile-app').dataset.verticalBattle==='true'&&window.goonkBattlePlanes?.version>1);console.log('PASS native vertical review battle');
 for(const row of catalog){
  const item={source:row.source,spell:row.spell,key:row.key,targetType:row.targetType};report.cases.push(item);
  try{
   const before=await p.evaluate(()=>({units:goonkMobileState.battleUnits,ground:window.goonkBattlePlanes?.ground.toDataURL(),siege:window.goonkSiegeAtlas?.toDataURL()}));
   await cmd(14);await wait(()=>goonkMobileState.mode==='spellbook'&&goonkMobileState.spellbook?.spells?.length);let spell;
   for(let page=0;page<30;page++){spell=await p.evaluate(({key,id,mechanics})=>goonkMobileState.spellbook.spells.find(s=>mechanics?s.id===id:s.name.includes(' '+key+' ')),{key:row.key,id:row.originalIndex,mechanics});if(spell)break;await p.locator('[data-page="1"]').tap();await p.waitForTimeout(100);}
   assert(spell,'Visual spell present: '+row.spell);assert(spell.enabled,'Visual spell available: '+JSON.stringify(spell));await p.locator('[data-spell="'+spell.id+'"]').tap();
   await p.evaluate(()=>{window.review={frames:0,pixels:0,ticks:0};window.reviewTimer=setInterval(()=>{review.ticks++;if(review.ticks%10===0)review.fallbackImage=document.querySelector('#mobile-scene').toDataURL();const c=window.goonkBattlePlanes?.effects;if(!c)return;const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let pixels=0;for(let i=3;i<d.length;i+=4)pixels+=d[i]>128;if(pixels){review.frames++;if(pixels>review.pixels){review.pixels=pixels;review.image=document.querySelector('#mobile-scene').toDataURL();review.plane=c.toDataURL();}}},25);});
   await p.locator('[data-cast-spell]').tap();await wait(()=>goonkMobileState.mode==='battle');
   for(let aim=0;aim<3&&await p.evaluate(()=>goonkMobileState.spellTargeting);aim++){
    const cell=await p.evaluate(({spell,aim,mechanics,targetTeam})=>{const units=goonkMobileState.battleUnits,enemy=units.filter(u=>u.enemy),ally=units.filter(u=>!u.enemy),cells=goonkMobileState.battleCells.filter(c=>c.spellTarget);const on=(c,us)=>us.some(u=>Math.hypot(c.x-u.x,c.y-u.y)<16);return mechanics?(spell==='teleport'&&aim===0||spell==='clone'?cells.find(c=>on(c,ally)):cells.find(c=>!on(c,units))||cells[0]):cells.find(c=>on(c,targetTeam==='ally'?ally:enemy));},{spell:row.spell,aim,mechanics,targetTeam});
    assert(cell,'Valid native target');item.target=cell;await cmd(14,3,cell.hex);await p.waitForTimeout(180);
   }
   await p.waitForTimeout(400);await wait(()=>goonkMobileState.mode==='battle'&&!goonkMobileState.spellTargeting&&!goonkMobileState.animating&&goonkMobileState.canAct);await p.waitForTimeout(80);const capture=await p.evaluate(()=>{clearInterval(reviewTimer);return review;});item.frames=capture.frames;item.pixels=capture.pixels;
   if(!capture.image)capture.image=capture.fallbackImage;if(capture.image)fs.writeFileSync(out+'/'+kind+'-'+row.key+'.png',Buffer.from(capture.image.split(',')[1],'base64'));
   const raster=['affect','hit'].flatMap(stage=>row.animation[stage]||[]).some(a=>typeof a==='string'||a?.defName);if(raster)assert(capture.frames>0,'Raster animation must reach the vertical effects plane');item.visualType=raster?'raster':Object.values(row.animation).flat().some(a=>a?.effectName)?'creature color transform':'timing/projectile';if(mechanics){
    const after=await p.evaluate(()=>({units:goonkMobileState.battleUnits,ground:window.goonkBattlePlanes?.ground.toDataURL(),siege:window.goonkSiegeAtlas?.toDataURL()}));
    if(row.spell==='earthquake')assert.notEqual(after.siege,before.siege,'Native siege wall atlas changes');
    if(row.spell==='clone')assert(after.units.some(u=>u.cloned),'Native clone appears');
    if(row.spell==='teleport')assert(after.units.some(u=>{const old=before.units.find(b=>b.stackId===u.stackId);return old&&Math.hypot(u.x-old.x,u.y-old.y)>20;}),'Native stack arrives at a different hex');
    if(['quicksand','landMine','forceField','removeObstacle','fireWall'].includes(row.spell))assert.notEqual(after.ground,before.ground,'Native magical obstacle layer changes');
    if(row.spell.endsWith('Elemental'))assert(after.units.some(u=>u.key==='core:'+row.spell),'Requested native elemental is present');
   }
   if(mechanics)await p.screenshot({path:out+'/'+kind+'-original-'+row.spell+'.png'});item.status='passed';console.log('PASS',kind,row.spell,'frames',item.frames,'pixels',item.pixels);
  }catch(e){item.status='failed';item.error=e.message;throw e;}finally{fs.writeFileSync(out+'/'+kind+'-report.json',JSON.stringify(report,null,2));}
 }
 assert.deepEqual(errors,[]);assert.equal(report.cases.length,catalog.length);console.log('PASS all',catalog.length,'native spell animation definitions');
}catch(e){console.log('STATE',await p.evaluate(()=>({mode:window.goonkMobileState?.mode,active:window.goonkMobileState?.activeUnit,book:window.goonkMobileState?.spellbook,recovery:window.goonkSessionRecovery})));await p.screenshot({path:out+'/'+kind+'-failed.png'});throw e;}finally{await browser.close();}
