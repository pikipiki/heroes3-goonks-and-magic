import{chromium}from'playwright-core';import assert from'node:assert/strict';import fs from'node:fs';
const out=n=>new URL('../../outputs/'+n,import.meta.url).pathname,report={errors:[],serverErrors:[],closed:[]};
const b=await chromium.connectOverCDP('http://127.0.0.1:9224'),c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:2}),p=await c.newPage(),wait=f=>p.waitForFunction(f,null,{timeout:90000}),click=n=>p.getByRole('button',{name:n,exact:true}).click();
p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(/Server encountered a problem|Assertion failed/i.test(m.text()))report.serverErrors.push(m.text());});
try{
 await p.goto('http://127.0.0.1:8767/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu');await click('Nouvelle aventure');await wait(()=>goonkMobileState.selectedMap==='Goonks');
 const map=await p.evaluate(()=>goonkMobileState.maps.find(m=>m.name.includes('Château Goonk')));await p.locator('#mobile-map-select').selectOption(String(map.index));await p.waitForFunction(n=>goonkMobileState.selectedMap===n,map.name);await click('Commencer');await wait(()=>goonkMobileState.mode==='map');await click('♜ Villes');await p.locator('.sheet-body button').first().click();await wait(()=>goonkMobileState.mode==='town'&&document.querySelector('#mobile-app').dataset.townLayout==='portrait');
 await p.waitForTimeout(300);await p.screenshot({path:out('town-hd-portrait.png')});
 const art=await p.evaluate(async()=>{const entry=window.goonkAssetURLs.find(e=>e.path.endsWith('/Sprites2x/goonk/structure-dwellingLvl1.png'));const img=new Image();img.src=entry.url;await img.decode();return{path:entry.path,width:img.naturalWidth,height:img.naturalHeight};});assert.equal(art.width,190);assert.equal(art.height,180);report.art=art;
 const tav=await p.evaluate(()=>goonkMobileState.buildings.find(b=>b.built&&/:tavern$/.test(b.key)));assert(tav);
 const open=async()=>{await p.evaluate(id=>Module._vcmiMobileCommand(39,id,0,0,0,0),tav.id);await wait(()=>goonkMobileState.dialogKind==='tavern');await p.locator('[data-tavern-close]').waitFor();await p.waitForTimeout(100);};
 for(const [width,height]of [[390,844],[844,390],[320,568]]){
  await p.setViewportSize({width,height});await open();
  const hit=await p.locator('[data-tavern-close]').boundingBox();assert(hit.width>=44&&hit.height>=44);report.closed.push({width,height,hit});
  await p.screenshot({path:out('tavern-close-'+width+'.png')});
  // A tap near the edge of the close button must also close it.
  await p.touchscreen.tap(hit.x+hit.width/2,hit.y+3);await wait(()=>goonkMobileState.mode==='town');
 }
 await p.setViewportSize({width:390,height:844});await open();await p.setViewportSize({width:844,height:390});await p.waitForTimeout(200);await p.setViewportSize({width:390,height:844});await p.waitForTimeout(200);
 const header=p.getByRole('button',{name:'Fermer la taverne',exact:true}),r=await header.boundingBox();await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();await p.waitForTimeout(500);await p.mouse.up();await wait(()=>goonkMobileState.mode==='town');report.rotationAndHeldPress=true;
 await p.evaluate(()=>Module._vcmiMobileCommand(40,0,0,0,0,0));await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>goonkMobileState.mode),'town');report.staleCloseIgnored=true;
 await click('Construire');await p.waitForTimeout(200);report.hdCard=await p.locator('.building-card-image').first().evaluate(async img=>{await img.decode();return[img.naturalWidth,img.naturalHeight];});assert.deepEqual(report.hdCard,[300,140]);await click('Fermer le panneau');
 await p.setViewportSize({width:844,height:390});await p.waitForTimeout(300);await p.screenshot({path:out('town-hd-landscape.png')});
 await p.setViewportSize({width:390,height:844});await wait(()=>document.querySelector('#mobile-app').dataset.townLayout==='portrait');
 const dw=await p.evaluate(()=>goonkMobileState.buildings.find(b=>b.built&&/:dwellingLvl1$/.test(b.key)));await p.locator('[data-town-building="'+dw.id+'"]').click();await wait(()=>goonkMobileState.mode==='recruit');await click('Fermer le recrutement');await wait(()=>goonkMobileState.mode==='town');report.recruitment=true;
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.serverErrors,[]);console.log(JSON.stringify(report));
}catch(e){report.failure=e.stack;await p.screenshot({path:out('town-hd-native-failure.png')});throw e;}
finally{fs.writeFileSync(out('town-hd-native-e2e.json'),JSON.stringify(report,null,2));await c.close();await b.close();}
