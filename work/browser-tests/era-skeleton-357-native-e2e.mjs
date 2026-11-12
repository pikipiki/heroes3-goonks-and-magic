/** Isolated real-engine fixtures. No helper calls; cast through native UI. */

import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{execFileSync}from'node:child_process';import{createRequire}from'node:module';
if(process.env.ERA_PREVIEW_GATE!=='previewmithrilready')throw Error('Do not start before parent previewmithrilready gate');
const project=path.resolve(process.env.ERA_PROJECT||process.cwd()),output=path.resolve(process.env.ERA_E2E_OUTPUT||new URL('./results-357',import.meta.url).pathname);fs.mkdirSync(output,{recursive:true});
const{chromium}=createRequire(path.join(project,'work/browser-tests/package.json'))('playwright-core');
const browser=await chromium.connectOverCDP(process.env.CDP_URL||'http://127.0.0.1:9224',{timeout:120000}),report={engineLabel:process.env.ERA_ENGINE_LABEL||'unlabeled-preview',startedAt:new Date().toISOString(),cases:[]};
const taskProfile=process.env.ERA_TASK_PROFILE==='tum-completion';const context=taskProfile?browser.contexts()[0]:await browser.newContext({viewport:{width:390,height:844}});if(!context)throw Error('Task profile requires existing default context');
const wait=(p,f,a)=>p.waitForFunction(f,a,{timeout:Number(process.env.ERA_BOOT_TIMEOUT_MS||900000)}),click=(p,n)=>p.getByRole('button',{name:n,exact:true}).click(),state=p=>p.evaluate(()=>structuredClone(window.goonkMobileState));
const patchMap=opts=>execFileSync('python3',['-c',`import zipfile,io,json,sys
p,opts=sys.argv[1],json.loads(sys.argv[2])
with zipfile.ZipFile(p) as z:
 out=io.BytesIO()
 with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as result:
  for n in z.namelist():
   b=z.read(n)
   if n=='objects.json':
    objects=json.loads(b)
    for o in objects:
     if o.get('instanceName')=='goonkHero':
      o['options'].update({'type':'core:solmyr','army':opts['army'],'spellBook':['preset']+opts['spells'],'secondarySkills':{'core:wisdom':'expert','core:waterMagic':'expert','core:airMagic':'expert','core:earthMagic':'expert'},'primarySkills':{'attack':0,'defence':0,'spellpower':100,'knowledge':50}})
     if o.get('instanceName')=='trainingGuard':
      o['subtype']='core:gnoll' if opts.get('training') else opts['enemy'];o['options']['amount']=1 if opts.get('training') else opts['enemyAmount']
      if opts.get('training'):
       second=json.loads(json.dumps(o));second['instanceName']='guardianSecondGuard';second['x']=14;second['subtype']=opts['enemy'];second['options']['amount']=opts['enemyAmount']
    if opts.get('training'):objects.append(second)
    b=json.dumps(objects).encode()
   result.writestr(n,b)
 sys.stdout.buffer.write(out.getvalue())`,path.join(project,'maps/000-Goonk.vmap'),JSON.stringify(opts)]).toString('base64');
