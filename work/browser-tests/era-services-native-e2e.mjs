import {captureTumPreview} from './tum-preview-provenance.mjs';
import {chromium} from 'playwright-core';import fs from'node:fs';import assert from'node:assert/strict';import{execFileSync}from'node:child_process';
// Fixtures edit ONLY the isolated browser's filesystem, never shipped game data.
const mapFor=({army,enemy='core:skeletonWarrior',amount=40,artifacts,townArmy,primarySkills,secondarySkills,spells,heroType})=>execFileSync('python3',['-c',`import zipfile,io,json,sys
opts=json.loads(sys.argv[1])
with zipfile.ZipFile('../../maps/000-Goonk.vmap') as z:
 out=io.BytesIO()
 with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as result:
  for name in z.namelist():
   data=z.read(name)
   if name=='objects.json':
    objects=json.loads(data)
    for obj in objects:
     if obj.get('instanceName')=='goonkHero':
      obj['options']['army']=opts['army']
      if opts.get('artifacts'):obj['options']['artifacts']=opts['artifacts']
      if opts.get('primarySkills') is not None:obj['options']['primarySkills']=opts['primarySkills']
      if opts.get('secondarySkills') is not None:obj['options']['secondarySkills']=opts['secondarySkills']
      if opts.get('spells') is not None:obj['options']['spellBook']=opts['spells']
      if opts.get('heroType'):obj['options']['type']=opts['heroType']
     if obj.get('instanceName')=='goonkTown' and opts.get('townArmy'):obj['options']['army']=opts['townArmy']
     if obj.get('instanceName')=='trainingGuard':obj['subtype']=opts['enemy'];obj['options']['amount']=opts['amount']
    data=json.dumps(objects).encode()
   result.writestr(name,data)
 sys.stdout.buffer.write(out.getvalue())`,JSON.stringify({army,enemy,amount,artifacts,townArmy,primarySkills,secondarySkills,spells,heroType})]).toString('base64');
