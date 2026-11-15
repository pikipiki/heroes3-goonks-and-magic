/** Private numeric MA controls; no installed production map or registry is modified. */
import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {readOriginalCampaign,readZip} from '../../scripts/era-bridge/campaigns/importer.mjs';
import {parseJsonc} from '../../scripts/era-bridge/artifacts/importer.mjs';
import {silenceTestAudio} from './silent-audio.mjs';
import {readCompletedNativeSave} from './native-save-completed.mjs';
const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8877',out=process.env.REVIEW_OUTPUT||'/tmp/goonk-campaign204-attributes';fs.mkdirSync(out,{recursive:true});
const digest=b=>crypto.createHash('sha256').update(b).digest('hex'),n=number=>({kind:'number',access:'read',number}),v=(index,access='read')=>({kind:'variable',space:'v',index:n(index),access}),text=text=>({kind:'string',access:'read',text});
const command=(receiver,selectors,code,args=[])=>({receiver,selectors,conditions:[],operations:[{code,args}]}),message=t=>command('IF',[],'M',[text(t)]);

const ma=(code,operand)=>command('MA',[],code,[n(168),operand]);
const fixture={originalMessages:['ZVSE private source creature attribute control'],initializers:[
 ma('P',v(810,'write')),ma('M',v(817,'write')),ma('E',v(818,'write')),message('ATTR before %V810/%V817/%V818'),
 ...[['P',20000],['A',50],['D',50],['M',100],['E',100]].map(([field,amount])=>ma(field,n(amount))),
 ...['P','A','D','M','E'].map((field,index)=>ma(field,v(811+index,'write'))),message('ATTR after %V811/%V812/%V813/%V814/%V815'),
 ma('P',{...n(-100),access:'relative'}),ma('P',v(816,'write')),message('ATTR relative %V816 baseline %V810/%V817/%V818'),ma('P',n(20000))],blocks:[]};
fixture.sha256=digest(JSON.stringify(fixture));
const base=readZip(fs.readFileSync('maps/003-Goonks-WoG.vmap')),header=JSON.parse(base['header.json']),objects=JSON.parse(base['objects.json']);
let heroTemplate;
for(const m of readOriginalCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc1.vcmp').maps)for(const o of Object.values(parseJsonc(m.map['objects.json'].toString()))){if(o.type==='hero')heroTemplate??=o.template;}
assert(heroTemplate);header.name='Native source attribute proof';header.mapLevels.surface.width=header.mapLevels.surface.height=72;
for(const color of ['red','blue']){header.players[color].allowedFactions={anyOf:['core:castle']};header.players[color].randomFaction=false;header.players[color].canPlay=color==='red'?'PlayerOnly':'AIOnly';}
header.players.blue.mainTown={x:63,y:63,l:0,generateHero:false};header.players.red.mainTown.generateHero=false;header.players.red.mainHero='privateOrrin';header.players.red.heroes={privateOrrin:{type:'core:orrin'}};
header.events=[{name:'private source binding',firstOccurrence:499,nextOccurrence:0,humanAffected:1,computerAffected:0,players:['red'],message:{exactStrings:fixture.originalMessages,localStrings:null,message:[0],numbers:null,stringsTextID:null}}];
const homes=objects.filter(o=>['redHome','blueHome'].includes(o.instanceName));homes.find(o=>o.instanceName==='blueHome').x=63;homes.find(o=>o.instanceName==='blueHome').y=63;for(const home of homes)home.options.buildings={allOf:['core:villageHall','core:fort'],noneOf:['core:tavern']};
const hero={instanceName:'privateOrrin',type:'hero',subtype:'knight',x:18,y:18,l:0,template:heroTemplate,options:{owner:'red',type:'core:orrin',gender:-1,experience:0,army:[{type:'wake-of-gods.creatures:gorynych',amount:1},{type:'core:pikeman',amount:1}]}};
const originalObjects=parseJsonc(readOriginalCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc1.vcmp').maps[1].map['objects.json'].toString()),opponent={...originalObjects.monster_501,instanceName:'privateGorynych',x:22,y:18};
const entries={'header.json':header,'objects.json':[...homes,hero,opponent],'surface_terrain.json':Array.from({length:72},()=>Array(72).fill('gr0_')),'english.json':JSON.parse(base['english.json'])};
const encode=entries=>execFileSync('python3',['-c',`import sys,json,zipfile,io
data=json.load(sys.stdin);out=io.BytesIO()
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED) as z:
 for name,value in data.items():z.writestr(name,json.dumps(value,separators=(',',':'),ensure_ascii=False))
sys.stdout.buffer.write(out.getvalue())`],{input:JSON.stringify(entries)});
const map=encode(entries),resetHeader={...header,name:'Native source attribute reset',events:[]},resetMap=encode({...entries,'header.json':resetHeader});fs.writeFileSync(out+'/private-source-attributes.vmap',map);

const browser=await (process.env.ATTRIBUTES_BROWSER==='webkit'?webkit:chromium).launch({headless:true}),page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(page);
const errors=[],dialogs=[],watchdog=setTimeout(()=>browser.close(),240000);page.on('pageerror',e=>{errors.push(e.message);fs.appendFileSync(out+'/page-errors.log',e.stack+'\n')});page.on('requestfailed',r=>fs.appendFileSync(out+'/requests.log',r.url()+' '+r.failure()?.errorText+'\n'));page.on('console',m=>fs.appendFileSync(out+'/console.log',m.type()+': '+m.text()+'\n'));
const state=()=>page.evaluate(()=>goonkMobileState),cmd=(...args)=>page.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]),wait=(fn,arg,timeout=90000)=>page.waitForFunction(fn,arg,{timeout});
let routedWasm=0;
if(process.env.CAMPAIGN_ENGINE_PATH)await page.context().route(/\/vcmiclient(?:\.[a-f0-9]+)?\.(js|wasm)(?:\?.*)?$/,route=>{const file=new URL(route.request().url()).pathname.endsWith('.wasm')?'vcmiclient.wasm':'vcmiclient.js';if(file.endsWith('wasm'))routedWasm++;return route.fulfill({path:path.join(process.env.CAMPAIGN_ENGINE_PATH,file),contentType:file.endsWith('wasm')?'application/wasm':'text/javascript',headers:{'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp'}});});
await page.addInitScript(({map,resetMap,fixture})=>{sessionStorage.setItem('heroes-goonk.storage-failed','true');let current;Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{current=m;const old=Object.getOwnPropertyDescriptor(m,'callMain');let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;old?.set?.call(m,f);},get:()=>function(...args){const invoke=old?.get?old.get.call(m):main,root='/home/web_user/.local/share/vcmi/',folder=root+'Mods/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns/';const registry=JSON.parse(m.FS.readFile(folder+'registry.json',{encoding:'utf8'})),entry=registry.programs.find(p=>p.id==='cave-gerfrex');if(!entry||entry.enabled)throw Error('Expected dormant registry');const program=JSON.parse(m.FS.readFile(folder+'cave-gerfrex.json',{encoding:'utf8'}));Object.assign(program,{initializers:fixture.initializers,blocks:fixture.blocks,originalMessages:fixture.originalMessages,sha256:fixture.sha256});entry.enabled=true;entry.programSha256=fixture.sha256;m.FS.writeFile(folder+'cave-gerfrex.json',JSON.stringify(program));m.FS.writeFile(folder+'registry.json',JSON.stringify(registry));m.FS.writeFile(root+'Maps/000-Native-quest-rules.vmap',new Uint8Array(map));m.FS.writeFile(root+'Maps/000-Native-attributes-reset.vmap',new Uint8Array(resetMap));return invoke.apply(m,args);}});}});},{map:[...map],resetMap:[...resetMap],fixture});


