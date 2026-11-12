import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
const output=process.env.REVIEW_OUTPUT||'/tmp/goonk-artifact-rebalance-layout';fs.mkdirSync(output,{recursive:true});
const viewports=[[320,568],[390,844],[568,320],[844,390],[768,1024],[1024,768],[1180,820]];
const reports=[];
for(const [kind,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true});try{
  const p=await browser.newPage({hasTouch:true});await silenceTestAudio(p);const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>localStorage.setItem('heroes-goonk.language',sessionStorage.getItem('review-language')||'fr'));
  await p.route('**/web/**',route=>{const file=path.resolve(process.env.GOONK_UI_ROOT||'web',new URL(route.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?route.fulfill({path:file}):route.abort();});
  await p.route('**/rebalance-review?mobile=1',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/game-menu.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.rebalanceCommands=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...a){rebalanceCommands.push(a)}};window.sheet={update:s=>dispatchEvent(new CustomEvent('goonk-state',{detail:s}))};</script><script type=module src=/web/mobile.mjs></script>`}));
  await p.goto('http://localhost/rebalance-review?mobile=1');await p.waitForSelector('#mobile-app');
  const state={mode:'hero',turn:true,armies:[],heroWindow:{id:1,owned:true,name:'Gardien des Goonks',level:20,mana:10,manaLimit:10,skills:[],slots:Array.from({length:19},(_,slot)=>({slot})),backpack:[],primarySkills:[10,20,15,20],canRebalanceSourceArtifacts:true}};
  for(const [width,height]of viewports){
   await p.setViewportSize({width,height});await p.evaluate(s=>sheet.update(s),state);
   const button=p.locator('[data-hero-source-rebalance]');await button.scrollIntoViewIfNeeded();assert.equal(await button.textContent(),'Rééquilibrer');
   const rect=await button.boundingBox();assert(rect.width>=44&&rect.height>=44&&rect.x>=-1&&rect.y>=0&&rect.x+rect.width<=width+1&&rect.y+rect.height<=height+1,JSON.stringify({width,height,rect}));
   const stable=await p.evaluate(async s=>{const panel=document.querySelector('.hero-equipment-page'),button=panel.querySelector('[data-hero-source-rebalance]'),nav=panel.querySelector('.hero-bag-tabs');let removed=0;const before=nav.scrollLeft,observer=new MutationObserver(rs=>removed+=rs.reduce((n,r)=>n+r.removedNodes.length,0));observer.observe(panel,{childList:true,subtree:true});for(let i=0;i<30;i++)sheet.update(s);await new Promise(r=>requestAnimationFrame(r));observer.disconnect();return{same:button===panel.querySelector('[data-hero-source-rebalance]'),removed,scrollDelta:nav.scrollLeft-before};},state);
   assert(stable.same&&stable.removed===0&&Math.abs(stable.scrollDelta)<1);
   const calls=await p.evaluate(()=>rebalanceCommands.filter(c=>c[0]===102).length);await button.tap();assert.equal(await p.evaluate(()=>rebalanceCommands.filter(c=>c[0]===102).length),calls+1);assert.equal(await p.evaluate(()=>rebalanceCommands.filter(c=>c[0]===102).at(-1)[1]),state.heroWindow.id);
   await button.focus();const left=await p.locator('.hero-bag-tabs').evaluate(n=>n.scrollLeft);state.heroWindow.primarySkills[0]++;
   await p.evaluate(s=>sheet.update(s),state);assert(Math.abs(await p.locator('.hero-bag-tabs').evaluate(n=>n.scrollLeft)-left)<1);assert(await button.evaluate(n=>n===document.activeElement));
   await p.screenshot({path:output+'/'+kind+'-'+width+'x'+height+'.png'});reports.push({kind,width,height,rect,identicalUpdates:30,removedNodes:stable.removed,explicitCommand102:true,scrollPreserved:true});
  }
  state.heroWindow.canRebalanceSourceArtifacts=false;await p.evaluate(s=>sheet.update(s),state);assert.equal(await p.locator('[data-hero-source-rebalance]').count(),0);
  state.heroWindow.canRebalanceSourceArtifacts=true;state.turn=false;await p.evaluate(s=>sheet.update(s),state);assert(await p.locator('[data-hero-source-rebalance]').isDisabled());
  state.turn=true;state.heroWindow.picked={name:'Objet transporté'};await p.evaluate(s=>sheet.update(s),state);assert(await p.locator('[data-hero-source-rebalance]').isDisabled());
  delete state.heroWindow.picked;state.heroWindow.owned=false;await p.evaluate(s=>sheet.update(s),state);assert(await p.locator('[data-hero-source-rebalance]').isDisabled());
  state.heroWindow.owned=true;state.heroWindow.name='Balancer';await p.evaluate(()=>sessionStorage.setItem('review-language','en'));await p.reload();await p.waitForSelector('#mobile-app');await p.evaluate(s=>sheet.update(s),state);assert.equal(await p.locator('[data-hero-source-rebalance]').textContent(),'Rebalance');
  assert.deepEqual(errors,[]);console.log('PASS',kind,'seven touch layouts, explicit refresh, stable DOM and eligibility guards');
 }finally{await browser.close();}
}
fs.writeFileSync(output+'/result.json',JSON.stringify({passed:true,reports},null,2));
