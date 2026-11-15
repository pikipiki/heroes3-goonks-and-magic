/** Private native campaign carryover control. Private programs and day-two victories check scenario transitions;
 * it does not validate the original quests or victory conditions. */
import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';import {readOriginalCampaign,readZip} from '../../scripts/era-bridge/campaigns/importer.mjs';
import {readCompletedNativeSave} from './native-save-completed.mjs';
import {chromium} from 'playwright-core';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {silenceTestAudio} from './silent-audio.mjs';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-campaign183-carry';fs.mkdirSync(out,{recursive:true});
const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8877',original='mod/wake-of-gods/Mods/maps/content/maps/zc1.vcmp';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex'),n=number=>({kind:'number',access:'read',number}),v=(space,index)=>({kind:'variable',space,access:'read',index:n(index)}),text=text=>({kind:'string',access:'read',text});
const command=(receiver,selectors,code,args)=>({receiver,selectors,conditions:[],operations:[{code,args}]}),set=(space,index,value)=>command('VR',[v(space,index)],'S',[typeof value==='string'?text(value):n(value)]);
const programs=Object.fromEntries([1,2,0].map((index,order)=>{
 const initializers=order===0?[
  ...[500,501,1000,1001].map(i=>set('v',i,i===501?777:i)),...[[300,'temporary'],[301,'persistent'],[398,'Z11p_4l.pcx'],[500,'last'],[501,'discard']].map(([i,t])=>set('z',i,t)),
  command('IF',[],'V',[n(500),n(1)]),command('IF',[],'V',[n(501),n(1)]),command('IF',[],'W',[n(0)]),...[50,51,100,200].map(i=>set('w',i,i)),
  command('IF',[],'M',[text('carry seeded %V501/%Z398/%W51')])
 ]:[command('IF',[],'W',[n(0)]),command('IF',[],'M',[text('carry '+order+': %V500/%V501/%V1000/%V1001 | %Z300/%Z301/%Z398/%Z500/%Z501 | %F500/%F501 | %W50/%W51/%W100/%W200')]),command('VR',[v('v',501)],'+',[n(1)])];
 if(process.env.CARRY_CHEST_MAP&&order===0)initializers.unshift(command('CH',[n(20),n(18),n(0)],'S',[n(0)]),command('CH',[n(20),n(18),n(0)],'B',[n(0)]));
 const program={schemaVersion:1,contract:'source-campaign-erm-ast-v1',source:'private-campaign-carry-'+index,initializers,blocks:[],originalMessages:['ZVSE private campaign carryover '+index]};program.sha256=digest(JSON.stringify(program));return[index,program];
}));
const replacements={};
const headers=Object.fromEntries(readOriginalCampaign(original).maps.map((m,index)=>{if(process.env.CARRY_CHEST_MAP&&index===1){const flat=readZip(fs.readFileSync(process.env.CARRY_CHEST_MAP));m.header=JSON.parse(flat['header.json']);m.header.players.teal=m.header.players.red;delete m.header.players.red;const objects=JSON.parse(flat['objects.json']);if(process.env.CARRY_SOURCE_COMPANIONS){const hero=objects.find(o=>o.type==='hero');hero.options.army.push({type:'wake-of-gods.creatures:gorynych',amount:1},{type:'wake-of-gods.creatures:nightmare',amount:1});}for(const object of objects)if(object.options?.owner==='red')object.options.owner='teal';flat['objects.json']=Buffer.from(JSON.stringify(objects));replacements[m.member]=Object.fromEntries(Object.entries(flat).map(([key,bytes])=>[key,bytes.toString('base64')]));}
 m.header.events=[{name:'private source binding',firstOccurrence:499,nextOccurrence:0,humanAffected:1,computerAffected:0,players:['red','blue','tan','green','orange','purple','teal','pink'],message:{exactStrings:programs[index].originalMessages,localStrings:null,message:[0],numbers:null,stringsTextID:null}}];m.header.triggeredEvents={controlledVictory:{condition:['allOf',['isHuman',{value:1}],['daysPassed',{value:1}]],effect:{type:'victory'}}};return[m.member,m.header];}));
