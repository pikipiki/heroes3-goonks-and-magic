import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const output=process.env.REVIEW_OUTPUT||'/tmp/goonk-wog-radio-components';fs.mkdirSync(output,{recursive:true});
const beforeModule=execFileSync('git',['show','357ed453:web/wog-options.mjs'],{encoding:'utf8'});
const beforeCSS=execFileSync('git',['show','357ed453:web/wog-options.css'],{encoding:'utf8'});
const report={passed:false,cases:[],errors:[]};
for(const[kind,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
  for(const language of ['fr','en'])for(const viewport of [{width:320,height:568},{width:430,height:932},{width:568,height:280},{width:844,height:390}]){
   for(const phase of ['before','after']){
    const page=await browser.newPage({viewport,hasTouch:true});page.on('pageerror',e=>report.errors.push(e.message));
    await page.route('**/web/**',route=>route.fulfill({path:path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1])}));
    await page.route('**/web/wog-options-before.mjs',route=>route.fulfill({contentType:'text/javascript',body:beforeModule}));
    await page.route('**/web/wog-options-before.css',route=>route.fulfill({contentType:'text/css',body:beforeCSS}));
    await page.route('**/wog-radio-test',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/ui/components.css><link rel=stylesheet href=/web/wog-options${phase==='before'?'-before':''}.css><style>body{margin:0;background:#241a10;color:#fff0cc;font:16px/1.5 system-ui}#mobile-app{position:fixed;inset:0;overflow:auto;padding:8px;box-sizing:border-box}.lobby-extra-options{max-width:520px;margin:auto}fieldset p{margin:8px 0}fieldset legend{overflow-wrap:anywhere}</style><section id=mobile-app><div class=lobby-extra-options></div></section><script type=module>import {createWogOptions} from '/web/wog-options${phase==='before'?'-before':''}.mjs';import {setLanguage} from '/web/i18n.mjs';setLanguage('${language}');window.model={mode:'lobby',lobbyReady:true,wogOptionsEditable:true,wogOptions:Array(17).fill(-1)};window.commands=[];window.choices=createWogOptions({menu:document,command:(...values)=>commands.push(values),onChange:()=>choices.update(model)});choices.update(model);document.querySelector('details').open=true;window.ready=true;</script>`}));
    await page.goto('http://localhost/wog-radio-test');await page.waitForFunction(()=>window.ready);
    const choice=page.locator('input[data-wog-option="16"][value="1"]').locator('..');await choice.scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(output,`${kind}-${language}-${viewport.width}-${viewport.height}-${phase}.png`)});
    if(phase==='after'){
     const geometry=await choice.evaluate(label=>({w:label.getBoundingClientRect().width,h:label.getBoundingClientRect().height,radius:getComputedStyle(label).borderRadius}));assert(geometry.w>=48&&geometry.h>=48);assert.equal(geometry.radius,'0px');
     await choice.tap();await page.waitForFunction(()=>commands.length===1);assert.deepEqual(await page.evaluate(()=>commands),[[109,16,1]]);
     assert(await page.locator('input[data-wog-option="0"]').first().isDisabled());
     await page.evaluate(()=>{model.wogOptions[16]=1;choices.observe(model);choices.update(model);});assert(await page.locator('input[data-wog-option="16"][value="1"]').isChecked());
     assert.equal(await page.locator('input[data-wog-option="16"][value="1"]').locator('..').textContent(),language==='fr'?'Oui':'On');
     await page.evaluate(()=>choices.update(model,true));assert(await page.locator('input[data-wog-option="16"]').first().isDisabled());
     await page.evaluate(()=>{model.wogOptions=Array(16).fill(-1);choices.update(model);});assert.equal(await page.locator('fieldset:visible').count(),16);
     await page.evaluate(()=>{model.wogOptionsEditable=false;choices.update(model);});assert(await page.locator('details').isHidden());
     await page.evaluate(()=>{model.wogOptionsEditable=true;model.lobbyReady=false;choices.update(model);});assert(await page.locator('input[data-wog-option="0"]').first().isDisabled());
     await page.evaluate(()=>{model.lobbyReady=true;model.wogOptions=Array(17).fill(-1);choices.update(model);const last=document.querySelector('fieldset:last-child legend');last.textContent='Réglage de créatures particulièrement long pour une petite largeur '.repeat(5);});
     assert(await page.locator('fieldset:last-child legend').evaluate(n=>n.scrollWidth<=n.getBoundingClientRect().width+1));
     assert(await page.locator('#mobile-app').evaluate(n=>n.scrollWidth<=n.clientWidth+1));
     if(language==='fr'&&viewport.width===320){
      await choice.scrollIntoViewIfNeeded();await choice.tap();await page.waitForFunction(()=>!choices.pending,null,{timeout:15000});
      assert.match(await page.locator('.wog-options-status').textContent(),/Réglage non confirmé/);assert.equal(await page.evaluate(()=>commands.length),2);
     }
     report.cases.push({kind,language,viewport,geometry,singleActivation:true,legacySixteenChoices:true,loadingAndDisabled:true,longLabelsFit:true});
    }
    await page.close();
   }
  }
 }finally{await browser.close();}
}
assert.deepEqual(report.errors,[]);report.passed=true;fs.writeFileSync(path.join(output,'result.json'),JSON.stringify(report,null,2));console.log('PASS WoG radio component: Chromium/WebKit, FR/EN, four viewports, legacy choices, pending/error and visual pairs');
