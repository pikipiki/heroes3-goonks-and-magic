import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8853',output=process.env.REVIEW_OUTPUT||'/tmp/goonk-mithril-information';fs.mkdirSync(output,{recursive:true});
const report={passed:false,cases:[],errors:[]};
const texts=Object.fromEntries(['en','fr'].map(language=>[language,JSON.parse(fs.readFileSync(`mod/tum-era/content/translation/tum-era-ui-${language==='fr'?'french':'english'}.json`))]));
for(const[kind,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
  for(const language of ['en','fr'])for(const viewport of [{width:320,height:568},{width:430,height:932},{width:568,height:280},{width:1440,height:900}]){
   const page=await browser.newPage({viewport,hasTouch:true});page.on('pageerror',e=>report.errors.push(e.message));
   await page.route('**/mithril-information-test',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html class=goonk-mobile><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/ui/material-components.css><style>body{margin:0}#mobile-app{position:fixed;inset:0;container-type:size;container-name:goonk-viewport}.scene-tools{display:flex}</style><section id=mobile-app data-mode=map><div class=scene-tools></div></section><script type=module>import {createMithrilEnhancements} from '/web/mithril-enhancements.mjs';import {setLanguage} from '/web/i18n.mjs';setLanguage('${language}');window.commands=[];window.view=createMithrilEnhancements({root:document.querySelector('#mobile-app'),command:(...args)=>{commands.push(args);queueMicrotask(()=>view.update(window.model));}});window.applyState=value=>{window.model=value;view.update(value)};window.ready=true;</script>`}));
   await page.goto(origin+'/mithril-information-test');await page.waitForFunction(()=>window.ready);
   const t=key=>texts[language]['tum-era.mithril.display.'+key];
   const information={total:t('total').replace('%d','100').replace('%s',t('plural')),title:t('title'),help:t('help'),prices:Array.from({length:11},(_,i)=>t('price.'+i))};
   await page.evaluate(information=>applyState({mode:'map',turn:true,mithrilEnabled:true,mithrilDisplayEnabled:true,mithril:{amount:100,revision:0,information,offers:[]}}),information);
   await page.locator('button[data-mithril-open]').tap();
   const b=page.locator('[data-mithril-prices]');await b.waitFor();await b.tap();
   assert.equal(await page.locator('#mithril-price-list li').count(),11);
   const geometry=await b.evaluate(node=>{const b=node.getBoundingClientRect();return{w:b.width,h:b.height,radius:getComputedStyle(node).borderRadius,mui:node.classList.contains('MuiButton-root')};});assert(geometry.w>=48&&geometry.h>=48&&geometry.radius==='0px'&&geometry.mui);
   await page.screenshot({path:path.join(output,`${kind}-${language}-${viewport.width}-top.png`)});
   const last=page.locator('#mithril-price-list li').last();await last.scrollIntoViewIfNeeded();assert(await last.isVisible());
   const fits=await page.locator('.mithril-content').evaluate(n=>n.scrollWidth<=n.clientWidth);assert(fits,'No horizontal text overflow');
   const close=page.locator('[data-mithril-close]');const box=await close.boundingBox();assert(box.width>=48&&box.height>=48);assert.equal(await close.getAttribute('aria-label'),language==='fr'?'Fermer':'Close');
   await page.screenshot({path:path.join(output,`${kind}-${language}-${viewport.width}-bottom.png`)});
   await close.tap();assert(await page.locator('.mithril-panel').isHidden());
   assert.deepEqual(await page.evaluate(()=>commands),[[1201,1],[1201,0]]);
   await page.evaluate(()=>{commands.length=0;applyState({mode:'map',turn:true,mithrilEnabled:false,mithrilDisplayEnabled:true,mithril:{amount:1,revision:0,information:{total:'1'},offers:[]}});});
   await page.locator('button[data-mithril-open]').tap();assert.equal(await b.count(),0);assert.equal(await page.locator('[data-mithril-buy]').count(),0);await close.tap();
   await page.evaluate(()=>applyState({mode:'map',turn:true,mithrilEnabled:false,mithrilDisplayEnabled:false}));assert(await page.locator('button[data-mithril-open]').isHidden());
   report.cases.push({kind,language,viewport,geometry,verticalScroll:true,horizontalOverflow:false,singleClose:true,readOnly:true,informationOnly:true,disabled:true});await page.close();
  }
 }finally{await browser.close();}
}
report.passed=!report.errors.length;fs.writeFileSync(path.join(output,'result.json'),JSON.stringify(report,null,2));assert(report.passed);console.log('PASS Mithril information: Chromium/WebKit, FR/EN, four viewports, read-only prices and single close');
