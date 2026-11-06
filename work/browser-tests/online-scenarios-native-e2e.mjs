import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';

// Run against a local game build configured to use a local relay and lobby.
const origin = process.env.GOONK_TEST_ORIGIN || 'http://127.0.0.1:8797';
const browser = await chromium.launch({executablePath: process.env.CHROME_PATH, args: ['--no-sandbox']});
const page = await browser.newPage({viewport: {width: 390, height: 844}, hasTouch: true, isMobile: true});
const wait = (fn, arg) => page.waitForFunction(fn, arg, {timeout: 90000});
const panel = page.locator('.online-lobby');

try {
  await page.addInitScript(() => {
    Object.defineProperty(Clipboard.prototype, 'readText', {value: async () => ' H'.repeat(43)});
    Object.defineProperty(ServiceWorkerRegistration.prototype, 'pushManager', {get() {
      return window.testPushReady ? {subscribe: async () => ({toJSON: () => ({endpoint: 'https://example.invalid/push'})})} : undefined;
    }});
  });
  await page.goto(origin + '/game.html?mobile=1');
  await wait(() => window.goonkMobileState?.mode === 'menu' && window.goonkOnlineConfigured);
  const endpoint = await page.evaluate(() => window.goonkHostedAlerts?.endpoint);
  if (endpoint) {
    const hostCode = 'H'.repeat(43);
    const map = {id: 'Maps/Alternate', name: 'Alternate scenario'};
    const matchId = '4b723f1c-987b-4213-b3bb-df22d36f21b1';
    let submitted, playable = false, revoke = false;
    const simulateHostedSocket = () => page.evaluate(() => {
      const listeners = new Map();
      Module.websocket.on = (event, callback) => listeners.set(event, callback);
      Module._vcmiJoinHostedMatch = () => listeners.get('open')?.();
    });
    await page.route(endpoint, route => {
      const headers = {'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type'};
      if (route.request().method() === 'OPTIONS') return route.fulfill({status: 204, headers});
      assert.equal(route.request().headers().authorization, 'Bearer ' + hostCode);
      if (route.request().method() === 'PUT') {
        assert.equal(route.request().postDataJSON().subscription.endpoint, 'https://example.invalid/push');
        return route.fulfill({status: 204, headers});
      }
      if (route.request().method() === 'POST') {
        submitted = route.request().postDataJSON();
        return route.fulfill({status: 204, headers});
      }
      if (revoke) return route.fulfill({status: 401, headers});
      return route.fulfill({status: 200, headers, json: {matchId, playable,
        ...(!playable ? {scenarioStatus: 'choose', scenarios: [map]} : {})}});
    });
    const entry = page.locator('.mobile-menu [data-action="75"] + [data-open-hosted-match]');
    await entry.tap();
    const seat = page.locator('#game-menu input[data-hosted-seat-code]');
    const {menuAllowed, touchSized} = await seat.evaluate(input => ({
      menuAllowed: input.dispatchEvent(new Event('contextmenu', {bubbles: true, cancelable: true})),
      touchSized: input.offsetHeight >= 48 && parseFloat(getComputedStyle(input).fontSize) >= 16,
    }));
    assert(menuAllowed, 'Seat code allows the native context menu');
    assert(touchSized, 'Seat code uses a touch-sized input and a font that avoids focus zoom');
    await seat.pressSequentially('bad');
    assert.equal(await seat.inputValue(), 'bad');
    const enable = page.getByRole('button', {name: 'Enable on this device', exact: true});
    assert(await enable.isDisabled());
    await page.getByRole('button', {name: 'Paste code', exact: true}).tap();
    await wait(code => document.querySelector('[data-hosted-seat-code]').value === code, hostCode);
    assert(await enable.isEnabled());
    await enable.tap();
    await page.getByText('Notifications are unavailable here.', {exact: false}).waitFor();
    await page.evaluate(() => { window.testPushReady = true; });
    await enable.tap();
    await page.getByText('Alerts enabled for this seat.', {exact: true}).waitFor();
    await seat.fill(hostCode);
    await page.getByRole('button', {name: 'Join match', exact: true}).tap();
    await page.getByLabel('Hosted match scenario').selectOption(map.id);
    await page.getByRole('button', {name: 'Start with this scenario', exact: true}).tap();
    await page.getByText('The server is starting the scenario.', {exact: false}).waitFor();
    assert.deepEqual(submitted, {scenario: map.id});
    await page.setViewportSize({width: 844, height: 390});
    const fitsLandscape = await seat.evaluate(input => {
      const field = input.getBoundingClientRect();
      return field.left >= 0 && field.right <= innerWidth && field.height >= 48;
    });
    assert(fitsLandscape, 'Seat field fits the landscape viewport');
    await page.locator('#game-menu [data-menu=close]').tap();
    await seat.waitFor({state: 'detached'});
    await page.setViewportSize({width: 390, height: 844});
    playable = true;
    await simulateHostedSocket();
    await entry.tap();
    await seat.fill(hostCode);
    await page.getByRole('button', {name: 'Join match', exact: true}).tap();
    await seat.waitFor({state: 'detached'});
    await page.reload();
    const resume = page.getByRole('button', {name: 'Resume match', exact: true});
    await resume.waitFor();
    await simulateHostedSocket();
    assert.equal(await seat.inputValue(), '');
    await resume.tap();
    await seat.waitFor({state: 'detached'});
    revoke = true;
    await entry.tap();
    await resume.tap();
    await page.getByText('This access has expired. Enter your seat code.').waitFor();
    assert(await resume.isHidden());
    await page.locator('#game-menu [data-menu=close]').tap();
  }

  await page.getByRole('button', {name: 'Online', exact: true}).tap();
  await page.locator('.online-login input').fill('ScenarioHost' + String(Date.now()).slice(-6));
  await page.locator('.online-login [type=submit]').tap();
  await panel.locator('[data-room-action=create]').tap();
  await panel.locator('[data-room-action=limit][data-room-id="4"]').tap();
  await panel.locator('[data-room-action=confirm-room]').tap();
  await wait(() => goonkMobileState.onlineHost && goonkMobileState.onlineRoomLimit === 4 && goonkMobileState.onlineScenarios?.length);
  await panel.locator('[data-room-action=scenario]').tap();
  const chosen = await page.evaluate(() => {
    const maps = goonkMobileState.onlineScenarios;
    if (maps.some(map => map.humanSeats < 4)) throw Error('Map has too few human slots');
    return maps.find(map => map.name !== 'Goonks Online');
  });
  assert(chosen, 'At least one alternate map fits the room');
  await panel.getByRole('searchbox').fill(chosen.name);
  await panel.locator(`[data-room-action=choose-scenario][data-room-id="${chosen.index}"]`).tap();
  await wait(index => goonkMobileState.onlineScenarioIndex === index, chosen.index);
  await panel.getByText(chosen.name, {exact: true}).waitFor();
  console.log('PASS hosted entry, code editing, paste, push activation, resume after reload, invalidated access, map submission and four-seat room selection');
} finally {
  await browser.close();
}
