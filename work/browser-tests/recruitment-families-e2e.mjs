import{chromium,webkit}from'playwright-core';import assert from'node:assert/strict';import fs from'node:fs';import path from'node:path';
const creatures=Object.values(JSON.parse(fs.readFileSync('mod/goonk/Content/config/creatures.json'))),roster=JSON.parse(fs.readFileSync('mod/goonk/Content/config/faction.json')).goonk.town.creatures;
const formCount=roster.flat().length;
for(const kind of ['chromium','webkit']){const b=await(kind==='webkit'?webkit.launch({headless:true,executablePath:process.env.WEBKIT_PATH}):chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,args:['--no-sandbox']})),c=await b.newContext({viewport:{width:430,height:873},hasTouch:true}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));try{
 await p.route('**/web/**',async r=>{const file=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);if(!fs.existsSync(file))return r.abort();await r.fulfill({path:file});});
 await p.route('**/family-test?mobile=1',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...a){calls.push(a)}};</script><script type=module src=/web/mobile.mjs></script>`}));await p.goto('http://127.0.0.1:8782/family-test?mobile=1');await p.waitForSelector('#mobile-app');
 await p.evaluate(({creatures,roster})=>{const base={mode:'fort',turn:true,resources:[50,50,50,50,50,50,100000,50],armies:[],fortRows:[],previewUnits:[],fortFamilies:roster.map((ids,level)=>({level,count:12,variants:ids.map((key,rank)=>{const u=creatures.find(x=>x.graphics.animation==='goonk/'+['pink','lancer','archer','fart','vomit','blue','fire'][level]+(rank===0?'':rank===1?'-evo':'-exalted'));return{id:level*3+rank,level,rank,count:12,built:rank<2,requiredBuilding:'Final sanctuary',name:u.name.singular,cost:[0,0,0,0,0,0,rank===2?300:90,0],attack:u.attack,defense:u.defense,health:u.hitPoints,speed:u.speed,damageMin:u.damage.min,damageMax:u.damage.max};})}))};window.familyState=base;window.send=()=>dispatchEvent(new CustomEvent('goonk-state',{detail:structuredClone(familyState)}));send();},{creatures,roster});
 assert.equal(await p.locator('[data-hall-preview]').count(),0,'No duplicate creature preview below the gallery');
 await p.evaluate(()=>{const atlas=document.createElement('canvas');atlas.width=768;atlas.height=288;const ctx=atlas.getContext('2d');ctx.fillStyle='rgb(0,200,0)';ctx.fillRect(0,0,768,288);window.goonkPortraitAtlas=atlas;window.goonkPortraitIds=new Map(familyState.fortFamilies.flatMap(f=>f.variants).map((u,i)=>[u.id,i]));familyState.previewUnits=familyState.fortFamilies.flatMap(f=>f.variants.map(u=>({...u,preview:{x:0,y:0,w:100,h:100}})));const native=document.querySelector('#canvas').getContext('2d');native.fillStyle='rgb(200,0,0)';native.fillRect(0,0,800,600);send();});
 await p.waitForTimeout(120);
 const pixel=selector=>p.locator(selector).evaluate(c=>[...c.getContext('2d').getImageData(Math.floor(c.width/2),Math.floor(c.height/2),1,1).data].slice(0,3));
 assert.deepEqual(await pixel('[data-hall-active=true]'),[200,0,0],'Selected tile uses the live native preview');assert.deepEqual(await pixel('[data-hall-icon="0"]'),[0,200,0],'Other tiles keep their static portrait');
 await p.locator('[data-family-select="0"]').focus();await p.waitForTimeout(80);assert.equal(await p.locator('[data-hall-active=true]').getAttribute('data-hall-icon'),'0','Keyboard focus selects the animated creature');
 await p.evaluate(()=>{const ctx=document.querySelector('#canvas').getContext('2d');ctx.fillStyle='rgb(0,0,200)';ctx.fillRect(0,0,800,600);});await p.waitForTimeout(100);assert.deepEqual(await pixel('[data-hall-active=true]'),[0,0,200]);assert.deepEqual(await pixel('[data-hall-icon="1"]'),[0,200,0]);
 await p.locator('.hall-families').evaluate(e=>e.scrollTop=e.scrollHeight);await p.waitForTimeout(60);await p.evaluate(()=>{const ctx=document.querySelector('#canvas').getContext('2d');ctx.fillStyle='rgb(200,0,0)';ctx.fillRect(0,0,800,600);});await p.waitForTimeout(80);assert.deepEqual(await pixel('[data-hall-active=true]'),[0,0,200],'Clipped selected tile pauses painting');await p.locator('.hall-families').evaluate(e=>e.scrollTop=0);
 await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(100);assert.deepEqual(await pixel('[data-hall-active=true]'),[0,200,0],'Reduced motion keeps a static portrait');await p.emulateMedia({reducedMotion:'no-preference'});
 for(const size of[{width:430,height:873},{width:932,height:430},{width:568,height:320},{width:320,height:740},{width:360,height:640},{width:430,height:873}]){await p.setViewportSize(size);await p.waitForTimeout(160);assert.equal(await p.locator('.hall-family').count(),7);const listBox=await p.locator('.hall-families').boundingBox(),rowBox=await p.locator('.hall-family').first().boundingBox();if(size.width<size.height)assert(Math.abs(Math.max(194,Math.floor((listBox.height-24)/2))-rowBox.height)<3,'Portrait rows fit two families where height permits and keep art large on short screens');await p.screenshot({path:'/private/tmp/goonk-large-hall-'+kind+'-'+size.width+'.png'});assert.equal(await p.locator('.hall-form').count(),formCount);for(const delta of await p.locator('.hall-form').evaluateAll(es=>es.map(e=>e.clientWidth-e.querySelector('.hall-art').clientWidth)))assert(delta<=10,'Creature illustration uses the full card width');const rects=await p.locator('.hall-family').first().locator('.hall-form').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));assert(rects.every(r=>Math.abs(r.y-rects[0].y)<1),'All three forms on a row');assert(rects.every(r=>r.width>=44&&r.x>=0&&r.right<=size.width+.5),'Accessible, unclipped form targets');const feature=await p.locator('.hall-feature').boundingBox(),stock=await p.locator('.hall-stock').boundingBox();assert(stock.y>=feature.y+feature.height-1,'Preview and stock must not overlap');const buy=await p.locator('[data-hall-buy]').boundingBox();if(!(buy.y>=0&&buy.y+buy.height<=size.height)){console.log('OVERFLOW',size,await p.locator('.hall-detail').evaluate(e=>({rect:e.getBoundingClientRect().toJSON(),rows:getComputedStyle(e).gridTemplateRows,children:[...e.children].map(n=>({cls:n.className,rect:n.getBoundingClientRect().toJSON()}))})));await p.screenshot({path:'/private/tmp/goonk-hall-overflow.png'});}assert(buy.y>=0&&buy.y+buy.height<=size.height,'Recruit action visible');const hall=await p.locator('.hall-layout').boundingBox(),detail=await p.locator('.hall-detail').boundingBox();if(size.width>size.height){console.log('LANDSCAPE',kind,size,JSON.stringify({hall,detail}));assert(rowBox.height>listBox.height*.85,'Landscape uses a large full-height family row');await p.screenshot({path:'/private/tmp/goonk-family-'+kind+'-'+size.width+'.png'});assert(detail.x>hall.x+hall.width*.35,'Landscape detail to the right');}await p.locator('[data-family-select="2"]').tap();assert(await p.locator('[data-hall-buy]').isDisabled());assert.match(await p.locator('.hall-stock').textContent(),/Requires/);await p.locator('[data-family-select="1"]').tap();assert(await p.locator('[data-hall-buy]').isEnabled());}
 await p.evaluate(()=>{const f=familyState.fortFamilies[0];f.variants.push(...f.variants.map((u,i)=>({...u,id:100+i,rank:3+i})));send();});await p.setViewportSize({width:320,height:740});await p.waitForTimeout(150);assert.equal(await p.locator('.hall-layout').count(),1);const six=await p.locator('.hall-family').first().locator('.hall-form').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));assert(six.every(r=>r.width>=44&&Math.abs(r.y-six[0].y)<1),'Six modded forms still fit one accessible row');await p.evaluate(()=>{familyState.fortFamilies[0].variants.splice(3);send();});await p.setViewportSize({width:430,height:873});await p.waitForTimeout(120);assert.equal(await p.locator('.hall-layout').count(),1);assert.equal(await p.locator('.hall-form').count(),formCount);for(const delta of await p.locator('.hall-form').evaluateAll(es=>es.map(e=>e.clientWidth-e.querySelector('.hall-art').clientWidth)))assert(delta<=10,'Creature illustration uses the full card width');
 await p.evaluate(()=>calls=[]);await p.locator('[data-hall-buy]').tap();await p.locator('[data-hall-buy]').tap({force:true});assert.equal((await p.evaluate(()=>calls.filter(a=>a[0]===61))).length,1,'Recruit exactly once while pending');await p.evaluate(()=>{familyState.fortFamilies[0].count=11;for(const u of familyState.fortFamilies[0].variants)u.count=11;send();});assert(await p.locator('[data-hall-buy]').isEnabled());assert.deepEqual(errors,[]);console.log('PASS',kind,formCount,'forms, full evolution rows, portrait/landscape, locked dwellings, single pending recruitment');

 const list=p.locator('.hall-families');
 const position=()=>list.evaluate(el=>({
  top:el.scrollTop,
  step:el.firstElementChild.getBoundingClientRect().height+parseFloat(getComputedStyle(el).rowGap)
 }));
 for(const {width,height,close,rotate} of [
  {width:430,height:873,close:'[data-presentation-close]'},
  {width:932,height:430,close:'[data-ui=presentation-back]'},
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
