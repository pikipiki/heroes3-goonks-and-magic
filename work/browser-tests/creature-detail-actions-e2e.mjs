import{chromium,webkit}from'playwright-core';import assert from'node:assert/strict';import fs from'node:fs';import path from'node:path';import{silenceTestAudio}from'./silent-audio.mjs';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-creature-detail-actions',baseline=process.env.CREATURE_ACTIONS_BASELINE==='1';fs.mkdirSync(out,{recursive:true});
for(const[name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});let page;try{
  page=await browser.newPage({hasTouch:true,serviceWorkers:'block'});const errors=[];page.on('pageerror',e=>errors.push(e.message));await silenceTestAudio(page);
  await page.route('**/web/**',r=>{const f=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);return fs.existsSync(f)?r.fulfill({path:f}):r.abort();});
  await page.route('**/opfs-worker.js',r=>r.fulfill({contentType:'text/javascript',body:'export const opfsList=async()=>({}),opfsUnlink=async()=>{},opfsFlush=async()=>{};'}));
  await page.route('**/creature-actions?mobile=1',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/game-menu.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...args){calls.push(args)}};</script><script type=module src=/web/mobile.mjs></script><script type=module src=/web/game-menu.mjs></script>'}));
  await page.goto('http://localhost/creature-actions?mobile=1');await page.waitForSelector('#game-menu-toggle');await page.evaluate(()=>window.send=()=>dispatchEvent(new CustomEvent('goonk-state',{detail:structuredClone(model)})));
  for(const language of['fr','en'])for(const viewport of[{width:320,height:568},{width:390,height:844},{width:716,height:279},{width:568,height:320},{width:844,height:390}]){
   await page.setViewportSize(viewport);await page.evaluate(async language=>{(await import('/web/i18n.mjs')).setLanguage(language);window.unit={id:0,name:language==='fr'?'Élémentaire de l’Air':'Air Elemental',count:12,attack:9,defense:9,health:25,speed:7,damageMin:2,damageMax:8,cost:[0,0,0,0,0,0,250],nativeFlags:{flying:true},abilities:['Special ability. '.repeat(10)],description:'A complete creature description. '.repeat(20)};window.model={mode:'creature',turn:true,resources:[999,999,999,999,999,999,999999],creatureUnit:unit,previewUnits:[unit],creatureUpgrades:[]};send();},language);await page.waitForTimeout(250);
   const baseArt=await page.locator('.creature-stage').boundingBox();
   for(const count of[1,3]){
    await page.evaluate(({count,language})=>{model.creatureUpgrades=Array.from({length:count},(_,i)=>({...unit,id:i+1,name:(language==='fr'?'Élémentaire amélioré ':'Upgraded elemental ')+(i+1),cost:[i?5:0,0,0,0,0,0,3000+i*100],affordable:i!==2}));calls.length=0;send();},{count,language});await page.waitForTimeout(100);
    const panel=page.locator('.creature-presentation.MuiDialog-paper');assert(await panel.isVisible(),'Detail uses the actual shared MUI Dialog');assert.equal(await panel.locator('[data-upgrade]').count(),count,'All native choices remain in both orientations');
    if(language==='fr'&&[390,716].includes(viewport.width))await page.screenshot({path:path.join(out,`${name}-${viewport.width}-${count}.png`)});
    if(!baseline){
     const art=await page.locator('.creature-stage').boundingBox();if(viewport.width>viewport.height)assert(Math.abs(art.width-baseArt.width)<2&&Math.abs(art.height-baseArt.height)<2,'Actions preserve the full native animation area');
     for(const button of await panel.locator('[data-upgrade]').all()){
      await button.scrollIntoViewIfNeeded();const b=await button.boundingBox();assert(b&&b.width>=48&&b.height>=48&&b.x>=0&&b.y>=0&&b.x+b.width<=viewport.width+1&&b.y+b.height<=viewport.height+1,'Every action is reachable inside the viewport '+JSON.stringify({name,language,viewport,count,b}));
      if(await button.isEnabled())assert(await button.evaluate(n=>{const r=n.getBoundingClientRect();return n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'Action is not covered by stats, title or resources');
      assert(await button.evaluate(n=>n.classList.contains('MuiButton-root')),'Actions are actual MUI Buttons');
     }
     const button=panel.locator('[data-upgrade="1"]');await button.scrollIntoViewIfNeeded();await page.evaluate(()=>calls.length=0);await button.click();assert.deepEqual((await page.evaluate(()=>calls)).map(c=>c.slice(0,2)),[[59,1]],'One native upgrade command');assert(await button.isDisabled(),'Pending upgrade prevents duplicate presses');
     await page.evaluate(()=>{model.creatureUpgrades[0].affordable=false;send();});assert(await panel.locator('[data-upgrade="1"]').isDisabled(),'Native unaffordable acknowledgement remains disabled');
    }
   }
   await page.evaluate(()=>{model.creatureUpgrades=[];model.creatureUnit={...unit,inCombat:true,currentHealth:20,remainingRetaliations:1};send();});assert.equal(await page.locator('[data-upgrade]').count(),0,'Read-only combat details invent no unavailable actions');
  }
  assert.deepEqual(errors,[]);console.log('PASS',name,baseline?'baseline captures':'native creature action parity, hit targets, unchanged artwork and command guards FR/EN portrait/landscape');
 }catch(error){if(page)await page.screenshot({path:path.join(out,name+'-failure.png')}).catch(()=>{});throw error;}finally{await browser.close();}
}
