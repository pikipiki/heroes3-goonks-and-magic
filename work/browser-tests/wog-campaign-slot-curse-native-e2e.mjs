/** Native source slot curse controls; production admissions stay intact. */
import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {readOriginalCampaign,readZip} from '../../scripts/era-bridge/campaigns/importer.mjs';
import {parseJsonc} from '../../scripts/era-bridge/artifacts/importer.mjs';
import {silenceTestAudio} from './silent-audio.mjs';
import {readCompletedNativeSave} from './native-save-completed.mjs';
const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8877',out=process.env.REVIEW_OUTPUT||'/tmp/goonk-campaign211-slot-curse';fs.mkdirSync(out,{recursive:true});
const digest=b=>crypto.createHash('sha256').update(b).digest('hex'),n=number=>({kind:'number',access:'read',number}),v=(index,access='read')=>({kind:'variable',space:'v',index:n(index),access}),text=text=>({kind:'string',access:'read',text});
const command=(receiver,selectors,code,args=[])=>({receiver,selectors,conditions:[],operations:[{code,args}]}),message=t=>command('IF',[],'M',[text(t)]);

const he=(code,args)=>command('HE',[n(0)],code,args),curse=(power,length,mode)=>he('Y',[n(2),power,length,n(mode)]);
const fixture={originalMessages:['ZVSE private slot curse controls'],blocks:[],initializers:[
 command('UN',[],'P',[n(17),v(810,'write')]),message('OPTION %V810'),
 he('A',[n(1),v(811,'write'),n(6)]),message('RING BEFORE %V811'),
 curse(n(6),n(99),2),curse(v(812,'write'),v(813,'write'),2),he('A',[n(1),v(814,'write'),n(6)]),message('LOCKED %V812/%V813/%V814'),
 curse(n(0),n(0),3),he('A',[n(1),v(815,'write'),n(6)]),message('RESTORED %V815'),
 he('A',[{...v(811),negate:true}]),he('A',[n(131)]),curse(n(6),n(99),2),he('A',[n(-131)]),curse(n(6),n(0),0),
 curse(v(816,'write'),v(817,'write'),2),he('A',[n(131)]),he('A',[n(2),n(131),v(818,'write'),v(819,'write')]),message('DELETED %V816/%V817 ELIXIR %V818/%V819'),
 curse(n(1),n(0),2),message('CURSE READY')
]};fixture.sha256=digest(JSON.stringify(fixture));
const base=readZip(fs.readFileSync('maps/003-Goonks-WoG.vmap')),header=JSON.parse(base['header.json']),objects=JSON.parse(base['objects.json']);
let heroTemplate,eventTemplate;
for(const m of readOriginalCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc1.vcmp').maps)for(const o of Object.values(parseJsonc(m.map['objects.json'].toString()))){if(o.type==='hero')heroTemplate??=o.template;if(o.type==='event')eventTemplate??=o;}
assert(heroTemplate);header.name='Native source slot curse proof';header.mapLevels.surface.width=header.mapLevels.surface.height=72;
for(const color of ['red','blue']){header.players[color].allowedFactions={anyOf:['core:castle']};header.players[color].randomFaction=false;header.players[color].canPlay=color==='red'?'PlayerOnly':'AIOnly';}
header.players.blue.mainTown={x:63,y:63,l:0,generateHero:false};header.players.red.mainTown.generateHero=false;header.players.red.mainHero='privateOrrin';header.players.red.heroes={privateOrrin:{type:'core:orrin'}};
header.events=[{name:'private source binding',firstOccurrence:499,nextOccurrence:0,humanAffected:1,computerAffected:0,players:['red'],message:{exactStrings:fixture.originalMessages,localStrings:null,message:[0],numbers:null,stringsTextID:null}}];
const homes=objects.filter(o=>['redHome','blueHome'].includes(o.instanceName));homes.find(o=>o.instanceName==='blueHome').x=63;homes.find(o=>o.instanceName==='blueHome').y=63;for(const home of homes)home.options.buildings={allOf:['core:villageHall','core:fort'],noneOf:['core:tavern']};
const hero={instanceName:'privateOrrin',type:'hero',subtype:'knight',x:18,y:18,l:0,template:heroTemplate,options:{owner:'red',type:'core:orrin',gender:-1,experience:0,army:[{type:'wake-of-gods.creatures:gorynych',amount:1},{type:'core:pikeman',amount:1},{type:'core:zombieLord',amount:1}]}};
const originalObjects=parseJsonc(readOriginalCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc1.vcmp').maps[1].map['objects.json'].toString()),opponent={...originalObjects.monster_501,instanceName:'privateGorynych',x:22,y:18};
const event={...structuredClone(eventTemplate),instanceName:'privateExperienceEvent',x:19,y:18,l:0,options:{players:['red'],humanActivate:true,computerActivate:false,removeAfterVisit:true}};
hero.options.artifacts={rightRing:'core:ringOfLife',shoulders:'core:capeOfConjuring'};
const entries={'header.json':header,'objects.json':[...homes,hero,opponent,event],'surface_terrain.json':Array.from({length:72},()=>Array(72).fill('gr0_')),'english.json':JSON.parse(base['english.json'])};
const encode=entries=>execFileSync('python3',['-c',`import sys,json,zipfile,io
data=json.load(sys.stdin);out=io.BytesIO()
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED) as z:
 for name,value in data.items():z.writestr(name,json.dumps(value,separators=(',',':'),ensure_ascii=False))
sys.stdout.buffer.write(out.getvalue())`],{input:JSON.stringify(entries)});
const map=encode(entries),resetHeader={...header,name:'Native source attribute reset',events:[]},resetMap=encode({...entries,'header.json':resetHeader});fs.writeFileSync(out+'/private-source-attributes.vmap',map);

const browserName=process.env.CURSE_BROWSER==='webkit'?'webkit':'chromium';
const browser=await (browserName==='webkit'?webkit:chromium).launch({headless:true}),page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(page);page.setDefaultTimeout(90000);
const errors=[],dialogs=[],watchdog=setTimeout(()=>browser.close(),240000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>fs.appendFileSync(out+'/console.log',m.text()+'\n'));
const state=()=>page.evaluate(()=>goonkMobileState),wait=(f,arg)=>page.waitForFunction(f,arg,{timeout:90000}),cmd=(...args)=>page.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]);
await page.addInitScript(({map,fixture})=>{sessionStorage.setItem('heroes-goonk.storage-failed','true');let current;Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{current=m;const old=Object.getOwnPropertyDescriptor(m,'callMain');let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;old?.set?.call(m,f)},get:()=>function(...args){const invoke=old?.get?old.get.call(m):main,root='/home/web_user/.local/share/vcmi/',folder=root+'Mods/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns/',registry=JSON.parse(m.FS.readFile(folder+'registry.json',{encoding:'utf8'})),entry=registry.programs.find(p=>p.id==='cave-gerfrex'),program=JSON.parse(m.FS.readFile(folder+'cave-gerfrex.json',{encoding:'utf8'}));Object.assign(program,fixture);entry.enabled=true;entry.programSha256=fixture.sha256;m.FS.writeFile(folder+'registry.json',JSON.stringify(registry));m.FS.writeFile(folder+'cave-gerfrex.json',JSON.stringify(program));m.FS.writeFile(root+'Maps/000-Slot-Curse.vmap',new Uint8Array(map));return invoke.apply(m,args)}})}})},{map:[...map],fixture});
let initialized=!!process.env.CURSE_LOAD_SAVE;
async function ready(){const seen=new Set();for(let i=0;i<1200;i++){const s=await state();fs.writeFileSync(out+'/progress.json',JSON.stringify(s,null,2));assert(!JSON.stringify(s.dialogPresentation||{}).includes('Original script error:'));if(initialized&&s.mode==='map'&&s.turn&&!s.campaignPending)return s;if(s.mode==='dialog'&&s.dialogPresentation){const key=s.windowToken+JSON.stringify(s.dialogPresentation);if(!seen.has(key)){seen.add(key);dialogs.push(s.dialogPresentation);fs.writeFileSync(out+'/dialogs.json',JSON.stringify(dialogs,null,2));if(s.dialogPresentation.lines?.includes('CURSE READY'))initialized=true;await cmd(1);}}await page.waitForTimeout(100)}throw Error('Native curse control not ready');}
async function inspect(){await cmd(55);await wait(()=>goonkMobileState.mode==='hero');const s=await state();await cmd(0);await wait(()=>goonkMobileState.mode==='map');return s;}
try{
 const engine=await(await page.request.get(origin+'/engine-build.json')).json();assert.equal(engine.sha256,process.env.EXPECTED_ENGINE_SHA);
 await page.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done');
 if(process.env.CURSE_LOAD_SAVE){const bytes=fs.readFileSync(process.env.CURSE_LOAD_SAVE);assert.equal(digest(bytes),process.env.CURSE_EXPECTED_SAVE_SHA);await page.evaluate(bytes=>{const p='/home/web_user/.local/share/vcmi/Saves/';Module.FS.mkdirTree(p);Module.FS.writeFile(p+'Goonk-auto.vsgm1',new Uint8Array(bytes))},[...bytes]);await cmd(23);await wait(()=>goonkMobileState.mode==='load'&&goonkMobileState.lobbyReady);const row=(await state()).maps.find(m=>/Goonk-auto/i.test(m.name+' '+m.file));assert(row);await cmd(27,row.index);await wait(i=>goonkMobileState.selectedIndex===i,row.index);await cmd(22);}
 else{await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);const row=(await state()).maps.find(m=>m.name==='Native source slot curse proof');assert(row);await page.locator('#mobile-map-select').selectOption(String(row.index),{force:true});await wait(()=>goonkMobileState.selectedMap==='Native source slot curse proof');await cmd(22);}
 const before=await ready();assert.equal(before.day,1);const locked=await inspect(),slot=(s,id)=>s.heroWindow.slots.find(p=>p.slot===id);
 fs.writeFileSync(out+'/locked.json',JSON.stringify(locked,null,2));assert(slot(locked,6).locked);assert(slot(locked,1).locked);assert(!slot(locked,1).name);
 assert(locked.heroWindow.backpack.some(a=>/Elixir/i.test(a.name)));
 if(!process.env.CURSE_LOAD_SAVE){const lines=dialogs.flatMap(d=>d?.lines||[]);assert(lines.includes('OPTION 0'));const baseline=Number(lines.find(s=>s.startsWith('RING BEFORE ')).split(' ').at(-1));assert(baseline>0);assert(lines.includes(`LOCKED ${6+32*(baseline+1)}/99/-1`));assert(lines.includes(`RESTORED ${baseline}`));assert(lines.includes('DELETED 0/0 ELIXIR 1/0'));}
 const save=await readCompletedNativeSave(page,cmd);assert.equal(save.readInt32LE(4),906);fs.writeFileSync(out+'/slot-curse-day1.vsgm1',save);
 await cmd(3);await wait(day=>goonkMobileState.day>day||goonkMobileState.mode==='dialog',before.day);await ready();const restored=await inspect();assert(!slot(restored,1).locked);assert(/Cape of Conjuring/i.test(slot(restored,1).name));assert(slot(restored,6).locked);
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,browser:browserName,engine,fixtureSha256:fixture.sha256,saveSha256:digest(save),loaded:!!process.env.CURSE_LOAD_SAVE,originalFlag0KeepsSlotLocked:true,mode3RestoresArtifact:true,inclusiveExpiryRestoresArtifact:true,combinedRecipeRespectsLocks:true,dialogs,locked,restored,errors},null,2));
}catch(e){fs.writeFileSync(out+'/failure-state.json',JSON.stringify(await state().catch(()=>null),null,2));await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e}finally{clearTimeout(watchdog);await browser.close()}
