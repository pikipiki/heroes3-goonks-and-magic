import {chromium} from '../../../work/browser-tests/node_modules/playwright-core/index.mjs';
import {battleView} from '../public/shared-field.js';
import {silenceTestAudio} from '../../../work/browser-tests/silent-audio.mjs';
import assert from 'node:assert/strict';import fs from 'node:fs';
const out='/private/tmp/heroes-starcraft-adventure-review';fs.mkdirSync(out,{recursive:true});
const report={scope:'Published trial map, native Heroes attack, real OpenBW combat, native Heroes casualty application; no injected game state',cases:[]};
const save=()=>fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2)+'\n');
const record=value=>{report.cases.push(value);save();console.log(value.name||value);};
fs.writeFileSync(out+'/console.log','');
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});await silenceTestAudio(page);
await page.addInitScript(()=>{
 sessionStorage.setItem('heroes-goonk.storage-failed','true');
 window.addEventListener('goonk-crossover-submitted',e=>window.testCrossoverSubmission=structuredClone(e.detail));
});
page.on('console',message=>fs.appendFileSync(out+'/console.log',message.type()+': '+message.text().slice(0,2000)+'\n'));
const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));let hero;
const cmd=async(...args)=>hero.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]);
try{
 await page.goto(process.env.CROSSOVER_URL||'http://127.0.0.1:8779/index.html');hero=page;
 await page.waitForFunction(()=>window.goonkMobileState?.mode==='menu',null,{timeout:180000});
 assert.equal(await page.locator('#crossover-tools').count(),0);
 assert(await page.locator('#mobile-app .mobile-menu #crossover-demo').isVisible(),'Demo belongs to the Heroes home menu');
 assert(await page.locator('#mobile-app .mobile-menu #game-menu-toggle').isVisible(),'Options belongs to the same menu');
 assert.equal(await page.locator('#mobile-app .mobile-top').isVisible(),false);
 await page.locator('#game-menu-toggle').click();await page.locator('#game-menu[open]').waitFor();await page.locator('#game-menu [data-menu="close"]').click();

 await page.screenshot({path:out+'/menu-portrait.png',fullPage:true});
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(150);
 const menuButton=await page.locator('#crossover-demo').boundingBox();assert(menuButton.x>=0&&menuButton.x+menuButton.width<=844);
 const buttons=await page.locator('#mobile-app .mobile-menu > button:visible').all();const bounds=await Promise.all(buttons.map(button=>button.boundingBox()));
 for(let i=0;i<bounds.length;i++)for(let j=i+1;j<bounds.length;j++){const a=bounds[i],b=bounds[j];assert(a.x+a.width<=b.x+1||b.x+b.width<=a.x+1||a.y+a.height<=b.y+1||b.y+b.height<=a.y+1,'Home menu buttons never overlap');}

 await page.screenshot({path:out+'/menu-landscape.png',fullPage:true});
 record({name:'Demo is integrated in the Heroes home menu in portrait and landscape, with no floating overlay'});
 await page.setViewportSize({width:390,height:844});
 await page.locator('#crossover-demo').click();
 await page.waitForFunction(()=>!!window.goonkMobileState?.crossover,null,{timeout:180000});
 record({name:'Demo button inside Heroes launches the published trial and a real native Heroes attack'});
 const initial=await hero.evaluate(()=>structuredClone(goonkMobileState.crossover));report.initial=initial;save();
 await hero.locator('#crossover-arena').waitFor();
 const sc=page.frames().find(frame=>frame.url().includes('/starcraft/index.html'));assert(sc);
 assert.equal(await hero.locator('#crossover-arena iframe').evaluate(el=>getComputedStyle(el).opacity),'0');
 await sc.waitForFunction(()=>!!window.openbwCrossover?.battle(),null,{timeout:180000});
 assert.equal(await sc.evaluate(()=>window.openbwCrossover.battle().frame),0,'RTS waits for the player before fighting');
 record({name:'Real Heroes attack is suspended and its exact armies initialize native StarCraft',heroes:initial,starcraft:await sc.evaluate(()=>window.openbwCrossover.battle())});
 assert(initial.stacks.some(row=>row.creature==='core:archer'));
 assert(initial.stacks.some(row=>row.creature==='core:pikeman'));
 assert(initial.stacks.some(row=>row.creature==='heroes-starcraft:marine'));
 await hero.waitForFunction(()=>Number(document.querySelector('#crossover-field')?.dataset.heroesUnits)>0&&Number(document.querySelector('#crossover-field')?.dataset.starcraftUnits)>0&&document.querySelector('#crossover-field')?.dataset.background==='heroes');
 const census=await sc.evaluate(()=>window.openbwCrossover.census());
 const view=battleView(census.units.filter(u=>u.stackId>=0),await sc.evaluate(()=>window.openbwCrossover.camera()));
 for(const row of initial.stacks.filter(row=>!row.creature.startsWith('heroes-starcraft:'))){const units=census.units.filter(unit=>unit.stackId===row.id);assert.equal(units.length,row.count);assert(units.every(unit=>unit.heroes&&unit.maxHp===row.health));}
 const portraitField=await hero.locator('#crossover-field').boundingBox(),portraitAside=await hero.locator('#crossover-arena aside').boundingBox();
 assert(portraitField.width>380&&portraitAside.y>=portraitField.y+portraitField.height-1,'Portrait uses full width and commands below the battlefield');
 await page.screenshot({path:out+'/mixed-field-portrait.png',fullPage:true});
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(200);
 const fieldBox=await hero.locator('#crossover-field').boundingBox(),landscapeAside=await hero.locator('#crossover-arena aside').boundingBox();assert(Math.abs(fieldBox.width/fieldBox.height-1.6)<0.01);assert(landscapeAside.x>fieldBox.x+fieldBox.width-2);
 const aside=hero.locator('#crossover-arena aside');await aside.hover();await page.mouse.wheel(0,600);await hero.waitForFunction(()=>document.querySelector('#crossover-arena aside').scrollTop>0);await page.mouse.wheel(0,-1200);await hero.waitForFunction(()=>document.querySelector('#crossover-arena aside').scrollTop===0);
 const cdp=await page.context().newCDPSession(page),rail=await aside.boundingBox(),tx=rail.x+rail.width/2,ty=rail.y+rail.height-24;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tx,y:ty}]});
 for(let step=1;step<=8;step++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:tx,y:ty-step*14}]});await page.waitForTimeout(25);}
 await page.waitForTimeout(100);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await hero.waitForFunction(()=>document.querySelector('#crossover-arena aside').scrollTop>0);
 await aside.hover();await page.mouse.wheel(0,-1200);await hero.waitForFunction(()=>document.querySelector('#crossover-arena aside').scrollTop===0);await cdp.detach();
 record({name:'Portrait uses lower controls; landscape right rail supports real touch scrolling with a visible exit'});
 await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(100);
 const ipadPortraitField=await hero.locator('#crossover-field').boundingBox(),ipadPortraitRail=await aside.boundingBox();assert(ipadPortraitRail.y>=ipadPortraitField.y+ipadPortraitField.height-1);
 await page.setViewportSize({width:1024,height:768});await page.waitForTimeout(100);
 const ipadLandscapeField=await hero.locator('#crossover-field').boundingBox(),ipadLandscapeRail=await aside.boundingBox();assert(ipadLandscapeRail.x>=ipadLandscapeField.x+ipadLandscapeField.width-1);
 record({name:'Tablet portrait 768×1024 and landscape 1024×768 preserve the same responsive command placement'});
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(100);

 await page.screenshot({path:out+'/mixed-field-ready.png',fullPage:true});
 record({name:'One visible Heroes battlefield contains original Heroes troops and native StarCraft Marines; Heroes HP are preserved',census});
 await hero.locator('#crossover-start').click();
 await sc.waitForFunction(()=>window.openbwCrossover.battle().frame>=36,null,{timeout:5000});
 const initialAllies=census.units.filter(unit=>unit.owner===0),initialEnemies=census.units.filter(unit=>unit.owner===1);
 const passive=await sc.evaluate(()=>window.openbwCrossover.census());
 for(const unit of passive.units.filter(unit=>unit.owner===0)){const original=initialAllies.find(row=>row.id===unit.id);assert(original);assert.equal(unit.x,original.x);assert.equal(unit.y,original.y);assert.equal(unit.order,original.order);assert.equal(unit.cooldown,0);}
 assert(passive.units.some(unit=>unit.owner===1&&initialEnemies.some(row=>row.id===unit.id&&(row.x!==unit.x||row.y!==unit.y))),'Enemy AI moves without player input');
 await sc.waitForFunction(initial=>{const allies=window.openbwCrossover.census().units.filter(unit=>unit.owner===0);return allies.length<initial||allies.some(unit=>unit.hp<unit.maxHp);},initialAllies.length,{timeout:15000});
 const underFire=await sc.evaluate(()=>window.openbwCrossover.census());
 for(const unit of underFire.units.filter(unit=>unit.owner===1))assert.equal(unit.hp,initialEnemies.find(row=>row.id===unit.id).hp,'No retaliation without an explicit attack');
 for(const unit of underFire.units.filter(unit=>unit.owner===0)){assert.equal(unit.order,initialAllies.find(row=>row.id===unit.id).order);assert.equal(unit.cooldown,0);}
 record({name:'Starting only advances time: Heroes stay idle even under enemy fire; Marines retain their AI'});
 const point=await sc.evaluate(()=>{const api=window.openbwCrossover,unit=api.census().units.find(u=>u.stackId===1),camera=api.camera();return {id:unit.id,x:unit.x-camera.x,y:unit.y-camera.y};});
 const box=await hero.locator('#crossover-field').boundingBox();
 const clickWorld=async point=>hero.locator('#crossover-field').click({position:{x:(point.x*view.zoom+view.x)*box.width/800,y:(point.y*view.zoom+view.y)*box.height/500}});
 await clickWorld(point);
 const selection=await hero.locator('#crossover-field').getAttribute('data-selection');assert.equal(selection,initial.stacks.find(row=>row.id===1).name);
 await hero.locator('#crossover-field').click({position:{x:760*box.width/800,y:440*box.height/500}});
 await sc.waitForFunction(()=>window.openbwCrossover.census().units.some(unit=>unit.stackId===1&&unit.order===6),null,{timeout:5000});
 await hero.locator('#crossover-stop').click();
 await sc.waitForFunction(order=>window.openbwCrossover.census().units.filter(unit=>unit.stackId===1).every(unit=>unit.order===order),initialAllies.find(row=>row.stackId===1).order,{timeout:5000});
 record({name:'Manual touch movement and Stop reach native orders and return the troop to passive stance'});
 await hero.locator('#crossover-select-all').click();
 const target=await sc.evaluate(()=>{const api=window.openbwCrossover,unit=api.census().units.find(u=>u.owner===1),camera=api.camera();return {id:unit.id,hp:unit.hp,x:unit.x-camera.x,y:unit.y-camera.y};});
 await clickWorld(target);
 await sc.waitForFunction(target=>{const unit=window.openbwCrossover.census().units.find(row=>row.id===target.id);return !unit||unit.hp<target.hp;},target,{timeout:12000});
 record({name:'Clicking a Marine issues an explicit native attack on that enemy'});
 await hero.locator('#crossover-attack').click();
 const camera=await sc.evaluate(()=>window.openbwCrossover.camera());await clickWorld({x:initialEnemies[0].x-camera.x,y:initialEnemies[0].y-camera.y});
 await hero.waitForFunction(()=>window.testCrossoverSubmission,null,{timeout:120000});
 const submission=await hero.evaluate(()=>window.testCrossoverSubmission);report.submission=submission;save();
 assert(submission.result.finished);assert(submission.result.groups.some(row=>row.survivors<row.initial));
 await hero.waitForFunction(()=>goonkMobileState.dialogKind==='battle-result',null,{timeout:60000});
 record({name:'Actual RTS result reaches the native Heroes battle summary',result:await hero.evaluate(()=>goonkMobileState.battleResult)});
 await cmd(1);await hero.waitForFunction(()=>goonkMobileState.mode==='map',null,{timeout:60000});
 await cmd(55);await hero.waitForFunction(()=>goonkMobileState.mode==='hero');
 const armies=await hero.evaluate(()=>goonkMobileState.armies),army=armies.find(row=>row.slots.some(Boolean));assert(army);
 for(const original of initial.stacks.filter(row=>row.side===0&&row.creature.startsWith('core:'))){
  const expected=submission.result.groups.find(row=>row.id===original.id).survivors;
  const actual=army.slots.filter(Boolean).filter(row=>row.key===original.creature).reduce((sum,row)=>sum+row.count,0);
  assert.equal(actual,expected,original.creature+' exact native casualty application');
 }
 record({name:'Native Heroes army exactly matches the surviving StarCraft cohorts',army});
 await page.screenshot({path:out+'/heroes-survivors.png',fullPage:true});
 await cmd(63);await hero.waitForFunction(()=>goonkMobileState.mode==='map');
 await cmd(7);
 await hero.waitForFunction(()=>{try{return Module.FS.stat('/home/web_user/.local/share/vcmi/Saves/Goonk-mobile.vsgm1').size>100000;}catch{return false;}},null,{timeout:60000});
 const saveBytes=await hero.evaluate(()=>Module.FS.stat('/home/web_user/.local/share/vcmi/Saves/Goonk-mobile.vsgm1').size);
 await cmd(71);await hero.waitForFunction(()=>goonkMobileState.mode==='menu');
 await cmd(23);await hero.waitForFunction(()=>goonkMobileState.mode==='load'&&goonkMobileState.lobbyReady&&goonkMobileState.maps?.some(row=>row.file?.toLowerCase().includes('goonk-mobile')));
 const index=await hero.evaluate(()=>goonkMobileState.maps.find(row=>row.file?.toLowerCase().includes('goonk-mobile')).index);
 await cmd(27,index);await hero.waitForFunction(index=>goonkMobileState.selectedIndex===index,index);
 await cmd(22);await hero.waitForFunction(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn,null,{timeout:60000});
 await cmd(55);await hero.waitForFunction(()=>goonkMobileState.mode==='hero');
 const restored=await hero.evaluate(()=>goonkMobileState.armies.find(row=>row.slots.some(Boolean)));
 assert.deepEqual(restored.slots.map(row=>row&&[row.key,row.count]),army.slots.map(row=>row&&[row.key,row.count]));
 record({name:'Native save and reload preserve exactly the post-RTS Heroes army',saveBytes,restored:restored.slots.map(row=>row&&[row.key,row.count])});
 // A second fresh adventure exercises the product's cancellation path.
 await page.goto(process.env.CROSSOVER_URL||'http://127.0.0.1:8779/index.html');hero=page;
 await page.waitForFunction(()=>window.goonkMobileState?.mode==='menu',null,{timeout:180000});
 await cmd(20,1);await hero.waitForFunction(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady,null,{timeout:60000});await cmd(111);await hero.waitForFunction(()=>goonkMobileState.selectedMap==='Crossover - duel StarCraft'&&goonkMobileState.lobbyReady);await cmd(22);
 await hero.waitForFunction(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn,null,{timeout:120000});
 await page.locator('#game-menu-toggle').click();await page.locator('#crossover-demo-menu').click();
 await hero.waitForFunction(()=>{try{return Module.FS.stat('/home/web_user/.local/share/vcmi/Saves/Avant-demo-StarCraft.vsgm1').size>100000;}catch{return false;}},null,{timeout:60000});
 record({name:'Launching the demo from an existing Heroes adventure first writes its dedicated native checkpoint'});
 await hero.locator('#crossover-arena').waitFor({timeout:180000});
 await hero.locator('#crossover-cancel').click();
 await hero.waitForFunction(()=>goonkMobileState.mode==='battle'&&!goonkMobileState.crossover&&goonkMobileState.canAutoCombat,null,{timeout:60000});
 await cmd(44,1);await hero.waitForFunction(()=>goonkMobileState.dialogKind==='battle-result',null,{timeout:120000});
 assert.equal(await hero.evaluate(()=>window.testCrossoverSubmission),undefined);
 record('Cancellation resumes a real native Heroes fight through completion without submitting any RTS casualties');
 assert.deepEqual(pageErrors,[],'No browser runtime exceptions');report.passed=true;save();
}catch(e){report.passed=false;report.error=String(e);report.heroes=await hero?.evaluate(()=>goonkMobileState).catch(()=>null);save();await page.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});process.exitCode=1;}
finally{await browser.close();}
console.log(JSON.stringify(report,null,2));
