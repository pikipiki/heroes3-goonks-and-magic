import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
for(const [kind,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
  const p=await browser.newPage({viewport:{width:390,height:740},hasTouch:true}),errors=[];p.on('pageerror',error=>errors.push(error.message));
  await p.route('**/web/**',route=>route.fulfill({path:path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1])}));
  await p.route('**/ui-test',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/ui/components.css><style>body{margin:0;background:#241a10}#viewport{position:fixed;inset:0;container:goonk-viewport/size}#mobile-app{position:absolute;inset:0}.fixture{position:absolute;inset:8px;display:grid;grid-template-rows:auto minmax(0,1fr) auto;color:#fff0cc}.content{overflow:auto;min-height:0;padding:12px}button{font:inherit}.fixture[hidden]{display:none}.ui-action-group{width:100%}</style><div id=viewport><div id=mobile-app></div></div><script type=module>import * as ui from '/web/ui/components.mjs';import{setLanguage}from'/web/i18n.mjs';window.ui=ui;window.setLanguage=setLanguage;ui.installScreenComponents();window.ready=true;</script>`}));
  await p.goto('http://localhost/ui-test');await p.waitForFunction(()=>window.ready);
  // Exercise the actual adapter registry, not a second inventory in the test.
  const inventory=await p.evaluate(async()=>{const {screenContracts}=await import('/web/ui/contracts.mjs');return screenContracts.map(c=>({name:c.name,selector:c.selector,requiredChoice:!!c.requiredChoice}));});
  assert(inventory.length>=20);assert(inventory.some(c=>c.name==='message'&&c.requiredChoice));
  for(const language of ['fr','en'])for(const viewport of [{width:320,height:568},{width:430,height:932},{width:568,height:280},{width:844,height:390}]){
   await p.setViewportSize(viewport);
   await p.evaluate(language=>{
    setLanguage(language);document.querySelector('#mobile-app').replaceChildren();window.commands=[];
    const panel=document.createElement('section');panel.className='progression-page ui-screen-layout fixture';
    panel.innerHTML=ui.screenHeaderMarkup({title:language==='fr'?'Améliorer toutes les créatures de cette armée':'Upgrade every creature in this army'})+'<main class="progression-scroll ui-screen-content content"><p>'+('Description '.repeat(200))+'</p></main>'+ui.actionDockMarkup('<button class="primary" data-command="confirm">'+(language==='fr'?'Confirmer':'Confirm')+'</button><button data-command="secondary">Second action</button><button data-command="disabled" disabled>Disabled</button><button data-command="other">Other action</button><button data-army-upgrade-cancel data-command="back">'+(language==='fr'?'Retour':'Back')+'</button>');
    panel.addEventListener('click',event=>{const button=event.target.closest('[data-command]');if(button&&!button.disabled)commands.push(button.dataset.command);});document.querySelector('#mobile-app').append(panel);ui.applyScreenComponents(panel);
   },language);
   const close=p.locator('.ui-screen-header .ui-icon-button'),confirm=p.locator('[data-command=confirm]'),back=p.locator('[data-command=back]'),more=p.locator('.ui-overflow-trigger');
   assert(await back.isHidden(),'Native back remains as command bridge; only the cross is exposed');
   for(const button of [close,confirm,more]){const r=await button.boundingBox();assert(r&&r.width>=48&&r.height>=48&&r.x>=0&&r.y>=0&&r.x+r.width<=viewport.width+1&&r.y+r.height<=viewport.height+1,JSON.stringify({kind,language,viewport,r}));}
   assert.equal(await p.locator('.ui-screen-header button').count(),1);assert.equal(await close.getAttribute('aria-label'),language==='fr'?'Fermer':'Close');
   const head=await p.locator('.ui-screen-header').boundingBox(),body=await p.locator('.ui-screen-content').boundingBox(),dock=await p.locator('.ui-action-dock').boundingBox();
   if(viewport.width>viewport.height)assert(head.x>=body.x+body.width-1&&dock.x>=body.x+body.width-1,'Title and actions share the right rail');else assert(head.y+head.height<=body.y+1&&body.y+body.height<=dock.y+1,'Portrait content stays between title and actions');
   await more.tap();assert(await p.getByRole('menu').isVisible());await p.getByRole('menuitem',{name:'Second action',exact:true}).tap();assert.deepEqual(await p.evaluate(()=>commands),['secondary'],'Original delegated command is activated once through overflow');
   await more.tap();await p.keyboard.press('Escape');assert.equal(await more.getAttribute('aria-expanded'),'false');assert(await more.evaluate(node=>node===document.activeElement));
   await close.tap();assert.deepEqual(await p.evaluate(()=>commands),['secondary','back'],'Header close forwards only the original cancel action');
   await p.evaluate(()=>document.querySelector('[data-command=back]').disabled=true);await p.waitForFunction(()=>document.querySelector('.ui-icon-button').disabled);assert(await close.isDisabled());
   await p.evaluate(()=>{window.mutations=0;const observer=new MutationObserver(records=>mutations+=records.filter(r=>r.type==='childList').length);observer.observe(document.querySelector('.fixture'),{subtree:true,childList:true});for(let i=0;i<40;i++)ui.refreshScreenComponents();observer.disconnect();});assert.equal(await p.evaluate(()=>mutations),0,'Repeated updates preserve DOM identity');
   if(viewport.width===844&&language==='fr')await p.screenshot({path:'/tmp/ui-components-'+kind+'.png'});
  }
  await p.evaluate(()=>{document.querySelector('#mobile-app').innerHTML='<section class="dialog-presentation fixture"><header><h2>Required choice</h2></header><main class=content>Choose</main><footer><button data-dialog-confirm>Confirm purchase</button></footer></section>';ui.refreshScreenComponents();});assert.equal(await p.locator('.ui-icon-button').count(),0,'A close icon never confirms a required purchase');
  await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await p.locator('.ui-button').evaluate(node=>getComputedStyle(node).animationName),'none');assert.deepEqual(errors,[]);console.log('PASS',kind,'component inventory, FR/EN, four viewports, fixed rails, cancel safety, overflow commands, focus, disabled states and stable DOM');
 }finally{await browser.close();}
}