const bytes=execFileSync('python3',['-c',`import sys,json,zipfile,io
p=json.load(sys.stdin); source=zipfile.ZipFile(p['source']);out=io.BytesIO()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as target:
 for name in source.namelist():
  data=source.read(name)
  if name in p['headers']:
   old=zipfile.ZipFile(io.BytesIO(data));new=io.BytesIO()
   replacement=p['replacements'].get(name)
   if replacement:
    import base64
    oldData={k:base64.b64decode(v) for k,v in replacement.items()}
   else:oldData={k:old.read(k) for k in old.namelist()}
   with zipfile.ZipFile(new,'w',zipfile.ZIP_DEFLATED) as dest:
    for member in oldData:dest.writestr(member,json.dumps(p['headers'][name]).encode() if member=='header.json' else oldData[member])
   data=new.getvalue()
  target.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`],{input:JSON.stringify({source:original,headers,replacements})});
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(page);page.setDefaultTimeout(90000);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>fs.appendFileSync(path.join(out,'console.log'),m.text()+'\n'));
const wait=(f,arg)=>page.waitForFunction(f,arg,{timeout:90000}),cmd=(...args)=>page.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]),state=()=>page.evaluate(()=>goonkMobileState);
await page.addInitScript(({bytes,programs})=>{
 sessionStorage.setItem('heroes-goonk.storage-failed','true');let current;Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{current=m;const old=Object.getOwnPropertyDescriptor(m,'callMain');let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;old?.set?.call(m,f);},get:()=>function(...args){const invoke=old?.get?old.get.call(m):main,folder='/home/web_user/.local/share/vcmi/Mods/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns/';m.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/000-Reference-ZC1.vcmp',new Uint8Array(bytes));const registry=JSON.parse(m.FS.readFile(folder+'registry.json',{encoding:'utf8'}));if(!registry.programs.every(p=>!p.enabled))throw Error('Expected dormant production registry');registry.programs=Object.entries(programs).map(([index,program])=>{const id='private-carry-'+index;m.FS.writeFile(folder+id+'.json',JSON.stringify(program));return{id,enabled:true,resource:'config/era-campaigns/'+id,programSha256:program.sha256}});m.FS.writeFile(folder+'registry.json',JSON.stringify(registry));return invoke.apply(m,args);}});}});
},{bytes:[...bytes],programs});

try{
 const engine=await(await page.request.get(origin+'/engine-build.json')).json();assert.equal(engine.sha256,process.env.EXPECTED_ENGINE_SHA);await page.goto(origin+'/game.html?mobile=1'+(process.env.CARRY_LOAD_SAVE?'':'&new-campaign=1'));
 if(process.env.CARRY_LOAD_SAVE){await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done');await page.evaluate(bytes=>{Module.FS.mkdirTree('/home/web_user/.local/share/vcmi/Saves');Module.FS.writeFile('/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1',new Uint8Array(bytes));},[...fs.readFileSync(process.env.CARRY_LOAD_SAVE)]);await cmd(23);await wait(()=>goonkMobileState.mode==='load'&&goonkMobileState.lobbyReady&&goonkMobileState.maps?.length);const entry=(await state()).maps.find(e=>/Goonk-auto/i.test(e.name+' '+e.file));assert(entry);await cmd(27,entry.index);await wait(index=>goonkMobileState.selectedIndex===index,entry.index);await cmd(22);}
 else{await wait(()=>window.goonkMobileState?.mode==='campaign'&&goonkMobileState.lobbyReady&&goonkMobileState.campaigns?.length);
 const id=await page.evaluate(()=>goonkMobileState.campaigns.find(c=>/in the wake of gods/i.test(c.name))?.index);assert.notEqual(id,undefined);await page.locator(`[data-campaign="${id}"]`).tap();
 await wait(()=>['campaign-scenario','campaign-intro'].includes(goonkMobileState.mode));if((await state()).mode==='campaign-intro')await cmd(68);await wait(()=>goonkMobileState.mode==='campaign-scenario');
 }
 const transitions=[],messages=[],companionTransfers=[],seen=new Set();let order=Number(process.env.CARRY_RESUME_ORDER||0);const initialOrder=order;assert([0,1].includes(order));const expected=['carry seeded 777/Z11p_4l.pcx/51','carry 1: 0/777/1000/0 | /persistent/Z11p_4l.pcx/last/ | 0/1 | 0/51/100/200','carry 2: 0/778/1000/0 | /persistent/Z11p_4l.pcx/last/ | 0/1 | 0/51/100/200'];
 for(const selected of [1,2,0].slice(initialOrder)){
  if(!(process.env.CARRY_LOAD_SAVE&&order===initialOrder)){const s=await state();transitions.push(s.campaignScenario);assert.equal(s.campaignScenario.selected,selected);assert.equal(s.campaignScenario.scenarios.find(x=>x.id===selected).available,true);assert.deepEqual(s.campaignScenario.scenarios.filter(x=>x.available&&!x.completed).map(x=>x.id),[selected]);
  const bonus=page.locator('[data-campaign-bonus]').first();if(await bonus.count())await bonus.tap();await wait(()=>goonkMobileState.campaignScenario?.canStart);await cmd(67);
  await wait(()=>['map','campaign-intro','dialog'].includes(goonkMobileState.mode));if((await state()).mode==='campaign-intro')await cmd(68);}
  for(let i=0;i<600;i++){await page.waitForTimeout(100);const s=await state();if(s.mode==='map'&&s.turn)break;if(s.mode==='dialog'){const token=order+':'+s.windowToken+':'+s.dialogPresentation?.queryId;if(seen.has(token))continue;seen.add(token);if(s.dialogKind==='source-campaign'){messages.push(s.dialogPresentation.lines.join('\n'));assert.equal(messages.at(-1),process.env.CARRY_CHEST_MAP&&order>0?expected[order].replace('/1000/0 |','/0/0 |'):expected[order]);if(order<2){assert(s.autosaveAllowed);const bytes=await readCompletedNativeSave(page,cmd);assert.equal(bytes.readInt32LE(4),906);fs.writeFileSync(path.join(out,'carry-pending-'+selected+'.vsgm1'),bytes);if(order===0)fs.writeFileSync(path.join(out,'carry-pending.vsgm1'),bytes);}}await cmd(1);}}
  await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);assert.equal((await state()).cheatsAllowed,true);
  if(process.env.CARRY_SOURCE_COMPANIONS&&order>0){const s=await state(),slots=s.armies.find(a=>a.id===s.heroId).slots;const units=['wake-of-gods.creatures:gorynych','wake-of-gods.creatures:nightmare'].map(key=>({key,count:slots.filter(u=>u?.key===key).reduce((n,u)=>n+u.count,0)}));for(const u of units)assert.equal(u.count,order===1?1:0);companionTransfers.push({selected,units});}
  if(process.env.CARRY_CHEST_MAP){if(order===0){const mini=(await state()).mapOverview;await page.evaluate(m=>Module._vcmiMobilePointer(Math.round(m.rect.x+20*m.rect.w/m.width),Math.round(m.rect.y+18*m.rect.h/m.height),5),mini);await page.waitForTimeout(500);const view=(await state()).mapOverview.view;await page.evaluate(r=>Module._vcmiMobilePointer(Math.round(r.x+r.w/2),Math.round(r.y+r.h/2),1),view);await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.choices?.filter(c=>c.selectable).length===2);await page.locator('[data-dialog-choice="1"]').tap();await page.locator('[data-dialog-confirm]').tap();await wait(()=>goonkMobileState.mode==='map'&&!goonkMobileState.heroMoving);}
   await cmd(55);await wait(()=>goonkMobileState.mode==='hero'&&goonkMobileState.heroWindow);const hero=(await state()).heroWindow;assert.equal(hero.experience,-500);assert.equal(hero.level,1);fs.writeFileSync(path.join(out,'experience-'+selected+'.json'),JSON.stringify(hero,null,2));await cmd(63);await wait(()=>goonkMobileState.mode==='map');}
  assert.equal(messages.length,order-initialOrder+1,'Source initializer ran on this native campaign map');order++;if(selected===0)break;await cmd(3);
  await page.waitForTimeout(1200);fs.writeFileSync(path.join(out,'after-win-'+selected+'.json'),JSON.stringify(await state(),null,2));
  const victoryWindows=new Set();for(let i=0;i<600;i++){const s=await state();if(['campaign-scenario','campaign-intro','campaign','menu'].includes(s.mode))break;const token=s.windowToken+':'+JSON.stringify(s.dialogPresentation);if(s.mode==='dialog'&&!victoryWindows.has(token)){victoryWindows.add(token);await cmd(1);}await page.waitForTimeout(200);}
  if(selected!==0){await wait(()=>['campaign-scenario','campaign-intro'].includes(goonkMobileState.mode));if((await state()).mode==='campaign-intro')await cmd(68);await wait(()=>goonkMobileState.mode==='campaign-scenario');}
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,scope:'Private source programs, two controlled day-two victories and native persistent variables on entry to three scenarios; no original quest/victory validation',controlledVictories:2-initialOrder,enteredScenarios:[1,2,0].slice(initialOrder),loadedPending:!!process.env.CARRY_LOAD_SAVE,privateCampaignSha256:digest(bytes),programSha256:Object.fromEntries(Object.entries(programs).map(([id,p])=>[id,p.sha256])),engine,messages,transitions,companionTransfers,after:await state(),errors},null,2));
}catch(e){fs.writeFileSync(path.join(out,'failure-state.json'),JSON.stringify(await state().catch(()=>null),null,2));await page.screenshot({path:path.join(out,'failure.png')});throw e;}finally{await browser.close();}
