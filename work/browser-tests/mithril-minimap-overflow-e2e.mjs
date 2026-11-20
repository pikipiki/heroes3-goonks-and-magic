import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import path from 'node:path';
for(const [kind,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true,...(kind==='chromium'?{args:['--mute-audio']}:{})});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await page.route('**/web/**',route=>route.fulfill({path:path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1])}));
  await page.route('**/mithril-fit',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/ui/components.css><style>
   html,body{margin:0}#mobile-app{position:relative;width:360px;height:660px;container:goonk-viewport/size}
   .scene-tools{position:absolute;top:64px;left:8px;display:flex;gap:6px}
   .scene-tools .map-center{width:79px;height:58px}.scene-tools .map-castle{width:90px;height:58px}.scene-tools [data-mithril-open]{width:69px;height:58px}
   #mobile-overview{position:absolute;top:64px;width:122px;height:122px}
   .mobile-nav{position:absolute;left:0;right:0;bottom:0;display:flex;gap:4px}
  </style><div id=mobile-app data-mode=map><div class=scene-tools><button class=map-center>Héros</button><button class=map-castle>Château</button></div><canvas id=mobile-overview></canvas><nav class=mobile-nav><button data-ui=move class=primary>Marcher</button><button data-ui=heroes>Troupes</button><button data-ui=towns>Villes</button><button data-ui=endturn>Fin tour</button></nav></div>
  <script type=module>import{createMithrilEnhancements}from'/web/mithril-enhancements.mjs';import{placeMithrilAction,useNavigation}from'/web/ui/material-components.mjs';import{setLanguage}from'/web/i18n.mjs';setLanguage('fr');const root=document.querySelector('#mobile-app');window.calls=[];const mithril=createMithrilEnhancements({root,command:(...args)=>calls.push(args)});mithril.update({mode:'map',turn:true,mithrilEnabled:true,mithril:{revision:1,offers:[]}});window.layout=left=>{document.querySelector('#mobile-overview').style.left=left+'px'};window.fit=()=>{const nav=root.querySelector('.mobile-nav');if(placeMithrilAction(root))useNavigation(nav);else useNavigation(nav)};window.ready=true;</script>`}));
  await page.goto('http://localhost/mithril-fit');await page.waitForFunction(()=>window.ready);
  const intersects=()=>page.evaluate(()=>{const a=document.querySelector('button[data-mithril-open]').getBoundingClientRect(),b=document.querySelector('#mobile-overview').getBoundingClientRect();return a.width>0&&b.width>0&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;});
  await page.evaluate(()=>layout(230));
  for(let i=0;i<4;i++)await page.evaluate(()=>fit());
  const mithril=page.locator('button[data-mithril-open]');
  assert.equal(await mithril.evaluate(node=>node.closest('[role=menu]')?.getAttribute('role')),'menu','Overlapping Mithril moves into Plus');
  assert.equal(await intersects(),false);
  assert.equal(await page.locator('.mobile-nav>.ui-overflow-trigger').innerText(),'Plus');
  assert.deepEqual(await page.locator('.mobile-nav > button:not([hidden])').evaluateAll(nodes=>nodes.map(node=>node.dataset.ui||(node.classList.contains('ui-overflow-trigger')?'more':''))),['move','endturn','towns','more']);
  assert.deepEqual(await page.locator('[role=menu] button').evaluateAll(nodes=>nodes.map(node=>node.dataset.ui||(node.hasAttribute('data-mithril-open')?'mithril':''))),['heroes','mithril']);
  await page.locator('.ui-overflow-trigger').tap();
  await mithril.tap();
  assert.deepEqual(await page.evaluate(()=>calls),[[1201,1]],'Mithril still opens from Plus');
  await page.evaluate(()=>{calls.length=0;layout(640);fit();});
  assert.equal(await mithril.evaluate(node=>node.parentElement.classList.contains('scene-tools')),true,'Mithril returns beside a clear minimap');
  assert.equal(await intersects(),false);
  assert.equal(await page.locator('.mobile-nav>.ui-overflow-trigger').isVisible(),false,'Plus leaves the bar when the minimap is clear');
  console.log('PASS',kind,'mithril minimap overflow');
 }finally{await browser.close();}
}