try{
 console.log('Attributes browser ready');const engine=process.env.CAMPAIGN_ENGINE_PATH?{sha256:digest(fs.readFileSync(path.join(process.env.CAMPAIGN_ENGINE_PATH,'vcmiclient.wasm')))}:await(await page.request.get(origin+'/engine-build.json')).json();assert.equal(engine.sha256,process.env.EXPECTED_ENGINE_SHA);
 console.log('Attributes navigating',origin);await page.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);
 if(process.env.ATTRIBUTES_LOAD_SAVE){const bytes=fs.readFileSync(process.env.ATTRIBUTES_LOAD_SAVE);assert.equal(digest(bytes),process.env.ATTRIBUTES_EXPECTED_SAVE_SHA);await page.evaluate(bytes=>{const root='/home/web_user/.local/share/vcmi/Saves/';Module.FS.mkdirTree(root);Module.FS.writeFile(root+'Goonk-auto.vsgm1',new Uint8Array(bytes));},[...bytes]);await cmd(23);await wait(()=>goonkMobileState.mode==='load'&&goonkMobileState.lobbyReady&&goonkMobileState.maps?.length);const entry=(await state()).maps.find(m=>/Goonk-auto/i.test(m.name+' '+m.file));assert(entry);await cmd(27,entry.index);await wait(index=>goonkMobileState.selectedIndex===index,entry.index);await cmd(22);}
 else{await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);const entry=(await state()).maps.find(m=>m.name==='Native source attribute proof');assert(entry);await page.locator('#mobile-map-select').selectOption(String(entry.index),{force:true});await wait(()=>goonkMobileState.selectedMap==='Native source attribute proof');await cmd(22);}
 const observations=[],seen=new Set();let pendingSaveSha256;
 const expected=process.env.ATTRIBUTES_LOAD_SAVE?['ATTR after 20000/50/50/100/100','ATTR relative 19900 baseline 500/25/50']:['ATTR before 500/25/50','ATTR after 20000/50/50/100/100','ATTR relative 19900 baseline 500/25/50'];
 for(let i=0;i<1200;i++){
  const current=await state();fs.writeFileSync(out+'/progress.json',JSON.stringify(current,null,2));assert.deepEqual(errors,[]);assert(!JSON.stringify(current.dialogPresentation||{}).includes('Original script error:'));
  if(current.mode==='dialog'){
   const token=current.windowToken+':'+JSON.stringify(current.dialogPresentation);if(seen.has(token)){await page.waitForTimeout(100);continue;}seen.add(token);
   const lines=current.dialogPresentation?.lines?.join(' ')||'';dialogs.push(current.dialogPresentation);
   if(lines.startsWith('ATTR ')){
    assert.equal(lines,expected[observations.length]);observations.push(lines);
    if(lines.startsWith('ATTR after')&&!process.env.ATTRIBUTES_LOAD_SAVE){assert(current.autosaveAllowed);const bytes=await readCompletedNativeSave(page,cmd);pendingSaveSha256=digest(bytes);fs.writeFileSync(out+'/pending-attributes.vsgm1',bytes);}
   }
   await cmd(1);await page.waitForTimeout(200);
  }else if(current.mode==='map'&&current.turn&&!current.campaignPending&&observations.length===expected.length)break;
  await page.waitForTimeout(100);
 }
 assert.deepEqual(observations,expected);
 async function heroStats(){await cmd(55);await wait(()=>goonkMobileState.mode==='hero');const hero=await state();await cmd(63);await wait(()=>goonkMobileState.mode==='map');return hero;}
 const modifiedHero=await heroStats(),modified=modifiedHero.troopEquipment.troops;assert.equal(modified.find(u=>u.key==='wake-of-gods.creatures:gorynych').health,20000);assert.equal(modified.find(u=>u.key==='core:pikeman').health,10);
 const mini=(await state()).mapOverview;await page.evaluate(({x,y})=>Module._vcmiMobilePointer(x,y,5),{x:Math.round(mini.rect.x+22*mini.rect.w/mini.width),y:Math.round(mini.rect.y+18*mini.rect.h/mini.height)});await page.waitForTimeout(300);const view=(await state()).mapOverview.view;await page.evaluate(({x,y})=>Module._vcmiMobilePointer(x,y,1),{x:Math.round(view.x+view.w/2),y:Math.round(view.y+view.h/2)});await wait(()=>goonkMobileState.hasPath||goonkMobileState.mode==='dialog');await cmd(2);await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.round>0);
 const battle=await state(),matching=battle.battleUnits.filter(u=>u.key==='wake-of-gods.creatures:gorynych');assert.equal(matching.length,2);assert(matching.some(u=>u.enemy)&&matching.some(u=>!u.enemy));for(const unit of matching){assert.equal(unit.maximumHealth,20000);assert(unit.attack>=50&&unit.defense>=50);if(unit.enemy){assert.equal(unit.attack,50);assert.equal(unit.defense,50);}assert.equal(unit.damageMin,100);assert.equal(unit.damageMax,100);}assert.equal(battle.battleUnits.find(u=>u.key==='core:pikeman').maximumHealth,10);
 await cmd(71);await wait(()=>goonkMobileState.mode==='menu');await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);const reset=(await state()).maps.find(m=>m.name==='Native source attribute reset');assert(reset);await page.locator('#mobile-map-select').selectOption(String(reset.index),{force:true});await wait(()=>goonkMobileState.selectedMap==='Native source attribute reset');await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn&&!goonkMobileState.campaignPending);await page.waitForTimeout(600);const resetHero=await heroStats(),resetGorynych=resetHero.troopEquipment.troops.find(u=>u.key==='wake-of-gods.creatures:gorynych');const baseline=observations.at(-1).match(/baseline (\d+)\/(\d+)\/(\d+)/).slice(1).map(Number);assert.equal(resetGorynych.health,baseline[0]);assert(resetGorynych.attack<50&&resetGorynych.defense<50);assert.equal(resetGorynych.damageMin,baseline[1]);assert.equal(resetGorynych.damageMax,baseline[2]);
 assert.deepEqual(errors,[]);if(process.env.CAMPAIGN_ENGINE_PATH)assert(routedWasm>0);
 fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,scope:'Private numeric MA source controls: actual matching owned and neutral stacks, unchanged Pikeman, replacement/relative update, pending save/reload, real battle stats and fresh game baseline in the same WASM instance. Not an original campaign victory.',engine,fixtureSha256:fixture.sha256,routedWasm,pendingSaveSha256,observations,modifiedHero,battle,resetHero,dialogs,errors},null,2));
}catch(error){fs.writeFileSync(out+'/failure-state.json',JSON.stringify(await state().catch(()=>null),null,2));await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw error;}finally{clearTimeout(watchdog);await browser.close();}
