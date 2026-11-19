import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-modal-inventory',reports=[];fs.mkdirSync(out,{recursive:true});
// Each modal source in docs/ui-audit/dialog-adoption.md. Page navigation is
// intentionally excluded: a close/back action alone does not make a page modal.
const cases=[
 ['sheet','section','mobile-sheet','',true,'data-ui="close-sheet"'],
 ['army-upgrades','section','progression-page army-upgrades-page','',true,'data-army-upgrade-cancel'],
 ['progression','section','progression-page progression-choices','',true,'data-progression-cancel'],
 ['troop-actions','section','progression-page troop-actions-page','',true,'data-troop-action="back"'],
 ['troop-equipment','section','progression-page troop-equipment-page','',true,'data-troop-close'],
 ['troop-deployment','section','progression-page troop-deployment-page','',true,'data-deployment-cancel'],
 ['mithril','section','mithril-panel','',true,'data-mithril-close'],
 ['cave-builder','section','','',true,'data-builder-close'],
 ['message','section','dialog-presentation','',false,'data-dialog-cancel'],
 ['commander','section','dialog-presentation','',false,'data-dialog-confirm'],
 ['creature','section','creature-presentation','',false,'data-presentation-close'],
 ['hero','section','hero-equipment-page','',false,'data-hero-close'],
 ['hero-exchange','section','hero-exchange-page','',false,'data-exchange-close'],
 ['market','section','market-page','',false,'data-market="close"'],
 ['spellbook','section','mobile-spellbook','',false,'data-close-book'],
 ['mage-guild','section','mobile-mage-guild','',false,'data-guild-close'],
 ['town-service','section','town-service','',false,'data-service-back'],
 ['tavern','section','mobile-tavern','',false,'data-tavern-close'],
 ['battle-result','section','battle-result','',false,'data-result-confirm'],
 ['scenario-picker','dialog','lobby-picker','',false,'data-picker-close'],
 ['hosted-castles','dialog','lobby-picker','hosted-castle-picker',false,'data-castle-close'],
 ['hosted-map','dialog','lobby-picker','hosted-map-picker',false,'data-picker-close'],
 ['game-menu','dialog','','game-menu',false,'data-menu="close"'],
 ['session-recovery','dialog','session-recovery','',false,'data-close'],
 ['campaign-media','dialog','campaign-media-viewer','',false,'data-close'],
 ['hosted-delete','dialog','hosted-delete-dialog','',false,'data-delete-cancel']
];
for(const [browserName,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
  const page=await browser.newPage({hasTouch:true}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/web/**',route=>route.fulfill({path:path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1])}));
  await page.route('**/modal-inventory',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/ui/material-components.css><style>body{margin:0;background:#241a10}#mobile-app{position:fixed;inset:0}</style><main id=mobile-app data-active=true><button id=opener>Open</button></main>'}));
  await page.goto('http://localhost/modal-inventory');
  await page.evaluate(async()=>{window.ui=await import('/web/ui/material-components.mjs');window.boundary=(await import('/web/ui/modal-boundary.mjs')).useModalBoundary;window.applyLanguage=(await import('/web/i18n.mjs')).setLanguage;});
  for(const language of ['fr','en'])for(const size of [{width:390,height:844},{width:716,height:279}])for(const spec of cases){
   await page.setViewportSize(size);
   await page.evaluate(({spec,language})=>{
    applyLanguage(language);const [name,tag,className,id,explicit,closeAttributes]=spec,app=document.querySelector('#mobile-app');
    app.dataset.sheet='army';app.dataset.mode=name;window.nativeCloseCount=0;
    const home=ui.createUIElement('div');if(name==='cave-builder')home.className='cave-builder';app.append(home);
    const root=ui.createUIElement(tag);root.className=className;if(id)root.id=id;if(tag!=='dialog')root.hidden=true;if(explicit){root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');}if(name==='commander')root.dataset.kind='commander';
    // Geometry is fixed for this API inventory; screen layout is tested by the
    // native screen matrix. No production style or layout is changed here.
    for(const [key,value] of Object.entries({position:'fixed',inset:'8px',width:'auto',height:'auto','max-width':'none','max-height':'none',overflow:'auto','box-sizing':'border-box'}))root.style.setProperty(key,value,'important');
    ui.renderMarkup(root,`<header><h2>Inventory ${name}</h2><button aria-label="Close" data-inventory-close ${closeAttributes}>✕</button></header><canvas width="20" height="20"></canvas><input aria-label="Quantity" type="number" value="3">`);ui.useScreenComponents(root);home.append(root);
    const button=root.querySelector('[data-inventory-close]'),canvas=root.querySelector('canvas'),input=root.querySelector('input');
    button.addEventListener('click',()=>{nativeCloseCount++;if(tag==='dialog')root.close('inventory');else{root.hidden=true;boundary(root);}});
    window.subject={root,home,button,canvas,input,tag};ui.useScreenComponents(root);if(tag==='dialog')root.showModal();else{root.hidden=false;boundary(root);}document.querySelector('#opener').focus();
   },{spec,language});
   await page.waitForTimeout(100);
   const result=await page.evaluate(()=>{const {root,button,canvas,input,tag}=subject,dialog=root.closest('.MuiDialog-root'),container=root.closest('.MuiDialog-container');return{paper:root.matches('.MuiDialog-paper[role=dialog]'),root:!!dialog,container:!!container,backdrop:!!dialog?.querySelector('.MuiBackdrop-root'),ownerApp:dialog?.closest('#mobile-app')===document.querySelector('#mobile-app'),nativeTopLayer:tag==='dialog'&&root.matches(':modal'),identity:root.querySelector('[data-inventory-close]')===button&&root.querySelector('canvas')===canvas&&root.querySelector('input')===input&&input.value==='3',open:tag==='dialog'?root.open:!root.hidden};});
   if(result.paper&&result.root&&result.container){await page.locator('[data-inventory-close]').click();await page.waitForTimeout(50);}
   result.closeCount=await page.evaluate(()=>nativeCloseCount);reports.push({browser:browserName,language,...size,name:spec[0],...result});
   await page.evaluate(()=>{const {root,home,tag}=subject;if(tag==='dialog'&&root.open)root.close();else{root.hidden=true;boundary(root);}home.remove();});await page.waitForTimeout(20);
  }
  assert.deepEqual(errors,[]);console.log(browserName,'104 modal source/orientation/language cases complete');
 }finally{await browser.close();}
}
fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(reports,null,2));
const failures=reports.filter(result=>!result.paper||!result.root||!result.container||!result.backdrop||!result.ownerApp||result.nativeTopLayer||!result.identity||!result.open||result.closeCount!==1);
assert.deepEqual(failures,[],`${failures.length} native sources are not fully adopted into MUI Dialog`);console.log('PASS 208 modal sources, true MUI Dialog structure, identity, protocol and one native close');
