import{chromium,webkit}from'playwright-core';import assert from'node:assert/strict';import fs from'node:fs';import path from'node:path';
for(const kind of ['chromium','webkit']){
 const browser=await(kind==='webkit'?webkit.launch({executablePath:process.env.WEBKIT_PATH}):chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox']}));
 try{const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/web/**',async route=>{const file=path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1]);if(!fs.existsSync(file))return route.abort();await route.fulfill({path:file});});
 await page.route('**/movement-test?mobile=1',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/web/mobile.css"><link rel="stylesheet" href="/web/h3-theme.css"><link rel="stylesheet" href="/web/mobile-upgrade.css"><canvas id="canvas" width="800" height="600"></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...args){calls.push(args)}};</script><script type="module" src="/web/mobile.mjs"></script>'}));
 await page.goto('http://127.0.0.1:8782/movement-test?mobile=1');await page.waitForSelector('#mobile-app');
 await page.evaluate(()=>{window.testState={mode:'map',turn:true,heroName:'Ax sis <test>',movement:179,heroes:[{index:0,name:'Ax sis <test>',movement:179},{index:1,name:'Gunnar',movement:0},{index:2,name:'Solmyr',movement:1630}],armies:[],towns:[],resources:[],day:16};window.send=()=>dispatchEvent(new CustomEvent('goonk-state',{detail:structuredClone(testState)}));send();});
 for(const size of [{width:390,height:844},{width:844,height:390},{width:568,height:320},{width:320,height:740},{width:390,height:844}]){
 await page.setViewportSize(size);await page.waitForTimeout(180);assert.equal(await page.locator('.mobile-nav [data-ui=save]').count(),0);assert.equal(await page.locator('.hero-movement-item').count(),3);assert.equal(await page.locator('.hero-movement-item strong').first().textContent(),'Ax sis <test>');assert.match(await page.locator('.hero-movement-item.is-exhausted').textContent(),/Gunnar0 MP/);
 for(const rect of await page.locator('.mobile-nav>button').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()))){assert(rect.width>=44&&rect.height>=44);assert(rect.x>=0&&rect.y>=0&&rect.right<=size.width+1&&rect.bottom<=size.height+1,'Actions stay within viewport');}
 await page.locator('[data-ui=endturn]').tap();await page.locator('[data-ui=close-sheet]').first().tap();
 }
 await page.evaluate(()=>{testState.heroes[0].movement=0;testState.movement=0;send();});assert.equal(await page.locator('.hero-movement-item.is-exhausted').count(),2);assert.match(await page.locator('.hero-movement-item').first().textContent(),/0 MP/);
 await page.evaluate(async()=>{const{setLanguage}=await import('/web/i18n.mjs');setLanguage('fr');send();});assert.match(await page.locator('.hero-movement-item').first().textContent(),/0 PM/);
 await page.screenshot({path:'/private/tmp/goonk-hero-movement-'+kind+'.png'});assert.deepEqual(errors,[]);console.log('PASS',kind,'movement updates, exhausted heroes, EN/FR, five portrait/landscape viewports and working actions');
 }finally{await browser.close();}
}
