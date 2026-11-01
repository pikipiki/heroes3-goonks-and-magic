import{assertTumNativeGuardRoster}from'./tum-native-guard-roster.mjs';
import{isTumNativeError}from'./tum-native-diagnostics.mjs';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire}from'node:module';import{execFileSync}from'node:child_process';import{fileURLToPath}from'node:url';
import{installTumFixturePreinit}from'./tum-fixture-preinit.mjs';import{tumNativeOptions,selectTumCases}from'./tum-native-options.mjs';import{captureTumPreview,verifyTumFixtureSources}from'./tum-preview-provenance.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),options=tumNativeOptions(here),project=options.project;const require=createRequire(project+'/work/browser-tests/package.json');const {chromium}=require('playwright-core');
const output=options.reportDir||path.join(here,'tum-native-reports/objects');fs.mkdirSync(output,{recursive:true});
// Deliberate launch gate: parent validates rebuilt preview before opening CDP.
if(!options.ready)throw Error('Wait for parent message previewmithrilready; then set TUM_PREVIEW_READY=mithril.');
const fixtureRoot=options.fixtureDir||path.join(here,'tum-objects-fixtures');let cases=JSON.parse(fs.readFileSync(path.join(fixtureRoot,'fixture-cases.json'))).cases.map(c=>({...c,mapFile:path.join(fixtureRoot,c.map)}));cases=selectTumCases(cases,options.cases);
const fixtureBytes=file=>execFileSync('python3',['-c',`import zipfile,io,json,sys
with zipfile.ZipFile(sys.argv[1]) as z:
 out=io.BytesIO()
 with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED)as result:
  for name in z.namelist():
   data=z.read(name)
   if name=='objects.json':
    objects=json.loads(data)
    hero=next(o for o in objects if o['instanceName']=='goonkHero')
    hero['options']['artifacts']={'spellbook':'core:spellBook'}
    hero['options']['spellBook']=[]
    data=json.dumps(objects).encode()
   elif name=='header.json':
    header=json.loads(data)
    header['events']=[{'name':'Isolated fixture recruitment budget','players':['red'],'humanAffected':1,'computerAffected':0,'firstOccurrence':0,'nextOccurrence':0,'resources':{k:100000 for k in ['wood','mercury','ore','sulfur','crystal','gems','gold']}}]
    data=json.dumps(header).encode()
   result.writestr(name,data)
 sys.stdout.buffer.write(out.getvalue())`,file]).toString('base64');
