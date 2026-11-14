import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const out = process.env.REVIEW_OUTPUT || '/tmp/goonk-options169-layout';
fs.mkdirSync(out, {recursive: true});
const browser = await chromium.launch({headless: true});
const report = {scope: 'Mock bridge UI and actual mobile modules; no native engine behavior claim', cases: []};
try {
  const page = await browser.newPage({viewport: {width: 390, height: 844}, hasTouch: true});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/web/**', route => {
    const file = path.resolve('web', new URL(route.request().url()).pathname.split('/web/')[1]);
    return fs.existsSync(file) ? route.fulfill({path: file}) : route.abort();
  });
  await page.route('**/wog-options-test*', route => route.fulfill({contentType: 'text/html', body: `<!doctype html>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <link rel="stylesheet" href="/web/mobile.css"><link rel="stylesheet" href="/web/h3-theme.css"><link rel="stylesheet" href="/web/mobile-upgrade.css">
    <canvas id="canvas" width="800" height="600"></canvas>
    <script>localStorage.setItem('heroes-goonk.language','fr'); window.calls=[]; Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...args){calls.push(args)}};</script>
    <script type="module" src="/web/mobile.mjs"></script>`}));
  await (await import('./silent-audio.mjs')).silenceTestAudio(page);
  await page.goto('http://127.0.0.1:8860/wog-options-test?mobile=1');
  await page.waitForSelector('#mobile-app');
  await page.evaluate(() => {
    window.testState = {mode: 'lobby', lobbyReady: true, lobbyHumanCount: 1, selectedMap: 'The King and Queen',
      selectedFaction: -1, difficulty: 1, maps: [{index: 0, name: 'The King and Queen', width: 144, height: 144, players: 2, castleChoice: true}],
      players: [], factions: [], wogOptionsEditable: true, wogOptions: [-1, -1, -1, -1, -1, -1]};
    window.sendState = () => dispatchEvent(new CustomEvent('goonk-state', {detail: structuredClone(testState)}));
    sendState();
  });
  await page.locator('.wog-options summary').tap();
  assert.equal(await page.locator('.wog-options fieldset').count(), 6);
  const touch = await page.context().newCDPSession(page);
  for (const [width, height] of [[320,568], [568,320], [390,844], [844,390], [768,1024], [1024,768]]) {
    await page.setViewportSize({width, height});
    await page.waitForFunction(({width, height}) => {
      const box = document.querySelector('.lobby-scroll').getBoundingClientRect();
      return box.right <= width + 1 && box.bottom <= height + 1;
    }, {width, height});
    const scroller = page.locator('.lobby-scroll');
    await scroller.evaluate(node => { node.scrollTop = 0; });
    const scrollBox = await scroller.boundingBox();
    const x = scrollBox.x + scrollBox.width / 2, y = scrollBox.y + scrollBox.height - 24;
    await touch.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x, y}]});
    const distance = Math.min(120, scrollBox.height - 50);
    for (let step = 1; step <= 6; step++) {
      await touch.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x, y: y - distance * step / 6}]});
      await page.waitForTimeout(25);
    }
    await touch.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
    await page.waitForTimeout(150);
    const touchScroll = await scroller.evaluate(node => ({top: node.scrollTop, range: node.scrollHeight - node.clientHeight}));
    assert(touchScroll.range <= 0 || touchScroll.top > 20, 'Real touch swipe scrolls the rules: ' + JSON.stringify({width, height, scrollBox, touchScroll}));
    const target = page.locator('input[data-wog-option="5"][value="0"]').locator('..');
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();
    assert(box.width >= 44 && box.height >= 44, 'Touch targets remain at least44px');
    assert(box.x >= -1 && box.x + box.width <= width + 1 && box.y >= -1 && box.y + box.height <= height + 1, 'Last rule stays reachable');
    const stable = await page.evaluate(() => {
      const form = document.querySelector('.wog-options'), input = form.querySelector('input'), scroll = document.querySelector('.lobby-scroll');
      input.focus({preventScroll: true});
      const top = scroll.scrollTop;
      let mutations = 0;
      const observer = new MutationObserver(records => { mutations += records.filter(record => record.type === 'childList').length; });
      observer.observe(form, {subtree: true, childList: true});
      for (let n = 0; n < 100; n++) sendState();
      return new Promise(resolve => queueMicrotask(() => { observer.disconnect(); resolve({sameInput: form.querySelector('input') === input, focused: document.activeElement === input, sameScroll: scroll.scrollTop === top, open: form.open, mutations}); }));
    });
    assert.deepEqual(stable, {sameInput: true, focused: true, sameScroll: true, open: true, mutations: 0}, 'No remount, focus loss or scroll jump on repeated bridge updates');
    await page.screenshot({path: path.join(out, `wog-options-${width}x${height}.png`)});
    report.cases.push({width, height, target: box, stable, touchScroll});
  }
  const choice = page.locator('input[data-wog-option="3"][value="1"]');
  await choice.locator('..').tap();
  assert.deepEqual((await page.evaluate(() => calls.at(-1))).slice(0, 3), [109, 3, 1]);
  assert(await page.locator('.lobby-footer [data-ui=begin]').isDisabled(), 'Start waits for the native acknowledgement');
  assert(await choice.isDisabled());
  await page.evaluate(() => { testState.wogOptions[3] = 1; sendState(); });
  assert(await choice.isChecked());
  assert(await choice.isEnabled());
  assert(await page.locator('.lobby-footer [data-ui=begin]').isEnabled());
  await page.evaluate(() => { testState.mode = 'load'; sendState(); });
  assert(await page.locator('.wog-options').isHidden(), 'Saved games cannot be reconfigured');
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify({passed: true, ...report, errors}, null, 2));
  console.log('PASS options UI: six viewports, stable DOM/focus/scroll and native acknowledgement');
} finally { await browser.close(); }
