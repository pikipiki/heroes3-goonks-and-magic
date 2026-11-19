import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
const origin=process.env.HEROES_KIT_URL||'http://127.0.0.1:8942';
fs.mkdirSync('/tmp/heroes-kit-review',{recursive:true});
for(const [engineName,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage();await silenceTestAudio(page);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/design-system.html');
  const actions=page.locator('.ds-section').first(),secondary=actions.getByRole('button',{name:'Retour',exact:true});
  const normalBox=await secondary.boundingBox();
  await secondary.hover();
  await page.waitForFunction(()=>getComputedStyle([...document.querySelectorAll('.ds-section button')].find(e=>e.textContent==='Retour')).boxShadow!=='none');
  const finish=await secondary.evaluate(e=>{const s=getComputedStyle(e);return {shadow:s.boxShadow,border:s.borderImageSource,background:s.backgroundImage,duration:s.transitionDuration};});
  assert.notEqual(finish.shadow,'none');assert(!finish.shadow.includes('inset'),'One thin border without inset bevels');assert.equal(await secondary.evaluate(e=>getComputedStyle(e).borderTopWidth),'1px');assert.equal(await secondary.evaluate(e=>getComputedStyle(e).fontWeight),'400');assert.equal(finish.border,'none');assert(finish.background.includes('stone.png'));assert(finish.duration.split(',').some(n=>parseFloat(n)>0),'Material hover transition preserved');
  const hoverBox=await secondary.boundingBox();assert.deepEqual(hoverBox,normalBox,'hover must not move the layout');
  await page.mouse.down();await secondary.locator('.MuiTouchRipple-ripple').waitFor({state:'attached'});await page.mouse.up();
  await page.locator('.ds-notice').getByRole('button').click();
  await secondary.hover();await actions.screenshot({path:`/tmp/heroes-kit-review/${engineName}-hover-after.png`});
  const accordion=page.getByRole('button',{name:'Capacités de la créature',exact:true});
  await accordion.click();assert.equal(await accordion.getAttribute('aria-expanded'),'true');
  await page.locator('.MuiCollapse-entered').nth(1).waitFor();
  assert.equal(await page.locator('.MuiCollapse-entered').count(),2,'Material accordion expansion preserved');
  const sliderFinish=await page.locator('.MuiSlider-thumb').first().evaluate(e=>({thumb:getComputedStyle(e).backgroundImage,rail:getComputedStyle(e.parentElement.querySelector('.MuiSlider-rail')).boxShadow,track:getComputedStyle(e.parentElement.querySelector('.MuiSlider-track')).backgroundImage}));
  assert(sliderFinish.thumb.includes('gradient'));assert(sliderFinish.track.includes('gradient'));assert.notEqual(sliderFinish.rail,'none');
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await secondary.evaluate(e=>getComputedStyle(e).transitionDuration),'0s');await page.emulateMedia({reducedMotion:'no-preference'});
  await page.getByRole('button',{name:'Écrans',exact:true}).click();
  const review=JSON.parse(fs.readFileSync('docs/ui-audit/component-needs.json','utf8'));
  assert.equal(await page.locator('[data-screen-id]').count(),review.screenCount);
  for(const screen of review.screens){
   await page.locator(`[data-screen-id="${screen.id}"]`).click();
   assert.equal(await page.locator('[data-reviewed-screen]').getAttribute('data-reviewed-screen'),screen.id);
   assert.equal(await page.locator('.ds-review-needs>div').count(),screen.needs.length);
  }
  await page.getByLabel('Rechercher un écran').fill('spellbook');assert.equal(await page.locator('[data-screen-id]').count(),1);
  await page.getByRole('combobox',{name:'Langue',exact:true}).click();await page.getByRole('option',{name:'English',exact:true}).click();
  assert.equal(await page.locator('.ds-review-details h2').textContent(),'Battle');
  await page.getByRole('combobox',{name:'Language',exact:true}).click();await page.getByRole('option',{name:'Français',exact:true}).click();
  await page.getByRole('button',{name:'Composants',exact:true}).click();
  assert.equal(await page.locator('.hk-icon').count(),0,'raised icon feature removed');
  for(const [width,height]of [[320,568],[360,640],[640,360],[568,280],[1280,720]]){
   await page.setViewportSize({width,height});
   for(const language of ['fr','en']){
    await page.getByRole('combobox',{name:language==='fr'?'Langue':'Language'}).or(page.getByRole('combobox',{name:language==='fr'?'Language':'Langue'})).first().click();
    await page.getByRole('option',{name:language==='fr'?'Français':'English',exact:true}).click();
    assert.equal(await page.locator('.hk-root').getAttribute('lang'),language);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'catalogue horizontal overflow');
    await page.getByRole('button',{name:language==='fr'?'Recrutement':'Recruitment',exact:true}).click();
    await page.locator('.ds-portrait svg image').waitFor();
    const structure=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,columns:document.querySelector('.hk-screen').getBoundingClientRect().width,wordBreak:getComputedStyle(document.querySelector('.ds-description')).wordBreak}));
    assert(!structure.overflow,JSON.stringify({engineName,width,height,structure}));assert.equal(structure.wordBreak,'normal');
    const geometry=await page.evaluate(()=>{
     const rect=selector=>document.querySelector(selector).getBoundingClientRect();
     return {statsBottom:rect('.hk-stats').bottom,descriptionTop:rect('.ds-description').top,actionsBottom:rect('.hk-actions').bottom,artClipped:Boolean(document.querySelector('.ds-portrait svg clipPath')),cardOverflow:[...document.querySelectorAll('.ds-evolutions button')].some(n=>n.scrollHeight>n.clientHeight+2)};
    });
    assert(geometry.artClipped);assert(!geometry.cardOverflow,JSON.stringify({engineName,width,height,geometry}));
    if(height>width)assert(geometry.statsBottom<=geometry.descriptionTop+1,JSON.stringify({engineName,width,height,geometry}));
    assert(geometry.actionsBottom<=height+1,'global actions outside viewport');
    await page.locator('.ds-evolutions button').nth(0).click();
    assert.equal(await page.locator('.hk-screen-heading').textContent(),'Picpique');
    assert(await page.locator('.hk-stats').textContent().then(s=>s.includes('4–7')));
    await page.locator('.ds-evolutions button').nth(2).click();
    assert(await page.locator('.hk-stats').textContent().then(s=>s.includes('7–12')));
    await page.getByRole('spinbutton').fill('3');
    assert(await page.locator('.hk-total').textContent().then(s=>s.includes('912')));
    await page.getByRole('button',{name:language==='fr'?'Recruter':'Recruit',exact:true}).click();
    await page.getByRole('dialog').waitFor();
    assert(await page.getByRole('dialog').textContent().then(s=>s.includes('912')));
    await page.getByRole('button',{name:language==='fr'?'Confirmer':'Confirm',exact:true}).click();
    await page.locator('.ds-notice').getByRole('button').click();
    await page.screenshot({path:`/tmp/heroes-kit-review/${engineName}-${width}x${height}-${language}.png`,fullPage:true});
    await page.getByRole('button',{name:language==='fr'?'Retour':'Back',exact:true}).click();
   }
  }
  const broken=await page.locator('img').evaluateAll(async images=>{await Promise.all(images.map(i=>i.decode().catch(()=>null)));return images.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src);});assert.deepEqual(broken,[]);assert.deepEqual(errors,[]);
  console.log('PASS',engineName,'5 viewports × 2 languages, real data, evolution/quantity/confirmation, no horizontal overflow');
 }finally{await browser.close();}
}
