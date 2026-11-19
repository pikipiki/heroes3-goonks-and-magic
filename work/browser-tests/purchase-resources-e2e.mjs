import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {silenceTestAudio} from './silent-audio.mjs';
const unit={id:1,name:'Pixie',count:12,attack:2,defense:2,health:4,speed:8,damageMin:1,damageMax:2,cost:[0,0,0,0,0,0,40]};
const cases=[
 ['recruit',{mode:'recruit',recruitUnit:unit,recruits:[{...unit,level:0}],recruitMaximum:12,recruitAmount:1,previewUnits:[unit]}],
 ['fort',{mode:'fort',fortFamilies:[{level:0,count:12,variants:[{...unit,built:true,rank:0}]}],previewUnits:[]}],
 ['market',{mode:'market',marketQuotes:[[0,1,1,1]]}],
 ['tavern',{mode:'dialog',dialogKind:'tavern',tavern:{cost:2500,canRecruit:true,rumor:'Rumor'},tavernHeroes:{0:{id:31,name:'Melodia',className:'Druid',level:1},1:{id:32,name:'Ryland',className:'Ranger',level:1}}}],
 ['forge',{mode:'dialog',dialogKind:'blacksmith',blacksmith:{cost:2500,unit:{...unit,name:'Ballista'},canBuy:true,alreadyOwned:false}}],
 ['guild',{mode:'mage-guild',mageGuild:{town:1,levels:5,built:1,spells:[]}}],
 ['town',{mode:'town',buildings:[]}],
 ['hero',{mode:'hero',heroWindow:{id:1,name:'Hero',owned:true,primarySkills:[1,2,3,4],slots:Array.from({length:19},(_,slot)=>({slot}))}}]
];
const results=[];
for(const [engineName,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});
 try{
 const page=await browser.newPage({hasTouch:true,serviceWorkers:'block'}),errors=[];page.on('pageerror',error=>errors.push(error.message));await silenceTestAudio(page);
 await page.route('**/web/**',route=>{const file=path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?route.fulfill({path:file}):route.abort();});
 await page.route('**/mithril.png',route=>route.fulfill({path:path.resolve('mod/wake-of-gods/Mods/mithril/content/sprites/mithril/small.png')}));
 await page.route('**/purchase-resources',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><link rel=stylesheet href=/web/marketplace.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...args){calls.push(args)}};</script><script type=module src=/web/mobile.mjs></script>'}));
 await page.goto('http://localhost/purchase-resources');await page.waitForSelector('#mobile-app');
 await page.evaluate(async()=>{const {createUIElement}=await import('/web/ui/material-components.mjs');const button=createUIElement('button');button.id='game-menu-toggle';button.textContent='☰';document.querySelector('.mobile-brand').replaceWith(button);window.goonkAssetURLs=[{path:'Mods/wake-of-gods/Mods/mithril/content/sprites/mithril/small.png',url:'/mithril.png'}];window.base={turn:true,day:1,townName:'Castle',heroName:'Hero',resources:[9999,9999,9999,9999,9999,9999,9999999,9999],resourceTypes:[...Array.from({length:7},(_,id)=>({id})),{id:7,key:'mithril',name:'Mithril',scope:'wake-of-gods.mithril',icon:'mithril/small.png'}]};window.send=state=>{window.model={...base,...state};dispatchEvent(new CustomEvent('goonk-state',{detail:structuredClone(model)}));};});
 async function check(name,viewport,language,{clone=false}={}){
  await page.waitForTimeout(90);
  const selector=clone?'.ui-purchase-resources':'.mobile-resources';const strip=page.locator(selector).filter({visible:true}).first();assert(await strip.isVisible(),`${name}: resources visible without a popup`);
  assert.equal(await page.locator('.ui-kingdom-trigger:visible').count(),0,`${name}: no Resources button while buying`);
  assert.equal(await strip.locator('[role=listitem]').count(),8,`${name}: all eight registry resources`);
  await strip.locator('img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
  assert.equal(await strip.locator('img:visible').count(),8,`${name}: all eight preloaded icons`);
  const amounts=await strip.locator('.resource-quantity').allTextContents();assert.equal(amounts[6],'9\u202f999\u202f999','Gold remains complete');
  const labels=await strip.locator('[role=listitem]').evaluateAll(items=>items.map(item=>item.getAttribute('aria-label')));assert(labels.every((label,index)=>label.replace(/[^0-9]/g,'')===(index===6?'9999999':'9999')),'Exact quantities in accessible resource labels');
  if(['recruit','build'].includes(name))await page.screenshot({path:`/tmp/purchase-resources-${engineName}-${language}-${viewport.width}-${name}.png`});
  const geometry=await strip.evaluate(strip=>{const nodes=[...strip.querySelectorAll('.resource-quantity,img')],rect=strip.getBoundingClientRect();return{rect:rect.toJSON(),nodes:nodes.map(node=>{const box=node.getBoundingClientRect();return{quantity:node.classList.contains('resource-quantity'),x:box.x,y:box.y,right:box.right,bottom:box.bottom,width:box.width,needed:node.scrollWidth};})};});
  for(const node of geometry.nodes){assert(node.x>=-1&&node.right<=viewport.width+1&&node.y>=-1&&node.bottom<=viewport.height+1,`${name} ${language} ${viewport.width}: resource outside viewport ${JSON.stringify(node)}`);assert(node.needed<=node.width+1,`${name}: quantity clipped ${JSON.stringify(node)}`);}
  const intersects=(a,b)=>a.x<b.right-1&&b.x<a.right-1&&a.y<b.bottom-1&&b.y<a.bottom-1;
  const quantities=geometry.nodes.filter(node=>node.quantity);
  for(let i=0;i<quantities.length;i++)for(let j=i+1;j<quantities.length;j++)assert(!intersects(quantities[i],quantities[j]),`${name} ${language} ${viewport.width}: resource quantities overlap ${JSON.stringify({a:quantities[i],b:quantities[j]})}`);
  const headerObstructions=await strip.evaluate(strip=>[...strip.parentElement.querySelectorAll(':scope>h2,:scope>button')].filter(node=>node.checkVisibility()).map(node=>({text:node.textContent,rect:node.getBoundingClientRect().toJSON()})));
  for(const obstruction of headerObstructions)for(const resource of geometry.nodes)assert(!intersects(resource,obstruction.rect),`${name} ${language} ${viewport.width}: resource overlaps title/action ${JSON.stringify({obstruction,resource})}`);
  const overlap=await page.evaluate(()=>{const menu=document.querySelector('#game-menu-toggle'),m=menu?.getBoundingClientRect();const menuFront=m&&menu.contains(document.elementFromPoint(m.x+m.width/2,m.y+m.height/2));const intersects=(a,b)=>a&&b&&a.width&&a.height&&b.width&&b.height&&a.x<b.right-1&&b.x<a.right-1&&a.y<b.bottom-1&&b.y<a.bottom-1;return[...document.querySelectorAll('.mobile-sheet:not([hidden]) .sheet-head h2,.creature-view-head h2,.market-header h2,.tavern-header h2,.town-service header h2')].filter(node=>node.checkVisibility()).map(title=>({text:title.textContent,overlap:!!(menuFront&&intersects(m,title.getBoundingClientRect())),closeOverlap:[...title.parentElement.querySelectorAll('button')].filter(button=>button.checkVisibility()).some(button=>intersects(button.getBoundingClientRect(),title.getBoundingClientRect()))}));});assert(overlap.every(item=>!item.overlap&&!item.closeOverlap),`${name}: menu/title overlap ${JSON.stringify(overlap)}`);
  const count=await page.evaluate(()=>calls.length);
  await page.evaluate(async({clone})=>{model.resources=[...model.resources];model.resources[6]-=2500;model.resources[7]-=7;if(clone){const {renderResources}=await import('/web/resources.mjs');const {useKingdomChrome}=await import('/web/ui/material-components.mjs');renderResources(document.querySelector('.mobile-resources'),model.resources,model.resourceTypes);useKingdomChrome(document.querySelector('#mobile-app'));}else dispatchEvent(new CustomEvent('goonk-state',{detail:structuredClone(model)}));},{clone});
  await page.waitForTimeout(50);assert.equal((await strip.locator('.resource-quantity').allTextContents())[6],'9\u202f997\u202f499','Native spending delta updates visible gold');assert.match(await strip.locator('[data-resource=mithril]').getAttribute('aria-label'),/9\D?992/);assert.equal(await page.evaluate(()=>calls.length),count,'Resource updates issue no purchase command');
  results.push({engineName,language,viewport,name,clone,visibleResources:8,geometry});
 }
 for(const language of ['fr','en'])for(const viewport of [{width:320,height:568},{width:360,height:659},{width:716,height:279},{width:568,height:320}]){
  await page.setViewportSize(viewport);await page.evaluate(async language=>(await import('/web/i18n.mjs')).setLanguage(language),language);
  for(const [name,state] of cases){await page.evaluate(state=>send(state),state);await check(name,viewport,language);}
  await page.evaluate(async()=>{
   send({mode:'town',armyTownId:1,townFaction:'core:castle',buildings:[{id:1,key:'core:townHall',name:'Town Hall',description:'Income',built:false,allowed:true,state:7,cost:[5,0,5,0,0,0,2500],missingPrerequisites:[]}]});
   const {createTownBuildingMenu}=await import('/web/town-building-menu.mjs');const {renderMarkup,useKingdomChrome}=await import('/web/ui/material-components.mjs');const root=document.querySelector('#mobile-app'),sheet=root.querySelector('.mobile-sheet');sheet.hidden=false;root.dataset.sheet='build';renderMarkup(sheet,'<header class="sheet-head"><h2>Town buildings</h2><button data-ui="close-sheet">✕</button></header><div class="sheet-body"></div><footer class="sheet-footer"><button data-ui="sheet-back">Back</button></footer>');
   window.buildController=createTownBuildingMenu({body:sheet.querySelector('.sheet-body'),getState:()=>model,asset:()=>'',backButton:sheet.querySelector('[data-ui=sheet-back]'),canOpen:()=>true,openSheet:()=>{},closeSheet:()=>{},command:(...args)=>calls.push(args),notify:()=>{}});await buildController.open();useKingdomChrome(root);
  });
  await check('build',viewport,language,{clone:true});
  await page.evaluate(()=>{buildController.cancel(true);document.querySelector('.mobile-sheet').hidden=true;delete document.querySelector('#mobile-app').dataset.sheet;});
 }
 assert.deepEqual(errors,[]);console.log('PASS',engineName,'purchase resource visibility, all eight icons, exact gold, native deltas, no purchase commands FR/EN portrait/landscape');
 }finally{await browser.close();}
}
fs.writeFileSync('/tmp/purchase-resources-e2e.json',JSON.stringify(results,null,2));
