/**
 * Long uninterrupted native sessions in isolated profiles (never user saves).
 * --opfs exercises real autosaves; otherwise use the bounded temporary asset cache.
 * --cycles=30 --browser=webkit|chromium --dpr=3 --out=/tmp/report
 * --engine-dir=/tmp/html5 serves BOTH the main runtime and worker scripts.
 * --skip-hiring isolates combat from tavern/equipment interactions.
 */
import {chromium,webkit} from 'playwright-core';import crypto from 'node:crypto';import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {silenceTestAudio} from './silent-audio.mjs';
const root=path.resolve(process.argv.find(a=>a.startsWith('--site-root='))?.slice(12)||process.env.GOONK_SITE_ROOT||'dist'),out=process.argv.find(a=>a.startsWith('--out='))?.slice(6)||process.env.REVIEW_OUTPUT||'/tmp/goonk-mixed-session-soak';fs.mkdirSync(out,{recursive:true});const report={engine:JSON.parse(fs.readFileSync(root+'/engine-build.json')),cases:[],failures:[],physicalDevice:false};
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm','.png':'image/png','.svg':'image/svg+xml'};const server=http.createServer((q,r)=>{let f=path.resolve(root,'.'+new URL(q.url,'http://x').pathname);const engineAsset=engineDir&&new URL(q.url,'http://x').pathname.match(/^\/vcmiclient(?:\.[a-f0-9]+)?\.(js|wasm)$/);if(engineAsset)f=path.join(engineDir,'vcmiclient.'+engineAsset[1]);if((!engineAsset&&!f.startsWith(root+'/'))||!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404).end();return;}r.setHeader('Cross-Origin-Opener-Policy','same-origin');r.setHeader('Cross-Origin-Embedder-Policy','require-corp');r.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).on('error',()=>r.destroy()).pipe(r);});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
const engineDir=process.argv.find(a=>a.startsWith('--engine-dir='))?.slice(13);if(engineDir)report.testEngineSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(engineDir,'vcmiclient.wasm'))).digest('hex');
const persistent=process.argv.includes('--opfs');report.storage=persistent?'opfs':'temporary';
const browserOnly=process.argv.find(a=>a.startsWith('--browser='))?.slice(10);
const cycles=Number(process.argv.find(a=>a.startsWith('--cycles='))?.slice(9)||30);const probe=false,dpr=Number(process.argv.find(a=>a.startsWith('--dpr='))?.slice(6)||1);report.deviceScaleFactor=dpr;report.cyclesPerBrowser=cycles;report.startedAt=new Date().toISOString();report.interactions={hires:0,dismissals:0,equipment:0,commanders:0,spellbooks:0};
assert(Number.isInteger(cycles)&&cycles>=1&&cycles<=30,'This 36x36 fixture supports 1–30 encounters');assert(!browserOnly||['webkit','chromium'].includes(browserOnly),'Supported browser engine');
const persist=()=>fs.writeFileSync(out+'/results.json',JSON.stringify(report,null,2));
try{for(const name of (browserOnly?[browserOnly]:probe?['webkit']:['webkit','chromium']))for(const army of ['goonk']){
 const browser=await({webkit,chromium}[name]).launch({headless:true,...(name==='chromium'?{args:['--enable-precise-memory-info']}: {})});let p;try{
 p=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:dpr,hasTouch:true,bypassCSP:true});await silenceTestAudio(p);await p.exposeFunction('testSoakProgress',value=>{report.phase={browser:name,...value};persist();});await p.addInitScript(()=>{let at=0,mode='';addEventListener('goonk-state',event=>{const s=event.detail,now=Date.now();if(s.mode!==mode||now-at>2000){mode=s.mode;at=now;window.testSoakProgress({mode:s.mode,day:s.day,round:s.round,hero:s.heroName,heroes:s.heroes?.length,selectedMap:s.selectedMap,scenarioCount:s.maps?.length,scenarios:s.mode==='lobby'?s.maps?.filter(m=>m.name.startsWith('000')).slice(0,12).map(m=>m.name):undefined,wasmBytes:window.Module?.HEAPU8?.byteLength});}});});console.log('START',name,cycles,'continuous mixed cycles');let fail;const fatal=new Promise((_,r)=>fail=r);fatal.catch(()=>{});const errors=[];p.on('pageerror',e=>{errors.push(e.message);fail(e);});p.on('crash',()=>fail(Error('Page process crashed')));let logLines=0;p.on('console',m=>{if(logLines++<12000)fs.appendFileSync(out+'/'+name+'-'+army+'.log',m.text().slice(0,2000)+'\n');});await p.addInitScript(persistent=>{if(!persistent)sessionStorage.setItem('heroes-goonk.storage-failed','true');window.stressAllocations={canvas:0,imageData:0};const create=document.createElement.bind(document);document.createElement=(tag,...args)=>{if(tag.toLowerCase()==='canvas')stressAllocations.canvas++;return create(tag,...args);};window.ImageData=new Proxy(ImageData,{construct(T,args){stressAllocations.imageData++;return Reflect.construct(T,args);}});},persistent);
 p.on('worker',worker=>{worker.evaluate(()=>addEventListener('error',event=>console.error('SOAK_WORKER_STACK',event.error?.stack||event.message))).catch(()=>{});});

 let navs=0;p.on('framenavigated',f=>{if(f===p.mainFrame())navs++;});
 const state=()=>p.evaluate(()=>goonkMobileState),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]),wait=(f,a)=>Promise.race([p.waitForFunction(f,a,{timeout:90000}),fatal]);
 await p.route(/\/web\/temporary-assets\.mjs(?:\?.*)?$/,r=>{let source=fs.readFileSync(root+'/web/temporary-assets.mjs','utf8');source=source.replace(' return reader;',' reader.testMemory=()=>({maxBytes,cachedBytes,entries:cache.size});\n return reader;').replace('return {prefetch: (entries, options)','return {testMemory:read.testMemory,prefetch: (entries, options)');return r.fulfill({body:source,contentType:'text/javascript'});});
 await p.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done');
 const fixture=execFileSync('python3',['-c',`import zipfile,json,io,sys
army=sys.argv[1];out=io.BytesIO()
with zipfile.ZipFile('maps/000-Goonk.vmap') as src,zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as dst:
 for name in src.namelist():
  data=src.read(name)
  if name=='objects.json':
   objects=[o for o in json.loads(data) if o.get('instanceName') in ['goonkTown','goonkHero','enemyTown','trainingGuard']]
   for o in objects:
    if o.get('instanceName')=='goonkHero':
     o['x']=7;o['y']=11;o['options'].update({'type':'core:neela','artifacts':{'spellbook':'core:spellBook'},'spellBook':['core:magicArrow'],'primarySkills':{'attack':10,'defence':10,'spellpower':5,'knowledge':10}})
     if army=='core':o['options']['army']=[{'type':'core:'+c,'amount':100} for c in ['archangel','pikeman','marksman','royalGriffin','crusader','zealot','champion']]
     else:
      for s in o['options']['army']:s['amount']=200
    if o.get('instanceName')=='goonkTown':o['subtype']='core:tower';o['options']['buildings']={'allOf':['core:villageHall','core:tavern','core:fort','core:dwellingLvl1']}
    if o.get('instanceName')=='trainingGuard':o['x']=10;o['y']=12;o['subtype']='core:skeleton';o['options']['amount']=10;o['options']['neverFlees']=True
   guard=next(o for o in objects if o.get('instanceName')=='trainingGuard')
   kinds=['skeleton','orc','hellHound','basilisk','cyclop','behemoth','dendroidGuard','monk','earthElemental','minotaur']
   for i in range(1,int(sys.argv[2])):
    clone=json.loads(json.dumps(guard));clone['instanceName']='stressGuard'+str(i);row,col=divmod(i,6);clone['x']=10+3*(col if row%2==0 else 5-col);clone['y']=12+3*row;clone['subtype']='core:'+kinds[i%len(kinds)];objects.append(clone)
   data=json.dumps(objects,ensure_ascii=False).encode()
  if name=='surface_terrain.json':data=json.dumps([['gr0_' for x in range(36)] for y in range(36)]).encode()
  if name=='header.json':
   h=json.loads(data);h['name']='000 - Long mixed session validation';h['players']['red']['allowedFactions']={'anyOf':['core:tower']};data=json.dumps(h,ensure_ascii=False).encode()
  if name in ['english.json','french.json']:
   t=json.loads(data);t['mapName']='000 - Long mixed session validation';data=json.dumps(t,ensure_ascii=False).encode()
  dst.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`,army,String(cycles)]);await p.evaluate(b=>{for(const name of ['001-Goonks.vmap','003-Goonks-WoG.vmap']){const file='/home/web_user/.local/share/vcmi/Maps/'+name;try{Module.FS.stat(file);Module.FS.writeFile(file,new Uint8Array(b));}catch{}}},[...fixture]);
 let combatHeroId;

 async function hireAndDismiss(iteration){
  const before=await state(),count=before.heroes.length;await cmd(5,0);await wait(()=>goonkMobileState.mode==='town');await p.locator('[data-ui=recruit-heroes]').tap();await wait(()=>goonkMobileState.dialogKind==='tavern');
  const tavern=await state(),entries=Object.keys(tavern.tavernHeroes||{}),slot=entries[iteration%entries.length],candidate=tavern.tavernHeroes[slot];assert(candidate&&tavern.tavern.canRecruit,'Tavern can hire a new hero');
  await p.locator('[data-tavern-equipment="'+slot+'"]').tap();await wait(()=>goonkMobileState.mode==='hero'&&goonkMobileState.heroWindow?.owned===false);report.interactions.equipment++;
  for(const tab of ['army','skills','backpack','worn'])await p.locator('[data-hero-tab="'+tab+'"]').tap();
  if((await state()).heroWindow.slots.some(s=>s.slot===17&&s.name)){
   await p.locator('[data-hero-slot="17"]').tap();await wait(()=>goonkMobileState.mode==='spellbook'&&goonkMobileState.spellbook.readOnly);if((await state()).spellbook.spells?.length)await p.locator('.spell-row').first().tap();report.interactions.spellbooks++;await p.locator('[data-close-book]').tap();await wait(()=>goonkMobileState.mode==='hero');
  }
  if(Number.isInteger((await state()).heroWindow.commanderIcon)){
   await p.locator('[data-hero-commander]').scrollIntoViewIfNeeded();await p.locator('[data-hero-commander]').tap();await wait(()=>goonkMobileState.dialogKind==='commander');report.interactions.commanders++;const tree=p.locator('[data-commander-tree]');if(await tree.count())await tree.tap();await p.locator('[data-dialog-confirm]').tap();await wait(()=>goonkMobileState.mode==='hero');
  }
  await p.locator('[data-hero-close]').tap();await wait(()=>goonkMobileState.dialogKind==='tavern');await p.locator('[data-tavern-recruit="'+slot+'"]').tap();await wait(count=>goonkMobileState.heroes.length===count+1,count);report.interactions.hires++;
  if((await state()).dialogKind==='tavern')await cmd(40);if((await state()).mode==='town')await cmd(0);await wait(()=>goonkMobileState.mode==='map');
  const hired=(await state()).heroes.find(h=>h.name===candidate.name);assert(hired);await cmd(4,hired.index);await cmd(55);await wait(name=>goonkMobileState.mode==='hero'&&goonkMobileState.heroWindow?.name===name,candidate.name);
  const hero=(await state()).heroWindow;await p.evaluate(r=>Module._vcmiMobilePointer(r.x-19+550,r.y-19+445,1),hero.portrait);await wait(()=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation);assert.match(JSON.stringify((await state()).dialogPresentation),/dismiss/i,'Native confirmation is hero dismissal');await p.locator('[data-dialog-confirm]').tap();await wait(count=>goonkMobileState.mode==='map'&&goonkMobileState.heroes.length===count,count);report.interactions.dismissals++;
  const main=(await state()).heroes.find(h=>h.id===combatHeroId);assert(main,'Combat hero remains present');await cmd(4,main.index);await wait(id=>goonkMobileState.heroId===id,combatHeroId);persist();
 }
 for(let i=0;i<cycles;i++){
 const test={browser:name,army,index:i+1,startedAt:new Date().toISOString(),spell:['Magic Arrow','Haste','Fireball','Prayer','Water Elemental','Shield','Fire Shield','Slow','Ice Bolt','Bless'][i%10],samples:[],rotations:0,viewChanges:0,cancelledSpell:false,passed:false};report.cases.push(test);persist();const stamp=async phase=>{test.samples.push(await p.evaluate(phase=>({phase,mode:goonkMobileState.mode,wasmBytes:Module.HEAPU8.byteLength,jsHeap:performance.memory?.usedJSHeapSize,allocations:{...stressAllocations},canvasBytes:[...document.querySelectorAll('canvas')].reduce((n,c)=>n+c.width*c.height*4,0),domNodes:document.querySelectorAll('*').length,temporary:window.goonkTemporaryAssets?.testMemory?.()}),phase));};
 try{
 if(i===0){await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady&&goonkMobileState.maps?.some(m=>m.name==='000 - Long mixed session validation'));const map=(await state()).maps.find(m=>m.name==='000 - Long mixed session validation');await p.locator('#mobile-map-select').selectOption(String(map.index),{force:true});await wait(()=>goonkMobileState.selectedMap==='000 - Long mixed session validation');await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);combatHeroId=(await state()).heroId;await cmd(29,0);await cmd(29,2);}
 if(!process.argv.includes('--skip-hiring'))await hireAndDismiss(i);await stamp('after-hero-cycle');
 await cmd(29,3);await cmd(29,1);await p.waitForTimeout(250);const mini=(await state()).mapOverview;
 await p.evaluate(({m,x,y})=>Module._vcmiMobilePointer(Math.round(m.rect.x+x*m.rect.w/m.width),Math.round(m.rect.y+y*m.rect.h/m.height),5),{m:mini,x:10+3*(Math.floor(i/6)%2?5-i%6:i%6),y:12+3*Math.floor(i/6)});await p.waitForTimeout(250);const view=(await state()).mapOverview.view;
 await p.evaluate(v=>Module._vcmiMobilePointer(Math.round(v.x+v.w/2),Math.round(v.y+v.h/2),1),view);await wait(()=>goonkMobileState.hasPath);await p.locator('.mobile-nav [data-ui=move]').tap();await wait(()=>goonkMobileState.mode==='battle');await cmd(15);await p.waitForTimeout(250);if((await state()).canEndTactics)await cmd(35);await wait(()=>goonkMobileState.canAct);await stamp('entry');const a0=await p.evaluate(()=>({...stressAllocations}));await p.waitForTimeout(1000);const a1=await p.evaluate(()=>({...stressAllocations}));test.idleAllocations={canvas:a1.canvas-a0.canvas,imageData:a1.imageData-a0.imageData};if(engineDir||!probe)assert(test.idleAllocations.canvas<=4,'Steady combat reuses canvas surfaces');
 for(const size of [{width:390,height:844},{width:844,height:390},{width:320,height:568},{width:568,height:320},{width:390,height:844}]){await p.setViewportSize(size);test.rotations++;await p.waitForTimeout(140);const view=p.locator('[data-ui=battle-view]:visible');if(await view.count()){await view.tap();test.viewChanges++;await p.waitForTimeout(100);}await stamp('view-'+test.rotations);}
 if(probe)await p.screenshot({path:out+'/'+name+'-'+army+'-battle.png'});
 const open=async()=>{await cmd(14);await wait(()=>goonkMobileState.mode==='spellbook');await cmd(51,0);await wait(()=>goonkMobileState.spellbook.school===-1);const b=(await state()).spellbook,s=b.spells.find(s=>s.name===test.spell);assert(s?.enabled,'Requested spell available: '+test.spell);return {book:b,spell:s};};
 let {book,spell}=await open();await p.locator('[data-spell="'+spell.id+'"]').scrollIntoViewIfNeeded();await p.locator('[data-spell="'+spell.id+'"]').tap();await wait(()=>goonkMobileState.mode==='battle'||goonkMobileState.dialogKind==='battle-result');
 if((await state()).spellTargeting){if(i%2===0){await cmd(14,2);await wait(()=>!goonkMobileState.spellTargeting);test.cancelledSpell=true;({book,spell}=await open());await p.locator('[data-spell="'+spell.id+'"]').scrollIntoViewIfNeeded();await p.locator('[data-spell="'+spell.id+'"]').tap();await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.spellTargeting);}
 await p.setViewportSize({width:844,height:390});test.rotations++;await p.waitForTimeout(150);const s=await state(),target=s.battleUnits.find(u=>spell.target==='ally'?!u.enemy:u.enemy);assert(target);await cmd(14,3,target.occupied[0]);}
 await wait(()=>goonkMobileState.dialogKind==='battle-result'||(goonkMobileState.mode==='battle'&&!goonkMobileState.spellTargeting&&goonkMobileState.heroMana<999));await stamp('after-spell');
 if((await state()).mode==='battle'){await wait(()=>goonkMobileState.canAutoCombat);await cmd(44,1);}await wait(()=>goonkMobileState.dialogKind==='battle-result');await stamp('result');await p.locator('[data-result-confirm]').tap();for(let dialog=0,stable=0;dialog<120&&stable<10;dialog++){await p.waitForTimeout(150);const s=await state();if(s.mode==='map'){stable++;continue;}stable=0;if(s.mode==='dialog'||s.mode==='levelup')await cmd(1);}await wait(()=>goonkMobileState.mode==='map');assert.equal(navs,1,'No automatic reload');assert.deepEqual(errors,[]);await stamp('returned-map');test.passed=true;persist();console.log('PASS',name,army,i+1,test.spell,'heap',test.samples.at(-1).wasmBytes);
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(150);
 }catch(error){test.failure=error.stack;report.failures.push({browser:name,army,index:i+1,error:error.message});fs.writeFileSync(out+'/'+name+'-'+army+'-failure-state.json',JSON.stringify(await state().catch(()=>null),null,2));await p.screenshot({path:out+'/'+name+'-'+army+'-failure.png'}).catch(()=>{});persist();throw error;}
 }
 }catch(error){report.failures.push({browser:name,army,sessionFailure:error.message});if(p){fs.writeFileSync(out+'/'+name+'-'+army+'-boot.json',JSON.stringify(await p.evaluate(()=>({state:window.goonkMobileState,recovery:window.goonkSessionRecovery,body:document.body.innerText})).catch(()=>null),null,2));await p.screenshot({path:out+'/'+name+'-'+army+'-boot.png'}).catch(()=>{});}persist();console.error('SESSION FAILED',name,army,error.message);}finally{await browser.close();}
}report.completed=report.cases.filter(c=>c.passed).length;report.passed=report.completed===cycles*(browserOnly?1:2)&&report.failures.length===0;persist();report.finishedAt=new Date().toISOString();persist();assert(report.passed,'Every long mixed session must finish');}finally{await new Promise(r=>server.close(r));}
