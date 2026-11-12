import {chromium, webkit} from 'playwright-core';
import assert from 'node:assert/strict';

const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:8784';
const state = {
  mode: 'dialog', dialogKind: 'tavern', turn: false,
  rect: {x: 203, y: 48, w: 395, h: 504},
  dialogCloseRect: {x: 513, y: 476, w: 64, h: 32},
  tavern: {cost: 2500, canRecruit: true, rumor: 'A rumor from the barkeep.'},
  tavernHeroes: {
    0: {id: 31, name: 'Melodia', className: 'Druid', level: 1, rect: {x: 250, y: 380, w: 58, h: 64}},
    1: {id: 32, name: 'Ryland', className: 'Ranger', level: 1, rect: {x: 335, y: 380, w: 58, h: 64}},
  },
};
const sizes = [[390, 844], [844, 390], [320, 568], [568, 320]];
for (const [kind, engine, executablePath] of [
  ['chromium', chromium, process.env.CHROME_PATH],
  ['webkit', webkit, process.env.WEBKIT_PATH],
]) {
  const browser = await engine.launch({executablePath});
  try {
    const page = await browser.newPage({viewport: {width: 390, height: 844}, hasTouch: true});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/tavern-touch-test?mobile=1', route => route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
        <link rel="stylesheet" href="/web/mobile.css"><link rel="stylesheet" href="/web/h3-theme.css">
        <canvas id="canvas" width="800" height="600"></canvas>
        <script>window.calls=[];window.Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...args){calls.push(args)}};
        window.goonkAssetsReady=Promise.resolve();window.goonkAssetURLs=[];</script>
        <script type="module" src="/web/mobile.mjs"></script>`,
    }));
    await (await import('./silent-audio.mjs')).silenceTestAudio(page);await page.goto(origin + '/tavern-touch-test?mobile=1');
    await page.waitForSelector('#mobile-app');
    const publish = detail => page.evaluate(detail => dispatchEvent(new CustomEvent('goonk-state', {detail})), detail);
    const panel = page.locator('.mobile-tavern');
    const equipment = panel.locator('[data-tavern-equipment="1"]');
    const recruit = panel.locator('[data-tavern-recruit="1"]');
    const close = panel.locator('[data-tavern-close]');
    await publish(state);
    assert.equal(await panel.locator('h3').allTextContents().then(names => names.join(', ')), 'Melodia, Ryland');
    assert(await panel.getByRole('status').isVisible());
    assert(await recruit.isDisabled());
    await publish({...state, turn: true});
    for (const [width, height] of sizes) {
      await page.setViewportSize({width, height});
      await page.waitForFunction(([w, h]) => {
        const close = document.querySelector('[data-tavern-close]').getBoundingClientRect();
        return close.right <= w && close.bottom <= h && innerWidth === w && innerHeight === h;
      }, [width, height]);
      for (const target of [close, ...await panel.locator('.tavern-actions button').all()]) {
        const {x, y, width: w, height: h} = await target.boundingBox();
        assert(w >= 44 && h >= 44 && x >= 0 && y >= 0 && x + w <= width && y + h <= height, JSON.stringify({width, height, x, y, w, h}));
      }
      assert(await page.locator('#mobile-app .scene-tools').isHidden());
    }
    await recruit.tap();
    assert.deepEqual(await page.evaluate(() => calls.at(-1)), [86, 1, 32, 0, 0, 0]);
    await publish(state);
    assert(await recruit.isDisabled());
    await equipment.tap();
    assert.deepEqual(await page.evaluate(() => calls.at(-1)), [72, 1, 0, 0, 0, 0]);
    await close.tap();
    assert.deepEqual(await page.evaluate(() => calls.at(-1)), [40, 0, 0, 0, 0, 0]);
    await publish({mode: 'town'});
    await panel.waitFor({state: 'hidden'});
    assert.deepEqual(errors, []);
    console.log('PASS', kind, sizes);
  } finally {
    await browser.close();
  }
}
