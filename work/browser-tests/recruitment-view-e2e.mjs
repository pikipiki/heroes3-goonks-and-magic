import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {silenceTestAudio} from './silent-audio.mjs';
const baseUnit={id:1,key:'goonk:picpique',name:'Picpique, Crystal Lancer',count:12,attack:14,defense:13,damageMin:7,damageMax:12,health:45,speed:8,cost:[0,0,0,0,0,1,3000,0],description:'A crystal spear also strikes the unit behind the target. Enemies cannot retaliate.',nativeFlags:{flying:false}};
const variants=['Picpique','Picpique, Lance Paladin','Picpique, Crystal Lancer','Picpique, Ancestral Crystal Spear Emperor'].map((name,i)=>({...baseUnit,id:i+1,name,upgradeRank:i+1,preview:{x:100*i,y:0,w:80,h:80}}));
const base={mode:'recruit',turn:true,day:8,resources:[9999,9999,9999,9999,9999,9999,9999999,9999],recruitUnit:variants[2],recruitAmount:1,recruitMaximum:12,previewUnits:variants,armies:[]};
for(const [kind,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
  const page=await browser.newPage({viewport:{width:360,height:659},hasTouch:true}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await silenceTestAudio(page);
  await page.route('**/web/**',r=>{const file=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?r.fulfill({path:file}):r.abort();});
  await page.route('**/recruit-prototype?mobile=1',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];window.pointerCalls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...a){calls.push(a)},_vcmiMobilePointer(...a){pointerCalls.push(a)}};</script><script type=module src=/web/mobile.mjs></script>'}));
  await page.goto('http://localhost/recruit-prototype?mobile=1');await page.waitForSelector('#mobile-app');
  await page.evaluate(()=>{const menu=document.createElement('button');menu.id='game-menu-toggle';menu.textContent='☰';document.querySelector('.mobile-brand').replaceWith(menu);});
  const send=state=>page.evaluate(s=>dispatchEvent(new CustomEvent('goonk-state',{detail:s})),state);
  const rect=selector=>page.locator(selector).boundingBox();
  const report=[];
  for(const size of [{width:360,height:659},{width:320,height:568},{width:430,height:873},{width:716,height:279},{width:844,height:390},{width:1024,height:768}]){
   await page.setViewportSize(size);await send(base);await page.waitForTimeout(250);
   const panel=page.locator('.recruitment-view');await panel.waitFor();
   assert.equal(await page.locator('[data-presentation-close]').count(),0);assert.equal(await page.locator('[data-ui=creature-info]').count(),0);
   assert.equal(await page.locator('[data-variant]').count(),4);
   const buttons=await page.locator('[data-variant]').evaluateAll(nodes=>nodes.map(e=>({rect:e.getBoundingClientRect().toJSON(),client:e.clientHeight,scroll:e.scrollHeight,text:e.textContent})));
   for(const b of buttons){assert(b.rect.width>=44&&b.rect.height>=44,'Evolution remains touchable '+JSON.stringify({size,b}));assert(b.rect.x>=0&&b.rect.right<=size.width+1,'Evolution text has a full-width column '+JSON.stringify({size,b}));assert(b.scroll<=b.client+2,'Full evolution name fits '+JSON.stringify({size,b}));}
   const art=await rect('.creature-stage'),description=await rect('.recruit-description'),facts=await rect('.creature-facts'),choices=await rect('.recruit-variants'),quantity=await rect('.mobile-recruit-amount'),nav=await rect('.mobile-nav');
   if(size.width<size.height){assert(Math.abs(art.height-choices.height)<1,'Animation spans the evolution grid height');assert(choices.x>=art.x+art.width,'Evolution grid beside animation');assert(facts.y>=art.y+art.height-1,'Stats below animation');}
   else{assert(Math.abs(art.width-description.width)<1,'Animation and description columns have equal width');assert(choices.x<art.x&&description.x>=art.x+art.width,'Evolution rail, animation, description reading order');}
   for(const key of ['gems','gold'])assert.equal(await page.locator('[data-total-resource='+key+'] img').count(),1,'Total uses preloaded resource artwork');
   const total=await rect('.recruit-summary');assert(total.y+total.height<=nav.y,'Entire icon total above actions '+JSON.stringify({size,total,nav}));
   if(size.width>size.height)assert(await page.locator('.recruitment-sidebar').evaluate(e=>e.scrollHeight<=e.clientHeight+1),'Only the contextual panel scrolls; quantity remains fixed '+JSON.stringify(size));
   assert(quantity.y+quantity.height<=nav.y+1,'Quantity sits above fixed action buttons '+JSON.stringify({size,quantity,nav}));
   for(const selector of ['[data-ui=confirm-recruit]','[data-ui=max-recruit]','.mobile-nav [data-ui=cancel-recruit]']){const box=await rect(selector);assert(box.width>=44&&box.height>=44&&box.y>=0&&box.y+box.height<=size.height+1,'Fixed action visible '+JSON.stringify({size,selector,box}));}
   if(size.width>size.height&&size.height<400){await page.locator('.ui-kingdom-trigger').tap({timeout:3000});await page.screenshot({path:'/tmp/mui-recruit-popup.png'});assert(await page.locator('.calendar-recruit-cue').isVisible(),JSON.stringify(await page.locator('.mobile-calendar').evaluate(node=>({html:node.outerHTML,style:getComputedStyle(node).display,cue:node.querySelector('.calendar-recruit-cue').getBoundingClientRect().toJSON(),ancestors:[node,node.parentElement,node.parentElement.parentElement,node.parentElement.parentElement.parentElement].map(n=>({class:n.className,display:getComputedStyle(n).display,visibility:getComputedStyle(n).visibility,rect:n.getBoundingClientRect().toJSON()})),parent:node.parentElement.outerHTML.slice(0,2000)}))));assert(await page.locator('.mobile-resources').isVisible());await page.keyboard.press('Escape');}else assert(await page.locator('.calendar-recruit-cue').isVisible());assert(await page.locator('.calendar-next-week').isHidden());
   await page.evaluate(()=>window.previewBefore=document.querySelector('[data-preview-creature]'));
   await send({...base,recruitUnit:variants[3]});await page.waitForTimeout(150);
   assert.deepEqual(await rect('.creature-stage'),art,'Longest evolution name cannot shift the animation');
   assert.deepEqual(await rect('.mobile-recruit-amount'),quantity,'Longest name cannot move quantity');
   assert(await page.evaluate(()=>previewBefore===document.querySelector('[data-preview-creature]')),'Long name selection retains the animation');
   assert(await page.locator('.creature-view-head h2').evaluate(e=>getComputedStyle(e).textOverflow!=='ellipsis'&&parseFloat(getComputedStyle(e).fontSize)>=16),'Full selected name remains readable without font shrinking or ellipsis');
   await send(base);await page.waitForTimeout(100);
   await page.evaluate(()=>window.titleNode=document.querySelector('.creature-view-head h2').firstChild);
   await send(base);await page.waitForTimeout(80);
   assert(await page.evaluate(()=>titleNode===document.querySelector('.creature-view-head h2').firstChild),'Repeated native snapshots do not replace translated title text');
   const before={art,choices,nav,quantity};
   await send({...base,recruitUnit:{...base.recruitUnit,description:baseUnit.description.repeat(100)}});await page.waitForTimeout(150);
   assert.deepEqual(await rect('.creature-stage'),before.art,'Long description cannot resize animation');assert.deepEqual(await rect('.recruit-variants'),before.choices,'Evolution cards stay fixed');assert.deepEqual(await rect('.mobile-nav'),before.nav);assert.deepEqual(await rect('.mobile-recruit-amount'),before.quantity);
   assert(await page.locator('.recruit-description').evaluate(e=>e.scrollHeight>e.clientHeight),'Long description scrolls '+JSON.stringify(size));
   await page.locator('.recruit-description').evaluate(e=>e.scrollTop=e.scrollHeight);assert(await page.locator('.recruit-description').evaluate(e=>e.scrollTop>0));
   if(size.width===360||size.width===716)await page.screenshot({path:'/tmp/recruitment-'+kind+'-'+size.width+'.png'});
   report.push({size,art,description,quantity});
  }
  await page.setViewportSize({width:360,height:659});await send(base);await page.waitForTimeout(150);await page.evaluate(()=>calls=[]);await page.locator('[data-ui=max-recruit]').tap();assert((await page.evaluate(()=>calls)).some(c=>c[0]===31&&c[1]===12));await page.locator('.mobile-nav [data-ui=cancel-recruit]').tap();assert((await page.evaluate(()=>calls)).some(c=>c[0]===33));
  await send({...base,mode:'map'});await page.waitForTimeout(450);
  // One shared window also covers map dwellings containing a single dragon.
  for(const count of [1,3]){const choices=variants.slice(0,count);await send({...base,recruitUnit:{...choices[0],name:count===1?'Solitary Dragon':choices[0].name},previewUnits:choices});await page.waitForTimeout(150);assert.equal(await page.locator('[data-variant]').count(),count);if(count===1){assert(await page.locator('.recruit-variants').isHidden());const art=await rect('.creature-stage'),facts=await rect('.creature-facts'),description=await rect('.recruit-description');assert(facts.x>=art.x+art.width&&description.y>=art.y+art.height,'Single dwelling creature has facts beside artwork and description below');await page.setViewportSize({width:716,height:279});await page.waitForTimeout(150);const boxes=await Promise.all(['.creature-stage','.creature-facts','.recruit-description'].map(rect));assert(boxes[1].width<boxes[0].width&&boxes[2].width>boxes[0].width,'Solitary landscape gives a narrower stats column and more width to description');
   await send({...base,recruitUnit:{...choices[0],damageMin:35,damageMax:40},previewUnits:choices});await page.waitForTimeout(100);
   const damage=await page.locator('.creature-stats>div').nth(2).evaluate(e=>{const dt=e.querySelector('dt'),dd=e.querySelector('dd'),r=document.createRange();r.selectNodeContents(dd);return {box:e.getBoundingClientRect().toJSON(),value:dd.getBoundingClientRect().toJSON(),rows:r.getClientRects().length,labelRows:dt.getClientRects().length,align:getComputedStyle(dd).textAlign,font:getComputedStyle(dd).fontSize};});
   assert.equal(damage.rows,1,'35–40 stays on one line');assert.equal(damage.align,'right');assert(Math.abs(damage.box.right-4-damage.value.right)<2,'Damage value aligns with the right inset');await page.setViewportSize({width:360,height:659});}if(count===3){const cards=await page.locator('[data-variant]').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().toJSON()));assert(Math.abs(cards[2].width-(cards[1].right-cards[0].left))<1,'Third portrait evolution fills the entire row');
   await page.evaluate(()=>{window.retained={canvas:document.querySelector('[data-preview-creature]'),choices:document.querySelector('.recruit-variants'),buttons:[...document.querySelectorAll('[data-variant]')],amount:document.querySelector('#recruit-number')};});
   await page.locator('[data-variant="1"]').tap();assert((await page.evaluate(()=>pointerCalls)).length>0,'Evolution tap reaches native selector');
   await send({...base,recruitUnit:choices[1],previewUnits:choices});await page.waitForTimeout(150);
   assert(await page.evaluate(()=>retained.canvas===document.querySelector('[data-preview-creature]')&&retained.choices===document.querySelector('.recruit-variants')&&retained.amount===document.querySelector('#recruit-number')&&retained.buttons.every((b,i)=>b===document.querySelectorAll('[data-variant]')[i])),'Selection keeps animation and controls mounted without a blank frame');
   assert.equal(await page.locator('[data-variant="1"]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('[data-preview-creature]').getAttribute('data-preview-creature'),String(choices[1].id));
  }assert(await page.locator('.mobile-nav [data-ui=cancel-recruit]').isVisible());}
  await page.setViewportSize({width:716,height:279});
  for(const count of [0,1]){await send({...base,recruitUnit:{...base.recruitUnit,count},recruitAmount:0,recruitMaximum:0});await page.waitForTimeout(100);const total=await rect('.recruit-summary'),nav=await rect('.mobile-nav');assert(total.y+total.height<=nav.y,'Unavailable recruitment still shows its complete total and reason '+JSON.stringify({count,total,nav,layout:await page.locator(".recruitment-sidebar").evaluate(e=>({scroll:e.scrollHeight,client:e.clientHeight,html:e.innerHTML,padding:getComputedStyle(e).padding}))}));assert(await page.locator('.recruitment-sidebar').evaluate(e=>e.scrollHeight<=e.clientHeight+1),'Unavailable purchase sidebar fits without scrolling');}
  assert.deepEqual(errors,[]);console.log('PASS',kind,'portrait and landscape, 1/3/4 variants, long descriptions, fixed geometry and recruitment commands');
  fs.writeFileSync('/tmp/recruitment-'+kind+'-validation.json',JSON.stringify(report,null,2));
 }finally{await browser.close();}
}
