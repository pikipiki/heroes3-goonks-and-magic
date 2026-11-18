import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
for(const [kind,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});
 try{
 for(const width of [360,430]){
 const p=await browser.newPage({viewport:{width,height:873},hasTouch:true,...(width===360?{userAgent:'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/90.0 Mobile Safari/537.36'}:{})}),errors=[];await silenceTestAudio(p);p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/web/**',r=>{const file=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?r.fulfill({path:file}):r.abort();});
 await p.route('**/opfs-worker.js',r=>r.fulfill({path:path.resolve('work/vcmi-wasm/lib/html5/opfs-worker.js'),contentType:'text/javascript'}));
 await p.route('**/settings',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/game-menu.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>Module={_vcmiMobileEnable(){},_vcmiMobileCommand(){}};</script><script type=module src=/web/mobile.mjs></script><script type=module src=/web/game-menu.mjs></script>'}));
 await p.goto('http://localhost/settings');await p.waitForSelector('#game-menu-toggle');
 await p.evaluate(()=>dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'map',turn:true,day:1,heroName:'Marius',mapSettings:{moveTime:150,enemyMoveTime:150}}})));
 await p.locator('#game-menu-toggle').tap();await p.locator('[data-menu=settings]').tap();
 const single=p.locator('[data-map-one-click]');assert(await single.isChecked(),'Single-click is the default');const option=p.locator('[data-map-two-clicks]');await option.waitFor({state:'visible'});await option.check();assert(await option.isChecked(),'Two-click movement is available on Android and iPhone');
 assert.equal(await single.isChecked(),false);await single.check();assert.equal(await option.isChecked(),false);assert.equal(await p.evaluate(()=>localStorage.getItem('heroes-goonk.map-two-clicks')),'false');await option.check();
 await p.waitForFunction(()=>[...document.querySelectorAll('#game-menu .setting-icon')].length===5&&[...document.querySelectorAll('#game-menu .setting-icon')].every(i=>i.complete&&i.naturalWidth>0&&i.src.startsWith('data:image/')));
 const selects=await p.locator('#game-menu[data-page=settings] .material-select-trigger').evaluateAll(es=>es.map(e=>{const c=getComputedStyle(e);return {appearance:c.appearance,radius:c.borderRadius,font:c.font,border:c.borderTop,padding:c.padding,height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width};}));
 assert.equal(selects.length,3);for(const select of selects){assert.equal(select.radius,'4px');assert(select.height>=48&&select.width>width*.65);assert.equal(select.border,selects[0].border);assert.equal(select.font,selects[0].font);}

 for(const [language,expected] of [['fr',['Réglages','Déplacement en un clic','Déplacement en deux clics','Masquer les déplacements ennemis','Sélection des sorts en un clic','Les textes natifs du jeu utiliseront cette langue à la prochaine ouverture du jeu.']],['en',['Settings','One-click movement','Two-click movement','Hide enemy movement','One-click spell selection','Native game text uses this language the next time you open the game.']]]){
  await p.locator('[data-language] + .material-select-trigger').tap();await p.getByRole('option',{name:language==='fr'?/^(Français|French)$/:/^(English|Anglais)$/}).tap();
  await p.waitForFunction(([title,label])=>document.querySelector('#game-menu-title').textContent===title&&document.querySelector('[data-map-one-click]').closest('label').textContent===label,expected.slice(0,2));
  const text=await p.locator('#game-menu').textContent();for(const phrase of expected)assert(text.includes(phrase),'Complete settings translation: '+phrase);
 }
 const spell=p.locator('[data-spell-one-click]');assert.equal(await spell.isChecked(),false);await spell.check();assert.equal(await p.evaluate(()=>localStorage.getItem('heroes-goonk.spell-one-click')),'true');await spell.uncheck();
 const combat=p.locator('[data-battle-one-click]');assert.equal(await combat.isChecked(),false);await combat.check();assert.equal(await p.evaluate(()=>localStorage.getItem('heroes-goonk.battle-one-click')),'true');await combat.uncheck();
 const body=p.locator('.game-menu-body');await body.evaluate(e=>e.scrollTop=e.scrollHeight);
 await p.locator('[data-menu=close]').tap();await p.locator('#game-menu-toggle').tap();await p.locator('[data-menu=settings]').tap();
 assert.equal(await body.evaluate(e=>e.scrollTop),0,'Settings reopen at the top so the option cannot stay above the clipped scroll position');
 const label=await option.locator('..').boundingBox(),content=await body.boundingBox();assert(label.y>=content.y&&label.y+label.height<=content.y+content.height,'Two-click option is in view on entering settings');
 await p.setViewportSize({width:873,height:width});await p.waitForTimeout(150);
 const rail=await p.locator('#game-menu>header').boundingBox(),list=await body.boundingBox(),back=await p.locator('.game-menu-return').boundingBox();assert(rail.x>=list.x+list.width-1&&back.x>=list.x+list.width-1,'Landscape settings actions are on the right');assert(list.height>=width-35,'Settings list uses the full landscape height');await body.evaluate(e=>e.scrollTop=e.scrollHeight);assert(await body.evaluate(e=>e.scrollTop)>0,'Settings content scrolls vertically');
 await p.setViewportSize({width,height:873});
 await p.screenshot({path:'/tmp/settings-icons-'+kind+'-'+width+'.png'});assert.deepEqual(errors,[]);console.log('PASS',kind,width,'uniform selects, preloaded Heroes III icons and visible two-click option');await p.close();
 }
 }finally{await browser.close();}
}
