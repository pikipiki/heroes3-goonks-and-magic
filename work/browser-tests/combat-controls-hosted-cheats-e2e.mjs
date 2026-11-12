import {chromium,webkit} from 'playwright-core';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {silenceTestAudio} from './silent-audio.mjs';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-navigation-rotation';fs.mkdirSync(out,{recursive:true});
for(const kind of ['chromium','webkit']){
 const browser=await(kind==='webkit'?webkit:chromium).launch({headless:true});const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await silenceTestAudio(p);
  await p.route('**/web/**',r=>{const f=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);return fs.existsSync(f)?r.fulfill({path:f}):r.abort();});
  await p.route('**/opfs-worker.js',r=>r.fulfill({path:path.resolve('work/vcmi-wasm/lib/html5/opfs-worker.js')}));
  await p.route('**/navigation-review?mobile=1',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/game-menu.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...a){calls.push(a)},_vcmiMobilePointer(){}};</script><script type=module src=/web/mobile.mjs></script><script type=module src=/web/game-menu.mjs></script>'}));
  await p.goto('http://localhost/navigation-review?mobile=1');await p.waitForSelector('#game-menu-toggle');
  const send=s=>p.evaluate(s=>dispatchEvent(new CustomEvent('goonk-state',{detail:s})),s);
  const base={mode:'map',turn:true,day:1,week:1,month:1,resources:[20,10,20,10,10,10,15000,0],heroName:'Christian',heroMovement:1500,heroMana:10};
  await send(base);
  await send({...base,mode:'battle',round:1,canAct:true,canUseMagic:true,activeUnit:{id:1,name:'Pikeman',count:20},battleUnits:[],battleCells:[]});
  for(const tactics of [false,true]){await send({...base,mode:'battle',round:tactics?0:1,tacticsMode:tactics,canEndTactics:tactics,canAct:true,canUseMagic:true,activeUnit:{id:1,name:'Pikeman',count:20},battleUnits:[],battleCells:[]});
  for(const size of [{width:1024,height:768},{width:1180,height:820},{width:1366,height:1024},{width:844,height:390}]){await p.setViewportSize(size);await p.waitForTimeout(200);const r=await p.locator('.mobile-nav').evaluate(e=>({style:[getComputedStyle(e).gridTemplateColumns,getComputedStyle(e).display],nav:e.getBoundingClientRect().toJSON(),buttons:[...e.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width>0).map(b=>({...b.getBoundingClientRect().toJSON(),col:getComputedStyle(b).gridColumn,row:getComputedStyle(b).gridRow}))}));assert(r.buttons.length>=4);const rows=Map.groupBy(r.buttons,b=>Math.round(b.y));for(const row of rows.values()){assert(Math.abs(Math.min(...row.map(b=>b.x))-r.nav.x-4)<3,JSON.stringify({size,r}));assert(Math.abs(Math.max(...row.map(b=>b.right))-r.nav.right+4)<3,JSON.stringify({size,r}));assert(row.every(b=>b.height>=44));}await p.screenshot({path:path.join(out,kind+'-combat-rail-'+size.width+'.png')});}
  }
  await p.route('**/hosted/matches**',r=>r.fulfill({json:{scenarios:[{id:'fixture',name:'A Bow of Hope',width:36,castles:[[{id:0,name:'Castle'}],[{id:1,name:'Rampart'}]]}],turnMinutes:[0,1]}}));
  await p.evaluate(async()=>{const {mountHostedMatchCreation}=await import('/web/hosted-match-create.mjs');const host=document.createElement('div'),open=document.createElement('button');host.id='creation-test';document.body.append(host);const activate=mountHostedMatchCreation(host,open,'http://localhost',false,()=>{},async()=>{});host.addEventListener('click',e=>{const b=e.target.closest('button');if(b)activate(b);});activate(open);});
  const cheats=p.locator('[data-create-cheats]');await cheats.waitFor({state:'visible'});assert.equal(await cheats.isChecked(),false);await cheats.check();assert(await cheats.isChecked());
  await p.route('**/hosted/matches',r=>{const body=r.request().postDataJSON();assert.equal(body.cheatsAllowed,true);return r.fulfill({json:{matchId:'fixture',hostToken:'HG'+'A'.repeat(41),roomCode:'ABCD'}});});
  const request=p.waitForRequest(r=>r.method()==='POST'&&new URL(r.url()).pathname==='/hosted/matches');await p.locator('[data-create-match=submit]').click();assert.equal((await request).postDataJSON().cheatsAllowed,true);
  console.log('PASS',kind,'landscape combat actions fill every row; hosted creation includes and transmits cheat choice');assert.deepEqual(errors,[]);

 }finally{await browser.close();}
}
