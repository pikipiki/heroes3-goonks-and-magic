import { chromium, webkit } from 'playwright-core';
import assert from 'node:assert/strict';

const browser = process.env.GOONK_WEBKIT
 ? await webkit.launch({ executablePath: process.env.WEBKIT_PATH })
 : await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] });
try {
 const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
 page.setDefaultTimeout(60000);
 const errors = [], navigations = [];
 page.on('pageerror', error => errors.push(error.message));
 page.on('crash', () => errors.push('Browser page crashed'));
 page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations.push(frame.url()); });
 const wait = (predicate, value) => page.waitForFunction(predicate, value, { timeout: 90000 });
 const setting = name => page.locator(`[data-setting="${name}"]`);
 const picker = page.locator('.lobby-picker');
 const start = page.locator('.lobby-footer [data-ui=begin]');
 const waitForLobby = () => wait(() => window.goonkMobileState?.mode === 'lobby' && goonkMobileState.lobbyReady &&
  !!document.querySelector('.lobby-footer [data-ui=begin]:enabled'));
 async function chooseCastle(control, id) {
  await setting(control).locator('.lobby-choice-card').tap();
  await picker.locator(`[data-choice-value="${id}"]`).tap();
 }
 await (await import('./silent-audio.mjs')).silenceTestAudio(page);await page.goto((process.env.GOONK_TEST_ORIGIN || 'http://127.0.0.1:8784') + '/game.html?mobile=1');
 await wait(() => window.goonkMobileState?.mode === 'menu' && window.goonkSessionRecovery?.phase === 'done');
 await page.locator('[data-action="20"]').tap();
 await waitForLobby();
 await start.tap();
 await wait(() => goonkMobileState.mode === 'map' && goonkMobileState.turn);
 await wait(() => window.goonkAutosaveStatus?.lastSaved);
 await page.reload();
 await wait(() => window.goonkSessionRecovery?.phase === 'done' && window.goonkMobileState?.mode === 'map');
 await page.evaluate(() => { window.firstGameModule = Module; });
 const baseline = navigations.length;
 const sameSession = async () => {
  assert.equal(navigations.length, baseline, 'The game document must not reload');
  assert(await page.evaluate(() => window.firstGameModule === window.Module), 'The WASM module must be reused');
 };
 await page.locator('#game-menu-toggle').tap();
 await page.locator('[data-menu=new-game]').tap();
 await page.locator('[data-menu=confirm-new-game]').tap();
 await wait(() => goonkMobileState.mode === 'menu');
 for (const selector of ['[data-action="20"]','[data-action="23"]','[data-action="47"]','[data-open-multiplayer]']) {
  await page.locator(selector).waitFor({ state:'visible' });
 }
 await sameSession();
 console.log('PASS after an automatic restore, New game returns to the main menu without reloading');
 await page.locator('[data-action="23"]').tap();
 await wait(() => goonkMobileState.mode === 'load' && goonkMobileState.maps?.some(save => /goonk-auto/i.test(save.file)));
 await page.locator('.lobby-footer [data-ui=back]').tap();
 await page.locator('[data-action="20"]').tap();
 await waitForLobby();
 await sameSession();
 await setting('mobile-faction-select').locator('figure img:visible').first().waitFor();
 await wait(() => [...document.querySelectorAll('[data-setting=mobile-faction-select] figure img')].filter(img => !img.hidden).every(img => img.complete && img.naturalWidth > 0));
 console.log('PASS autosave stays available and a new adventure opens with the same WebAssembly instance');

 const factions = await page.evaluate(() => goonkMobileState.factions);
 assert(factions.length > 2);
 for (const [index, faction] of factions.entries()) {
  if (index === Math.ceil(factions.length / 2)) await page.setViewportSize({ width: 844, height: 390 });
  await chooseCastle('mobile-faction-select', faction.id);
  await wait(id => goonkMobileState.selectedFaction === id, faction.id);
  await sameSession();
 }
 await setting('mobile-faction-select').locator('button').tap();
 await picker.locator('[data-picker-back]').tap();
 assert(await picker.isHidden());
 await setting('mobile-difficulty').locator('[data-tile-value="2"]').tap();
 await wait(() => goonkMobileState.difficulty === 2);

 const selectedMap = await page.evaluate(() => goonkMobileState.selectedMap);
 await setting('mobile-map-select').locator('button').tap();
 const search = picker.getByRole('searchbox');
 await search.fill(selectedMap);
 await picker.locator('[data-choice-value]:visible').first().waitFor();
 await picker.locator('[data-picker-back]').tap();
 await waitForLobby();
 console.log('PASS', factions.length, 'castle choices, difficulty, map search, back and both orientations');

 const randomMap = page.locator('.custom-game-options');
 if (await randomMap.getAttribute('open') === null) await randomMap.locator('summary').tap();
 await setting('players').locator('[data-counter="1"]').tap();
 await setting('size').locator('[data-tile-value="72"]').tap();
 await page.locator('[data-custom-underground]').check();
 await page.locator('[data-custom-generate]').tap();
 await wait(() => goonkMobileState.customMap && goonkMobileState.customMapOptions?.players === 3 && goonkMobileState.customMapOptions?.size === 72 && goonkMobileState.customMapOptions?.levels === 2);
 const player = await page.evaluate(() => goonkMobileState.players.find(player => player.color !== 0 && player.factions.some(faction => faction.id !== player.faction)));
 assert(player);
 const faction = player.factions.find(faction => faction.id !== player.faction);
 await chooseCastle(`player-${player.color}`, faction.id);
 await wait(({color,id}) => goonkMobileState.players.some(player => player.color === color && player.faction === id), {color:player.color,id:faction.id});
 await sameSession();
 await start.tap();
 await wait(() => goonkMobileState.mode === 'map' && goonkMobileState.turn);
 await sameSession();
 assert.deepEqual(errors, []);
 console.log('PASS random map controls, opponent castle, second game and no page reloads');
} finally {
 await browser.close();
}
