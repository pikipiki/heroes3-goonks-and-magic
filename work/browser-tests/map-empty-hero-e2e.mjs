import{chromium,webkit}from'playwright-core';import assert from'node:assert/strict';import fs from'node:fs';import path from'node:path';import{screenCases,stateFor}from'./material-screen-cases.mjs';import{silenceTestAudio}from'./silent-audio.mjs';
const output=process.env.REVIEW_OUTPUT||'/tmp/goonk-map-empty-hero';fs.mkdirSync(output,{recursive:true});
for(const[name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
  const page=await browser.newPage({hasTouch:true,serviceWorkers:'block'}),errors=[];page.on('pageerror',error=>errors.push(error.message));await silenceTestAudio(page);
  await page.route('**/web/**',route=>{const file=path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?route.fulfill({path:file}):route.abort();});
  await page.route('**/opfs-worker.js',route=>route.fulfill({contentType:'text/javascript',body:'export const opfsList=async()=>({}),opfsUnlink=async()=>{},opfsFlush=async()=>{};'}));
  await page.route('**/hero-fixture?mobile=1',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...args){calls.push(args)}};</script><script type=module src=/web/mobile.mjs></script>'}));
  await page.goto('http://localhost/hero-fixture?mobile=1');await page.waitForSelector('#mobile-app');await page.evaluate(()=>window.send=model=>dispatchEvent(new CustomEvent('goonk-state',{detail:structuredClone(model)})));
  for(const language of['fr','en'])for(const viewport of[{width:316,height:640},{width:390,height:844},{width:716,height:279}]){
   await page.setViewportSize(viewport);await page.evaluate(async language=>(await import('/web/i18n.mjs')).setLanguage(language),language);
   const noHero={mode:'map',turn:true,heroes:[],heroName:'',towns:[{id:1,index:0,name:'Castle'}],resources:[20,15,20,10,10,10,20000,0]},hero={...noHero,heroName:'Sylvia',heroId:1,movement:1000,heroes:[{id:1,index:0,name:'Sylvia',movement:1000}]};
   for(const [phase,model]of[['empty',noHero],['hero',hero],['empty-again',noHero]]){
    await page.evaluate(model=>send(model),model);await page.waitForTimeout(180);
    const nav=page.locator('.mobile-nav');assert.equal(await nav.locator('.hero-movement-summary').count(),phase==='hero'?1:0);assert(!/Aucun héros|No heroes|Pas de héros/.test(await nav.innerText()));
    assert.equal(await nav.locator('[data-ui=endturn]').count(),1,'Turn action retained');assert.equal(await nav.locator('[data-ui=move]').count(),1,'Move action retained');
    const geometry=await nav.evaluate(n=>{const cs=getComputedStyle(n),r=n.getBoundingClientRect(),buttons=[...n.querySelectorAll(':scope>button')].filter(b=>!b.hidden&&b.getBoundingClientRect().height);return{height:r.height,children:buttons.map(b=>b.getBoundingClientRect().toJSON()),gap:parseFloat(cs.rowGap)||0,padding:parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom)+parseFloat(cs.borderTopWidth)+parseFloat(cs.borderBottomWidth),overflow:n.scrollWidth>n.clientWidth||n.scrollHeight>n.clientHeight+1};});
    assert(!geometry.overflow,'Action dock has no hidden scrolling');
    if(phase!=='hero'){assert(geometry.children.length>0);const rows=new Set(geometry.children.map(rect=>Math.round(rect.y))).size;assert(Math.abs(geometry.height-(rows*geometry.children[0].height+(rows-1)*geometry.gap+geometry.padding))<2,'No empty row/background remains');for(const rect of geometry.children)assert(rect.height>=48);}
    if(phase==='empty-again')await page.screenshot({path:path.join(output,`${name}-${language}-${viewport.width}.png`)});
   }
  }
  assert.deepEqual(errors,[]);console.log('PASS',name,'NoHero→Hero→NoHero dock collapses without dropping actions, FR/EN portrait/landscape');
 }finally{await browser.close();}
}