const browser=await chromium.connectOverCDP(process.env.CDP_URL||'http://127.0.0.1:9224'),report={preview:await captureTumPreview(process.env.GAME_ORIGIN||'http://127.0.0.1:8774',{sourceRuntime:process.env.ERA_SOURCE_RUNTIME==='1'}),cases:[]};
const reportPath=process.env.ERA_REPORT||'../../outputs/era-services-native-e2e.json';
const selected=(process.env.ERA_CASES||'bow,rage,rebirth,imposed,income,crystals').split(',');
const taskProfile=process.env.ERA_TASK_PROFILE==='tum-completion';
const sharedContext=taskProfile?browser.contexts()[0]:process.env.ERA_CONTEXT_MODE==='fresh'?null:await browser.newContext({viewport:{width:390,height:844}});
if(taskProfile&&!sharedContext)throw new Error('Dedicated task profile not available');
const wait=(p,f,arg,timeout=360000)=>p.waitForFunction(f,arg,{timeout});
const click=(p,name)=>p.getByRole('button',{name,exact:true}).click();
async function openFixture(p,fixture,policy,creaturePatch){
 await p.addInitScript(({creaturePatch,policy})=>{let current;Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:module=>{current=module;let nativeMain;Object.defineProperty(module,'callMain',{configurable:true,set:value=>nativeMain=value,get:()=>function(...args){const file='/home/web_user/.config/vcmi/modSettings.json',settings=JSON.parse(module.FS.readFile(file,{encoding:'utf8'})),preset=settings.presets[settings.activePreset||'default'];preset.settings||={};preset.settings['wake-of-gods']||={};preset.settings['wake-of-gods'].commanders=false;module.FS.writeFile(file,JSON.stringify(settings));if(creaturePatch){const file='/home/web_user/.local/share/vcmi/Mods/tum-era/content/config/red-bones-dragon.json',json=JSON.parse(module.FS.readFile(file,{encoding:'utf8'}));for(const [id,patch]of Object.entries(creaturePatch))Object.assign(json[id]??={},patch);module.FS.writeFile(file,JSON.stringify(json));}if(policy)module.FS.writeFile('/home/web_user/.local/share/vcmi/Mods/tum-era/content/config/era-bridge-runtime.json',JSON.stringify(policy));return nativeMain.apply(module,args);}});}});},{creaturePatch,policy});
 await p.goto((process.env.GAME_ORIGIN||'http://127.0.0.1:8774')+(process.env.GAME_ENTRY||'/game.html')+'?mobile=1'+(sharedContext?'&choose-save=1':''));if(sharedContext){await wait(p,()=>window.goonkMobileState?.mode==='load'&&window.goonkMobileState.lobbyReady,undefined,Number(process.env.ERA_BOOT_TIMEOUT_MS||900000));await click(p,'Retour');}await wait(p,()=>window.goonkMobileState?.mode==='menu');assert.equal(await p.evaluate(()=>Module._vcmiEraBridgeVersion()),2);
 await p.evaluate(({map,policy,creaturePatch})=>{const root='/home/web_user/.local/share/vcmi/';Module.FS.writeFile(root+'Maps/000-Goonk.vmap',Uint8Array.from(atob(map),c=>c.charCodeAt(0)));if(policy)Module.FS.writeFile(root+'Mods/tum-era/content/config/era-bridge-runtime.json',JSON.stringify(policy));if(creaturePatch){const file=root+'Mods/tum-era/content/config/red-bones-dragon.json',json=JSON.parse(Module.FS.readFile(file,{encoding:'utf8'}));for(const [id,patch] of Object.entries(creaturePatch))Object.assign(json[id]??={},patch);Module.FS.writeFile(file,JSON.stringify(json));}window.eraSnapshots=[];window.addEventListener('goonk-state',e=>{const s=e.detail;if(s.mode==='battle')window.eraSnapshots.push(structuredClone({round:s.round,canAct:s.canAct,active:s.activeStack,units:s.battleUnits}));});},{map:mapFor(fixture),policy,creaturePatch});
 await click(p,'Nouvelle aventure');await wait(p,()=>goonkMobileState.maps?.length);const map=(await p.evaluate(()=>goonkMobileState.maps)).find(m=>m.name.includes('Château Goonk'));assert(map);await p.locator('#mobile-map-select').selectOption(String(map.index));await wait(p,name=>goonkMobileState.selectedMap===name,map.name);await click(p,'Commencer');await wait(p,()=>{if(goonkMobileState.mode==='map'&&goonkMobileState.heroName)return true;try{return Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'}).includes('Failed to launch game:');}catch{return false;}});assert.equal(await p.evaluate(()=>goonkMobileState.mode),'map',await p.evaluate(()=>Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'}).slice(-4000)));
}
async function battle(p){await p.evaluate(()=>Module._vcmiMobilePointer(433,281,1));await wait(p,()=>goonkMobileState.hasPath);await click(p,'➤ Marcher');await wait(p,()=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct);}
const ally=p=>p.evaluate(()=>goonkMobileState.battleUnits.find(u=>!u.enemy));
const baseCreature={hitPoints:400,speed:99,attack:10,defense:10,damage:{min:1,max:1},abilities:{flying:{type:'FLYING'},noMorale:{type:'NO_MORALE'}}};
for(const name of selected){const context=sharedContext||await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),result={name,errors:[],nativeErrors:[],nativeOutput:[]};page.on('pageerror',e=>result.errors.push(e.message));page.on('console',m=>{result.nativeOutput.push(m.text());if(result.nativeOutput.length>1500)result.nativeOutput.shift();if(/(unresolved|failed to resolve identifier|identifier.*does not exists?|unknown identifier|invalid.*(?:policy|bonus)|fatal error|schema.*error)/i.test(m.text()))result.nativeErrors.push(m.text());});
 try{
  if(name==='bow'){
   await openFixture(page,{army:[{type:'core:woodElf',amount:3},{type:'core:grandElf',amount:2}],artifacts:{misc1:'tum-era:artifact218'}},null,null);
   const slots=await page.evaluate(()=>goonkMobileState.armies[0].slots.filter(Boolean));assert.equal(slots.length,2);assert.deepEqual(slots.map(s=>s.count),[3,2]);assert(slots.every(s=>s.name==='Noble Elf'),JSON.stringify(slots));result.army=slots;
  }else if(name==='rage'||name==='imposed'){
   const operation=name==='rage'?{meleeRage:{}}:{imposedSpells:[{spell:'core:bloodlust',mastery:3},{spell:'core:stoneSkin',mastery:3}]};
   await openFixture(page,{army:[{type:'tum-era:redBonesDragon',amount:1}]},{schemaVersion:1,creatures:{'tum-era:redBonesDragon':operation}},{redBonesDragon:{...baseCreature,abilities:{...baseCreature.abilities,additionalAttack:{type:'ADDITIONAL_ATTACK',val:1}}}});await battle(page);const before=await ally(page);result.before=before;
   if(name==='imposed'){assert(before.attack>=16);assert(before.defense>=16);}
   for(let action=1;action<=2;action++){
    const round=await page.evaluate(()=>goonkMobileState.round),enemy=await page.evaluate(()=>goonkMobileState.battleUnits.find(u=>u.enemy));
    await page.evaluate(({x,y})=>{Module._vcmiMobilePointer(x,y,0);Module._vcmiMobilePointer(x,y,1);},enemy);
    if(name==='rage')await wait(page,({attack,defense})=>{const a=goonkMobileState.battleUnits?.find(u=>!u.enemy);return a?.attack===attack&&a?.defense===defense;},{attack:before.attack+3*action,defense:before.defense-action});
    await wait(page,round=>goonkMobileState.round>round&&goonkMobileState.canAct&&!goonkMobileState.battleUnits.find(u=>u.stackId===goonkMobileState.activeStack)?.enemy,round);
    const after=await ally(page);result['after'+action]=after;if(name==='rage'){assert.equal(after.attack,before.attack+3*action);assert.equal(after.defense,before.defense-action);}else{assert.equal(after.attack,before.attack);assert.equal(after.defense,before.defense);}
   }
  }else if(name==='rebirth'){
   await openFixture(page,{army:[{type:'tum-era:divinePhoenix',amount:3}],enemy:'core:azureDragon',amount:1},null,{'core:azureDragon':{attack:100,damage:{min:10000,max:10000}}});await battle(page);
   for(let action=0;action<6;action++){
    const state=await page.evaluate(()=>({mode:goonkMobileState.mode,round:goonkMobileState.round,canAct:goonkMobileState.canAct,active:goonkMobileState.activeUnit?.name}));if(state.mode!=='battle')break;
    await wait(page,()=>goonkMobileState.mode!=='battle'||(goonkMobileState.canAct&&goonkMobileState.activeUnit?.name==='Divine Phoenix'));if((await page.evaluate(()=>goonkMobileState.mode))!=='battle')break;
    const round=await page.evaluate(()=>goonkMobileState.round);await click(page,'◷ Attendre');await wait(page,round=>goonkMobileState.mode!=='battle'||goonkMobileState.round>round,round);
   }
   const snapshots=await page.evaluate(()=>window.eraSnapshots);result.snapshots=snapshots;result.battleLog=await page.evaluate(()=>Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'}).split('\n').filter(line=>line.includes('CBattleConsole message:')));// Native publication at the following active turn includes 200-HP regeneration.
   result.rebirths=[1,0].map(charges=>snapshots.find(s=>s.units?.some(u=>!u.enemy&&u.count===2&&u.remainingCasts===charges)));
   assert(result.rebirths.every(Boolean),'Two charges must each produce a living two-Phoenix stack');
   const rounds=result.rebirths.map(s=>s.round);assert(rounds[1]>rounds[0],'Rebirths must occur in separate rounds');
   assert.equal(await page.evaluate(()=>goonkMobileState.mode),'dialog','After both charges are spent, a third lethal hit must end the battle');result.rounds=rounds;
  }else if(name==='vampire'||name==='vampireControl'||name==='vampireSource'){
   const percent=name==='vampireControl'?40:100;
   const actor={hitPoints:10000,speed:99,attack:0,defense:0,damage:{min:100,max:100},abilities:{flying:{type:'FLYING'},noMorale:{type:'NO_MORALE'},noRetaliation:{type:'BLOCKS_RETALIATION'},drain:{type:'LIFE_DRAIN',val:percent},noLuck:{type:'LUCK',val:0,valueType:'INDEPENDENT_MIN'}}};
   const enemy={upgrades:[],hitPoints:10000,speed:1,attack:0,defense:0,damage:{min:1,max:1},abilities:{fireShield:null,fireImmune:{type:'SPELL_SCHOOL_IMMUNITY',subtype:'spellSchool.fire'},noMorale:{type:'NO_MORALE'},inert:{type:'NOT_ACTIVE',subtype:'core:blind'}}};
   await openFixture(page,{army:[{type:'tum-era:redBonesDragon',amount:2}],enemy:'core:efreetSultan',amount:10,heroType:'core:solmyr',spells:['preset','core:armageddon'],primarySkills:{attack:0,defence:0,spellpower:10,knowledge:10},secondarySkills:{}},{schemaVersion:1,creatures:{'tum-era:redBonesDragon':{regeneration:{hitPoints:50,chancePercent:0},...(name==='vampireSource'?{vampireDrain:{}}:{})}}},{redBonesDragon:actor,'core:efreetSultan':enemy});
   await battle(page);await click(page,'Magie');await click(page,'Sort du héros');await wait(page,()=>goonkMobileState.mode==='dialog');
   await page.evaluate(()=>{const r=goonkMobileState.rect,big=r.w>700;Module._vcmiMobilePointer(r.x+549+(big?195:0)+22,r.y+94+236+17,1);});
   await page.evaluate(()=>{const r=goonkMobileState.rect,big=r.w>700;Module._vcmiMobilePointer(r.x+117+(big?-11:0)+32,r.y+90+(big?-37:0)+40,1);});
   await wait(page,()=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct&&goonkMobileState.battleUnits?.some(u=>!u.enemy&&u.currentHealth<10000));
   const before=await page.evaluate(()=>structuredClone(goonkMobileState.battleUnits));const a=before.find(u=>!u.enemy),v=before.find(u=>u.enemy);result.before={actor:a,target:v};
   await page.evaluate(({x,y})=>{Module._vcmiMobilePointer(x,y,0);Module._vcmiMobilePointer(x,y,1);},v);
   await wait(page,h=>goonkMobileState.battleUnits?.some(u=>!u.enemy&&u.currentHealth>h),a.currentHealth);
   const after=await page.evaluate(()=>structuredClone(goonkMobileState.battleUnits));const healed=after.find(u=>!u.enemy),victim=after.find(u=>u.enemy);result.after={actor:healed,target:victim};
   const hp=u=>(u.count-1)*u.maximumHealth+u.currentHealth,damage=hp(v)-hp(victim),healing=hp(healed)-hp(a);result.damage=damage;result.healing=healing;result.percent=percent;assert(damage>0);assert.equal(healing,Math.floor(damage*percent/100));
  }else if(name==='fireShield'){
   const actor={hitPoints:147,speed:99,attack:0,defense:0,damage:{min:100,max:100},abilities:{noMorale:{type:'NO_MORALE'},noRetaliation:{type:'BLOCKS_RETALIATION'},luckMin:{type:'LUCK',val:0,valueType:'INDEPENDENT_MIN'},luckMax:{type:'LUCK',val:0,valueType:'INDEPENDENT_MAX'}}};
   await openFixture(page,{army:[{type:'tum-era:eraCreature297',amount:1}],enemy:'core:efreetSultan',amount:1,primarySkills:{attack:0,defence:0,spellpower:10,knowledge:10},secondarySkills:{}},null,{'tum-era:eraCreature297':actor,'core:efreetSultan':{hitPoints:10000,speed:1,attack:0,defense:0,damage:{min:1,max:1},abilities:{flying:{type:'FLYING'},noMorale:{type:'NO_MORALE'},fireShield:{type:'FIRE_SHIELD',val:20}}}});
   await battle(page);result.before=await ally(page);assert.equal(result.before.currentHealth,147);assert.equal(result.before.attack,0);
   const target=await page.evaluate(()=>goonkMobileState.battleUnits.find(u=>u.enemy));assert.equal(target.defense,0);
   await page.evaluate(({x,y})=>{Module._vcmiMobilePointer(x,y,0);Module._vcmiMobilePointer(x,y,1);},target);
   await wait(page,()=>window.eraSnapshots.some(s=>s.units?.some(u=>!u.enemy&&u.currentHealth===127)));
   result.after=await ally(page);assert.equal(result.after.count,1);assert.equal(result.after.currentHealth,127,'Fire Shield is direct source damage: twenty HP lost, with no magical inversion or immunity');
  }else if(name==='angelic'){
   result.scenarios=[];
   const scenarios=[
    {name:'Cherub plus Angel',army:[{type:'tum-era:cherub',amount:1},{type:'core:angel',amount:1},{type:'core:imp',amount:1}],morale:3,prayer:true},
    {name:'Two split Cherubs plus Supreme',army:[{type:'tum-era:cherub',amount:1},{type:'tum-era:cherub',amount:1},{type:'wake-of-gods.level8units:supremeArchangel',amount:1},{type:'core:imp',amount:1}],morale:2,prayer:true},
    {name:'Supreme without Cherub',army:[{type:'wake-of-gods.level8units:supremeArchangel',amount:1},{type:'core:imp',amount:1}],morale:2,prayer:false}
   ];
   for(const scenario of scenarios){
    await openFixture(page,{army:scenario.army,primarySkills:{attack:0,defence:0,spellpower:10,knowledge:10},secondarySkills:{}},null,null);await battle(page);
    const imp=await page.evaluate(()=>goonkMobileState.battleUnits.find(u=>!u.enemy&&u.name==='Imp'));assert(imp);
    assert.equal(imp.morale,scenario.morale,'One original-army aura, preserving native Angel/Supreme contribution');
    assert.equal(imp.attack,scenario.prayer?6:2,'Expert Prayer from mimic artifact129');assert.equal(imp.defense,scenario.prayer?7:3);
    const log=await page.evaluate(()=>Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'}));
    const openingCasts=log.split('\n').filter(line=>/Received CPack of type .*BattleSpellCast/.test(line));
    assert.equal(openingCasts.length,scenario.prayer?1:0,'Split Cherubs must not duplicate the opening spell');
    result.scenarios.push({name:scenario.name,imp,openingCasts:openingCasts.length});
   }
  }else if(name==='crystals'){
   await openFixture(page,{army:[{type:'core:crystalDragon',amount:2},{type:'core:crystalDragon',amount:3}],townArmy:[{type:'core:azureDragon',amount:100}]},null,null);
   result.days=[];
   for(let day=0;day<7;day++){
    const before=await page.evaluate(()=>({day:goonkMobileState.day,resources:goonkMobileState.resources}));
    await click(page,'☀ Terminer le tour');await click(page,'Oui, terminer');
    await wait(page,day=>goonkMobileState.day>day&&['map','dialog'].includes(goonkMobileState.mode),before.day);
    if(await page.evaluate(()=>goonkMobileState.mode==='dialog')){
     const log=await page.evaluate(()=>Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'}));
     assert.match(log,/text=Astrologers proclaim week of the /,'Only the standard new-week notification may interrupt this fixture');
     await click(page,'✓ Valider');
    }
    await wait(page,day=>goonkMobileState.mode==='map'&&goonkMobileState.turn&&goonkMobileState.day>day,before.day);
    const after=await page.evaluate(()=>({day:goonkMobileState.day,resources:goonkMobileState.resources}));
    assert.equal(after.resources[4]-before.resources[4],1,'One crystal daily, maximum across stacks, with no extra old weekly generation');
    result.days.push({before,after});
   }
  }else if(name==='income'){
   await openFixture(page,{army:[{type:'tum-era:redBonesDragon',amount:2},{type:'tum-era:redBonesDragon',amount:3}]},{schemaVersion:1,creatures:{'tum-era:redBonesDragon':{dailyResources:{resource:'core:gems',amount:3,goldPerCreature:25}}}},null);
   const before=await page.evaluate(()=>({day:goonkMobileState.day,resources:goonkMobileState.resources}));await click(page,'☀ Terminer le tour');await click(page,'Oui, terminer');await wait(page,day=>goonkMobileState.mode==='map'&&goonkMobileState.turn&&goonkMobileState.day>day,before.day);const after=await page.evaluate(()=>({day:goonkMobileState.day,resources:goonkMobileState.resources}));assert.equal(after.resources[5]-before.resources[5],3,'Max across stacks, not sum or count');assert.equal(after.resources[6]-before.resources[6],625,'Town income 500 plus tax 25 times five creatures');result.before=before;result.after=after;
  }else throw new Error('Unknown test '+name);
  if(process.env.ERA_EXPECT_LANDING){
   const log=await page.evaluate(()=>Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'}));
   result.landingEffects=log.split('\n').filter(line=>/CPointEffectAnimation::init: effect.*tum-era\/hit-effects\/Burst16/i.test(line));
   assert(result.landingEffects.length>=2,'Both real attack actions must use the original Red Bones landing effect');
  }
  assert.deepEqual(result.errors,[]);assert.deepEqual(result.nativeErrors,[]);console.log(JSON.stringify({name,passed:true,...(result.rounds?{rebirthRounds:result.rounds}:{})}));
 }catch(e){result.failure=e.stack;process.exitCode=1;console.error(name+': '+e.stack);await page.screenshot({path:'../../outputs/era-services-'+name+'-failure.png',timeout:5000}).catch(()=>{});result.last=await page.evaluate(()=>window.goonkMobileState);result.nativeLog=await page.evaluate(()=>{try{return Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'}).slice(-12000);}catch{return '';}});}
 finally{report.cases.push(result);fs.writeFileSync(reportPath,JSON.stringify(report,null,2));await page.close();if(!sharedContext)await context.close();}
}
fs.writeFileSync(reportPath,JSON.stringify(report,null,2));if(sharedContext&&!taskProfile)await sharedContext.close();await browser.close();
