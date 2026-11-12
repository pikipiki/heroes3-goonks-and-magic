import{chromium,webkit}from'playwright-core';import assert from'node:assert/strict';import fs from'node:fs';import path from'node:path';
for(const kind of ['chromium','webkit']){const b=await(kind==='webkit'?webkit.launch({headless:true,executablePath:process.env.WEBKIT_PATH}):chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,args:['--no-sandbox']})),c=await b.newContext({viewport:{width:430,height:873},hasTouch:true}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));try{
await p.route('**/web/**',r=>{
 const file=path.resolve('.'+new URL(r.request().url()).pathname);
 return fs.existsSync(file)?r.fulfill({path:file}):r.abort();
});
await p.route('**/upgrade-layout-test?mobile=1',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...a){calls.push(a)}};</script><script type=module src=/web/mobile.mjs></script>`}));await (await import('./silent-audio.mjs')).silenceTestAudio(p);await p.goto('http://127.0.0.1:8782/upgrade-layout-test?mobile=1');await p.waitForSelector('#mobile-app');await p.evaluate(()=>{window.send=detail=>dispatchEvent(new CustomEvent('goonk-state',{detail}));window.unit={id:1,name:'Goonk',count:12};send({mode:'creature',turn:true,creatureUnit:unit,creatureUpgrades:Array.from({length:4},(_,i)=>({id:i+2,name:'Evolution '+(i+1),affordable:true,cost:[0,0,0,0,0,0,100+i*20]}))});});
for(const size of [{width:430,height:873},{width:932,height:430},{width:568,height:320},{width:430,height:873}]){await p.setViewportSize(size);await p.waitForTimeout(120);const boxes=await p.locator('.creature-upgrade').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));if(size.width<size.height){assert(Math.abs(boxes[0].y-boxes[1].y)<1);assert(boxes[2].y>boxes[0].y);assert.equal((await p.locator('.upgrade-options').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length)),2);}else{assert(boxes.every(x=>Math.abs(x.y-boxes[0].y)<1));const pane=await p.locator('.upgrade-options').boundingBox();assert(pane.width>size.width*.9,'Landscape upgrades use screen width');}for(const r of boxes)assert(r.x>=0&&r.right<=size.width+.5);for(const selector of ['[data-presentation-close]','[data-ui=presentation-back]']){await p.evaluate(()=>calls=[]);await p.locator(selector).tap();const calls=await p.evaluate(()=>calls.filter(a=>a[0]===43));assert.equal(calls.length,1,kind+' direct close exactly once');}}
await p.locator('[data-presentation-close]').focus();await p.evaluate(()=>calls=[]);await p.keyboard.press('Enter');assert.equal((await p.evaluate(()=>calls.at(-1)))[0],43);
await p.evaluate(()=>send({mode:'dialog'}));
await p.locator('.creature-presentation').waitFor({state:'hidden'});
await p.evaluate(()=>send({
 mode:'creature',day:1,resources:[20,10,20,10,10,10,10000,0],turn:true,
 creatureUnit:{...unit,name:'Ancestral Behemoth',attack:35,defense:35,damageMin:45,damageMax:75,health:600,speed:14,
  description:'A veteran creature of the Stronghold.',
  abilities:Array.from({length:14},(_,i)=>`{Ability ${i+1}} A detailed explanation for this special ability.`)},
 creatureUpgrades:[]
}));
await p.locator('.creature-description').waitFor({state:'visible'});
for(const size of [{width:390,height:844},{width:320,height:568},{width:844,height:390},{width:568,height:320}]){
 await p.setViewportSize(size);
 await p.waitForTimeout(120);
 assert.equal(await p.locator('.creature-upgrades').count(),0);
 const [art,stats,description]=await Promise.all(['.creature-stage canvas','.creature-stats','.creature-description'].map(s=>p.locator(s).boundingBox()));
 assert(art.width>70&&art.height>70,'Animation has enough room');
 assert(stats.x>=art.x+art.width,'Stats appear to the right of the animation');
 if(size.width<size.height){
  assert(description.y>=art.y+art.height&&description.width>size.width*.85,'Portrait description uses the width beneath the summary '+JSON.stringify({size,art,description}));
 }
 if(process.env.GOONK_TEST_OUTPUT)await p.screenshot({path:path.join(process.env.GOONK_TEST_OUTPUT,`creature-detail-${kind}-${size.width}.png`)});
 const scroll=p.locator(size.width<size.height?'.featured-creature':'.creature-details');
 assert(await scroll.evaluate(e=>e.scrollHeight>e.clientHeight));
 await scroll.evaluate(e=>{e.scrollTop=e.scrollHeight;});
 assert(await scroll.evaluate(e=>{
  const last=e.querySelector('.creature-abilities li:last-child').getBoundingClientRect();
  const viewport=e.getBoundingClientRect();
  return last.top>=viewport.top-1&&last.bottom<=viewport.bottom+1;
 }),'The last ability is reachable');
 if(size.width>size.height)assert.deepEqual(await p.locator('.creature-stage canvas').boundingBox(),art,'Only the text scrolls in landscape');
 await scroll.evaluate(e=>{e.scrollTop=0;});
}
await p.evaluate(()=>send({mode:'recruit',turn:true,recruitUnit:unit,recruitAmount:1,recruitMaximum:12,previewUnits:Array.from({length:3},(_,i)=>({id:i+1,name:'Family '+i,preview:{x:i*50,y:0,w:50,h:50}}))}));for(const size of [{width:430,height:873},{width:932,height:430}]){await p.setViewportSize(size);await p.waitForTimeout(100);const boxes=await p.locator('.recruit-variants button').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));assert.equal(boxes.length,3);assert(boxes.every(box=>Math.abs(box.y-boxes[0].y)<1),'Recruitment variants stay in a single horizontal row');}assert.deepEqual(errors,[]);console.log('PASS',kind,'two columns portrait, full-width upgrades, readable creature details, X/Back/keyboard and variant layout');
}finally{await b.close();}}
