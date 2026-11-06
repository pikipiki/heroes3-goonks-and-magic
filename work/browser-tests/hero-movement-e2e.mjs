import{chromium,webkit}from'playwright-core';import assert from'node:assert/strict';import fs from'node:fs';import path from'node:path';
for(const kind of ['chromium','webkit']){
 const browser=await(kind==='webkit'?webkit.launch({executablePath:process.env.WEBKIT_PATH}):chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox']}));
 try{const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/web/**',async route=>{const file=path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1]);if(!fs.existsSync(file))return route.abort();await route.fulfill({path:file});});
 await page.route('**/movement-test?mobile=1',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/web/mobile.css"><link rel="stylesheet" href="/web/game-menu.css"><link rel="stylesheet" href="/web/h3-theme.css"><link rel="stylesheet" href="/web/mobile-upgrade.css"><canvas id="canvas" width="800" height="600"></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...args){calls.push(args)}};</script><script type="module" src="/web/mobile.mjs"></script>'}));
 await page.goto('http://127.0.0.1:8783/movement-test?mobile=1');await page.waitForSelector('#mobile-app');
 await page.evaluate(()=>{const menu=document.createElement('button');menu.id='game-menu-toggle';menu.textContent='☰';document.querySelector('.mobile-brand').replaceWith(menu);window.testState={mode:'map',turn:true,heroName:'Ax sis <test>',movement:179,heroMana:0,heroManaLimit:10,heroes:[{index:0,name:'Ax sis <test>',movement:179,movementLimit:1630,mana:0,manaLimit:10},{index:1,name:'Gunnar',movement:0},{index:2,name:'Solmyr',movement:1630}],armies:[],towns:[],resources:[20,20,20,20,20,20,118300,100],day:16};window.send=()=>dispatchEvent(new CustomEvent('goonk-state',{detail:structuredClone(testState)}));send();});
 await page.waitForSelector('.hero-movement-item');assert.equal(await page.locator('.hero-movement-item[data-movement-band=low]').count(),1);assert.equal(await page.locator('.hero-movement-item[data-movement-band=high]').count(),1);assert.equal(await page.locator('.hero-movement-item[data-movement-band=empty]').count(),1);
 for(const size of [{width:390,height:844},{width:844,height:390},{width:568,height:320},{width:320,height:740},{width:390,height:844}]){
 await page.setViewportSize(size);await page.waitForTimeout(180);assert.equal(await page.locator('.mobile-top .mobile-movement').count(),0);assert.equal(await page.locator('.hero-mana').first().textContent(),'Mana 0/10');assert.equal(await page.locator('.mobile-nav [data-ui=save]').count(),0);assert.equal(await page.locator('.hero-movement-item').count(),3);assert.equal(await page.locator('.hero-movement-item strong').first().textContent(),'Ax sis <test>');assert.match(await page.locator('.hero-movement-item.is-exhausted').textContent(),/Gunnar0 MP/);
 for(const rect of await page.locator('.mobile-nav>button').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()))){assert(rect.width>=44&&rect.height>=44);assert(rect.x>=0&&rect.y>=0&&rect.right<=size.width+1&&rect.bottom<=size.height+1,'Actions stay within viewport');}
 const calendar=page.locator('.mobile-calendar');
 assert.equal(await page.locator('.mobile-title').isVisible(),false,'The compact HUD replaces the header hero name');
 const [menu,date,resources,top,play]=await Promise.all(['#game-menu-toggle','.mobile-calendar','.mobile-resources','.mobile-top','.mobile-play'].map(selector=>page.locator(selector).boundingBox()));
 assert(resources.x>=menu.x+menu.width&&resources.x+resources.width<=top.x+top.width+1,'The resources fit beside the menu');
 assert(resources.y>=menu.y-1&&resources.y+resources.height<=menu.y+menu.height+1,'The resources share the menu row');
 assert(date.x<=menu.x+1&&date.y>=menu.y+menu.height-1,'The calendar spans the row below the menu');
 assert(await page.locator('.mobile-resources').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'All eight resources fit without scrolling');
 if(size.width<size.height){
  assert.match(await calendar.innerText(),/Day 2\/7 · Week 3 · Month 1/);
  assert(Math.abs(play.y-(date.y+date.height))<8,'The map starts directly after the calendar');
 }else{
  assert.match(await calendar.innerText(),/Day 2\/7 · W3 · M1/);
  assert(Math.abs(play.y-top.y)<1&&play.height>=size.height-2,'Landscape map uses the full height');
 }
 const heroButton=page.locator('[data-hero-index="1"]');await heroButton.scrollIntoViewIfNeeded();await heroButton.tap();assert.deepEqual((await page.evaluate(()=>calls.at(-1))).slice(0,2),[4,1],'Hero selection uses native command after rotation');
 await page.locator('[data-ui=endturn]').tap();assert.equal((await page.evaluate(()=>calls.at(-1)))[0],3);assert.equal(await page.locator('.mobile-sheet:not([hidden])').count(),0);
 }
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{testState.heroes=Array.from({length:12},(_,index)=>({index,name:'Hero '+index,movement:1000-index*100}));send();});
 const strip=page.locator('.hero-movement-list'),right=page.locator('[data-hero-scroll="1"]'),left=page.locator('[data-hero-scroll="-1"]');
 await strip.evaluate(e=>e.scrollLeft=0);await page.waitForTimeout(100);await right.waitFor({state:'visible'});assert(await left.isDisabled());const before=await page.evaluate(()=>calls.length);await right.tap();await page.waitForTimeout(500);assert(await strip.evaluate(e=>e.scrollLeft>0));assert.equal(await page.evaluate(()=>calls.length),before,'Scrolling never selects a hero');assert(!(await left.isDisabled()));
 const scroll=await strip.evaluate(e=>e.scrollLeft);await page.evaluate(()=>{testState.heroes[0].movement--;send();});const afterScroll=await strip.evaluate(e=>e.scrollLeft);assert(Math.abs(afterScroll-scroll)<2,'Live state preserves horizontal position '+scroll+' -> '+afterScroll);
 await page.evaluate(()=>{testState.heroes=testState.heroes.slice(0,1);Object.assign(testState.heroes[0],{name:'Ax sis <test>',mana:0,manaLimit:10});testState.heroName='Ax sis <test>';send();});assert(await right.isHidden());
 await page.evaluate(()=>{testState.heroes.push({index:1,name:'Gunnar',movement:0},{index:2,name:'Solmyr',movement:1630});testState.heroes[0].movement=0;testState.movement=0;send();});assert.equal(await page.locator('.hero-movement-item.is-exhausted').count(),2);assert.match(await page.locator('.hero-movement-item').first().textContent(),/0 MP/);
 await page.evaluate(async()=>{const{setLanguage}=await import('/web/i18n.mjs');setLanguage('fr');send();});assert.match(await page.locator('.hero-movement-item').first().textContent(),/0 PM/);assert.equal(await page.locator('.hero-mana').first().textContent(),'Magie 0/10');
 await page.locator('[data-ui=heroes]').tap();assert.equal((await page.evaluate(()=>calls.at(-1)))[0],55,'Heroes opens equipment directly, including with several heroes');assert.equal(await page.locator('.mobile-sheet:not([hidden])').count(),0);
 await page.evaluate(()=>dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'town',turn:true,townFaction:'goonk:goonk',townName:'Goonkbourg',buildings:[],resources:[],armies:[],day:1}})));await page.waitForSelector('.town-recruit-strip');assert.equal(await page.locator('.town-recruit-strip [data-ui=build]').count(),0);assert.equal(await page.locator('.mobile-nav [data-ui=build]').count(),1);
 const headers=[
  {mode:'town',townName:'Goonkbourg',buildings:[]},
  {mode:'fort',fortRows:[],fortFamilies:[]},
  {mode:'recruit',recruitUnit:{id:98,name:'Gnoll',count:12},recruits:[]},
  {mode:'creature',creatureUnit:{id:98,name:'Gnoll',count:12}},
  {mode:'dialog',dialogKind:'tavern'},
  {mode:'spellbook',spellbook:{page:0,pages:1,spells:[]}}
 ];
 for(const size of [{width:320,height:740},{width:568,height:320}]){
  await page.setViewportSize(size);
  await page.waitForTimeout(180);
  for(const header of headers){
   await page.evaluate(header=>dispatchEvent(new CustomEvent('goonk-state',{detail:{
    ...header,day:16,turn:true,resources:[20,10,20,10,10,10,118300,100],armies:[]
   }})),header);
   await page.waitForFunction(mode=>window.goonkMobileState?.mode===mode,header.mode);
   const [menu,resources,date]=await Promise.all(['#game-menu-toggle','.mobile-resources','.mobile-calendar'].map(selector=>page.locator(selector).boundingBox()));
   assert(await page.locator('.mobile-title').isHidden(),header.mode+' uses the compact header');
   assert(resources.x>=menu.x+menu.width&&resources.x+resources.width<=size.width,header.mode+' resources fit beside the menu '+JSON.stringify({size,menu,resources}));
   assert(resources.y>=menu.y-1&&resources.y+resources.height<=menu.y+menu.height+1,header.mode+' resources share the menu row');
   assert(date.y>=menu.y+menu.height-1,header.mode+' calendar is below the menu');
   assert(await page.locator('.mobile-resources').evaluate(el=>el.scrollWidth<=el.clientWidth+1),header.mode+' displays every resource');
   if(header.dialogKind==='tavern'){
    const close=await page.locator('.dialog-close').boundingBox();
    assert(close.x>=resources.x+resources.width&&close.y+close.height<=date.y+1,'Tavern close stays beside the resources');
   }
  }
 }
 await page.screenshot({path:'/private/tmp/goonk-hero-movement-'+kind+'.png'});assert.deepEqual(errors,[]);console.log('PASS',kind,'movement updates, exhausted heroes, EN/FR, five portrait/landscape viewports and working actions');
 }finally{await browser.close();}
}
