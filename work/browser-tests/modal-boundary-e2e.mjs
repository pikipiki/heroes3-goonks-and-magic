import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-modal-boundary';fs.mkdirSync(out,{recursive:true});
const baseline=process.env.MODAL_BOUNDARY_BASELINE==='1',boundarySource=process.env.MODAL_BOUNDARY_SOURCE||(baseline?'/tmp/modal-boundary-before.mjs':null),reports=[];
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
  const page=await browser.newPage({hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/web/**',route=>{const relative='web/'+new URL(route.request().url()).pathname.split('/web/')[1];return boundarySource&&relative==='web/ui/modal-boundary.mjs'?route.fulfill({path:boundarySource,contentType:'text/javascript'}):route.fulfill({path:path.resolve(relative)});});
  await page.route('**/modal-fixture',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/ui/material-components.css><style>body{margin:0;background:#241a10;color:#fff0cc}main{padding:8px}section[aria-modal]{position:fixed;inset:8px;padding:16px;background:#302318;border:1px solid #a88c63;z-index:2}section[aria-modal][hidden]{display:none}button{margin:4px!important}</style>'}));
  await page.goto('http://localhost/modal-fixture');
  await page.evaluate(async()=>{
   const ui=await import('/web/ui/material-components.mjs'),{createMaterialSelects}=await import('/web/material-select.mjs'),{useModalBoundary}=await import('/web/ui/modal-boundary.mjs');
   window.setup=()=>{document.body.replaceChildren();const app=ui.createUIElement('main');app.id='mobile-app';document.body.append(app);ui.renderMarkup(app,'<button id="launch">Open army</button><aside id="permanent" inert><button id="permanent-button">Unavailable</button></aside><div id="background"><button>Map action</button></div>');app.querySelector('#permanent').inert=true;window.app=app;window.panels={};window.actions=[];app.querySelector('#launch').focus();};
   window.panel=(id,parent=app)=>{const root=ui.createUIElement('section');root.id=id;root.style.zIndex=String({army:10,upgrade:20,confirm:30}[id]);root.hidden=true;root.setAttribute('aria-modal','true');root.setAttribute('role','dialog');root.setAttribute('aria-label',id);ui.renderMarkup(root,`<h2>${id}</h2><button id="${id}-first">Choose</button><button id="${id}-last">Close</button><button disabled>Disabled</button>`);parent.append(root);root.addEventListener('click',event=>{if(event.target.closest('button'))actions.push(id);});panels[id]=root;useModalBoundary(root);return root;};
   window.recheck=id=>useModalBoundary(panels[id]);window.openPanel=id=>{panels[id].hidden=false;useModalBoundary(panels[id]);};window.closePanel=id=>{panels[id].hidden=true;useModalBoundary(panels[id]);};window.removePanel=id=>{panels[id].remove();useModalBoundary(panels[id]);};
   window.portalFixture=nested=>{setup();panel('army');if(nested)panel('upgrade',panels.army);openPanel('army');if(nested)openPanel('upgrade');window.portalParent=nested?'upgrade':'army';const root=panels[portalParent],host=ui.createUIElement('div');root.append(host);ui.renderMarkup(host,'<label>Army filter<select id=portal-select aria-label="Army filter"><option value=a>All armies</option><option value=b>Commanders</option></select></label><button id=portal-anchor>More actions</button>');window.selectChanges=0;host.querySelector('select').addEventListener('change',()=>selectChanges++);window.selects=createMaterialSelects(host);selects.update();window.popupActions=0;window.popup=ui.createPopupMenu({anchor:host.querySelector('#portal-anchor'),container:root,label:'Army actions'});const action=ui.createUIElement('button');action.id='portal-action';action.textContent='Inspect army';action.addEventListener('click',()=>popupActions++);popup.setItems([action]);window.results=[];};
   window.usable=id=>!panels[id].closest('[hidden],[inert]');
   window.check=(name,value)=>{window.results.push({name,pass:!!value});};
  });
  for(const viewport of [{width:390,height:844},{width:844,height:390}])for(const nested of [false,true]){
   await page.setViewportSize(viewport);await page.evaluate(nested=>{
    setup();window.results=[];panel('army');panel('upgrade',nested?panels.army:app);panel('confirm',nested?panels.upgrade:app);
    check('fixture begins with native inert',document.querySelector('#permanent').inert);openPanel('army');check('first boundary usable',usable('army'));check('background isolated',document.querySelector('#background').inert);check('pre-existing inert retained',document.querySelector('#permanent').inert);
    panels.army.querySelector('#army-last').focus();openPanel('upgrade');check('second boundary usable',usable('upgrade'));check('lower controls excluded',!!document.querySelector('#army-first').closest('[inert]'));
    panels.upgrade.querySelector('#upgrade-last').focus();openPanel('confirm');check('third boundary usable',usable('confirm'));check('second controls excluded',!!document.querySelector('#upgrade-first').closest('[inert]'));
    if(nested)panels.army.prepend(panels.upgrade);else app.append(panels.army);recheck('army');check('DOM reorder does not steal top ownership',usable('confirm')&&!!document.querySelector('#army-first').closest('[inert]'));
   },nested);
   // Use real keyboard input, not synthetic keydown: browser inertness and the
   // boundary must agree about the active top-level focus trap.
   await page.evaluate(()=>document.querySelector('#confirm-last').focus());await page.keyboard.press('Tab');
   await page.evaluate(()=>check('Tab wraps to first of top dialog',document.activeElement.id==='confirm-first'));
   await page.keyboard.press('Shift+Tab');await page.evaluate(()=>check('ShiftTab wraps to last of top dialog',document.activeElement.id==='confirm-last'));
   if(await page.evaluate(()=>usable('confirm'))){await page.locator('#confirm-first').click();await page.evaluate(()=>check('real click reaches top dialog',actions.includes('confirm')));}
   await page.screenshot({path:path.join(out,`${name}-${viewport.width}x${viewport.height}-${nested?'nested':'siblings'}.png`)});
   await page.evaluate(()=>{
    closePanel('confirm');check('second reactivated after close',usable('upgrade'));check('focus restored to second trigger',document.activeElement.id==='upgrade-last');
    closePanel('upgrade');check('first reactivated after close',usable('army'));check('focus restored to first trigger',document.activeElement.id==='army-last');
    closePanel('army');check('background restored',!document.querySelector('#background').inert);check('pre-inert survives full close',document.querySelector('#permanent').inert);check('focus restored to launch',document.activeElement.id==='launch');
   });
   const normal=await page.evaluate(()=>results);
   await page.evaluate(nested=>{
    setup();window.results=[];panel('army');panel('upgrade',nested?panels.army:app);panel('confirm',nested?panels.upgrade:app);
    openPanel('army');panels.army.querySelector('#army-last').focus();openPanel('upgrade');openPanel('confirm');
    closePanel('upgrade');check('closing middle selects visible top',usable(nested?'army':'confirm'));check('focus stays inside visible top',panels[nested?'army':'confirm'].contains(document.activeElement));
    closePanel('confirm');check('hidden middle is skipped',usable('army'));check('focus skips closed middle',panels.army.contains(document.activeElement)&&!document.activeElement.closest('[hidden],[inert]'));
    openPanel('upgrade');openPanel('confirm');closePanel('army');check('closing lower selects visible boundary',nested?!document.querySelector('#background').inert:usable('confirm'));removePanel('confirm');check('removed top restores next visible boundary',nested?!document.querySelector('#background').inert:usable('upgrade'));closePanel('upgrade');check('all background restored after irregular closes',!document.querySelector('#background').inert);check('original inert preserved after irregular closes',document.querySelector('#permanent').inert);
   },nested);
   const irregular=await page.evaluate(()=>results),report={browser:name,...viewport,nested,checks:[...normal,...irregular]};reports.push(report);
   await page.evaluate(nested=>portalFixture(nested),nested);
   await page.getByRole('combobox',{name:'Army filter'}).click();await page.getByRole('listbox').waitFor();
   await page.evaluate(()=>{for(let i=0;i<12;i++)recheck(portalParent);const list=document.querySelector('[role=listbox]');check('MUI Select listbox is a body portal',!!list&&!panels[portalParent].contains(list));check('repeated parent refresh leaves MUI Select portal interactive',!!list&&!list.closest('[inert]'));});
   if(await page.getByRole('listbox').evaluate(n=>!n.closest('[inert]'))){await page.getByRole('option',{name:'Commanders',exact:true}).click();await page.getByRole('listbox').waitFor({state:'hidden'});await page.evaluate(()=>{check('Select option issues one native bridge change',document.querySelector('#portal-select').value==='b'&&selectChanges===1);check('Select restores focus to its trigger',document.activeElement.getAttribute('role')==='combobox');});}
   else {await page.getByRole('listbox').evaluate(node=>node.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));await page.getByRole('listbox').waitFor({state:'hidden'});}
   await page.locator('#portal-anchor').click();await page.getByRole('menu',{name:'Army actions'}).waitFor();
   await page.evaluate(()=>{for(let i=0;i<12;i++)recheck(portalParent);check('native popup MUI Menu remains inside its modal',panels[portalParent].contains(popup.list)&&popup.list.closest('.MuiMenu-root')!==null);check('native popup remains interactive after parent refresh',!popup.list.closest('[inert]'));});
   await page.locator('#portal-action').click();await page.evaluate(()=>check('native popup action is dispatched exactly once',popupActions===1));
   await page.locator('#portal-anchor').click();await page.getByRole('menu',{name:'Army actions'}).waitFor();await page.keyboard.press('Escape');await page.evaluate(()=>{check('native popup Escape restores anchor focus',document.activeElement.id==='portal-anchor');popup.dispose();closePanel(portalParent);if(portalParent==='upgrade')closePanel('army');check('portal dismissal restores background isolation',!document.querySelector('#background').inert&&document.querySelector('#permanent').inert);});
   report.checks.push(...await page.evaluate(()=>results));
   console.log(name,viewport.width,viewport.height,nested?'nested':'siblings',report.checks.filter(x=>!x.pass));
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
}
fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({baseline,reports},null,2));
const failed=reports.flatMap(r=>r.checks.filter(c=>!c.pass).map(c=>({...r,...c,checks:undefined})));
assert.deepEqual(failed,[],`${failed.length} modal boundary regressions`);
console.log('PASS 8 modal compositions and MUI portals, 3 levels, focus traps, irregular closes, preserved inert state');
