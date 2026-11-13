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
 for(const size of [{width:393,height:851},{width:320,height:568},{width:768,height:1024},{width:640,height:280},{width:851,height:393},{width:1024,height:768}]){
  await p.setViewportSize(size);await send(base);await p.waitForTimeout(250);
  const list=p.locator('.hall-families');await list.evaluate(e=>e.scrollTop=0);
  const rows=await list.evaluate(e=>{const s=getComputedStyle(e),first=e.children[0].getBoundingClientRect(),next=e.children[1].getBoundingClientRect();return{height:e.clientHeight-parseFloat(s.paddingTop)-parseFloat(s.paddingBottom),first:first.height,nextTop:next.top,top:first.top,viewportBottom:e.getBoundingClientRect().bottom};});
  if(size.width<size.height){assert(Math.abs(rows.first-rows.height)<2,JSON.stringify({size,rows}));assert(rows.nextTop>=rows.viewportBottom-8,'Only one family is visible');}
  const back=p.locator('[data-presentation-close]');assert.equal(await back.count(),1);await back.waitFor({state:'visible'});const rect=await back.boundingBox();assert(rect.y>=0&&rect.x>=0&&rect.y+rect.height<=size.height&&rect.x+rect.width<=size.width,'Back is reachable '+JSON.stringify({size,rect}));
  if(size.width>size.height){const detail=p.locator('.hall-detail'),metrics=await detail.evaluate(e=>({overflow:getComputedStyle(e).overflowY,height:e.clientHeight,scroll:e.scrollHeight}));assert.equal(metrics.overflow,'auto');if(size.height<=280)assert(metrics.scroll>metrics.height,'Short landscape sidebar scrolls');const buy=detail.locator('[data-hall-buy]');await buy.scrollIntoViewIfNeeded();assert(await buy.isVisible());}
  await p.screenshot({path:'/tmp/goonk-hall-'+kind+'-'+size.width+'x'+size.height+'.png'});
  await back.tap();assert((await p.evaluate(()=>calls)).some(c=>c[0]===43),'Back calls the native return action');
  await send({...base,mode:'map',heroName:'Hero',turn:true});await p.waitForTimeout(150);
  const date=await p.locator('.mobile-calendar>span:first-child').boundingBox(),cue=await p.locator('.calendar-recruit-cue').boundingBox();assert(date.y>=cue.y+cue.height-1,'Game date lies below recruits '+JSON.stringify({size,date,cue}));
 }
 assert.deepEqual(errors,[]);console.log('PASS',kind,'one portrait family per screen; short landscape sidebar scroll; visible Back; map date below recruits');
 }finally{await b.close();}}
