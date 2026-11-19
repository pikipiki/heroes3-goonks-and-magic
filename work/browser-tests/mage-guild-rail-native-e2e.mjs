import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {fitRegion} from '../../web/mobile-layout.mjs';

const browser = await chromium.launch({executablePath: process.env.CHROME_PATH, args: ['--no-sandbox']});
const page = await browser.newPage({viewport: {width: 390, height: 844}, hasTouch: true});
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const wait = (fn, arg) => page.waitForFunction(fn, arg, {timeout: 60000});
const command = (...args) => page.evaluate(values => Module._vcmiMobileCommand(...values, ...Array(6 - values.length).fill(0)), args);
const origin = process.env.GOONK_TEST_ORIGIN || 'http://127.0.0.1:8796';
const accept = page.locator('[data-dialog-confirm]:visible');

try {
  await page.route('**/web/**',async route=>{const fs=await import('node:fs');const path=await import('node:path');const file=path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?route.fulfill({path:file}):route.continue();});
  await (await import('./silent-audio.mjs')).silenceTestAudio(page);await page.goto(origin + '/game.html?mobile=1');
  await wait(() => window.goonkMobileState?.mode === 'menu' && window.goonkSessionRecovery?.phase === 'done');
  await page.locator('[data-action="20"]').tap();
  await wait(() => goonkMobileState.mode === 'lobby' && goonkMobileState.lobbyReady && !!document.querySelector('[data-ui=begin]:enabled'));
  const tower = await page.evaluate(() => goonkMobileState.factions.find(faction => faction.key === 'core:tower'));
  assert(tower);
  await page.locator('[data-setting=mobile-faction-select] .lobby-choice-card').tap();
  await page.locator(`.lobby-picker [data-choice-value="${tower.id}"]`).tap();
  await wait(id => goonkMobileState.selectedFaction === id, tower.id);
  await page.locator('.lobby-footer [data-ui=begin]').tap();
  await wait(() => goonkMobileState.mode === 'map' && goonkMobileState.turn && goonkMobileState.towns?.length);
  await command(5, 0);
  await wait(() => goonkMobileState.mode === 'town');
  if (!await page.evaluate(() => goonkMobileState.buildings.some(building => building.built && building.key.endsWith(':mageGuild1')))) {
    await command(8, 0);
    await wait(() => goonkMobileState.buildings.some(building => building.built && building.key.endsWith(':mageGuild1')));
  }
  await page.locator('.mobile-nav .ui-overflow-trigger').tap();
  await page.locator('[data-ui=town-guild]:visible').tap();
  await wait(() => goonkMobileState.mode === 'mage-guild');
  const guild = page.locator('.mobile-mage-guild');

  await guild.locator('[data-guild-level-select]').waitFor({state:'attached'});
  for(const viewport of [{width:360,height:659},{width:716,height:279},{width:844,height:390}]){
   await page.setViewportSize(viewport);
   await guild.locator('[role=combobox]').click();
   await page.getByRole('option').nth(4).click();
   await page.waitForTimeout(100);
   assert.equal(await guild.locator('[data-guild-level-select]').inputValue(),'5');
   assert.match(await guild.locator('.mage-guild-empty').textContent(),/discover|découvrir/);
   const geo=await guild.evaluate(p=>({panel:p.getBoundingClientRect().toJSON(),field:p.querySelector('.mage-guild-level-field').getBoundingClientRect().toJSON(),shelf:p.querySelector('.mage-guild-shelf').getBoundingClientRect().toJSON()}));
   if(viewport.width>viewport.height){assert(geo.field.x>viewport.width/2);assert(geo.shelf.y<=geo.panel.y+12);assert(geo.shelf.bottom>=geo.panel.bottom-12);}
   await page.screenshot({path:'/tmp/mage-native-'+viewport.width+'.png'});
  }
  await guild.locator('[role=combobox]').click();await page.getByRole('option').first().click();
  await guild.locator('[data-guild-spell]').first().waitFor();
  assert.equal(await guild.locator('.mage-guild-shelf-head').count(),0);
  assert.equal(await guild.locator('.mage-guild-title-art').count(),1);
  await page.locator('#mobile-scene').evaluate(n=>window.originalGuildScene=n);
  for(const viewport of [{width:716,height:279},{width:844,height:390},{width:360,height:659}]){
   await page.setViewportSize(viewport);
   await guild.locator('[data-guild-view]').click();
   await page.waitForTimeout(250);
   const b=await page.locator('#mobile-scene').boundingBox();
   const layout=await page.locator('#mobile-scene').evaluate(n=>({same:n===window.originalGuildScene,inside:!!n.closest('.MuiDialog-paper'),hit:document.elementFromPoint(n.getBoundingClientRect().x+n.clientWidth/2,n.getBoundingClientRect().y+n.clientHeight/2)===n}));
   assert(layout.same&&layout.inside&&layout.hit,JSON.stringify(layout));
   if(viewport.width>viewport.height){assert(b.width<viewport.width-170);assert(b.height>=viewport.height-24);}
   const rect=await page.evaluate(()=>goonkMobileState.rect);
   const fitted=fitRegion(b.width,b.height,rect);
   assert(fitted.dx>=-1&&fitted.dy>=-1,'Whole native window fits');
   assert(fitted.w*fitted.scale<=b.width+1&&fitted.h*fitted.scale<=b.height+1);
   await page.screenshot({path:'/tmp/mage-native-classic-'+viewport.width+'.png'});
   const spell=await page.evaluate(()=>goonkMobileState.mageGuild.spells[0]);
   await page.locator('#mobile-scene').tap({position:{x:fitted.dx+(spell.x-fitted.x)*fitted.scale,y:fitted.dy+(spell.y-fitted.y)*fitted.scale}});
   await wait(()=>goonkMobileState.mode==='dialog');
   await accept.tap();await wait(()=>goonkMobileState.mode==='mage-guild');
   await page.waitForTimeout(150);
   assert(await page.locator('#mobile-scene').evaluate(n=>n===window.originalGuildScene&&!!n.closest('.MuiDialog-paper')));
   await guild.locator('[data-guild-view]').click();
   assert(await page.locator('#mobile-scene').evaluate(n=>!n.closest('.mage-guild-native-viewport')));
   await guild.locator('[role=combobox]').waitFor();
  }
  await guild.locator('[data-guild-close]').click();await wait(()=>goonkMobileState.mode==='town');
  assert.deepEqual(errors,[]);console.log('PASS actual native tower guild, sealed level preview, levels MUI, portrait/landscape right rail full height, original building art, classic full native frame + projected spell tap + dialog return at all three sizes, canvas identity preserved, close returns town');
}finally{await browser.close();}
