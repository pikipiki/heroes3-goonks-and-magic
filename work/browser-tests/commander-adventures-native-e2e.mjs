import {chromium} from 'playwright-core';import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';import {silenceTestAudio} from './silent-audio.mjs';
const project=Number(process.env.PROJECT||0);const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-adventures-native-'+project;fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});let p;const messages=[],errors=[];
try{
 p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(p);p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{messages.push(m.type()+': '+m.text());fs.appendFileSync(path.join(out,'live-console.log'),m.type()+': '+m.text()+'\n');if(m.type()==='error')console.log(m.text().slice(0,180));});
 await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));
 await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8781')+(process.env.GAME_PATH||'/game.html')+'?mobile=1');
 const wait=(fn,arg,timeout=60000)=>p.waitForFunction(fn,arg,{timeout}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]),state=()=>p.evaluate(()=>goonkMobileState);
 await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);console.log('PASS native engine load');
 const fixture=execFileSync('python3',['-c',`import zipfile,json,io,sys,importlib.util,os
spec=importlib.util.spec_from_file_location('adv','scripts/place-adventure-objects.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
out=io.BytesIO()
with zipfile.ZipFile('maps/000-Goonk.vmap') as src,zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as dst:
 for name in src.namelist():
  data=src.read(name)
  if name in ['english.json','french.json']:
   t=json.loads(data);t['mapName']='000 - Goonk adventures test';data=json.dumps(t).encode()
  if name=='header.json':
   h=json.loads(data);h['name']='000 - Goonk adventures test';data=json.dumps(h).encode()
  if name=='objects.json':
   o=json.loads(data);o=[a for a in o if not a['instanceName'].startswith('goonkAdventure') and a['instanceName'] not in ['trainingGuard','trainingOgre']]
   for a in o:
    if a['instanceName']=='goonkHero':a['options'].update({'type':'core:christian','secondarySkills':{'core:wisdom':'basic'},'artifacts':{'mach1':'core:ballista','mach2':'core:ammoCart','mach3':'core:firstAidTent'}})
   if os.environ.get('PROJECT')=='1':
    for a in o:
     if a['instanceName']=='goonkHero':a['options']['army']=[{'type':'core:ancientBehemoth','amount':2}]
   o += [m.adventure_object('adventureCache',10,11,'testCache'),m.adventure_object('adventureWorkshop',13,11,'testWorkshop'),m.adventure_object('adventureWorkshop',13,14,'secondWorkshop'),m.adventure_object('adventureAcademy',17,16,'testAcademy')]
   o.append({'type':'core:monster','subtype':'core:masterGremlin' if os.environ.get('PROJECT')=='1' else 'core:pikeman','instanceName':'battleGuard','x':17,'y':11,'l':0,'template':{'animation':'AVWgreX0.def' if os.environ.get('PROJECT')=='1' else 'AVWpikX0.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{'amount':100 if os.environ.get('PROJECT')=='1' else 30,'character':'savage','neverFlees':True}})
   data=json.dumps(o).encode()
  dst.writestr(name,data)
spec=importlib.util.spec_from_file_location('normalizer','scripts/normalize-map-instances.py');n=importlib.util.module_from_spec(spec);spec.loader.exec_module(n)
with zipfile.ZipFile(io.BytesIO(out.getvalue())) as z:entries={name:z.read(name) for name in z.namelist()}
entries=n.normalize(entries);normalized=io.BytesIO()
with zipfile.ZipFile(normalized,'w',zipfile.ZIP_DEFLATED) as dst:
 for name,data in entries.items():dst.writestr(name,data)
sys.stdout.buffer.write(normalized.getvalue())`]);
 await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture]);
 await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await cmd(21);await wait(()=>goonkMobileState.selectedMap==='000 - Goonk adventures test');await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);console.log('PASS new fixture game');
 await p.locator('[data-ui=heroes]').tap();await wait(()=>goonkMobileState.mode==='hero');await cmd(85);await wait(()=>goonkMobileState.dialogPresentation?.commanderTree?.abilities?.length===15);
 const baseline=(await state()).dialogPresentation.commanderTree;assert.equal(baseline.skills.length,6);assert(baseline.abilities.every(a=>a.description&&!a.description.includes('PLACEHOLDER')));fs.writeFileSync(path.join(out,'tree-baseline.json'),JSON.stringify(baseline,null,2));
 await p.locator('[data-commander-tree]').tap();
 for(const viewport of [{width:390,height:844},{width:844,height:390},{width:768,height:1024},{width:1024,height:768}]){await p.setViewportSize(viewport);await p.waitForTimeout(200);assert.equal(await p.locator('[data-tree-ability]').count(),15);assert(await p.locator('.dialog-copy').evaluate(e=>getComputedStyle(e).display==='none'),'Tree replaces the old details panel');await p.screenshot({path:path.join(out,'tree-'+viewport.width+'x'+viewport.height+'.png')});}
 await p.locator('[data-dialog-confirm]').tap();await wait(()=>goonkMobileState.mode==='hero');await p.locator('[data-hero-close]').tap();await wait(()=>goonkMobileState.mode==='map');
 await cmd(29,5);await wait(()=>goonkMobileState.dialogPresentation?.title==='Level up');await p.locator('[data-dialog-confirm]').tap();await wait(()=>goonkMobileState.dialogKind==='commander-level-up');
 await p.locator('[data-commander-tree]').tap();const before=(await state()).dialogPresentation.commanderTree.skills[0].rank;
 await p.locator('[data-tree-choose="0"]').tap();await wait(()=>goonkMobileState.dialogPresentation.commanderTree.selectedSkill===0);assert.equal((await state()).dialogPresentation.commanderTree.skills[0].rank,before,'Selecting alone never grants a skill');await p.locator('[data-dialog-confirm]').tap();await wait(()=>goonkMobileState.mode==='map');
 await p.locator('[data-ui=heroes]').tap();await wait(()=>goonkMobileState.mode==='hero');await cmd(85);await wait(()=>goonkMobileState.dialogKind==='commander');assert.equal((await state()).dialogPresentation.commanderTree.skills[0].rank,before+1);await p.locator('[data-dialog-confirm]').tap();await wait(()=>goonkMobileState.mode==='hero');await p.locator('[data-hero-close]').tap();await wait(()=>goonkMobileState.mode==='map');console.log('PASS native commander graph and confirmed level-up');
 if(process.env.COMMANDER_ONLY==='1'){assert.deepEqual(errors,[]);console.log('PASS commander-only native inspection and confirmed level-up');await browser.close();process.exit(0);}
 if(project===0){
  const gain=async()=>{await cmd(29,5);await wait(()=>goonkMobileState.dialogPresentation?.title==='Level up'||goonkMobileState.dialogKind==='commander-level-up');if((await state()).dialogKind!=='commander-level-up'){await p.locator('[data-dialog-confirm]').tap();await wait(()=>goonkMobileState.dialogKind==='commander-level-up');}};
  for(const skill of [0,0,0,4,4,4,4]){await gain();await cmd(96,skill);await wait(id=>goonkMobileState.dialogPresentation.commanderTree.selectedSkill===id,skill);await p.locator('[data-dialog-confirm]').tap();await wait(()=>goonkMobileState.mode==='map');}
  await gain();let graph=(await state()).dialogPresentation.commanderTree;assert(graph.abilities.find(a=>a.id===103).selectable);const selected=graph.selectedSkill;await cmd(96,999);await cmd(96,100);await p.waitForTimeout(100);assert.equal((await state()).dialogPresentation.commanderTree.selectedSkill,selected,'Invalid and locked abilities cannot change the selection');
  await p.locator('[data-commander-tree]').tap();await p.locator('[data-tree-choose="103"]').scrollIntoViewIfNeeded();await p.locator('[data-tree-choose="103"]').tap();await wait(()=>goonkMobileState.dialogPresentation.commanderTree.selectedSkill===103);await p.locator('[data-dialog-confirm]').tap();await wait(()=>goonkMobileState.mode==='map');
  await p.locator('[data-ui=heroes]').tap();await wait(()=>goonkMobileState.mode==='hero');await cmd(85);await wait(()=>goonkMobileState.dialogKind==='commander');assert((await state()).dialogPresentation.commanderTree.abilities.find(a=>a.id===103).learned);await p.locator('[data-commander-tree]').tap();await p.screenshot({path:path.join(out,'tree-learned.png')});await p.locator('[data-dialog-confirm]').tap();await wait(()=>goonkMobileState.mode==='hero');await p.locator('[data-hero-close]').tap();await wait(()=>goonkMobileState.mode==='map');console.log('PASS native Master combination unlock, acquisition and locked-choice rejection');
 }

 await cmd(29,1);await p.waitForTimeout(200);await cmd(6);await p.waitForTimeout(200);
 // Coordinates are transformed from the engine's current hero-centred map view.
 let hx=8,hy=11;
 const visit=async(x,y,expected='dialog')=>{await cmd(6);await p.waitForTimeout(150);const target=await p.evaluate(({dx,dy})=>{const v=goonkMobileState.mapOverview.view;return {x:Math.round(v.x+v.w/2+dx*32),y:Math.round(v.y+v.h/2+dy*32)}},{dx:x-hx,dy:y-hy});await p.evaluate(t=>Module._vcmiMobilePointer(t.x,t.y,1),target);await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(mode=>goonkMobileState.mode===mode,expected);hx=x;hy=y;};
 // Cache: no reward before confirmation, one exclusive reward afterwards.
 const treasury=(await state()).resources[6];await visit(10,11);await wait(()=>goonkMobileState.dialogPresentation?.choices?.length===2||goonkMobileState.dialogPresentation?.choices?.length===3);
 let d=(await state()).dialogPresentation;fs.writeFileSync(path.join(out,'cache.json'),JSON.stringify(d,null,2));assert(d.choices.every(c=>c.selectable));assert(d.choices[0].label.includes('1500'));assert.equal((await state()).resources[6],treasury);await p.locator('[data-dialog-choice="0"]').tap();await p.locator('[data-dialog-confirm]').tap();await wait(g=>goonkMobileState.mode==='map'&&goonkMobileState.resources[6]===g+1500,treasury);console.log('PASS native exclusive cache reward');
 await visit(12,11);d=(await state()).dialogPresentation;fs.writeFileSync(path.join(out,'workshop.json'),JSON.stringify(d,null,2));assert.equal(d.choices.length,3,'All machines available in fixture');assert(d.choices[0].label.includes('Ballista'));assert(d.cancel);const gold=(await state()).resources[6];
 await p.locator('[data-dialog-cancel]').tap();await wait(()=>goonkMobileState.mode==='map');assert.equal((await state()).resources[6],gold);console.log('PASS workshop cancellation has no cost');
 await visit(12,14);await p.locator(`[data-dialog-choice="${project}"]`).tap();await p.locator('[data-dialog-confirm]').tap();const price=project===2?1000:1500;await wait(g=>goonkMobileState.mode==='map'&&goonkMobileState.resources[6]===g,gold-price);console.log('PASS native workshop payment exactly once',project);
 const afterProject=(await state()).resources[6];await visit(12,11);assert(!((await state()).dialogPresentation.choices||[]).some(c=>c.selectable),'Another workshop cannot grant a second project');await p.locator('[data-dialog-confirm]').tap();await wait(()=>goonkMobileState.mode==='map');assert.equal((await state()).resources[6],afterProject);console.log('PASS no repeat project across workshops');
 await visit(16,16);d=(await state()).dialogPresentation;assert.equal(d.choices.length,3);assert(d.choices[0].label.includes('+1 Attack'));await p.locator('[data-dialog-choice="0"]').tap();await p.locator('[data-dialog-confirm]').tap();await wait(g=>goonkMobileState.mode==='map'&&goonkMobileState.resources[6]===g-1000,afterProject);console.log('PASS academy native training and exact payment');
 const beforeSave=await state();await cmd(7);await wait(()=>Module.FS.readdir('/home/web_user/.local/share/vcmi/Saves').some(n=>/Goonk-mobile/i.test(n)));await p.waitForTimeout(500);
 const saves=await p.evaluate(()=>{const root='/home/web_user/.local/share/vcmi/Saves';return Module.FS.readdir(root).filter(n=>/^Goonk-mobile/i.test(n)).map(n=>({name:n,bytes:Array.from(Module.FS.readFile(root+'/'+n))}));});fs.writeFileSync(path.join(out,'save-files.json'),JSON.stringify(saves.map(s=>({name:s.name,size:s.bytes.length})),null,2));assert(saves.length>=1);await p.close();
 p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(p);p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>messages.push(m.type()+': '+m.text()));await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8781')+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);
 await p.evaluate(files=>{const root='/home/web_user/.local/share/vcmi/Saves';Module.FS.mkdirTree(root);for(const f of files)Module.FS.writeFile(root+'/'+f.name,new Uint8Array(f.bytes));},saves);await cmd(23);await wait(()=>goonkMobileState.mode==='load'&&goonkMobileState.lobbyReady&&goonkMobileState.maps?.length);let save=(await state()).maps.find(s=>/Goonk-mobile/i.test(s.name+' '+s.file));assert(save);await cmd(27,save.index);await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);assert.deepEqual((await state()).resources,beforeSave.resources);console.log('PASS resource persistence after actual save/load');
 hx=16;hy=16;await visit(12,11);assert(!((await state()).dialogPresentation.choices||[]).some(c=>c.selectable));await p.locator('[data-dialog-confirm]').tap();await wait(()=>goonkMobileState.mode==='map');assert.deepEqual((await state()).resources,beforeSave.resources);console.log('PASS permanent workshop project survives save/load');
 await visit(17,11,'battle');await wait(()=>goonkMobileState.battleUnits?.some(u=>u.id===146));const combat=await state();fs.writeFileSync(path.join(out,'battle.json'),JSON.stringify(combat,null,2));const machines=combat.battleUnits.filter(u=>[145,146,147,148].includes(u.id));assert(machines.some(u=>u.id===146));
 const health={146:250,147:75,148:100};for(const unit of machines)if(health[unit.id])assert.equal(unit.maximumHealth,Math.floor(health[unit.id]*((project===2||project===0&&unit.id===146)?1.5:1)),'Effective machine HP '+unit.id);
 await p.screenshot({path:path.join(out,'battle.png')});console.log('PASS effective native machine health in battle',project);
 if(project===1){
  for(let step=0;step<12;step++){await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct);const s=await state();if(s.activeUnit?.id===147)break;const old=s.activeStack;await cmd(13);await wait(id=>goonkMobileState.mode!=='battle'||goonkMobileState.activeStack!==id,old);}
  let s=await state();assert.equal(s.activeUnit.id,147,'Improved tent has manual control');const wounded=s.battleUnits.find(u=>!u.enemy&&![145,146,147,148].includes(u.id)&&u.currentHealth<u.maximumHealth);assert(wounded,'Enemy fire creates a normal wounded ally');const hp=wounded.currentHealth;await p.evaluate(u=>Module._vcmiMobilePointer(u.x,u.y,1),wounded);await wait(({id,hp})=>goonkMobileState.battleUnits?.some(u=>u.stackId===id&&u.currentHealth>hp),{id:wounded.stackId,hp});s=await state();const healed=s.battleUnits.find(u=>u.stackId===wounded.stackId).currentHealth-hp;assert(healed>10,'Enhanced tent heals more than the untrained native 10 HP');fs.writeFileSync(path.join(out,'healing.json'),JSON.stringify({healed,before:wounded,after:s.battleUnits.find(u=>u.stackId===wounded.stackId)},null,2));console.log('PASS native improved tent heals a wounded ally',healed);
 }


 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,errors,tree:baseline,afterWorkshop:await state()},null,2));
}catch(e){if(p){await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(out,'failure-state.json'),JSON.stringify(await p.evaluate(()=>window.goonkMobileState).catch(()=>null),null,2));}console.error(e);process.exitCode=1;}finally{fs.writeFileSync(path.join(out,'console.log'),messages.join('\n'));await browser.close();}
