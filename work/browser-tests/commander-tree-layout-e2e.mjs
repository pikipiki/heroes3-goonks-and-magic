import {chromium,webkit} from 'playwright-core';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {silenceTestAudio} from './silent-audio.mjs';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-tree-layout';fs.mkdirSync(out,{recursive:true});
const skills=['Attack','Defense','Health','Damage','Speed','Magic'].map((name,id)=>({id,name,rank:id===0||id===4?4:0,selectable:true,description:name}));
const abilities=[];for(let a=0;a<6;a++)for(let b=a+1;b<6;b++)abilities.push({id:100+abilities.length,requires:[a,b],description:'A native ability with a complete description, including its exact effect.',learned:abilities.length===0,selectable:a===0&&b===4});
for(const kind of ['chromium','webkit']){
 const browser=await(kind==='webkit'?webkit:chromium).launch({headless:true});try{
 const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});await silenceTestAudio(p);const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/web/**',r=>{const f=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);return fs.existsSync(f)?r.fulfill({path:f}):r.abort();});
 await p.route('**/tree-review?mobile=1',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/game-menu.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...a){calls.push(a)},_vcmiMobilePointer(...a){calls.push(['pointer',...a])}};</script><script type=module src=/web/i18n.mjs></script><script type=module src=/web/mobile.mjs></script>`}));
 await p.goto('http://localhost/tree-review?mobile=1');await p.waitForSelector('#mobile-app');
 const send=()=>p.evaluate(s=>dispatchEvent(new CustomEvent('goonk-state',{detail:s})),{mode:'dialog',turn:true,dialogKind:'commander-level-up',rect:{x:100,y:50,w:600,h:500},dialogPresentation:{title:'Commander level up',choices:skills.map(s=>({skillId:s.id,label:s.name,rect:{x:100+s.id*30,y:200,w:25,h:25},selectable:true})),commanderTree:{skills,abilities,masterRank:4,maxRank:5,selectedSkill:0}}});
 await send();await p.locator('[data-commander-tree]').tap();
 for(const viewport of [{width:320,height:568},{width:390,height:844},{width:568,height:320},{width:844,height:390},{width:768,height:1024},{width:1024,height:768},{width:1180,height:820}]){
  await p.setViewportSize(viewport);await p.waitForTimeout(200);
  const tree=p.locator('.commander-tree');await tree.waitFor();assert.equal(await p.locator('[data-tree-ability]').count(),15);assert.equal(await p.locator('.tree-parents span').count(),30);
  assert(await tree.evaluate(e=>e.scrollWidth<=e.clientWidth+1),'No horizontal overflow');
  for(const selector of ['[data-commander-tree]','[data-dialog-confirm]']){const b=p.locator(selector),r=await b.boundingBox();assert(r.width>=44&&r.height>=44&&r.x>=0&&r.y>=0&&r.x+r.width<=viewport.width+1&&r.y+r.height<=viewport.height+1,selector+JSON.stringify(r));await b.scrollIntoViewIfNeeded();assert(await b.evaluate(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e===hit||e.contains(hit)}),'Unobscured '+selector);}
  await p.locator('[data-tree-skill="4"]').scrollIntoViewIfNeeded();await p.locator('[data-tree-skill="4"]').tap();assert.equal(await p.locator('[data-tree-ability]').count(),5);await p.locator('.tree-all').tap();
  await p.locator('[data-tree-choose="103"]').scrollIntoViewIfNeeded();await p.locator('[data-tree-choose="103"]').tap();assert(await p.evaluate(()=>calls.at(-1)[0]===96&&calls.at(-1)[1]===103),'Native choice dispatch');
  await p.screenshot({path:path.join(out,kind+'-'+viewport.width+'x'+viewport.height+'.png')});
 }
 assert.deepEqual(errors,[]);console.log('PASS',kind,'15 connections, filtering, native selection and reachable controls across seven phone/tablet sizes');
 }finally{await browser.close();}
}
