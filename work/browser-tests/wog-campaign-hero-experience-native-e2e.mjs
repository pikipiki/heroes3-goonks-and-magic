/** Private HE:E/DO controls; never changes a published map or registry. */
import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {readOriginalCampaign,readZip} from '../../scripts/era-bridge/campaigns/importer.mjs';
import {parseJsonc} from '../../scripts/era-bridge/artifacts/importer.mjs';
import {silenceTestAudio} from './silent-audio.mjs';
import {readCompletedNativeSave} from './native-save-completed.mjs';
const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8877',out=process.env.REVIEW_OUTPUT||'/tmp/goonk-campaign200-experience';fs.mkdirSync(out,{recursive:true});
const digest=b=>crypto.createHash('sha256').update(b).digest('hex'),n=number=>({kind:'number',access:'read',number}),v=(index,access='read')=>({kind:'variable',space:'v',index:n(index),access}),text=text=>({kind:'string',access:'read',text});
const command=(receiver,selectors,code,args=[])=>({receiver,selectors,conditions:[],operations:[{code,args}]}),message=t=>command('IF',[],'M',[text(t)]);

const relative=number=>({...n(number),access:'relative'}),local=(space,index)=>({...v(index),space}),he=(...args)=>command('HE',[n(0)],'E',args);
const inspect=(label,xp,level)=>[he(v(xp,'write'),v(level,'write')),message(label+' %V'+xp+'/%V'+level)];
const fixture={originalMessages:['ZVSE private pinned HE:E and DO control'],initializers:[message('HE:E starting'),
 ...inspect('HE:E initial',800,801),he(n(2000)),...inspect('HE:E raised',802,803),
 he(n(1000),v(804,'write')),...inspect('HE:E mixed',805,806),message('HE:E previous level %V804'),
 he(n(0)),...inspect('HE:E lowered',807,808),he(n(-1)),...inspect('HE:E negative',809,810),
 he(n(2147483647),v(811,'write')),he(relative(1),v(812,'write')),...inspect('HE:E wrapped',813,814),
 he(n(0),n(65537)),...inspect('HE:E level word',815,816),
 command('VR',[local('y',1)],'S',[n(700)]),command('DO',[n(7),n(1),n(3),n(1)],'P',[n(99)]),
 message('HE:E complete; caller %Y1')],blocks:[{receiver:'FU',selectors:[n(7)],kind:'trigger',conditions:[],commands:[
 command('VR',[local('y',1)],'+',[n(1)]),command('VR',[local('x',1)],'+',[n(1)]),command('VR',[local('x',8)],'+',[n(10)]),message('LOOP %X16 %Y1 %X1 %X8')]}]};
