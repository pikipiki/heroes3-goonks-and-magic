import{chromium,webkit}from'playwright-core';import assert from'node:assert/strict';import fs from'node:fs';import path from'node:path';
const creatures=Object.values(JSON.parse(fs.readFileSync('mod/goonk/Content/config/creatures.json'))),roster=JSON.parse(fs.readFileSync('mod/goonk/Content/config/faction.json')).goonk.town.creatures;
const formCount=roster.flat().length;
for(const kind of ['chromium','webkit']){const b=await(kind==='webkit'?webkit.launch({headless:true,executablePath:process.env.WEBKIT_PATH}):chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,args:['--no-sandbox']})),c=await b.newContext({viewport:{width:430,height:873},hasTouch:true}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));try{
 await p.route('**/web/**',async r=>{const file=path.resolve(process.env.GOONK_TEST_WEB_ROOT||'web',new URL(r.request().url()).pathname.split('/web/')[1]);if(!fs.existsSync(file))return r.abort();await r.fulfill({path:file});});
 await p.route('**/opfs-worker.js',r=>r.fulfill({path:path.resolve('work/vcmi-wasm/lib/html5/opfs-worker.js')}));
 await p.route('**/family-test?mobile=1',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/game-menu.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...a){calls.push(a)}};</script><script type=module src=/web/mobile.mjs></script>`}));await (await import('./silent-audio.mjs')).silenceTestAudio(p);await p.goto('http://127.0.0.1:8782/family-test?mobile=1');await p.waitForSelector('#mobile-app');
 await p.evaluate(({creatures,roster})=>{const menu=document.createElement('button');
 menu.id='game-menu-toggle';
 menu.textContent='☰';
 document.querySelector('.mobile-brand').replaceWith(menu);
 const base={mode:'fort',dialogTitle:'Town creatures',day:1,turn:true,resources:[50,50,50,50,50,50,118300,50],armies:[],fortRows:[],previewUnits:[],fortFamilies:roster.map((ids,level)=>({level,count:12,variants:ids.map((key,rank)=>{const u=creatures.find(x=>x.graphics.animation==='goonk/'+['pink','lancer','archer','fart','vomit','blue','fire'][level]+(rank===0?'':rank===1?'-evo':'-exalted'));return{id:level*3+rank,level,rank,count:12,built:rank<2,requiredBuilding:'{Final sanctuary}',name:u.name.singular,cost:[0,0,0,0,0,0,rank===2?300:90,0],attack:u.attack,defense:u.defense,health:u.hitPoints,speed:u.speed,damageMin:u.damage.min,damageMax:u.damage.max};})}))};window.familyState=base;window.send=()=>dispatchEvent(new CustomEvent('goonk-state',{detail:structuredClone(familyState)}));send();},{creatures,roster});

 const send=s=>p.evaluate(s=>dispatchEvent(new CustomEvent('goonk-state',{detail:s})),s),base=await p.evaluate(()=>structuredClone(familyState));
 for(const size of [{width:430,height:873},{width:430,height:760},{width:360,height:640},{width:360,height:650},{width:360,height:716},{width:360,height:650},{width:360,height:716},{width:360,height:780},{width:393,height:851},{width:320,height:568},{width:768,height:1024},{width:640,height:280},{width:716,height:335},{width:851,height:393},{width:1024,height:768}]){
  await p.setViewportSize(size);await send(base);await p.waitForTimeout(250);
  const list=p.locator('.hall-families');await list.evaluate(e=>e.scrollTop=0);
  const rows=await list.evaluate(e=>{const s=getComputedStyle(e),first=e.children[0].getBoundingClientRect(),next=e.children[1].getBoundingClientRect();return{height:e.clientHeight-parseFloat(s.paddingTop)-parseFloat(s.paddingBottom),first:first.height,nextTop:next.top,top:first.top,gap:parseFloat(s.rowGap)||0,minimum:Math.max(132,...[...e.children].flatMap(r=>[...r.querySelectorAll('.hall-art')].map(a=>Math.ceil(r.getBoundingClientRect().height-a.getBoundingClientRect().height+64)))),secondBottom:next.bottom,viewportBottom:e.getBoundingClientRect().bottom};});
  if(size.width<size.height){
   const count=rows.height>=rows.minimum*2+rows.gap?2:1;
   assert(Math.abs(rows.first-(rows.height-rows.gap*(count-1))/count)<2,JSON.stringify({size,rows,count}));
   if(count===2)assert(rows.secondBottom<=rows.viewportBottom-7,'Two complete families fit in tall portrait');
   else assert(rows.nextTop>=rows.viewportBottom-8,'Short portrait retains one complete family');
   if(size.width===430&&size.height===873)assert.equal(count,2,'iPhone Pro Max uses two rows');
  }
  const back=p.locator('[data-presentation-close]');assert.equal(await back.count(),1);await back.waitFor({state:'visible'});const rect=await back.boundingBox();assert(rect.y>=0&&rect.x>=0&&rect.y+rect.height<=size.height&&rect.x+rect.width<=size.width,'Back is reachable '+JSON.stringify({size,rect}));
  if(size.width>size.height){const detail=p.locator('.hall-detail'),metrics=await detail.evaluate(e=>({overflow:getComputedStyle(e).overflowY,height:e.clientHeight,scroll:e.scrollHeight}));assert.equal(metrics.overflow,'auto');if(size.width===716&&size.height===335)assert(metrics.scroll<=metrics.height+1,'Measured landscape sidebar has no unnecessary scroll');const statFit=await detail.locator('.hall-feature').evaluate(e=>({height:e.clientHeight,scroll:e.scrollHeight,bottom:e.getBoundingClientRect().bottom,stats:e.querySelector('.creature-stats').getBoundingClientRect().bottom}));assert(statFit.stats<=statFit.bottom+1&&statFit.scroll<=statFit.height+1,'Attack and defense values fit without an inner scrollbar '+JSON.stringify({size,statFit}));if(size.height<=280)assert(metrics.scroll>metrics.height,'Short landscape sidebar scrolls');const buy=detail.locator('[data-hall-buy]');await buy.scrollIntoViewIfNeeded();assert(await buy.isVisible());}
  await p.screenshot({path:'/tmp/goonk-hall-'+kind+'-'+size.width+'x'+size.height+'.png'});
  await back.tap();assert((await p.evaluate(()=>calls)).some(c=>c[0]===43),'Back calls the native return action');
  await send({...base,mode:'map',heroName:'Hero',turn:true});await p.waitForTimeout(150);
  const date=await p.locator('.mobile-calendar>span:first-child').boundingBox(),cue=await p.locator('.calendar-recruit-cue').boundingBox();assert(date.y>=cue.y+cue.height-1,'Game date lies below recruits '+JSON.stringify({size,date,cue}));
 }
 // Every selection retains the same compact footer and roster geometry.
 await p.setViewportSize({width:360,height:716});await send(base);await p.waitForTimeout(180);
 const gallery=p.locator('.hall-families'),detail=p.locator('.hall-detail');
 const beforeLocked={gallery:await gallery.boundingBox(),detail:await detail.boundingBox(),row:await gallery.locator('.hall-family').first().boundingBox(),stats:await detail.locator('.creature-stats').boundingBox()};
 await gallery.evaluate(e=>e.scrollTop=0);await p.locator('[data-family-select="2"]').tap();await p.waitForTimeout(180);
 assert.equal(await p.locator('.hall-unlock-preview').count(),0,'No required-building explanation remains');
 assert(await detail.locator('.hall-stock').isHidden());assert(await detail.locator('.hall-total').isHidden());
 assert(await detail.locator('.hall-quantity').isVisible());assert(await detail.locator('.hall-quantity input').isDisabled());
 assert.deepEqual(await gallery.boundingBox(),beforeLocked.gallery,'Locked selection does not resize the gallery');
 assert.deepEqual(await detail.boundingBox(),beforeLocked.detail,'Footer height stays fixed');
 assert.deepEqual(await detail.locator('.creature-stats').boundingBox(),beforeLocked.stats,'Stats stay anchored despite a different name and price');
 assert.match(await detail.locator('.hall-unit-price').innerText(),/Cost/);assert.match(await detail.locator('.hall-unit-price').innerText(),/300/);
 assert.deepEqual(await gallery.locator('.hall-family').first().boundingBox(),beforeLocked.row,'Visible row count stays fixed');
 assert(await detail.locator('[data-type-info]').isVisible());
 await p.locator('[data-family-select="1"]').tap();await p.waitForTimeout(180);
 assert(await detail.locator('[data-hall-buy]').isEnabled());assert(await detail.locator('.hall-quantity input').isEnabled());
 assert.deepEqual(await gallery.boundingBox(),beforeLocked.gallery,'Returning to a recruitable form does not jump');
 assert.deepEqual(await detail.locator('.creature-stats').boundingBox(),beforeLocked.stats,'Returning to available units keeps stats fixed');
 // Full names fit by changing the font, not by truncating or changing stat positions.
 const longName='Grandmaster Gremlin of the Ancestral Clockwork Legion';
 const longState={...base,fortFamilies:base.fortFamilies.map((family,i)=>i?i===1?{...family,variants:family.variants.map(u=>({...u,damageMin:12345,damageMax:67890}))}:family:{...family,variants:family.variants.map(u=>({...u,name:longName}))})};
 for(const size of [{width:360,height:716},{width:716,height:335}]){
  await p.setViewportSize(size);await send(longState);await p.waitForTimeout(200);await p.locator('[data-family-select="1"]').click();await p.waitForTimeout(100);
  const name=await p.locator('.hall-feature-title h3').evaluate(e=>({text:e.textContent,width:e.clientWidth,scroll:e.scrollWidth,font:parseFloat(getComputedStyle(e).fontSize),clamp:getComputedStyle(e).webkitLineClamp}));
  assert.equal(name.text,longName);assert(name.scroll<=name.width+1,'The complete name fits its line '+JSON.stringify({size,name}));assert(name.font<16,'Long names use a smaller font');assert.notEqual(name.clamp,'1','No ellipsis clamp remains');
  const statsBefore=await p.locator('.hall-feature .creature-stats').boundingBox();
  await p.locator('[data-family-select="2"]').click();await p.waitForTimeout(100);assert.deepEqual(await p.locator('.hall-feature .creature-stats').boundingBox(),statsBefore,'A long locked name does not move stats');
  const cost=await p.locator('.hall-unit-price').boundingBox(),title=await p.locator('.hall-feature-title h3').boundingBox();assert(Math.abs(cost.y-title.y)<2,'Cost shares the creature name row');assert(title.x+title.width<=cost.x-3,'Full name never overlaps the cost');assert(cost.y+cost.height<=statsBefore.y+1,'No extra price row below the stats');
 }
 await send(base);
 // Reproduce the real compact Tower labels measured on the connected device.
 const names=[['Gremlin','Master Gremlin','Grandmaster Gremlin'],['Stone Gargoyle','Obsidian Gargoyle','Marble Gargoyle'],['Stone Golem','Iron Golem','Mithril Golem'],['Mage','Arch Mage','Supreme Arch Mage'],['Genie','Master Genie','Arcane Genie'],['Naga','Naga Queen','Naga Empress'],['Giant','Titan','Lord of Thunder','Master of Thunder']];
 const tower={...base,fortFamilies:base.fortFamilies.map((family,i)=>({...family,variants:family.variants.map((u,j)=>({...u,name:names[i][j]}))}))};
 // Chrome can hide/show its bars without a game snapshot or an orientation change.
 await p.setViewportSize({width:360,height:716});await send(tower);await p.waitForTimeout(150);
 const rosterList=p.locator('.hall-families');
 const anchor=()=>rosterList.evaluate(e=>e.scrollTop/(e.firstElementChild.getBoundingClientRect().height+parseFloat(getComputedStyle(e).rowGap)));
 await rosterList.evaluate(e=>e.scrollTop=2*(e.firstElementChild.getBoundingClientRect().height+parseFloat(getComputedStyle(e).rowGap)));
 const before=await anchor();
 assert(await rosterList.evaluate(e=>e.firstElementChild.getBoundingClientRect().height*2+8<=e.clientHeight-16),'Two readable Tower rows fit in the measured 716px viewport');
 for(const height of [590,716]){
  await p.setViewportSize({width:360,height});await p.waitForTimeout(150);
  assert(Math.abs(await anchor()-before)<.02,'Browser bar resizing keeps the same tier in view');
  const metrics=await rosterList.evaluate(e=>({row:e.firstElementChild.getBoundingClientRect().height,space:e.clientHeight-16,gap:parseFloat(getComputedStyle(e).rowGap)}));
  const visible=height===716?2:1;
  assert(Math.abs(metrics.row-(metrics.space-metrics.gap*(visible-1))/visible)<2,'Bar visibility changes the row count without a new game snapshot');
 }
 // Reserve iPhone status/home-indicator space as well as reducing the viewport for URL bars.
 await p.setViewportSize({width:430,height:932});await send(base);
 await p.locator('#mobile-app').evaluate(e=>{e.style.paddingTop='62px';e.style.paddingBottom='34px';});
 await p.waitForTimeout(180);await p.locator('.hall-families').evaluate(e=>e.scrollTop=0);
 const safeRows=await p.locator('.hall-families').evaluate(e=>({height:e.children[0].getBoundingClientRect().height,secondBottom:e.children[1].getBoundingClientRect().bottom,bottom:e.getBoundingClientRect().bottom}));
 assert(safeRows.height>=220&&safeRows.secondBottom<=safeRows.bottom-7,'Pro Max fits two rows with safe areas reserved');
 await p.screenshot({path:'/tmp/goonk-hall-'+kind+'-pro-max-safe.png'});
 assert.deepEqual(errors,[]);console.log('PASS',kind,'adaptive one/two portrait families per screen; safe areas; short landscape sidebar scroll; visible Back; map date below recruits');
 }finally{await b.close();}}
