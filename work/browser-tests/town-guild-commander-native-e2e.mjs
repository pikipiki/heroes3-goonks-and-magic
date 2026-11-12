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
const accept = page.locator('.mobile-nav [data-ui=accept]');

try {
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
  await page.locator('[data-ui=town-guild]').tap();
  await wait(() => goonkMobileState.mode === 'mage-guild');
  const guild = page.locator('.mobile-mage-guild');
  const sealed = guild.locator('[data-guild-level="5"][data-floor-status=sealed]');
  await sealed.tap();
  assert.match(await guild.locator('.mage-guild-empty').textContent(), /discover its spells/);
  await guild.locator('[data-guild-close]').tap();
  await wait(() => goonkMobileState.mode === 'town');
  await command(29, 4);
  await wait(() => goonkMobileState.buildings?.some(building => building.built && building.key.endsWith(':mageGuild5')));

  const dwelling = await page.evaluate(() => goonkMobileState.buildings.find(building => building.built && building.key.endsWith(':dwellingLvl1')));
  assert(dwelling);
  await command(39, dwelling.id);
  await wait(() => goonkMobileState.mode === 'recruit' && goonkMobileState.previewUnits?.some(unit => unit.id === goonkMobileState.recruitUnit.id && unit.preview?.w));
  const canvas = page.locator('.creature-presentation .creature-stage canvas');
  const shooter = await page.evaluate(() => goonkMobileState.previewUnits.findIndex(unit => unit.shooter));
  assert(shooter >= 0, 'A ranged variant is available');
  await page.locator(`[data-variant="${shooter}"]`).tap();
  await wait(() => goonkMobileState.recruitUnit?.shooter === true);
  for (const viewport of [{width: 390, height: 844}, {width: 844, height: 390}, {width: 568, height: 320}]) {
    await page.setViewportSize(viewport);
    await canvas.waitFor();
    const bounds = await canvas.boundingBox();
    assert(bounds.width >= 220 && bounds.height >= 110, JSON.stringify(bounds));
    const stats = await page.locator('.creature-details').evaluate(details => {
      const bounds = details.closest('.creature-presentation').getBoundingClientRect();
      const controls = details.closest('.creature-presentation').querySelector('.mobile-recruit-amount').getBoundingClientRect();
      const price = details.querySelector('.featured-price').getBoundingClientRect();
      return {fits: price.bottom <= Math.min(bounds.bottom, controls.top) + 1,
        scrolls: details.scrollHeight > details.clientHeight + 1, overflow: getComputedStyle(details).overflowY};
    });
    assert(stats.fits && !stats.scrolls && stats.overflow === 'visible', JSON.stringify(stats));
  }
  await page.locator('[data-presentation-close]').tap();
  await wait(() => goonkMobileState.mode === 'town');
  console.log('PASS native animated dwelling in portrait and landscape');

  await page.locator('[data-ui=town-guild]').tap();
  await wait(() => goonkMobileState.mode === 'mage-guild' && goonkMobileState.mageGuild.spells?.length);
  await page.locator('#mobile-app').evaluate(root => root.style.setProperty('--safe-bottom', '22px'));
  for (const viewport of [{width: 320, height: 568}, {width: 568, height: 320}, {width: 844, height: 390}]) {
    await page.setViewportSize(viewport);
    const levels = guild.locator('[data-guild-level]');
    assert.equal(await levels.count(), 5);
    for (const tab of await levels.all()) {
      await tab.tap();
      const layout = await guild.evaluate(panel => {
        const bounds = panel.getBoundingClientRect();
        return {height: panel.clientHeight, scrollHeight: panel.scrollHeight,
          coversBottom: Math.abs(bounds.bottom - panel.closest('#mobile-app').getBoundingClientRect().bottom) < 1,
          fits: [...panel.querySelectorAll('button')].every(button => {
          const rect = button.getBoundingClientRect();
          return rect.width >= 44 && rect.height >= 44 && rect.bottom <= bounds.bottom + 1;
        })};
      });
      assert(layout.fits && layout.coversBottom && layout.scrollHeight <= layout.height + 1, JSON.stringify(layout));
    }
    const toggle = guild.locator('[data-guild-view]');
    await toggle.tap();
    assert.equal(await levels.count(), 0);
    const scene = page.locator('#mobile-scene');
    assert(await scene.isVisible());
    const size = await scene.boundingBox();
    const {rect, spell} = await page.evaluate(() => ({rect: goonkMobileState.rect, spell: goonkMobileState.mageGuild.spells[0]}));
    const layout = fitRegion(size.width, size.height, rect);
    await scene.tap({position: {x: layout.dx + (spell.x - layout.x) * layout.scale, y: layout.dy + (spell.y - layout.y) * layout.scale}});
    await wait(() => goonkMobileState.mode === 'dialog');
    await accept.tap();
    await wait(() => goonkMobileState.mode === 'mage-guild');
    assert.equal(await levels.count(), 0);
    await toggle.tap();
    assert.equal(await guild.locator('[data-guild-level="5"]').getAttribute('aria-pressed'), 'true');
  }
  const firstScroll = guild.locator('[data-guild-spell]').first();
  const spellName = await firstScroll.locator('span').textContent();
  await firstScroll.tap();
  assert.equal(await guild.locator('.mage-guild-detail h4').textContent(), spellName);
  assert(await guild.locator('.mage-guild-detail p').textContent());
  assert.equal(await page.evaluate(() => goonkMobileState.mode), 'mage-guild');
  assert.equal(await guild.locator('[data-guild-level="5"]').getAttribute('aria-pressed'), 'true');
  await guild.locator('[data-guild-close]').tap();
  await wait(() => goonkMobileState.mode === 'town');
  console.log('PASS five native guild levels fit and spell inspection returns to the same level');

  await page.locator('.mobile-nav [data-ui=back]').tap();
  await wait(() => goonkMobileState.mode === 'map' && goonkMobileState.heroName);
  await command(29, 5);
  await wait(() => goonkMobileState.mode === 'dialog');
  if (await page.evaluate(() => goonkMobileState.dialogKind !== 'commander-level-up')) await accept.tap();
  await wait(() => goonkMobileState.dialogKind === 'commander-level-up');
  assert(await page.locator('.creature-presentation').isHidden());
  assert(await page.locator('#mobile-scene').isVisible());
  await command(43);
  await page.waitForTimeout(350);
  assert.equal(await page.evaluate(() => goonkMobileState.dialogKind), 'commander-level-up');
  await accept.tap();
  await wait(() => goonkMobileState.mode === 'map');
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => goonkMobileState.mode), 'map');
  assert.deepEqual(errors, []);
  console.log('PASS native dwelling, five guild levels, spell inspection and commander confirmation');
} catch (error) {
  console.error(await page.evaluate(() => {
    const {mode, dialogKind, selectedMap, selectedFaction, townName, heroName} = window.goonkMobileState || {};
    return {mode, dialogKind, selectedMap, selectedFaction, townName, heroName};
  }));
  throw error;
} finally {
  await browser.close();
}
