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
 const send=s=>p.evaluate(s=>dispatchEvent(new CustomEvent('goonk-state',{detail:s})),s),list=p.locator('.hall-families');
 const position=()=>list.evaluate(e=>({top:e.scrollTop,step:e.firstElementChild.getBoundingClientRect().height+parseFloat(getComputedStyle(e).rowGap)}));
 for(const [size,doubleTap,rotate] of [[{width:430,height:873},false,false],[{width:932,height:430},true,false],[{width:768,height:1024},false,true]]){
  await p.setViewportSize(size);await p.waitForTimeout(100);await p.locator('[data-family-select="12"]').scrollIntoViewIfNeeded();await p.locator('[data-family-select="12"]').tap();await p.waitForTimeout(500);
  const before=await position();assert(before.top>0);
  for(let id=900;id<902;id++){await p.evaluate(id=>{familyState.recruitUnit={id,name:'Native preview',count:id};send();},id);await p.waitForTimeout(80);const rebuilt=await position();assert(Math.abs(rebuilt.top-before.top*rebuilt.step/before.step)<2,'Native preview snapshots preserve deep roster scroll');}
  await p.evaluate(()=>calls=[]);
  if(doubleTap){await p.locator('[data-family-select="12"]').tap();await p.waitForTimeout(60);await p.locator('[data-family-select="12"]').tap();}else await p.locator('[data-type-info="12"]').tap();
  assert((await p.evaluate(()=>calls)).some(c=>c[0]===42&&c[1]===12));await p.evaluate(()=>{familyState.mode='creature';familyState.creatureUnit=familyState.fortFamilies[4].variants[0];send();});await list.waitFor({state:'detached'});
  if(rotate)await p.setViewportSize({width:1024,height:768});await p.locator('[data-presentation-close]').tap();await p.evaluate(()=>{familyState.mode='fort';send();});await list.waitFor();const after=await position();assert(Math.abs(after.top-before.top*after.step/before.step)<2,'Details return restores the same tier and offset');assert.equal(await p.locator('[data-family-select="12"]').getAttribute('aria-pressed'),'true');
 }
 const gold=async selector=>{const value=await p.locator(selector).evaluate(e=>{const s=getComputedStyle(e);return{width:s.borderTopWidth,style:s.borderTopStyle,color:s.borderTopColor};});assert.deepEqual(value,{width:'4px',style:'ridge',color:'rgb(255, 225, 138)'});};
 const base=await p.evaluate(()=>structuredClone(familyState));
 for(const size of [{width:430,height:873},{width:932,height:430},{width:1024,height:768}]){
  await p.setViewportSize(size);await send({...base,mode:'mage-guild',mageGuild:{town:1,levels:5,built:5,spells:[{id:1,level:1,name:'Magic Arrow',description:'Arrow'},{id:2,level:1,name:'Haste',description:'Haste'}]}});await p.locator('[data-guild-spell="2"]').tap();await gold('[data-guild-spell="2"]');assert.equal(await p.locator('[data-guild-spell="1"]').getAttribute('aria-pressed'),'false');
  const variants=base.fortFamilies[4].variants.map((u,i)=>({...u,upgradeRank:i+1,preview:{x:i*60,y:0,w:50,h:50}}));await send({...base,mode:'recruit',turn:false,recruitUnit:variants[1],recruitAmount:0,recruitMaximum:0,previewUnits:variants});await gold('[data-variant="1"]');assert.equal(await p.locator('[data-variant="0"]').getAttribute('aria-pressed'),'false');
 }
 assert.deepEqual(errors,[]);console.log('PASS',kind,'gold spell/evolution selections; details and double tap preserve scroll through native preview updates and rotation');
 }finally{await b.close();}}