fixture.sha256=digest(JSON.stringify(fixture));
const base=readZip(fs.readFileSync('maps/003-Goonks-WoG.vmap')),header=JSON.parse(base['header.json']),objects=JSON.parse(base['objects.json']);
let heroTemplate;
for(const m of readOriginalCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc1.vcmp').maps)for(const o of Object.values(parseJsonc(m.map['objects.json'].toString()))){if(o.type==='hero')heroTemplate??=o.template;}
assert(heroTemplate);header.name='Native source experience proof';header.mapLevels.surface.width=header.mapLevels.surface.height=72;
for(const color of ['red','blue']){header.players[color].allowedFactions={anyOf:['core:castle']};header.players[color].randomFaction=false;header.players[color].canPlay=color==='red'?'PlayerOnly':'AIOnly';}
header.players.blue.mainTown={x:63,y:63,l:0,generateHero:false};header.players.red.mainTown.generateHero=false;header.players.red.mainHero='privateOrrin';header.players.red.heroes={privateOrrin:{type:'core:orrin'}};
header.events=[{name:'private source binding',firstOccurrence:499,nextOccurrence:0,humanAffected:1,computerAffected:0,players:['red'],message:{exactStrings:fixture.originalMessages,localStrings:null,message:[0],numbers:null,stringsTextID:null}}];
const homes=objects.filter(o=>['redHome','blueHome'].includes(o.instanceName));homes.find(o=>o.instanceName==='blueHome').x=63;homes.find(o=>o.instanceName==='blueHome').y=63;for(const home of homes)home.options.buildings={allOf:['core:villageHall','core:fort'],noneOf:['core:tavern']};
const hero={instanceName:'privateOrrin',type:'hero',subtype:'knight',x:18,y:18,l:0,template:heroTemplate,options:{owner:'red',type:'core:orrin',gender:-1,experience:0,army:[{type:'core:blackDragon',amount:10}]}};
const entries={'header.json':header,'objects.json':[...homes,hero],'surface_terrain.json':Array.from({length:72},()=>Array(72).fill('gr0_')),'english.json':JSON.parse(base['english.json'])};
const map=execFileSync('python3',['-c',`import sys,json,zipfile,io
data=json.load(sys.stdin);out=io.BytesIO()
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED) as z:
 for name,value in data.items():z.writestr(name,json.dumps(value,separators=(',',':'),ensure_ascii=False))
sys.stdout.buffer.write(out.getvalue())`],{input:JSON.stringify(entries)});fs.writeFileSync(out+'/private-source-experience.vmap',map);

const browser=await (process.env.EXPERIENCE_BROWSER==='webkit'?webkit:chromium).launch({headless:true}),page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(page);
const errors=[],dialogs=[],levels=[],watchdog=setTimeout(()=>browser.close(),240000);page.on('pageerror',e=>{errors.push(e.message);fs.appendFileSync(out+'/page-errors.log',e.stack+'\n')});page.on('requestfailed',r=>fs.appendFileSync(out+'/requests.log',r.url()+' '+r.failure()?.errorText+'\n'));page.on('console',m=>fs.appendFileSync(out+'/console.log',m.type()+': '+m.text()+'\n'));
const state=()=>page.evaluate(()=>goonkMobileState),cmd=(...args)=>page.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]),wait=(fn,arg,timeout=90000)=>page.waitForFunction(fn,arg,{timeout});
let routedWasm=0;
if(process.env.CAMPAIGN_ENGINE_PATH)await page.context().route(/\/vcmiclient(?:\.[a-f0-9]+)?\.(js|wasm)(?:\?.*)?$/,route=>{const file=new URL(route.request().url()).pathname.endsWith('.wasm')?'vcmiclient.wasm':'vcmiclient.js';if(file.endsWith('wasm'))routedWasm++;return route.fulfill({path:path.join(process.env.CAMPAIGN_ENGINE_PATH,file),contentType:file.endsWith('wasm')?'application/wasm':'text/javascript',headers:{'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp'}});});
await page.addInitScript(({map,fixture})=>{sessionStorage.setItem('heroes-goonk.storage-failed','true');let current;Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{current=m;const old=Object.getOwnPropertyDescriptor(m,'callMain');let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;old?.set?.call(m,f);},get:()=>function(...args){const invoke=old?.get?old.get.call(m):main,root='/home/web_user/.local/share/vcmi/',folder=root+'Mods/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns/';const registry=JSON.parse(m.FS.readFile(folder+'registry.json',{encoding:'utf8'})),entry=registry.programs.find(p=>p.id==='cave-gerfrex');if(!entry||entry.enabled)throw Error('Expected dormant registry');const program=JSON.parse(m.FS.readFile(folder+'cave-gerfrex.json',{encoding:'utf8'}));Object.assign(program,{initializers:fixture.initializers,blocks:fixture.blocks,originalMessages:fixture.originalMessages,sha256:fixture.sha256});entry.enabled=true;entry.programSha256=fixture.sha256;m.FS.writeFile(folder+'cave-gerfrex.json',JSON.stringify(program));m.FS.writeFile(folder+'registry.json',JSON.stringify(registry));m.FS.writeFile(root+'Maps/000-Native-quest-rules.vmap',new Uint8Array(map));return invoke.apply(m,args);}});}});},{map:[...map],fixture});


