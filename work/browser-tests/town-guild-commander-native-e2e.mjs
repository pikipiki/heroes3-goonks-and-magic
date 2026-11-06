import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';

const browser = await chromium.launch({executablePath: process.env.CHROME_PATH, args: ['--no-sandbox']});
const page = await browser.newPage({viewport: {width: 390, height: 844}, hasTouch: true});
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const wait = (fn, arg) => page.waitForFunction(fn, arg, {timeout: 60000});
const command = (...args) => page.evaluate(values => Module._vcmiMobileCommand(...values, ...Array(6 - values.length).fill(0)), args);
const origin = process.env.GOONK_TEST_ORIGIN || 'http://127.0.0.1:8796';
const accept = page.locator('.mobile-nav [data-ui=accept]');

try {
  await page.goto(origin + '/game.html?mobile=1');
  await wait(() => window.goonkMobileState?.mode === 'menu' && window.goonkSessionRecovery?.phase === 'done');
  await page.locator('[data-action="20"]').tap();
  await wait(() => goonkMobileState.mode === 'lobby' && goonkMobileState.lobbyReady && goonkMobileState.selectedMap === 'Goonks');
  const tower = await page.evaluate(() => goonkMobileState.factions.find(faction => faction.key === 'core:tower'));
  assert(tower);
  await page.locator('[data-setting=mobile-faction-select] .lobby-choice-card').tap();
  await page.locator(`.lobby-picker [data-choice-value="${tower.id}"]`).tap();
  await wait(id => goonkMobileState.selectedFaction === id, tower.id);
  await page.locator('.lobby-footer [data-ui=begin]').tap();
  await wait(() => goonkMobileState.mode === 'map' && goonkMobileState.turn && goonkMobileState.towns?.length);
  await command(5, 0);
  await wait(() => goonkMobileState.mode === 'town');
  await command(29, 4);
  await wait(() => goonkMobileState.buildings?.some(building => building.built && building.key.endsWith(':mageGuild5')));

  const dwelling = await page.evaluate(() => goonkMobileState.buildings.find(building => building.built && building.key.endsWith(':dwellingLvl1')));
  assert(dwelling);
  await command(39, dwelling.id);
  await wait(() => goonkMobileState.mode === 'recruit' && goonkMobileState.previewUnits?.some(unit => unit.id === goonkMobileState.recruitUnit.id && unit.preview?.w));
  const canvas = page.locator('.creature-presentation .creature-stage canvas');
  for (const viewport of [{width: 390, height: 844}, {width: 844, height: 390}]) {
    await page.setViewportSize(viewport);
    await canvas.waitFor();
    const bounds = await canvas.boundingBox();
    assert(bounds.width >= 225 && bounds.height >= 175, JSON.stringify(bounds));
  }
  await page.locator('[data-presentation-close]').tap();
  await wait(() => goonkMobileState.mode === 'town');
  console.log('PASS native animated dwelling in portrait and landscape');

  await page.locator('[data-ui=town-guild]').tap();
  await wait(() => goonkMobileState.mode === 'mage-guild' && goonkMobileState.mageGuild.spells?.length);
  const guild = page.locator('.mobile-mage-guild');
  for (const viewport of [{width: 320, height: 568}, {width: 568, height: 320}, {width: 844, height: 390}]) {
    await page.setViewportSize(viewport);
    const levels = guild.locator('[data-guild-level]');
    assert.equal(await levels.count(), 5);
    for (const tab of await levels.all()) {
      await tab.tap();
      const layout = await guild.evaluate(panel => {
        const bounds = panel.getBoundingClientRect();
        return {height: panel.clientHeight, scrollHeight: panel.scrollHeight, fits: [...panel.querySelectorAll('button')].every(button => {
          const rect = button.getBoundingClientRect();
          return rect.width >= 44 && rect.height >= 44 && rect.bottom <= bounds.bottom + 1;
        })};
      });
      assert(layout.fits && layout.scrollHeight <= layout.height + 1, JSON.stringify(layout));
    }
  }
  await guild.locator('[data-guild-spell]').first().tap();
  await wait(() => goonkMobileState.mode === 'dialog');
  await accept.tap();
  await wait(() => goonkMobileState.mode === 'mage-guild');
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