async function fixture(p,opts){
 const map=patchMap(opts);
 await p.addInitScript(({patches})=>{let module;Object.defineProperty(window,'Module',{configurable:true,get:()=>module,set:m=>{module=m;let original;Object.defineProperty(m,'callMain',{configurable:true,set:f=>original=f,get:()=>function(...args){const root='/home/web_user/.local/share/vcmi/Mods/tum-era/',manifest=JSON.parse(m.FS.readFile(root+'mod.json',{encoding:'utf8'})),cfg='config/e2e-skeleton357.json';manifest.creatures.push(cfg);m.FS.writeFile(root+'mod.json',JSON.stringify(manifest));m.FS.writeFile(root+'content/'+cfg,JSON.stringify(patches));const settingsFile='/home/web_user/.config/vcmi/modSettings.json',settings=JSON.parse(m.FS.readFile(settingsFile,{encoding:'utf8'})),preset=settings.presets[settings.activePreset||'default'];preset.settings||={};preset.settings['wake-of-gods']||={};preset.settings['wake-of-gods'].commanders=false;m.FS.writeFile(settingsFile,JSON.stringify(settings));return original.apply(m,args);}});}});},{patches:opts.patches});
 await (await import('./silent-audio.mjs')).silenceTestAudio(p);await p.goto((process.env.GAME_ORIGIN||'http://127.0.0.1:8774')+(process.env.GAME_ENTRY||'/game.html')+'?mobile=1&choose-save=1');await wait(p,()=>window.goonkMobileState?.mode==='load');await click(p,'Retour');await wait(p,()=>window.goonkMobileState?.mode==='menu');assert.equal(await p.evaluate(()=>Module._vcmiEraBridgeVersion()),2);
 await p.evaluate(map=>{Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/000-Goonk.vmap',Uint8Array.from(atob(map),x=>x.charCodeAt(0)));window.eraSnapshots=[];window.addEventListener('goonk-state',e=>{const s=e.detail;if(s.mode==='battle')window.eraSnapshots.push(structuredClone({round:s.round,active:s.activeStack,canAct:s.canAct,units:s.battleUnits,heroMana:s.heroMana}));});},map);
 await click(p,'Nouvelle aventure');await wait(p,()=>goonkMobileState.maps?.length);const entry=(await state(p)).maps.find(m=>m.name.includes('Château Goonk'));assert(entry);await p.locator('#mobile-map-select').selectOption(String(entry.index));await wait(p,n=>goonkMobileState.selectedMap===n,entry.name);await click(p,'Commencer');await wait(p,()=>goonkMobileState.mode==='map'&&goonkMobileState.heroName);
 await p.evaluate(()=>Module._vcmiMobilePointer(433,281,1));await wait(p,()=>goonkMobileState.hasPath);await click(p,'➤ Marcher');await wait(p,()=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct);assert((await state(p)).heroHasSpellbook);
}
async function heroSpell(p,slot,{target}={}){
 await click(p,'Magie');await click(p,'Sort du héros');await wait(p,()=>goonkMobileState.mode==='dialog');
 await p.evaluate(()=>{const r=goonkMobileState.rect,big=r.w>700;Module._vcmiMobilePointer(r.x+549+(big?195:0)+22,r.y+94+236+17,1);});
 await p.evaluate(slot=>{const r=goonkMobileState.rect,big=r.w>700;Module._vcmiMobilePointer(r.x+117+(big?-11:0)+85*slot+32,r.y+90+(big?-37:0)+40,1);},slot);
 await wait(p,()=>goonkMobileState.mode!=='dialog');
 if(target)await p.evaluate(({x,y})=>{Module._vcmiMobilePointer(x,y,0);Module._vcmiMobilePointer(x,y,1);},target);
}
async function closeResult(p){for(let i=0;i<5;i++){const s=await state(p);if(s.mode==='map')return;if(s.mode==='dialog')await p.evaluate(()=>Module._vcmiMobileCommand(1,0,0,0,0,0));await p.waitForTimeout(300);}await wait(p,()=>goonkMobileState.mode==='map');}
const hp=u=>(u.count-1)*u.maximumHealth+u.currentHealth;
const inertEnemy={hitPoints:10000000,speed:1,attack:0,damage:{min:1,max:1},abilities:{e2eInert:{type:'NOT_ACTIVE',subtype:'core:blind'}}};
async function run(name,body){if(name==='armageddon-control'&&Number(process.env.ERA_CONTROL_REPEATS||1)>1){for(let n=1;n<=Number(process.env.ERA_CONTROL_REPEATS);n++)await run(name+'-'+n,body);return;}if(process.env.ERA_CASE_FILTER&&!process.env.ERA_CASE_FILTER.split(',').includes(name.replace(/-\d+$/,'')))return;const p=await context.newPage();await p.setViewportSize({width:390,height:844});const item={name,startedAt:new Date().toISOString(),errors:[],errorStacks:[],nativeErrors:[],wasmResponses:[]};p.on('response',r=>{if(/\.wasm(?:\?|$)/.test(r.url()))item.wasmResponses.push({url:r.url(),headers:r.headers(),at:new Date().toISOString()});});p.on('pageerror',e=>{item.errors.push(e.message);item.errorStacks.push(e.stack);});p.on('console',m=>{if(/(?:unresolved|unknown identifier|invalid.*(?:policy|bonus)|fatal error|schema.*error|unsupported multiplier)/i.test(m.text()))item.nativeErrors.push(m.text());});try{await body(p,item);assert.deepEqual(item.errors,[]);assert.deepEqual(item.nativeErrors,[]);item.passed=true;console.log(JSON.stringify({name,passed:true}));}catch(e){item.failure=e.stack;process.exitCode=1;item.state=await state(p).catch(()=>null);item.nativeLog=await p.evaluate(()=>{try{return Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'}).slice(-12000)}catch{return''}}).catch(()=>null);await p.screenshot({path:path.join(output,name+'-failure.png'),timeout:5000}).catch(()=>{});console.error(name,e.stack);}finally{item.snapshots=await p.evaluate(()=>window.eraSnapshots||[]).catch(()=>[]);report.cases.push(item);fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));await p.close();}}

const noLuck={e2eNoMorale:{type:'NO_MORALE'},e2eNoLuck:{type:'LUCK',val:0,valueType:'INDEPENDENT_MIN'},e2eMaxLuck:{type:'LUCK',val:0,valueType:'INDEPENDENT_MAX'}},fireImmune={type:'SPELL_SCHOOL_IMMUNITY',subtype:'spellSchool.fire'},inert={type:'NOT_ACTIVE',subtype:'core:blind'};
for(const scenario of [
 {name:'cast-budget-bound',actorCount:2,corpse:'core:angel',corpseCount:10,corpseHP:150,targetName:'Skeleton Angel',targetHP:100,expected:1},
 {name:'mutable-corpse-health-bound',actorCount:10,corpse:'core:pikeman',corpseCount:10,corpseHP:3,targetName:'Skeleton',targetHP:6,expected:5},
 {name:'corpse-initial-count-bound',actorCount:10,corpse:'core:pikeman',corpseCount:3,corpseHP:100,targetName:'Skeleton',targetHP:6,expected:3}
])await run('skeleton357-'+scenario.name,async(p,r)=>{
 const actorKey='tum-era:eraCreature357';r.fixture={...scenario,actorFireImmunity:'fixture-only survive Armageddon',heroSpellPower:100,experience:'not modified',expectedFormula:'min(corpseInitialCount,floor(min(50*actorAlive,mutableCorpseHP*corpseInitialCount)/outputHP))'};
 await fixture(p,{army:[{type:actorKey,amount:scenario.actorCount},{type:scenario.corpse,amount:scenario.corpseCount}],enemy:'core:azureDragon',enemyAmount:1,spells:['core:armageddon'],patches:{[actorKey]:{upgrades:[],speed:99,attack:0,damage:{min:99999,max:99999},abilities:{...noLuck,e2eSurvive:fireImmune}},[scenario.corpse]:{upgrades:[],hitPoints:scenario.corpseHP,speed:1,abilities:{...noLuck,e2eInert:inert}},'core:azureDragon':{upgrades:[],hitPoints:1,speed:1,abilities:{...noLuck,e2eInert:inert,e2eSurvive:fireImmune}}}});
 const before=await state(p),actor=before.battleUnits.find(u=>!u.enemy&&u.name==='Skeleton Angel'),corpse=before.battleUnits.find(u=>!u.enemy&&u.stackId!==actor.stackId);assert(actor&&corpse);assert.equal(actor.count,scenario.actorCount);assert.equal(actor.remainingCasts,1);assert.equal(corpse.maximumHealth,scenario.corpseHP);assert.equal(corpse.count,scenario.corpseCount);r.before={actor,corpse};
 await heroSpell(p,0);await wait(p,id=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct&&!goonkMobileState.battleUnits.some(u=>u.stackId===id),corpse.stackId);const killed=await state(p);assert(killed.battleUnits.some(u=>u.stackId===actor.stackId&&u.count===scenario.actorCount));assert(killed.creatureCanCast,'Real creature power must be available with allied living-species corpse');r.afterKill=killed.battleUnits;
 await click(p,'Magie');await click(p,'Pouvoir de la créature');await p.waitForTimeout(150);await p.screenshot({path:path.join(output,scenario.name+'-native-power-targeting.png')});await p.evaluate(({x,y})=>{Module._vcmiMobilePointer(x,y,0);Module._vcmiMobilePointer(x,y,1);},corpse);
 await wait(p,({actorId,corpseId})=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct&&goonkMobileState.battleUnits.some(u=>!u.enemy&&u.stackId!==actorId&&u.stackId!==corpseId),{actorId:actor.stackId,corpseId:corpse.stackId});const transformed=await state(p),raised=transformed.battleUnits.find(u=>!u.enemy&&u.stackId!==actor.stackId);assert.equal(raised.name,scenario.targetName);assert.equal(raised.count,scenario.expected);assert.equal(raised.maximumHealth,scenario.targetHP);assert.equal(raised.currentHealth,scenario.targetHP);assert.equal(raised.x,corpse.x);assert.equal(raised.y,corpse.y);assert.equal(transformed.battleUnits.find(u=>u.stackId===actor.stackId).remainingCasts,0);r.afterRaise={actor:transformed.battleUnits.find(u=>u.stackId===actor.stackId),raised};await p.screenshot({path:path.join(output,scenario.name+'-raised-native.png')});
 for(let n=0;n<8;n++){const current=await state(p);if(current.mode!=='battle')break;assert(current.canAct);if(current.activeStack===actor.stackId){const enemy=current.battleUnits.find(u=>u.enemy);await p.evaluate(({x,y})=>{Module._vcmiMobilePointer(x,y,0);Module._vcmiMobilePointer(x,y,1);},enemy);}else await click(p,'⛨ Défendre');await wait(p,({round,active})=>goonkMobileState.mode!=='battle'||(goonkMobileState.canAct&&(goonkMobileState.round>round||goonkMobileState.activeStack!==active)),{round:current.round,active:current.activeStack});}
 await closeResult(p);r.afterVictory=await state(p);const units=r.afterVictory.armies.flatMap(a=>a.slots||a.stacks||[]).filter(Boolean);r.persistedUnits=units;const total=units.filter(u=>u.name===scenario.targetName).reduce((n,u)=>n+u.count,0);assert.equal(total,scenario.expected+(scenario.targetName==='Skeleton Angel'?scenario.actorCount:0),'Permanent transformed units must remain in original army after victory, beyond the original actor count');await p.screenshot({path:path.join(output,scenario.name+'-army-after-victory.png')});
});
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));if(!taskProfile)await context.close();await browser.close();