try{
 console.log('Experience browser ready');const engine=process.env.CAMPAIGN_ENGINE_PATH?{sha256:digest(fs.readFileSync(path.join(process.env.CAMPAIGN_ENGINE_PATH,'vcmiclient.wasm')))}:await(await page.request.get(origin+'/engine-build.json')).json();assert.equal(engine.sha256,process.env.EXPECTED_ENGINE_SHA);
 console.log('Experience navigating',origin);await page.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);
 if(process.env.EXPERIENCE_LOAD_SAVE){const bytes=fs.readFileSync(process.env.EXPERIENCE_LOAD_SAVE);assert.equal(digest(bytes),process.env.EXPERIENCE_EXPECTED_SAVE_SHA);await page.evaluate(bytes=>{const root='/home/web_user/.local/share/vcmi/Saves/';Module.FS.mkdirTree(root);Module.FS.writeFile(root+'Goonk-auto.vsgm1',new Uint8Array(bytes));},[...bytes]);await cmd(23);await wait(()=>goonkMobileState.mode==='load'&&goonkMobileState.lobbyReady&&goonkMobileState.maps?.length);const entry=(await state()).maps.find(m=>/Goonk-auto/i.test(m.name+' '+m.file));assert(entry);await cmd(27,entry.index);await wait(index=>goonkMobileState.selectedIndex===index,entry.index);await cmd(22);}
 else{await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);const entry=(await state()).maps.find(m=>m.name==='Native source experience proof');assert(entry);await page.locator('#mobile-map-select').selectOption(String(entry.index),{force:true});await wait(()=>goonkMobileState.selectedMap==='Native source experience proof');await cmd(22);}
 let complete=false,seen=new Set(),midpointSha256;
 for(let i=0;i<1600;i++){
  const s=await state();fs.writeFileSync(out+'/progress.json',JSON.stringify(s,null,2));const model=s.dialogPresentation,body=JSON.stringify(model||{});assert(!body.includes('Original script error:'));assert.deepEqual(errors,[]);
  if(s.mode==='map'&&s.turn&&!s.campaignPending&&!s.heroMoving&&complete)break;
  if(s.mode==='dialog'){
   const token=s.windowToken+':'+body;if(seen.has(token)){await page.waitForTimeout(100);continue;}seen.add(token);
   if(model?.title==='Level up'){assert.equal(s.autosaveAllowed,false);levels.push(s);const choice=model?.choices?.find(c=>c.selectable);assert(choice);await page.evaluate(r=>Module._vcmiMobilePointer(Math.round(r.x+r.w/2),Math.round(r.y+r.h/2),1),choice.rect);await cmd(1);}
   else{dialogs.push(model);const lines=model?.lines?.join(' ')||'';if(lines.includes('LOOP 2 2 101 20')&&!process.env.EXPERIENCE_LOAD_SAVE){const bytes=await readCompletedNativeSave(page,cmd);assert.equal(bytes.readInt32LE(4),906);fs.writeFileSync(out+'/loop-middle.vsgm1',bytes);midpointSha256=digest(bytes);}if(lines.includes('HE:E complete; caller 700'))complete=true;await cmd(1);}
  }
  await page.waitForTimeout(100);if(i===1599)throw Error('Experience control did not complete');
 }
 assert(complete);const all=dialogs.map(d=>d.lines?.join(' ')||'');for(const expected of process.env.EXPERIENCE_LOAD_SAVE?['LOOP 2 2 101 20','LOOP 3 3 102 30','HE:E complete; caller 700']:['HE:E initial 0/1','HE:E raised 2000/3','HE:E mixed 1000/3','HE:E previous level 3','HE:E lowered 0/1','HE:E negative -1/0','HE:E wrapped -2147483648/0','HE:E level word 0/1','LOOP 1 1 100 10','LOOP 2 2 101 20','LOOP 3 3 102 30','HE:E complete; caller 700'])assert(all.some(s=>s.includes(expected)),expected+' missing: '+all.join('; '));
 await cmd(55);await wait(()=>goonkMobileState.mode==='hero'&&goonkMobileState.heroWindow);const hero=(await state()).heroWindow;assert.equal(hero.experience,0);assert.equal(hero.level,1);await cmd(63);await wait(()=>goonkMobileState.mode==='map');const bytes=await readCompletedNativeSave(page,cmd);fs.writeFileSync(out+'/complete.vsgm1',bytes);assert.deepEqual(errors,[]);if(process.env.CAMPAIGN_ENGINE_PATH)assert(routedWasm>0);fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,engine,fixtureSha256:fixture.sha256,routedWasm,midpointSha256,completedSaveSha256:digest(bytes),hero,dialogs,levels,errors},null,2));
}catch(error){fs.writeFileSync(out+'/failure-state.json',JSON.stringify(await state().catch(()=>null),null,2));await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw error;}finally{clearTimeout(watchdog);await browser.close();}
