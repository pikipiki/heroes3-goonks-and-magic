import {chromium} from 'playwright-core';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-native-spell-estimates';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true}),p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,serviceWorkers:'block'}),errors=[];
p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(180000);
const wait=(f,arg)=>p.waitForFunction(f,arg,{timeout:180000}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]),state=()=>p.evaluate(()=>structuredClone(goonkMobileState));
const report={scope:'Original native spells; test-only extra hero casts, no altered spell payloads or combat rules',cases:[]};
try{
 await silenceTestAudio(p);await p.addInitScript(()=>{
  sessionStorage.setItem('heroes-goonk.storage-failed','true');localStorage.setItem('heroes-goonk.language','fr');
  const previous=Object.getOwnPropertyDescriptor(window,'Module');let current;
  Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{previous?.set?.call(window,m);current=m;const prior=Object.getOwnPropertyDescriptor(m,'callMain');let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;prior?.set?.call(m,f)},get:()=>function(...args){
   const root='/home/web_user/.local/share/vcmi/Mods/goonk/',manifest=JSON.parse(m.FS.readFile(root+'mod.json',{encoding:'utf8'}));manifest.artifacts??=[];manifest.artifacts.push('config/spell-estimates-review.json');
   m.FS.writeFile(root+'mod.json',JSON.stringify(manifest));m.FS.writeFile(root+'Content/config/spell-estimates-review.json',JSON.stringify({'core:spellBook':{bonuses:{reviewCasts:{type:'HERO_SPELL_CASTS_PER_COMBAT_TURN',val:1000}}}}));
   return (prior?.get?prior.get.call(m):main).apply(m,args);
  }});}});
 });
 await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8998')+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done');
 const fixture=execFileSync('python3',['-c',`import zipfile,json,io,sys
out=io.BytesIO()
with zipfile.ZipFile('maps/000-Goonk.vmap')as src,zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED)as dst:
 for name in src.namelist():
  data=src.read(name)
  if name=='objects.json':
   objects=[o for o in json.loads(data)if o.get('instanceName')!='trainingOgre']
   for o in objects:
    if o.get('instanceName')=='goonkHero':o['x']=8;o['y']=9;o['options'].update({'type':'core:christian','spellBook':['core:magicArrow','core:fireball','core:chainLightning','core:cure','core:resurrection'],'artifacts':{'spellbook':'core:spellBook'},'primarySkills':{'attack':0,'defence':50,'spellpower':1,'knowledge':100},'secondarySkills':{'core:wisdom':'expert','core:airMagic':'basic','core:fireMagic':'basic','core:waterMagic':'basic','core:earthMagic':'advanced'},'army':[{'type':'core:marksman','amount':200},{'type':'core:halberdier','amount':100},{'type':'core:pikeman','amount':1}]})
    if o.get('instanceName')=='trainingGuard':o['x']=12;o['y']=9;o['subtype']='core:skeleton';o['options']['amount']=200
   data=json.dumps(objects).encode()
  dst.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`]);
 await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture]);
 await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await cmd(21);await wait(()=>goonkMobileState.selectedMap?.startsWith('000'));await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);await cmd(6);await p.waitForTimeout(250);await p.evaluate(()=>Module._vcmiMobilePointer(433,281,4));await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='battle');await cmd(15);await p.waitForTimeout(250);if((await state()).canEndTactics)await cmd(35);await wait(()=>goonkMobileState.canAct&&goonkMobileState.battleLossEstimatesVersion>=2);
 const choose=async id=>{await cmd(14);await wait(()=>goonkMobileState.mode==='spellbook');await cmd(49,id);await wait(id=>goonkMobileState.mode==='battle'&&goonkMobileState.spellTargeting&&goonkMobileState.selectedSpellId===id,id);};
 const settle=()=>wait(()=>goonkMobileState.mode==='battle'&&!goonkMobileState.spellTargeting&&goonkMobileState.canAct&&!goonkMobileState.battleCamera?.active);
 const cancel=async()=>{await cmd(14,2);await settle();};
 const cast=async unit=>{const snapshot=await state(),sequence=snapshot.battleCamera?.sequence??0,cell=snapshot.battleCells.find(c=>c.spellTarget&&Math.hypot(c.x-unit.x,c.y-unit.y)<16);assert(cell,'Native legal target '+unit.name);await cmd(14,3,cell.hex);await wait(sequence=>(goonkMobileState.battleCamera?.sequence??0)>sequence,sequence);await settle();};
 for(const [id,name]of [[15,'magicArrow'],[19,'chainLightning']]){
  await choose(id);const before=await state(),target=before.battleUnits.find(u=>u.enemy&&u.spellEstimate);assert(target,name+' native offensive forecast');assert(target.spellEstimate.unitsDelta<=0);const stable=JSON.stringify(before.battleUnits);await p.waitForTimeout(900);assert.equal(JSON.stringify((await state()).battleUnits),stable,'Idle previews do not mutate armies or consume RNG');await p.screenshot({path:out+'/'+name+'.png'});const forecast=target.spellEstimate;await cast(target);const after=(await state()).battleUnits.find(u=>u.stackId===target.stackId);assert.equal((after?.count||0)-target.count,forecast.unitsDelta,'Primary target actual losses match native forecast '+name);report.cases.push({name,forecast,before:target.count,after:after?.count||0});
 }
 await choose(21);let before=await state(),target=before.battleUnits.find(u=>u.key==='core:halberdier');assert(target?.spellEstimate?.unitsDelta<0,'Area spell predicts friendly collateral when aimed there');let forecast=target.spellEstimate;await cast(target);let after=(await state()).battleUnits.find(u=>u.stackId===target.stackId);assert.equal(after.count-target.count,forecast.unitsDelta,'Native fireball casualties match forecast');report.cases.push({name:'fireball',forecast,before:target.count,after:after.count});
 await choose(37);before=await state();target=before.battleUnits.find(u=>u.key==='core:halberdier');assert.equal(target.spellEstimate.unitsDelta,0,'Cure does not resurrect creatures');assert(target.spellEstimate.hpDelta>0&&target.spellEstimate.hpDelta<=target.maximumHealth-target.currentHealth,'Cure HP gain is capped to actual first-unit injury');forecast=target.spellEstimate;await cast(target);after=(await state()).battleUnits.find(u=>u.stackId===target.stackId);assert.equal(after.count,target.count);assert.equal(after.currentHealth-target.currentHealth,forecast.hpDelta);report.cases.push({name:'cure',forecast});
 await choose(38);before=await state();target=before.battleUnits.find(u=>u.key==='core:halberdier');assert(target.spellEstimate.unitsDelta>0,'Resurrection forecasts regained creatures');forecast=target.spellEstimate;await cast(target);after=(await state()).battleUnits.find(u=>u.stackId===target.stackId);assert.equal(after.count-target.count,forecast.unitsDelta);report.cases.push({name:'resurrection',forecast});
 await choose(21);before=await state();target=before.battleUnits.find(u=>u.key==='core:pikeman');if(target){assert.equal(target.count,1);await cast(target);assert(!(await state()).battleUnits.some(u=>u.stackId===target.stackId),'Dead stack stays out of normal living UI');}else await cancel();
 await choose(38);before=await state();target=before.battleUnits.find(u=>u.key==='core:pikeman');assert(target?.spellCorpse&&target.count===0&&target.spellEstimate.unitsDelta===1,'Only legal corpse targets return with an anchored gain forecast');assert(target.countBounds?.w>0,'Corpse forecast uses native count anchor');forecast=target.spellEstimate;await p.screenshot({path:out+'/corpse-resurrection.png'});await cast(target);after=(await state()).battleUnits.find(u=>u.stackId===target.stackId);assert.equal(after.count,1);report.cases.push({name:'corpse-resurrection',forecast});
 assert.deepEqual(errors,[]);console.log('PASS original native offensive/area/chain/cure/resurrection/corpse forecasts, idle stability and actual cast agreement');
}catch(e){await p.screenshot({path:out+'/failed.png'});fs.writeFileSync(out+'/failed-state.json',JSON.stringify(await state(),null,2));throw e;}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}
