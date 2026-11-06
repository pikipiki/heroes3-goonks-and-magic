import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';

// Run against a local game build configured to use a local relay and lobby.
const origin = process.env.GOONK_TEST_ORIGIN || 'http://127.0.0.1:8797';
const browser = await chromium.launch({executablePath: process.env.CHROME_PATH, args: ['--no-sandbox']});
const page = await browser.newPage({viewport: {width: 390, height: 844}, hasTouch: true});
const wait = (fn, arg) => page.waitForFunction(fn, arg, {timeout: 90000});
const panel = page.locator('.online-lobby');

try {
  await page.goto(origin + '/game.html?mobile=1');
  await wait(() => window.goonkMobileState?.mode === 'menu' && window.goonkOnlineConfigured);
  const endpoint = await page.evaluate(() => window.goonkHostedAlerts?.endpoint);
  if (endpoint) {
    const hostCode = 'H'.repeat(43);
    const map = {id: 'Maps/Alternate', name: 'Alternate scenario'};
    let submitted;
    await page.route(endpoint, route => {
      const headers = {'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type'};
      if (route.request().method() === 'OPTIONS') return route.fulfill({status: 204, headers});
      assert.equal(route.request().headers().authorization, 'Bearer ' + hostCode);
      if (route.request().method() === 'POST') {
        submitted = route.request().postDataJSON();
        return route.fulfill({status: 204, headers});
      }
      return route.fulfill({status: 200, headers, json: {matchId: '4b723f1c-987b-4213-b3bb-df22d36f21b1',
        playable: false, scenarioStatus: 'choose', scenarios: [map]}});
    });
    await page.locator('#game-menu-toggle').tap();
    await page.locator('#game-menu [data-menu=settings]').tap();
    await page.locator('#game-menu input[type=password]').fill(hostCode);
    await page.getByRole('button', {name: 'Join match', exact: true}).tap();
    await page.getByLabel('Hosted match scenario').selectOption(map.id);
    await page.getByRole('button', {name: 'Start with this scenario', exact: true}).tap();
    await page.getByText('The server is starting the scenario.', {exact: false}).waitFor();
    assert.deepEqual(submitted, {scenario: map.id});
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
  console.log('PASS four-seat VCMI room selects an alternate map and hosted form sends the chosen ID');
} finally {
  await browser.close();
}
