import{chromium,webkit}from'playwright-core';import assert from'node:assert/strict';
const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8782';
for(const kind of ['chromium','webkit']){
 const browser=await(kind==='webkit'?webkit.launch({headless:true,executablePath:process.env.WEBKIT_PATH}):chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,args:['--no-sandbox']}));const c=await browser.newContext({viewport:{width:430,height:873},hasTouch:true}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
 await p.route('**/army-accessible-test?mobile=1',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...args){calls.push(args)}};</script><script type=module src=/web/mobile.mjs></script>`}));
 await p.route('**/test-large.png',r=>r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><circle cx="512" cy="512" r="500" fill="purple"/></svg>'}));await p.addInitScript(()=>window.goonkAssetURLs=[{path:'/sprites/test-large.png',url:'/test-large.png'}]);
 await p.goto(origin+'/army-accessible-test?mobile=1');await p.waitForSelector('#mobile-app');
 await p.evaluate(()=>{const slots=Array.from({length:7},(_,i)=>({id:i+1,icon:"test-large.png",name:['Vermin','Winged Magog','Astral Cerberus','Gog','Sharp-Horned Demon','Pit Master','Arch Devil'][i],count:12}));dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'town',townName:'Town',townFaction:'core:inferno',turn:true,armies:[{id:1,name:'Garrison',slots},{id:2,name:'Hero',needsLastStack:true,slots:structuredClone(slots)}]}}));});
 await p.locator('[data-ui=army]').tap();
 for(const size of [{width:430,height:873},{width:932,height:430},{width:568,height:320},{width:390,height:844}]){
 await p.setViewportSize(size);await p.waitForTimeout(120);
 const boxes=await p.locator('.army-troop,.army-transfer-all,#army-split,.army-transfer-tools input[type=number]').evaluateAll(els=>els.map(e=>({rect:e.getBoundingClientRect().toJSON(),tag:e.tagName})));
 assert.equal(await p.locator('.army-troop').count(),14);for(const {rect:r}of boxes){assert(r.x>=0&&r.y>=0&&r.right<=size.width+.5&&r.bottom<=size.height+.5,kind+' control outside screen '+JSON.stringify({size,r}));}
 assert(await p.locator('.sheet-body').evaluate(e=>e.scrollHeight<=e.clientHeight+1),'Both armies fit without scrolling');
 await p.locator('.army-split-toggle').tap();assert(await p.locator('#army-split').isChecked(),'Split works before selection');await p.locator('.army-split-toggle').tap();assert(!await p.locator('#army-split').isChecked());
 }
 await p.locator('.army-split-toggle').tap();await p.locator('[data-army="1"][data-slot="0"]').tap();assert(await p.locator('#army-split').isChecked(),'Selection preserves split mode');assert(!await p.locator('.army-transfer-tools input[type=number]').isDisabled());
 await p.locator('[data-ui=close-sheet]').tap();await p.locator('[data-ui=army]').tap();await p.locator('.army-transfer-all').first().tap();assert.equal((await p.evaluate(()=>calls.at(-1)))[0],58);assert.equal(await p.locator('.mobile-sheet:not([hidden])').count(),1);
 assert.deepEqual(errors,[]);console.log('PASS',kind,'14 slots, no scroll, Split before/after selection, bulk command');
 }finally{await browser.close();}
}
