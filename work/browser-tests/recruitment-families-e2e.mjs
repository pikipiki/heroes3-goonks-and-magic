import{chromium,webkit}from'playwright-core';import assert from'node:assert/strict';import fs from'node:fs';import path from'node:path';
const creatures=Object.values(JSON.parse(fs.readFileSync('mod/goonk/Content/config/creatures.json'))),roster=JSON.parse(fs.readFileSync('mod/goonk/Content/config/faction.json')).goonk.town.creatures;
const formCount=roster.flat().length;
for(const kind of ['chromium','webkit']){const b=await(kind==='webkit'?webkit.launch({headless:true,executablePath:process.env.WEBKIT_PATH}):chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,args:['--no-sandbox']})),c=await b.newContext({viewport:{width:430,height:873},hasTouch:true}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));try{
 await p.route('**/web/**',async r=>{const file=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);if(!fs.existsSync(file))return r.abort();await r.fulfill({path:file});});
 await p.route('**/family-test?mobile=1',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/game-menu.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...a){calls.push(a)}};</script><script type=module src=/web/mobile.mjs></script>`}));await (await import('./silent-audio.mjs')).silenceTestAudio(p);await p.goto('http://127.0.0.1:8782/family-test?mobile=1');await p.waitForSelector('#mobile-app');
 await p.evaluate(({creatures,roster})=>{const menu=document.createElement('button');
 menu.id='game-menu-toggle';
 menu.textContent='☰';
 document.querySelector('.mobile-brand').replaceWith(menu);
 const base={mode:'fort',dialogTitle:'Town creatures',day:1,turn:true,resources:[50,50,50,50,50,50,118300,50],armies:[],fortRows:[],previewUnits:[],fortFamilies:roster.map((ids,level)=>({level,count:12,variants:ids.map((key,rank)=>{const u=creatures.find(x=>x.graphics.animation==='goonk/'+['pink','lancer','archer','fart','vomit','blue','fire'][level]+(rank===0?'':rank===1?'-evo':'-exalted'));return{id:level*3+rank,level,rank,count:12,built:rank<2,requiredBuilding:'{Final sanctuary}',name:u.name.singular,cost:[0,0,0,0,0,0,rank===2?300:90,0],attack:u.attack,defense:u.defense,health:u.hitPoints,speed:u.speed,damageMin:u.damage.min,damageMax:u.damage.max};})}))};window.familyState=base;window.send=()=>dispatchEvent(new CustomEvent('goonk-state',{detail:structuredClone(familyState)}));send();},{creatures,roster});
 assert.equal(await p.locator('[data-hall-preview]').count(),0,'No duplicate creature preview below the gallery');
 await p.evaluate(()=>{const atlas=document.createElement('canvas');atlas.width=768;atlas.height=288;const ctx=atlas.getContext('2d');ctx.fillStyle='rgb(0,200,0)';ctx.fillRect(0,0,768,288);window.goonkPortraitAtlas=atlas;window.goonkPortraitIds=new Map(familyState.fortFamilies.flatMap(f=>f.variants).map((u,i)=>[u.id,i]));familyState.previewUnits=familyState.fortFamilies.flatMap(f=>f.variants.map(u=>({...u,preview:{x:0,y:0,w:100,h:100}})));const native=document.querySelector('#canvas').getContext('2d');native.fillStyle='rgb(200,0,0)';native.fillRect(0,0,800,600);send();});
 await p.waitForTimeout(120);
 const pixel=selector=>p.locator(selector).evaluate(c=>[...c.getContext('2d').getImageData(Math.floor(c.width/2),Math.floor(c.height/2),1,1).data].slice(0,3));
 assert.deepEqual(await pixel('[data-hall-active=true]'),[200,0,0],'Selected tile uses the live native preview');assert.deepEqual(await pixel('[data-hall-icon="0"]'),[0,200,0],'Other tiles keep their static portrait');
 await p.locator('[data-family-select="0"]').focus();await p.waitForTimeout(80);assert.equal(await p.locator('[data-hall-active=true]').getAttribute('data-hall-icon'),'0','Keyboard focus selects the animated creature');
 await p.evaluate(()=>{const ctx=document.querySelector('#canvas').getContext('2d');ctx.fillStyle='rgb(0,0,200)';ctx.fillRect(0,0,800,600);});await p.waitForTimeout(100);assert.deepEqual(await pixel('[data-hall-active=true]'),[0,0,200]);assert.deepEqual(await pixel('[data-hall-icon="1"]'),[0,200,0]);
 await p.locator('.hall-families').evaluate(e=>e.scrollTop=e.scrollHeight);await p.waitForTimeout(60);await p.evaluate(()=>{const ctx=document.querySelector('#canvas').getContext('2d');ctx.fillStyle='rgb(200,0,0)';ctx.fillRect(0,0,800,600);});await p.waitForTimeout(80);assert.deepEqual(await pixel('[data-hall-active=true]'),[0,0,200],'Clipped selected tile pauses painting');await p.locator('.hall-families').evaluate(e=>e.scrollTop=0);
 await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(100);assert.deepEqual(await pixel('[data-hall-active=true]'),[0,200,0],'Reduced motion keeps a static portrait');await p.emulateMedia({reducedMotion:'no-preference'});
 for(const size of[{width:430,height:873},{width:932,height:430},{width:568,height:320},{width:320,height:740},{width:360,height:640},{width:430,height:873}]){await p.setViewportSize(size);await p.waitForTimeout(160);assert.equal(await p.locator('.hall-family').count(),7);const listBox=await p.locator('.hall-families').boundingBox(),rowBox=await p.locator('.hall-family').first().boundingBox();if(size.width<size.height)assert(Math.abs(Math.max(132,Math.floor((listBox.height-24)/2))-rowBox.height)<3,'Portrait rows fit two families where height permits and preserve a usable portrait on short screens');await p.screenshot({path:'/private/tmp/goonk-large-hall-'+kind+'-'+size.width+'.png'});assert.equal(await p.locator('.hall-form').count(),formCount);for(const delta of await p.locator('.hall-form').evaluateAll(es=>es.map(e=>e.clientWidth-e.querySelector('.hall-art').clientWidth)))assert(delta<=10,'Creature illustration uses the full card width');const rects=await p.locator('.hall-family').first().locator('.hall-form').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));assert(rects.every(r=>Math.abs(r.y-rects[0].y)<1),'All three forms on a row');assert(rects.every(r=>r.width>=44&&r.x>=0&&r.right<=size.width+.5),'Accessible, unclipped form targets');const feature=await p.locator('.hall-feature').boundingBox(),stock=await p.locator('.hall-stock').boundingBox();assert(stock.y>=feature.y+feature.height-1,'Preview and stock must not overlap');const buy=await p.locator('[data-hall-buy]').boundingBox();if(!(buy.y>=0&&buy.y+buy.height<=size.height)){console.log('OVERFLOW',size,await p.locator('.hall-detail').evaluate(e=>({rect:e.getBoundingClientRect().toJSON(),rows:getComputedStyle(e).gridTemplateRows,children:[...e.children].map(n=>({cls:n.className,rect:n.getBoundingClientRect().toJSON()}))})));await p.screenshot({path:'/private/tmp/goonk-hall-overflow.png'});}assert(buy.y>=0&&buy.y+buy.height<=size.height,'Recruit action visible');const hall=await p.locator('.creature-presentation').boundingBox(),detail=await p.locator('.hall-detail').boundingBox();if(size.width>size.height){console.log('LANDSCAPE',kind,size,JSON.stringify({hall,detail}));assert(rowBox.height>listBox.height*.85,'Landscape uses a large full-height family row');await p.screenshot({path:'/private/tmp/goonk-family-'+kind+'-'+size.width+'.png'});assert(detail.x>hall.x+hall.width*.35,'Landscape detail to the right');const action=await p.locator('[data-type-info]').boundingBox();assert(detail.x+detail.width-action.x-action.width>=10,'Landscape details button has a right margin');}await p.locator('[data-family-select="2"]').tap();assert(await p.locator('[data-hall-buy]').isDisabled());assert.equal(await p.locator('.hall-stock').textContent(),'Requires: Final sanctuary');await p.locator('[data-family-select="1"]').tap();assert(await p.locator('[data-hall-buy]').isEnabled());}
 await p.evaluate(()=>{
  familyState.townFaction='core:tower';
  familyState.fortFamilies.flatMap(family=>family.variants).find(unit=>unit.id===14).requiredBuildingId=52;
  familyState.buildings=[
   {id:52,key:'core:dwellingLvl5',name:'Final sanctuary',allowed:false,state:8,missingPrerequisites:[0]},
   {id:0,key:'core:mageGuild1',name:'Mage Guild Level 1',allowed:true,state:7},
  ];
  send();
 });
 for (const size of [{width:390,height:844},{width:568,height:320}]) {
  await p.setViewportSize(size);
  const geometry = () => p.locator('.hall-layout').evaluate(hall => {
   const selectors = ['.hall-families','.hall-family','.hall-art','.hall-detail','.hall-actions'];
   return [...selectors.map(selector => {
    const {x,y,width,height} = hall.querySelector(selector).getBoundingClientRect();
    return [x,y,width,height];
   }), hall.querySelector('.hall-families').scrollTop];
  });
  await p.locator('[data-family-select="13"]').tap();
  await p.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const before = await geometry();
  const buy = await p.locator('[data-hall-buy]').boundingBox();
  const details = await p.locator('.hall-actions [data-type-info]').boundingBox();
  const preview = p.locator('.hall-unlock-preview');
  assert(await preview.isHidden());
  await p.locator('[data-family-select="14"]').tap();
  await p.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await p.locator('.hall-detail').getAttribute('data-locked'),'true');
  assert.equal(await p.locator('.hall-quantity').isVisible(),false);
  assert(await preview.isVisible());
  assert.equal(await preview.locator('strong').textContent(),'Mage Guild Level 1');
  assert.match(await preview.locator('img').getAttribute('src'),/mageGuild1\.webp$/);
  assert.equal(await preview.locator('span').textContent(),'First required building');
  assert.equal(await preview.locator('button, a').count(),0);
  assert.match(await p.locator('.hall-stock').textContent(),/Recruitment locked/);
  assert(await p.getByRole('button',{name:'How to unlock',exact:true}).isVisible());
  assert.deepEqual(await p.locator('[data-hall-build]').boundingBox(),buy);
  assert.deepEqual(await p.locator('.hall-actions [data-type-info]').boundingBox(),details);
  assert.deepEqual(await geometry(),before,'Selecting a locked form keeps the gallery, portraits, scroll and actions in place');
  await p.locator('[data-family-select="13"]').tap();
  assert.deepEqual(await geometry(),before,'Returning to a recruitable form preserves the same geometry');
  assert(await preview.isHidden());
 }
 await p.locator('[data-family-select="1"]').tap();
 for(const size of [{width:390,height:844},{width:320,height:650},{width:932,height:430}]){
  await p.setViewportSize(size);
  await p.locator('.mobile-calendar').waitFor({state:'visible'});
  await p.waitForTimeout(120);
  assert.equal(await p.locator('.mobile-title').isVisible(),false,'The resources replace the hall title');
  const menu=await p.locator('#game-menu-toggle').boundingBox();
  const resources=p.locator('.mobile-resources .mobile-resource');
  const cells=await resources.evaluateAll(items=>items.map(item=>item.getBoundingClientRect().toJSON()));
  assert.equal(cells.length,8,'The bar includes the modded resource');
  for(const cell of cells){
   assert(cell.left>=(size.width>size.height?size.width-Math.min(340,Math.max(244,size.width*.29)):menu.x+menu.width)-1&&cell.right<=size.width+1,'Every resource fits in the control area '+JSON.stringify({size,menu,cell}));
   if(size.width<=size.height)assert(cell.top>=menu.y&&cell.bottom<=menu.y+menu.height,'Portrait resources share the menu row');else assert(cell.top>=menu.y+menu.height-1,'Landscape resources use their own right-hand row');
  }
  if(size.width===320){
   const list=await p.locator('.hall-families').boundingBox();
   const second=await p.locator('.hall-family').nth(1).boundingBox();
   const art=await p.locator('.hall-art').first().boundingBox();
   assert(second.y+second.height<=list.y+list.height+1,'Two complete rows fit in short portrait');
   assert(art.height>=56,'The illustration remains visible on a short portrait screen');
  }
  const calendar=await p.locator('.mobile-calendar').boundingBox();
  if(size.width<=size.height)assert(calendar.y>=menu.y+menu.height,'Portrait calendar stays below the resources');else assert(calendar.x>=menu.x+menu.width&&calendar.y<cells[0].top,'Landscape calendar shares the menu row above resources');
 }
 await p.evaluate(()=>{const f=familyState.fortFamilies[0];f.variants.push(...f.variants.map((u,i)=>({...u,id:100+i,rank:3+i})));send();});await p.setViewportSize({width:320,height:740});await p.waitForTimeout(150);assert.equal(await p.locator('.hall-layout').count(),1);const six=await p.locator('.hall-family').first().locator('.hall-form').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));assert(six.every(r=>r.width>=44&&Math.abs(r.y-six[0].y)<1),'Six modded forms still fit one accessible row');await p.evaluate(()=>{familyState.fortFamilies[0].variants.splice(3);send();});await p.setViewportSize({width:430,height:873});await p.waitForTimeout(120);assert.equal(await p.locator('.hall-layout').count(),1);assert.equal(await p.locator('.hall-form').count(),formCount);for(const delta of await p.locator('.hall-form').evaluateAll(es=>es.map(e=>e.clientWidth-e.querySelector('.hall-art').clientWidth)))assert(delta<=10,'Creature illustration uses the full card width');
 await p.evaluate(()=>calls=[]);await p.locator('[data-hall-buy]').tap();await p.locator('[data-hall-buy]').tap({force:true});assert.equal((await p.evaluate(()=>calls.filter(a=>a[0]===61))).length,1,'Recruit exactly once while pending');await p.evaluate(()=>{familyState.fortFamilies[0].count=11;for(const u of familyState.fortFamilies[0].variants)u.count=11;send();});assert(await p.locator('[data-hall-buy]').isEnabled());assert.deepEqual(errors,[]);console.log('PASS',kind,formCount,'forms, full evolution rows, portrait/landscape, locked dwellings, single pending recruitment');

 const list=p.locator('.hall-families');
 const position=()=>list.evaluate(el=>({
  top:el.scrollTop,
  step:el.firstElementChild.getBoundingClientRect().height+parseFloat(getComputedStyle(el).rowGap)
 }));
 for(const {width,height,close,rotate} of [
  {width:430,height:873,close:'[data-presentation-close]'},
  {width:932,height:430,close:'[data-presentation-close]'},
  {width:430,height:873,close:'[data-presentation-close]',rotate:{width:932,height:430}}
 ]){
  await p.setViewportSize({width,height});
  await p.locator('[data-family-select="12"]').tap();
  await list.evaluate(el=>{el.scrollTop=el.firstElementChild.getBoundingClientRect().height*3.5;});
  const before=await position();
  assert(before.top>0);
  await p.locator('[data-type-info="12"]').tap();
  assert.deepEqual((await p.evaluate(()=>calls.at(-1))).slice(0,2),[42,12]);
  await p.evaluate(()=>{
   familyState.mode='creature';
   familyState.creatureUnit=familyState.fortFamilies[4].variants[0];
   send();
  });
  await list.waitFor({state:'detached'});
  if(rotate)await p.setViewportSize(rotate);
  await p.locator(close).tap();
  assert.equal((await p.evaluate(()=>calls.at(-1)))[0],43);
  await p.evaluate(()=>{familyState.mode='fort';send();});
  const after=await position();
  assert(Math.abs(after.top-before.top*after.step/before.step)<=1,'Returns to the same tier and offset');
  assert.equal(await p.locator('[data-family-select="12"]').getAttribute('aria-pressed'),'true');
 }
 await p.evaluate(()=>{familyState.mode='town';send();});
 await list.waitFor({state:'detached'});
 await p.evaluate(()=>{familyState.mode='fort';send();});
 assert.equal((await position()).top,0,'A fresh hall starts at the top');
 console.log('PASS',kind,'details preserve hall scroll in portrait, landscape and across rotation');
 }finally{await b.close();}}
