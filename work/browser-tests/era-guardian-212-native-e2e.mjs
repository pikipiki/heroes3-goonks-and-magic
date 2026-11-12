/** Isolated real-engine fixtures. No helper calls; cast through native UI. */
import {trainAndEngageFromMap} from './era-xp-training.mjs';
import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{execFileSync}from'node:child_process';import{createRequire}from'node:module';
if(process.env.ERA_PREVIEW_GATE!=='previewmithrilready')throw Error('Do not start before parent previewmithrilready gate');
const project=path.resolve(process.env.ERA_PROJECT||process.cwd()),output=path.resolve(process.env.ERA_E2E_OUTPUT||new URL('./results-212',import.meta.url).pathname);fs.mkdirSync(output,{recursive:true});
const{chromium}=createRequire(path.join(project,'work/browser-tests/package.json'))('playwright-core');
const browser=await chromium.connectOverCDP(process.env.CDP_URL||'http://127.0.0.1:9224'),report={engineLabel:process.env.ERA_ENGINE_LABEL||'unlabeled-preview',startedAt:new Date().toISOString(),cases:[]};
const overlayRoot=path.resolve(process.env.ERA_212_OVERLAY||path.join(project,'work/tum-reviewed/guardian-zeus')),overlayFiles=[];const collect=(d,relativeRoot=overlayRoot,filter=()=>true)=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const file=path.join(d,e.name),relative=path.relative(relativeRoot,file).split(path.sep).join('/');if(e.isDirectory())collect(file,relativeRoot,filter);else if(filter(relative))overlayFiles.push({path:relative,base64:fs.readFileSync(file).toString('base64')});}};const chasmRoot=path.resolve(process.env.ERA_231_OVERLAY||path.join(project,'work/tum-reviewed/chasm-dragon'));collect(path.join(chasmRoot,'content'),chasmRoot,name=>name.startsWith('content/Sprites/')||name.startsWith('content/Sounds/')||name==='content/config/chasm-dragon.candidate.json');collect(path.join(overlayRoot,'content'));
const context=await browser.newContext({viewport:{width:390,height:844}});
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
      o['options'].update({'type':'core:solmyr','army':opts['army'],'spellBook':['preset']+opts['spells'],'secondarySkills':{'core:wisdom':'expert'},'primarySkills':{'attack':0,'defence':0,'spellpower':25,'knowledge':50}})
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
 await p.addInitScript(({patches,policies,overlayFiles,training})=>{let module;Object.defineProperty(window,'Module',{configurable:true,get:()=>module,set:m=>{module=m;let original;Object.defineProperty(m,'callMain',{configurable:true,set:f=>original=f,get:()=>function(...args){const root='/home/web_user/.local/share/vcmi/Mods/tum-era/';for(const file of overlayFiles){const destination=root+file.path;m.FS.mkdirTree(destination.slice(0,destination.lastIndexOf('/')));m.FS.writeFile(destination,Uint8Array.from(atob(file.base64),x=>x.charCodeAt(0)));}const manifest=JSON.parse(m.FS.readFile(root+'mod.json',{encoding:'utf8'}));manifest.creatures??=[];manifest.factions??=[];manifest.creatures.push('config/chasm-dragon.candidate.json','config/guardian-zeus.candidate.json');manifest.factions.push('config/tower.candidate.json');for(const stem of ['experience-attack-spells','thunder-attacks','landing-effects']){const file=root+'content/config/era-bridge-'+stem+'.json',candidate=root+'content/config/era-bridge-'+stem+'.candidate.json';let a;try{a=JSON.parse(m.FS.readFile(file,{encoding:'utf8'}));}catch{a={schemaVersion:1,creatures:stem==='thunder-attacks'?[]:{}};}const b=JSON.parse(m.FS.readFile(candidate,{encoding:'utf8'}));if(Array.isArray(a.creatures))a.creatures=[...new Set([...a.creatures,...b.creatures])];else Object.assign(a.creatures,b.creatures);m.FS.writeFile(file,JSON.stringify(a));}const progression=JSON.parse(m.FS.readFile(root+'content/config/era-bridge-experience.json',{encoding:'utf8'})),sourceProgression=JSON.parse(m.FS.readFile(root+'content/config/era-bridge-experience.candidate.json',{encoding:'utf8'}));Object.assign(progression.creatures,sourceProgression.creatures);if(training)progression.creatures['tum-era:guardianOfZeus']={fullRank10:1,rank11Extra:1,battlePercent:100,experienceMultiplier:1,upgradeMultiplier:.75};m.FS.writeFile(root+'content/config/era-bridge-experience.json',JSON.stringify(progression));const cfg='config/e2e-native-services.json';manifest.creatures??=[];if(!manifest.creatures.includes(cfg))manifest.creatures.push(cfg);m.FS.writeFile(root+'mod.json',JSON.stringify(manifest));m.FS.writeFile(root+'content/'+cfg,JSON.stringify(patches));const policy=JSON.parse(m.FS.readFile(root+'content/config/era-bridge-runtime.json',{encoding:'utf8'}));Object.assign(policy.creatures,JSON.parse(m.FS.readFile(root+'content/config/era-bridge-runtime.candidate.json',{encoding:'utf8'})).creatures);for(const[k,v]of Object.entries(policies||{}))policy.creatures[k]=v;m.FS.writeFile(root+'content/config/era-bridge-runtime.json',JSON.stringify(policy));const file='/home/web_user/.config/vcmi/modSettings.json',settings=JSON.parse(m.FS.readFile(file,{encoding:'utf8'})),preset=settings.presets[settings.activePreset||'default'];preset.settings||={};preset.settings['wake-of-gods']||={};preset.settings['wake-of-gods'].commanders=false;m.FS.writeFile(file,JSON.stringify(settings));window.eraLandingReads=[];const originalOpen=m.FS.open;m.FS.open=function(file,...rest){if(/Burst(?:10|11)\.def|GOGFLAME\.wav/i.test(String(file)))window.eraLandingReads.push({path:String(file),at:performance.now()});return originalOpen.call(this,file,...rest);};return original.apply(m,args);}});}});},{patches:opts.patches,policies:opts.policies,overlayFiles,training:!!opts.training});
 await (await import('./silent-audio.mjs')).silenceTestAudio(p);await p.goto((process.env.GAME_ORIGIN||'http://127.0.0.1:8774')+(process.env.GAME_ENTRY||'/game.html')+'?mobile=1&choose-save=1');await wait(p,()=>window.goonkMobileState?.mode==='load');await click(p,'Retour');await wait(p,()=>window.goonkMobileState?.mode==='menu');assert.equal(await p.evaluate(()=>Module._vcmiEraBridgeVersion()),2);
 await p.evaluate(map=>{Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/000-Goonk.vmap',Uint8Array.from(atob(map),x=>x.charCodeAt(0)));window.eraSnapshots=[];window.addEventListener('goonk-state',e=>{const s=e.detail;if(s.mode==='battle')window.eraSnapshots.push(structuredClone({round:s.round,active:s.activeStack,canAct:s.canAct,units:s.battleUnits,heroMana:s.heroMana}));});},map);
 await click(p,'Nouvelle aventure');await wait(p,()=>goonkMobileState.maps?.length);const entry=(await state(p)).maps.find(m=>m.name.includes('Château Goonk'));assert(entry);await p.locator('#mobile-map-select').selectOption(String(entry.index));await wait(p,n=>goonkMobileState.selectedMap===n,entry.name);await click(p,'Commencer');await wait(p,()=>goonkMobileState.mode==='map'&&goonkMobileState.heroName);
 if(opts.training){const trained=await trainAndEngageFromMap(p,{snapshotArray:'eraSnapshots'});return trained;}
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
async function run(name,body){if(name==='armageddon-control'&&Number(process.env.ERA_CONTROL_REPEATS||1)>1){for(let n=1;n<=Number(process.env.ERA_CONTROL_REPEATS);n++)await run(name+'-'+n,body);return;}if(process.env.ERA_CASE_FILTER&&!process.env.ERA_CASE_FILTER.split(',').includes(name.replace(/-\d+$/,'')))return;const p=await context.newPage(),item={name,startedAt:new Date().toISOString(),errors:[],errorStacks:[],nativeErrors:[],wasmResponses:[]};p.on('response',r=>{if(/\.wasm(?:\?|$)/.test(r.url()))item.wasmResponses.push({url:r.url(),headers:r.headers(),at:new Date().toISOString()});});p.on('pageerror',e=>{item.errors.push(e.message);item.errorStacks.push(e.stack);});p.on('console',m=>{if(/(?:unresolved|unknown identifier|invalid.*(?:policy|bonus)|fatal error|schema.*error|unsupported multiplier)/i.test(m.text()))item.nativeErrors.push(m.text());});try{await body(p,item);assert.deepEqual(item.errors,[]);assert.deepEqual(item.nativeErrors,[]);item.passed=true;console.log(JSON.stringify({name,passed:true}));}catch(e){item.failure=e.stack;process.exitCode=1;item.state=await state(p).catch(()=>null);item.nativeLog=await p.evaluate(()=>{try{return Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'}).slice(-12000)}catch{return''}}).catch(()=>null);await p.screenshot({path:path.join(output,name+'-failure.png'),timeout:5000}).catch(()=>{});console.error(name,e.stack);}finally{item.snapshots=await p.evaluate(()=>window.eraSnapshots||[]).catch(()=>[]);report.cases.push(item);fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));await p.close();}}

const unitPatch={attack:0,damage:{min:1,max:1},speed:99,abilities:{e2eNoMorale:{type:'NO_MORALE'},e2eNoLuck:{type:'LUCK',val:0,valueType:'INDEPENDENT_MIN'}}};
const targetPatch={upgrades:[],faction:'core:tower',hitPoints:10000,attack:0,defense:0,damage:{min:0,max:0},speed:1,abilities:{e2eNoMorale:{type:'NO_MORALE'},e2eNoLuck:{type:'LUCK',val:0,valueType:'INDEPENDENT_MIN'},e2eInert:{type:'NOT_ACTIVE',subtype:'core:blind'}}};
await run('guardian212-mimic135-hero-titan-bolt',async(p,r)=>{
 await fixture(p,{army:[{type:'tum-era:guardianOfZeus',amount:1}],enemy:'core:pikeman',enemyAmount:1,spells:[],patches:{'tum-era:guardianOfZeus':unitPatch,'core:pikeman':targetPatch}});
 const before=await state(p),actor=before.battleUnits.find(u=>!u.enemy),enemy=before.battleUnits.find(u=>u.enemy);assert.equal(actor.count,1);assert.equal(actor.maximumHealth,600);assert.equal(enemy.currentHealth,10000);assert(before.heroHasSpellbook);r.before={actor,enemy,mana:before.heroMana};r.fixture={learnedSpells:[],hero:'core:solmyr',airMagic:'absent',artifact135:'not equipped; no artifact135 injected',armyMimic135:'tum-era:guardianOfZeus only'};
 // An otherwise empty native spellbook must expose the dynamic TitanBolt grant.
 // Native book "all spells" tab and first slot; target through real UI.
 await heroSpell(p,0,{target:enemy});
 await wait(p,id=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct&&goonkMobileState.battleUnits?.some(u=>u.stackId===id&&u.currentHealth<10000),enemy.stackId);
 const after=await state(p),victim=after.battleUnits.find(u=>u.stackId===enemy.stackId);assert.equal(hp(enemy)-hp(victim),600);assert.equal(after.heroMana,before.heroMana);r.after={enemy:victim,mana:after.heroMana};await p.screenshot({path:path.join(output,'guardian212-titan600-mana0.png')});
});
await run('guardian212-intrinsic-thunder-melee',async(p,r)=>{
 await fixture(p,{army:[{type:'tum-era:guardianOfZeus',amount:1}],enemy:'core:pikeman',enemyAmount:1,spells:[],patches:{'tum-era:guardianOfZeus':{...unitPatch,shots:0},'core:pikeman':targetPatch}});
 let s=await state(p);const actor=s.battleUnits.find(u=>!u.enemy),enemy=s.battleUnits.find(u=>u.enemy);assert.equal(actor.count,1);assert.equal(actor.attack,0);assert.equal(enemy.defense,0);r.fixture={shots:0,reason:'Force native melee selection without changing intrinsic Thunder policy',actor,enemy};r.samples=[];
 for(let attempt=0;attempt<60;attempt++){
  s=await state(p);const victim=s.battleUnits.find(u=>u.stackId===enemy.stackId),round=s.round;assert.equal(s.activeStack,actor.stackId);
  await p.evaluate(({x,y})=>{Module._vcmiMobilePointer(x,y,0);Module._vcmiMobilePointer(x,y,1);},victim);
  await wait(p,({round,id,h})=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct&&goonkMobileState.round>round&&goonkMobileState.battleUnits.some(u=>u.stackId===id&&u.currentHealth<h),{round,id:enemy.stackId,h:victim.currentHealth});
  const current=(await state(p)).battleUnits.find(u=>u.stackId===enemy.stackId),delta=hp(victim)-hp(current);r.samples.push({round,delta,after:current.currentHealth});assert([1,11].includes(delta),'One physical damage plus optional exact ten Thunder damage; observed'+delta);
  if(delta===11){r.observedThunderDamage=10;break;}
 }
 assert.equal(r.observedThunderDamage,10,'No Thunder proc in sixty real melee attacks');await p.screenshot({path:path.join(output,'guardian212-thunder10.png')});
});
await run('guardian212-xp-p57-expert600',async(p,r)=>{
 const trained=await fixture(p,{training:true,army:[{type:'tum-era:guardianOfZeus',amount:1},{type:'core:halberdier',amount:1}],enemy:'core:pikeman',enemyAmount:1,spells:[],patches:{'tum-era:guardianOfZeus':{...unitPatch,shots:0},'core:pikeman':targetPatch,'core:gnoll':{...targetPatch,hitPoints:2,abilities:{...targetPatch.abilities,e2eNoCounter:{type:'ADDITIONAL_RETALIATION',val:-1}}},'core:halberdier':{hitPoints:100000,speed:1,abilities:{e2eInert:{type:'NOT_ACTIVE',subtype:'core:blind'}}}}});r.training=trained;
 let s=await state(p);const actor=s.battleUnits.find(u=>!u.enemy&&u.name.includes('Thunder')),enemy=s.battleUnits.find(u=>u.enemy);assert(actor);assert.equal(actor.count,1);assert.equal(actor.attack,0);assert.equal(enemy.defense,0);r.before={actor,enemy};r.samples=[];
 // The fixture lowers progression thresholds before boot; XP itself is earned
 // by killing a real2HP Gnoll, split across two original-army stacks.
 for(let attempt=0;attempt<80;attempt++){
  s=await state(p);const victim=s.battleUnits.find(u=>u.stackId===enemy.stackId),round=s.round;assert.equal(s.activeStack,actor.stackId);
  await p.evaluate(({x,y})=>{Module._vcmiMobilePointer(x,y,0);Module._vcmiMobilePointer(x,y,1);},victim);
  await wait(p,({round,id,h})=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct&&goonkMobileState.round>round&&goonkMobileState.battleUnits.some(u=>u.stackId===id&&u.currentHealth<h),{round,id:enemy.stackId,h:victim.currentHealth});
  const current=(await state(p)).battleUnits.find(u=>u.stackId===enemy.stackId),delta=hp(victim)-hp(current);r.samples.push({round,delta,after:current.currentHealth});assert([1,11,601,611].includes(delta),'Exact physical1 + optionalThunder10 + optionalXP Titan600, got'+delta);
  if(delta>=600){r.observedXPTitanDamage=600;break;}
 }
 assert.equal(r.observedXPTitanDamage,600,'No XP Titan proc after80 real melee attacks');await p.screenshot({path:path.join(output,'guardian212-xp-titan600.png')});
});
for(const ranged of[false,true])await run('guardian212-landing-'+(ranged?'ranged':'melee'),async(p,r)=>{
 await fixture(p,{army:[{type:'tum-era:guardianOfZeus',amount:1}],enemy:'core:pikeman',enemyAmount:1,spells:[],patches:{'tum-era:guardianOfZeus':{...unitPatch,shots:ranged?24:0},'core:pikeman':targetPatch}});
 const start=await state(p),actor=start.battleUnits.find(u=>!u.enemy),enemy=start.battleUnits.find(u=>u.enemy),readsBefore=await p.evaluate(()=>eraLandingReads.length);r.before={actor,enemy};r.frames=[];
 await p.evaluate(({x,y})=>{Module._vcmiMobilePointer(x,y,0);Module._vcmiMobilePointer(x,y,1);},enemy);
 for(let n=0;n<250;n++){const file='guardian212-'+(ranged?'ranged':'melee')+'-frame-'+String(n).padStart(2,'0')+'.png';await p.screenshot({path:path.join(output,file)});r.frames.push(file);await p.waitForTimeout(45);const now=await state(p);if(now.mode==='battle'&&now.canAct&&now.round>start.round)break;}
 await wait(p,old=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct&&goonkMobileState.round>old,start.round);
 const end=await state(p),after=end.battleUnits.find(u=>u.stackId===actor.stackId);r.after=end.battleUnits;r.resourceReads=await p.evaluate(n=>eraLandingReads.slice(n),readsBefore);const expected=ranged?'Burst11.def':'Burst10.def';assert(r.resourceReads.some(x=>x.path.toLowerCase().endsWith(expected.toLowerCase())),'Native effect must actually open original'+expected);
 if(ranged){assert.equal(hp(enemy)-hp(end.battleUnits.find(u=>u.stackId===enemy.stackId)),2,'Two source ranged physical shots without melee Thunder');assert(!r.resourceReads.some(x=>/Burst10/i.test(x.path)));}else assert(r.resourceReads.some(x=>/GOGFLAME/i.test(x.path)),'Source melee sound must load');r.staticTimingProof='guardian-landing-source-evidence.json';
});
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));await context.close();await browser.close();
