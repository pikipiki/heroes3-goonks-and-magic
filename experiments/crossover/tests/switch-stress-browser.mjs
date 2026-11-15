import {chromium, webkit} from '../../../work/browser-tests/node_modules/playwright-core/index.mjs';
import {silenceTestAudio} from '../../../work/browser-tests/silent-audio.mjs';
import assert from 'node:assert/strict';

const cycles = Number(process.env.SWITCH_CYCLES || 8);
assert(Number.isInteger(cycles) && cycles >= 2 && cycles <= 20);
for (const [name, type] of Object.entries({chromium, webkit}).filter(([name]) => !process.env.CROSSOVER_BROWSER || name === process.env.CROSSOVER_BROWSER)) {
 const browser = await type.launch({headless: true});
 const page = await browser.newPage({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
 await silenceTestAudio(page);
 const errors = [];
 page.on('pageerror', error => {errors.push(error.message); console.log('pageerror', error.message);});
 page.on('crash', () => errors.push('browser page crashed'));
 page.on('console', message => {if (message.type() === 'error' && /abort|trap|assert|refus|horloge|exception|invalid unit|failed to resolve/i.test(message.text())) console.log('browser', message.text());});
 try {
  await page.addInitScript(() => {try {sessionStorage.setItem('heroes-goonk.storage-failed', 'true');} catch {} window.switchMagic = []; window.engineReleases = 0; window.transferResumes = 0; window.switchOnSync = false; addEventListener('goonk-crossover-magic', event => {switchMagic.push(structuredClone(event.detail)); if(switchOnSync && event.detail.ok) {switchOnSync = false; document.querySelector('#crossover-cancel')?.click();}});});
  await page.goto(process.env.CROSSOVER_URL || 'http://127.0.0.1:8784/heroes-starcraft/battle.html');
  await page.waitForFunction(() => window.goonkMobileState?.mode === 'menu', null, {timeout: 120000});
  await page.locator('#crossover-demo').click({timeout: 180000});
  for (let cycle = 0; cycle < cycles; cycle++) {
   await page.locator('#crossover-field').waitFor({state: 'visible', timeout: 60000});
   const sc = await (await page.locator('iframe[data-crossover-engine]').elementHandle()).contentFrame();
   if (cycle === 1 && process.env.STALL_SOUND === '1') await sc.evaluate(() => {openbwCrossover.prepareCreatureSounds = () => new Promise(() => {});});
   await sc.evaluate(() => {const dispose = window.openbwDisposeCrossover; window.openbwDisposeCrossover = () => {parent.engineReleases++; dispose();}; const start = openbwCrossover.start; openbwCrossover.start = () => {if(parent.document.querySelector('#crossover-arena')?.dataset.transferring === 'true') parent.transferResumes++; start();};});
   await sc.evaluate(() => openbwCrossover.start());
   if(process.env.CLICK_ON_SYNC === '1') {
    // Return at the exact native reply, before the periodic sync can resume RTS.
    await page.evaluate(() => {switchOnSync = true;});
   } else {
    await sc.waitForFunction(() => openbwCrossover.frame() >= 193, null, {timeout: 15000});
    // Return with native missiles and AI orders in flight.
    await page.locator('#crossover-cancel').dblclick();
   }
   await page.waitForFunction(() => !document.querySelector('#crossover-arena') && goonkMobileState.mode === 'battle' && goonkMobileState.canAct, null, {timeout: 30000});
   assert.equal(await page.locator('iframe[data-crossover-engine]').count(), 1, 'one prepared engine');
   assert.equal(await page.evaluate(() => engineReleases), cycle + 1, 'previous engine explicitly released');
   await page.locator('[data-ui="battle-view"]').click();
   if(cycle % 2 === 0) {
    const turn = await page.evaluate(() => ({round: goonkMobileState.round, active: goonkMobileState.activeStack}));
    await page.locator('.mobile-nav [data-ui=defend]').click();
    await page.waitForFunction(s => goonkMobileState.canAct && (goonkMobileState.round !== s.round || goonkMobileState.activeStack !== s.active), turn, {timeout: 30000});
   }
   const state = await page.evaluate(() => ({round: goonkMobileState.round, active: goonkMobileState.activeStack, units: goonkMobileState.battleUnits.map(u => ({id: u.stackId, count: u.count, hp: u.currentHealth}))}));
   assert(state.units.some(u => u.count > 0));
   // Exercise both native combat presentations and touch layouts between handovers.
   await page.setViewportSize(cycle % 2 ? {width: 390, height: 844} : {width: 844, height: 390});
   console.log(name, 'cycle', cycle + 1, state.round, state.active, 'magic replies', await page.evaluate(() => switchMagic.length));
   assert.deepEqual(errors, []);
   assert.equal(await page.evaluate(() => transferResumes), 0, 'pending replies cannot resume RTS during transfer');
   if (cycle < cycles - 1) {
    await page.locator('#crossover-realtime').click({timeout: 30000});
   }
  }
  const rejected = await page.evaluate(() => switchMagic.filter(r => !r.ok));
  assert.deepEqual(rejected, [], 'no rejected synchronization');
  await page.screenshot({path: `/private/tmp/switch-stress-${name}.png`});
  console.log(name, cycles, 'running round trips completed');
 } catch (error) {
  console.log(await page.evaluate(() => ({state: goonkMobileState, status: document.querySelector('#crossover-battle-status')?.textContent, magic: switchMagic.slice(-2)})).catch(() => null));
  await page.screenshot({path: `/private/tmp/switch-stress-${name}-failure.png`}).catch(() => {});
  throw error;
 } finally {await browser.close();}
}
