import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {silenceTestAudio} from './silent-audio.mjs';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-recruit-variants-stretch';fs.mkdirSync(out,{recursive:true});
const variants=['Élémentaire du Feu','Élémentaire d’Énergie','Élémentaire de plasma','Élémentaire de feu ancestral'].map((name,i)=>({id:i+1,name,upgradeRank:i+1,count:12,attack:14,defense:10,damageMin:4,damageMax:6,health:35,speed:10,cost:[0,0,0,0,0,0,500,0],description:'Cette créature utilise sa magie en combat.',nativeFlags:{flying:true},preview:{x:i*100,y:0,w:80,h:80}}));
const report=[];
for(const [kind,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await silenceTestAudio(page);
  await page.route('**/web/**',route=>{const pathname=new URL(route.request().url()).pathname;return route.fulfill({path:process.env.TEST_RECRUIT_CSS&&pathname==='/web/recruitment-view.css'?process.env.TEST_RECRUIT_CSS:path.resolve('web',pathname.split('/web/')[1])});});
  await page.route('**/variants-stretch?mobile=1',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.pointerCalls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(){},_vcmiMobilePointer(...args){pointerCalls.push(args)}};</script><script type=module src=/web/mobile.mjs></script>'}));
  await page.goto('http://localhost/variants-stretch?mobile=1');await page.waitForSelector('#mobile-app');
  await page.evaluate(async()=>{window.setFixtureLanguage=(await import('/web/i18n.mjs')).setLanguage});
  for(const language of ['fr','en'])for(const size of [{width:390,height:844},{width:716,height:279},{width:844,height:390},{width:1440,height:900},{width:1728,height:1117}])for(const count of [1,2,3,4]){
   await page.setViewportSize(size);await page.waitForTimeout(300);await page.waitForSelector('#mobile-app');
   const choices=variants.slice(0,count).map((u,i)=>({...u,name:language==='en'?['Fire Elemental','Energy Elemental','Plasma Elemental','Ancestral Fire Elemental'][i]:u.name}));
   await page.evaluate(({language,choices})=>{setFixtureLanguage(language);dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'recruit',turn:true,day:8,resources:[300,300,300,300,300,300,299999,300],recruitUnit:choices[0],recruitAmount:1,recruitMaximum:12,previewUnits:choices,armies:[]}}));},{language,choices});
   await page.waitForTimeout(120);
   const chooser=page.locator('.recruit-variants');assert.equal(await chooser.locator('[data-variant]').count(),count);
   if(count===1){assert(await chooser.isHidden(),'One native variant needs no redundant chooser');report.push({kind,language,size,count});continue;}
   const measurement=await chooser.evaluate(node=>{const s=getComputedStyle(node),rect=node.getBoundingClientRect();return{rect:rect.toJSON(),gap:parseFloat(s.rowGap),rows:s.gridTemplateRows.split(' ').map(Number.parseFloat),tiles:[...node.querySelectorAll('[data-variant]')].map(button=>({box:button.getBoundingClientRect().toJSON(),scroll:button.scrollHeight,client:button.clientHeight,mui:button.classList.contains('MuiButton-root')}))};});
   for(const [index,tile] of measurement.tiles.entries()){
    const row=size.width>size.height||count===2?index:Math.floor(index/2);
    assert(Math.abs(tile.box.height-measurement.rows[row])<=1,'Every evolution card fills its grid row '+JSON.stringify({kind,language,size,count,index,measurement}));
    assert(tile.mui,'Evolution remains a real MUI Button');assert(tile.scroll<=tile.client+2,'Full native name is readable');
   }
   const canvasBefore=await page.locator('[data-preview-creature]').boundingBox();
   const chosen=count-1,target=chooser.locator('[data-variant="'+chosen+'"]');await target.scrollIntoViewIfNeeded();
   await page.evaluate(()=>pointerCalls=[]);await target.tap();assert.equal((await page.evaluate(()=>pointerCalls)).length,1,'Native selector receives exactly one original pointer command');
   const canvasAfter=await page.locator('[data-preview-creature]').boundingBox();assert.deepEqual(canvasAfter,canvasBefore,'Selecting does not resize the animated creature');
   if(count===3)await page.screenshot({path:out+'/'+kind+'-'+language+'-'+size.width+'.png'});
   report.push({kind,language,size,count,measurement});
  }
  assert.deepEqual(errors,[]);await page.close();
 }finally{await browser.close()}
}
fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log('PASS',report.length,'variant layouts: full-height MUI tiles, native pointer, stable animation, portrait/landscape/Mac');
