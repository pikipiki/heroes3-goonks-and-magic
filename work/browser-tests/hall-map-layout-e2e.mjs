import{chromium,webkit}from'playwright-core';import assert from'node:assert/strict';import fs from'node:fs';import path from'node:path';
const creatures=Object.values(JSON.parse(fs.readFileSync('mod/goonk/Content/config/creatures.json'))),roster=JSON.parse(fs.readFileSync('mod/goonk/Content/config/faction.json')).goonk.town.creatures;
const formCount=roster.flat().length;
for(const kind of ['chromium','webkit']){const b=await(kind==='webkit'?webkit.launch({headless:true,executablePath:process.env.WEBKIT_PATH}):chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,args:['--no-sandbox']})),c=await b.newContext({viewport:{width:430,height:873},hasTouch:true}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.stack));try{
 await p.route('**/web/**',async r=>{const file=path.resolve(process.env.GOONK_TEST_WEB_ROOT||'web',new URL(r.request().url()).pathname.split('/web/')[1]);if(!fs.existsSync(file))return r.abort();await r.fulfill({path:file});});
 await p.route('**/opfs-worker.js',r=>r.fulfill({path:path.resolve('work/vcmi-wasm/lib/html5/opfs-worker.js')}));
 await p.route('**/family-test?mobile=1',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/game-menu.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...a){calls.push(a)}};</script><script type=module src=/web/mobile.mjs></script>`}));await (await import('./silent-audio.mjs')).silenceTestAudio(p);await p.goto('http://127.0.0.1:8782/family-test?mobile=1');await p.waitForSelector('#mobile-app');
 await p.evaluate(({creatures,roster})=>{const menu=document.createElement('button');
 menu.id='game-menu-toggle';
 menu.textContent='☰';
 document.querySelector('.mobile-brand').replaceWith(menu);
 const base={mode:'fort',dialogTitle:'Town creatures',day:1,turn:true,resources:[50,50,50,50,50,50,118300,50],armies:[],fortRows:[],previewUnits:[],fortFamilies:roster.map((ids,level)=>({level,count:12,variants:ids.map((key,rank)=>{const u=creatures.find(x=>x.graphics.animation==='goonk/'+['pink','lancer','archer','fart','vomit','blue','fire'][level]+(rank===0?'':rank===1?'-evo':'-exalted'));return{id:level*3+rank,level,rank,count:12,built:rank<2,requiredBuilding:'{Final sanctuary}',name:u.name.singular,cost:[0,0,0,0,0,0,rank===2?300:90,0],attack:u.attack,defense:u.defense,health:u.hitPoints,speed:u.speed,damageMin:u.damage.min,damageMax:u.damage.max};})}))};window.familyState=base;window.send=()=>dispatchEvent(new CustomEvent('goonk-state',{detail:structuredClone(familyState)}));send();},{creatures,roster});

 const send=s=>p.evaluate(s=>dispatchEvent(new CustomEvent('goonk-state',{detail:s})),s),base=await p.evaluate(()=>structuredClone(familyState));
 for(const size of [{width:430,height:873},{width:430,height:760},{width:360,height:640},{width:360,height:650},{width:360,height:716},{width:360,height:650},{width:360,height:716},{width:360,height:780},{width:393,height:851},{width:320,height:568},{width:768,height:1024},{width:640,height:280},{width:716,height:279},{width:716,height:335},{width:851,height:393},{width:1024,height:768}]){
  await p.setViewportSize(size);await send(base);await p.waitForTimeout(250);
  const list=p.locator('.hall-families');await list.evaluate(e=>e.scrollTop=0);
  const rows=await list.evaluate(e=>{const s=getComputedStyle(e),first=e.children[0].getBoundingClientRect(),next=e.children[1].getBoundingClientRect();return{height:e.clientHeight-parseFloat(s.paddingTop)-parseFloat(s.paddingBottom),first:first.height,nextTop:next.top,top:first.top,gap:parseFloat(s.rowGap)||0,minimum:Math.max(132,...[...e.children].flatMap(r=>[...r.querySelectorAll('.hall-art')].map(a=>Math.ceil(r.getBoundingClientRect().height-a.getBoundingClientRect().height+64)))),secondBottom:next.bottom,viewportBottom:e.getBoundingClientRect().bottom};});
  if(size.width<size.height){
   const count=2;
   assert(Math.abs(rows.first-(rows.height-rows.gap*(count-1))/count)<2,JSON.stringify({size,rows,count}));
   assert(rows.secondBottom<=rows.viewportBottom-7,'Two complete families fit in every portrait viewport');
   if(size.width===430&&size.height===873)assert.equal(count,2,'iPhone Pro Max uses two rows');
  }
  const back=p.locator('[data-presentation-close]');assert.equal(await back.count(),1);await back.waitFor({state:'visible'});const rect=await back.boundingBox();assert(rect.y>=0&&rect.x>=0&&rect.y+rect.height<=size.height&&rect.x+rect.width<=size.width,'Back is reachable '+JSON.stringify({size,rect}));
  if(size.width>size.height){const detail=p.locator('.hall-detail'),context=detail.locator('.hall-purchase-context');assert.equal(await context.evaluate(e=>getComputedStyle(e).overflowY),'auto');const metrics=await detail.evaluate(e=>({overflow:getComputedStyle(e).overflowY,height:e.clientHeight,scroll:e.scrollHeight}));assert.equal(metrics.overflow,'hidden');if(size.width===716&&size.height===335)assert(metrics.scroll<=metrics.height+1,'Measured landscape sidebar has no unnecessary scroll');const statFit=await detail.locator('.hall-feature').evaluate(e=>({height:e.clientHeight,scroll:e.scrollHeight,bottom:e.getBoundingClientRect().bottom,stats:e.querySelector('.creature-stats').getBoundingClientRect().bottom}));assert(statFit.stats<=statFit.bottom+1&&statFit.scroll<=statFit.height+1,'Attack and defense values fit without an inner scrollbar '+JSON.stringify({size,statFit}));if(size.height<=335)assert(metrics.scroll<=metrics.height+1,'Short landscape keeps all recruitment actions visible');assert(await p.locator('.mobile-calendar').isHidden(),'Hall countdown and date are hidden only in landscape');const buy=detail.locator('[data-hall-buy]');await buy.scrollIntoViewIfNeeded();assert(await buy.isVisible());}
  const statValues=await p.locator('.hall-feature .creature-stats dd').evaluateAll(nodes=>nodes.map(e=>({size:getComputedStyle(e).fontSize,width:e.clientWidth,scroll:e.scrollWidth})));
  assert.equal(new Set(statValues.map(e=>e.size)).size,1,'All five stat values share one font size');
  assert(statValues.every(e=>e.scroll<=e.width+1),'Stat values fit their full columns');
  await p.screenshot({path:'/tmp/goonk-hall-'+kind+'-'+size.width+'x'+size.height+'.png'});
  await back.tap();assert((await p.evaluate(()=>calls)).some(c=>c[0]===43),'Back calls the native return action');
  await send({...base,mode:'map',heroName:'Maille Maille Keeper',movement:1630,heroMana:10,heroManaLimit:10,heroHasSpellbook:false,turn:true});await p.waitForTimeout(150);
  if(size.width>size.height){const hero=await p.locator('.hero-movement-item.is-active').boundingBox(),move=await p.locator('[data-ui=move]').boundingBox(),book=await p.locator('.hero-no-spellbook').boundingBox();assert(hero.height>=48&&hero.y+hero.height<=move.y-4,'Compact hero card never overlaps Move '+JSON.stringify({size,hero,move,book}));assert(book.y>=hero.y&&book.y+book.height<=hero.y+hero.height+1,'No spellbook badge stays inside hero borders');const borders=await p.locator('.hero-movement-item.is-active').evaluate(e=>({top:parseFloat(getComputedStyle(e).borderTopWidth),bottom:parseFloat(getComputedStyle(e).borderBottomWidth)}));assert(borders.top>=1&&borders.bottom>=1,'Hero keeps visible top and bottom borders');}
  const compactResources=p.locator('.ui-kingdom-trigger');if(size.width>size.height&&size.height<400)await compactResources.tap();
  const date=await p.locator('.mobile-calendar>span:first-child').boundingBox(),cue=await p.locator('.calendar-recruit-cue').boundingBox();if(size.width<size.height)assert(date.y>=cue.y+cue.height-1,'Game date lies below recruits '+JSON.stringify({size,date,cue}));
  const label=await p.locator('[data-recruit-label]').boundingBox(),days=await p.locator('[data-recruit-days]').boundingBox();
  if(size.width<size.height){assert(days.y>=label.y+label.height-1,'Portrait recruits and countdown use two lines');assert(cue.x+cue.width<=size.width+1,'Countdown stays entirely inside portrait viewport');assert(days.x+days.width<=cue.x+cue.width-2,'Final countdown glyph is not cropped');}else assert(Math.abs(days.y-label.y)<3,'Landscape countdown stays on one line');if(size.width>size.height&&size.height<400)await p.keyboard.press('Escape');

 }
 // A damage range and three-digit HP must not progressively shrink on resize.
 const highStats={...base,fortFamilies:base.fortFamilies.map(f=>({...f,variants:f.variants.map(u=>({...u,attack:32,defense:30,damageMin:52,damageMax:73,health:460}))}))};
 for(const size of [{width:716,height:279},{width:360,height:716},{width:716,height:335}]){
  await p.setViewportSize(size);await send(highStats);await p.waitForTimeout(200);
  for(let i=0;i<4;i++){await send({...highStats,day:i+1});await p.waitForTimeout(50);}
  const sizes=await p.locator('.hall-feature .creature-stats dd').evaluateAll(nodes=>nodes.map(e=>parseFloat(getComputedStyle(e).fontSize)));
  assert(sizes.every(n=>n===14),'Combat stats retain the shared 14px body role across updates '+JSON.stringify({size,sizes}));
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
 await detail.locator('.ui-overflow-trigger').tap();assert(await detail.locator('[data-type-info]').isVisible());await p.keyboard.press('Escape');
 await p.locator('[data-family-select="1"]').tap();await p.waitForTimeout(180);
 assert(await detail.locator('[data-hall-buy]').isEnabled());assert(await detail.locator('.hall-quantity input').isEnabled());
 assert.deepEqual(await gallery.boundingBox(),beforeLocked.gallery,'Returning to a recruitable form does not jump');
 assert.deepEqual(await detail.locator('.creature-stats').boundingBox(),beforeLocked.stats,'Returning to available units keeps stats fixed');
 // Full names wrap at spaces with the shared readable title role.
 const longName='Grandmaster Gremlin of the Ancestral Clockwork Legion';
 const longState={...base,fortFamilies:base.fortFamilies.map((family,i)=>i?i===1?{...family,variants:family.variants.map(u=>({...u,damageMin:12345,damageMax:67890}))}:family:{...family,variants:family.variants.map(u=>({...u,name:longName}))})};
 for(const size of [{width:360,height:716},{width:716,height:335}]){
  await p.setViewportSize(size);await send(longState);await p.waitForTimeout(200);await p.locator('[data-family-select="1"]').click();await p.waitForTimeout(100);
  const name=await p.locator('.hall-feature-title h3').evaluate(e=>({text:e.textContent,width:e.clientWidth,scroll:e.scrollWidth,font:parseFloat(getComputedStyle(e).fontSize),clamp:getComputedStyle(e).webkitLineClamp}));
  assert.equal(name.text,longName);assert(name.scroll<=name.width+1,'The complete name fits its line '+JSON.stringify({size,name}));assert(name.font>=14&&name.font<=16,'Long names keep the shared readable text role');assert.notEqual(name.clamp,'1','No ellipsis clamp remains');
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
  const visible=2;
  assert(Math.abs(metrics.row-(metrics.space-metrics.gap*(visible-1))/visible)<2,'Both portrait rows keep fitting when URL bars change without a game snapshot');
 }
 // Reserve iPhone status/home-indicator space as well as reducing the viewport for URL bars.
 await p.setViewportSize({width:430,height:932});await send(base);
 await p.locator('#mobile-app').evaluate(e=>{e.style.paddingTop='62px';e.style.paddingBottom='34px';});
 await p.waitForTimeout(180);await p.locator('.hall-families').evaluate(e=>e.scrollTop=0);
 const safeRows=await p.locator('.hall-families').evaluate(e=>({height:e.children[0].getBoundingClientRect().height,secondBottom:e.children[1].getBoundingClientRect().bottom,bottom:e.getBoundingClientRect().bottom}));
 assert(safeRows.height>=220&&safeRows.secondBottom<=safeRows.bottom-7,'Pro Max fits two rows with safe areas reserved');
 await p.screenshot({path:'/tmp/goonk-hall-'+kind+'-pro-max-safe.png'});
 await send({...base,mode:'town'});await p.waitForTimeout(150);await p.locator('.mobile-nav>.ui-overflow-trigger').tap();await p.waitForFunction(()=>{const img=document.querySelector('[data-ui=town-guild] img');return img?.complete&&img.naturalWidth>0&&img.src.startsWith('data:image/svg+xml,');});
 assert.deepEqual(errors,[]);console.log('PASS',kind,'two complete portrait families per screen; safe areas; short landscape without sidebar scroll; visible Back; map date below recruits');
 }finally{await b.close();}}