const metadata=JSON.parse(fs.readFileSync(path.join(fixtureRoot,'native-creatures.json'))).creatures;const resolvers={byNative:new Map(Object.entries(metadata).map(([type,d])=>[type,{index:d.coreIndex,name:{singular:d.nameSingular},level:d.level}])),byEra:new Map(Object.entries(metadata).map(([type,d])=>[d.eraId,type])),resolveStats:id=>Object.values(metadata).find(d=>d.eraId===id)};for(const c of cases)c.freeSourceRecruit=c.kind==='dwelling'&&c.expectedDefinition.creatures?.length===1&&resolvers.byNative.get(c.expectedDefinition.creatures[0][0])?.level===1;
const preview=await captureTumPreview(options.origin,{sourceRuntime:options.sourceRuntime}),sourceAttestation=verifyTumFixtureSources(options.tum,JSON.parse(fs.readFileSync(path.join(fixtureRoot,'source-inputs.json'))));
const browser=await chromium.connectOverCDP(options.cdp);const report={origin:options.origin,preview,sourceAttestation,preInit:{commanders:false,scopedResourceArrayCandidate:options.resourceArray},fixture:{heroArmy:'500core:blackDragon',spellbook:true,firstDayBaselineBudget:100000},cases:[]};
const wait=(p,f,arg,timeout=360000)=>p.waitForFunction(f,arg,{timeout});const state=p=>p.evaluate(()=>structuredClone(window.goonkMobileState));const command=(p,n,a=0)=>p.evaluate(({n,a})=>Module._vcmiMobileCommand(n,a,0,0,0,0),{n,a});
async function boot(page,c,{chooseSave=true}={}){
 await page.addInitScript(caseId=>{window.tumObjectHarnessCase=caseId;},c.kind+':'+c.sourceId);
 await page.addInitScript(installTumFixturePreinit,{scopedResourceArray:options.resourceArray});
 await page.goto(report.origin+'/?mobile=1'+(chooseSave?'&choose-save=1':''));
 if(chooseSave){await wait(page,()=>window.goonkMobileState?.mode==='load'&&window.goonkMobileState.lobbyReady,undefined,900000);await page.getByRole('button',{name:'Retour',exact:true}).click();}
 await wait(page,()=>window.goonkMobileState?.mode==='menu',undefined,900000);assert.equal(await page.evaluate(()=>Module._vcmiEraBridgeVersion()),2);
 await page.evaluate(map=>{Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/000-Goonk.vmap',Uint8Array.from(atob(map),c=>c.charCodeAt(0)));window.tumVisitStates=[];window.addEventListener('goonk-state',e=>{const s=e.detail;window.tumVisitStates.push(structuredClone({mode:s.mode,rect:s.rect,round:s.round,resources:s.resources,resourceTypes:s.resourceTypes,armies:s.armies,recruitUnit:s.recruitUnit,recruitAmount:s.recruitAmount,recruitMaximum:s.recruitMaximum,battleUnits:s.battleUnits,canAutoCombat:s.canAutoCombat}));if(window.tumVisitStates.length>1500)window.tumVisitStates.shift();});},fixtureBytes(c.mapFile));
 await page.getByRole('button',{name:'Nouvelle aventure',exact:true}).click();await wait(page,()=>goonkMobileState.maps?.length);const map=(await page.evaluate(()=>goonkMobileState.maps)).find(m=>m.name===c.name);assert(map,'Fixture listed by native map loader');await page.locator('#mobile-map-select').selectOption(String(map.index));await wait(page,name=>goonkMobileState.selectedMap===name,c.name);await page.getByRole('button',{name:'Commencer',exact:true}).click();
 // Silent day-one budget event may have an empty native message; dismiss any startup info.
 for(let i=0;i<30;i++){await wait(page,()=>['map','dialog'].includes(goonkMobileState.mode));if((await state(page)).mode==='map')break;await command(page,1);await page.waitForTimeout(200);}
 await wait(page,()=>goonkMobileState.mode==='map'&&goonkMobileState.heroName&&goonkMobileState.resources?.length===8);const s=await state(page);assert.equal(s.resourceTypes.find(t=>t.key==='mithril')?.scope,'wake-of-gods.mithril');assert.equal(await page.locator('[data-resource="mithril"]').count(),1);return s;
}
async function selectTile(page,tile){
 await page.bringToFront();const map=(await state(page)).mapOverview;assert(map?.rect&&map?.view,'Native minimap geometry available');
 // Native CMinimap::pixelToTile uses round(), so request exact tile/size, not tile+0.5.
 await page.evaluate(({x,y})=>Module._vcmiMobilePointer(x,y,1),{x:Math.round(map.rect.x+tile.x/map.width*map.rect.w),y:Math.round(map.rect.y+tile.y/map.height*map.rect.h)});await page.waitForTimeout(300);
 await page.evaluate(({x,y})=>Module._vcmiMobilePointer(x,y,1),{x:Math.round(map.view.x+map.view.w/2),y:Math.round(map.view.y+map.view.h/2)});await wait(page,()=>goonkMobileState.hasPath||goonkMobileState.mode!=='map');if((await state(page)).hasPath)await command(page,2);
}
async function visit(page,c,result,{revisit=false}={}){
 if(revisit){await selectTile(page,{x:c.targetVisitablePosition.x,y:c.targetVisitablePosition.y+2});await wait(page,()=>goonkMobileState.mode==='map'&&!goonkMobileState.hasPath);}
 await selectTile(page,c.targetVisitablePosition);
 let battle=false,recruited=false,settled=0;const deadline=Date.now()+180000;
 while(Date.now()<deadline){const s=await state(page);if(s.mode==='battle'){battle=true;settled=0;if(s.canAutoCombat&&!s.autoCombat)await command(page,44,1);}
  else if(s.mode==='dialog'){settled=0;await page.screenshot({path:path.join(output,`${c.kind}-${c.sourceId}-dialog-${result.dialogs++}.png`)});await command(page,1);}
  else if(s.mode==='recruit'){
   if(c.kind!=='dwelling')throw Error('Bank unexpectedly opened recruitment');
   assert(s.recruitUnit&&s.recruitMaximum>0,'External dwelling offers recruitable creatures');result.recruitBefore=s;await command(page,31,1);await wait(page,()=>goonkMobileState.recruitAmount===1);await command(page,32);await command(page,33);recruited=true;settled=0;
  }else if(s.mode==='map'&&!s.hasPath){if(++settled>=6&&(battle||recruited||revisit||c.freeSourceRecruit))return {battle,recruited,state:s};}
  await page.waitForTimeout(220);
 }
 throw Error('Visit did not settle: '+JSON.stringify(await state(page)));
}
const sharedContext=options.fresh?null:await browser.newContext({viewport:{width:390,height:844}});
const listen=(page,r)=>{page.on('pageerror',e=>r.errors.push(e.message));page.on('console',m=>{if(isTumNativeError(m.text()))r.nativeErrors.push(m.text());});};
for(const c of cases){let context=sharedContext||await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();const r={kind:c.kind,id:c.sourceId,dialogs:0,errors:[],nativeErrors:[],scopedResourceArrayPreInit:options.resourceArray,contextMode:sharedContext?'reused-normal-save-picker':'fresh'};listen(page,r);
 try{try{r.before=await boot(page,c,{chooseSave:Boolean(sharedContext)});}catch(error){if(context!==sharedContext)throw error;r.contextFallback={reason:String(error),errors:r.errors,nativeErrors:r.nativeErrors};await page.close();context=await browser.newContext({viewport:{width:390,height:844}});page=await context.newPage();r.errors=[];r.nativeErrors=[];r.contextMode='fresh-fallback';listen(page,r);r.before=await boot(page,c,{chooseSave:false});}r.runtimeMainScript=await page.evaluate(()=>String(Module.mainScriptUrlOrBlob||''));assert(preview.runtime.includes(new URL(r.runtimeMainScript,options.origin).pathname.split('/').at(-1)),'Browser uses the hashed runtime recorded before this run');const first=await visit(page,c,r);r.after=first.state;r.battle=first.battle;r.snapshots=await page.evaluate(()=>window.tumVisitStates);if(c.kind==='bank'||(Array.isArray(c.expectedDefinition.guards)&&c.expectedDefinition.guards.length))assert(first.battle,'Original source guardians really fought');else assert(!first.battle,'Unguarded source dwelling stays unguarded');
  if(c.kind==='dwelling'){const expected=c.expectedDefinition.guards||[],first=r.snapshots.find(s=>s.mode==='battle'&&s.battleUnits?.some(u=>u.enemy)),actual=first?.battleUnits.filter(u=>u.enemy)||[];assert.equal(actual.length,expected.length,'All original dwelling guard slots reached native battle');for(const guard of expected){const d=resolvers.byNative.get(guard.type);assert(d,'Guard identity metadata');const core=guard.type.startsWith('core:')&&Number.isInteger(d.index)?d.index:null;assert(actual.some(u=>(core===null?u.name===d.name?.singular:u.id===core)&&u.count===guard.amount),'Original dwelling guardian identity and amount');}r.initialGuards=actual;}
  const delta=r.after.resources.map((value,index)=>value-r.before.resources[index]);r.delta=delta;
  if(c.kind==='bank'){
   const types=r.after.resourceTypes;const rewardResources=reward=>Array.isArray(reward.resources)?Object.fromEntries(reward.resources.map(r=>[r.type,r.amount])):reward.resources||{};let matching=c.expectedDefinition.rewards.filter(reward=>types.every((type,i)=>delta[i]===(rewardResources(reward)[type.key]??rewardResources(reward)[type.scope+':'+type.key]??0)));assert(matching.length,'Actual native reward resource delta matches a whole source state: '+JSON.stringify(delta));r.matchingStates=matching.map(x=>x.mapDice);
   const countCreature=(snapshot,type)=>{const metadata=resolvers.byNative.get(type);assert(metadata,'Registered native creature metadata');const coreIndex=type.startsWith('core:')&&Number.isInteger(metadata.index)?metadata.index:null;return snapshot.armies[0].slots.filter(Boolean).filter(u=>coreIndex===null?u.name===metadata.name?.singular:u.id===coreIndex).reduce((n,u)=>n+u.count,0);};matching=matching.filter(reward=>(reward.creatures||[]).every(recruit=>countCreature(r.after,recruit.type)-countCreature(r.before,recruit.type)===recruit.amount));assert(matching.length,'All source bank creature rewards enter hero army');
   const initialBattle=r.snapshots.find(s=>s.mode==='battle'&&s.battleUnits?.some(u=>u.enemy));assert(initialBattle,'Native battle snapshot captured');const guardCounts=initialBattle.battleUnits.filter(u=>u.enemy).map(u=>u.count).sort((a,b)=>a-b);matching=matching.filter(reward=>JSON.stringify(reward.guards.map(g=>g.amount).sort((a,b)=>a-b))===JSON.stringify(guardCounts));assert(matching.length,'The same complete source state matches resources, creature rewards and original per-slot guardians');r.matchingStates=matching.map(x=>x.mapDice);r.initialGuards=initialBattle.battleUnits.filter(u=>u.enemy);assertTumNativeGuardRoster(matching[0].guards,r.initialGuards,metadata);
   if(String(c.sourceId)==='44')assert(r.initialGuards.some(u=>/High Priest/i.test(u.name)),'Only first source zealot stack was upgraded to mapped High Priest');
   if(['43','44'].includes(String(c.sourceId)))assert.equal(delta[types.findIndex(t=>t.key==='mithril')],2,'Source Mithril reward applied');
   await page.screenshot({path:path.join(output,`${c.kind}-${c.sourceId}-reward.png`)});
   const revisit=await visit(page,c,r,{revisit:true});r.revisit=revisit.state;assert.deepEqual(r.revisit.resources,r.after.resources,'Once-only bank cannot pay again');assert(!revisit.battle,'Cleared bank has no second guardian fight');
  }else{
   if(c.freeSourceRecruit){const id=c.expectedDefinition.creatures[0][0],name=resolvers.byNative.get(id).name.singular,eraId=[...resolvers.byEra].find(([era,native])=>native===id)[0],amount=resolvers.resolveStats(eraId).growth;const count=s=>s.armies[0].slots.filter(Boolean).filter(u=>u.name===name).reduce((n,u)=>n+u.count,0);assert.equal(count(r.after)-count(r.before),amount,'Original level1 free dwelling gives its entire weekly growth');assert(delta.every(x=>x===0),'Level1 dwelling recruitment is free under native/source rules');r.recruited={type:id,name,amount,mode:'source-level1-free-join'};}else{assert(first.recruited,'Confirmed real external dwelling recruitment');const offer=r.recruitBefore.recruitUnit,oldCount=r.recruitBefore.armies[0].slots.filter(Boolean).filter(x=>x.id===offer.id).reduce((n,x)=>n+x.count,0),newCount=r.after.armies[0].slots.filter(Boolean).filter(x=>x.id===offer.id).reduce((n,x)=>n+x.count,0);assert.equal(newCount,oldCount+1,'Recruited creature enters native hero army');assert.deepEqual(delta,offer.cost.map(v=>v?-v:0),'Exactly one creature cost debited across all registered resources');r.recruited={id:offer.id,name:offer.name,amount:1};}
  }
  assert.deepEqual(r.errors,[]);assert.deepEqual(r.nativeErrors,[]);r.passed=true;console.log(JSON.stringify({kind:r.kind,id:r.id,passed:true,delta:r.delta,recruited:r.recruited}));
 }catch(error){r.failure=error.stack;process.exitCode=1;console.error(`${c.kind}:${c.sourceId} ${error.stack}`);await page.screenshot({path:path.join(output,`${c.kind}-${c.sourceId}-failure.png`)}).catch(()=>{});r.last=await state(page).catch(()=>null);}
 finally{report.cases.push(r);fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));await page.close();if(context!==sharedContext)await context.close();}
}
if(sharedContext)await sharedContext.close();
await browser.close();
