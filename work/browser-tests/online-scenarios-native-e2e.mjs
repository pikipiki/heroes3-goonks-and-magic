import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';

// Run against a local game build configured to use a local relay and lobby.
const origin = process.env.GOONK_TEST_ORIGIN || 'http://127.0.0.1:8797';
const browser = await chromium.launch({executablePath: process.env.CHROME_PATH, args: ['--no-sandbox']});
const page = await browser.newPage({viewport: {width: 390, height: 844}, hasTouch: true, isMobile: true});
const wait = (fn, arg) => page.waitForFunction(fn, arg, {timeout: 90000});
const panel = page.locator('.online-lobby');
const multiplayer = page.getByRole('button', {name: 'Multiplayer', exact: true});
const dedicated = page.getByRole('button', {name: 'Dedicated server', exact: true});
const hostDevice = page.getByRole('button', {name: 'Host device', exact: true});
async function openMultiplayer() {
  const heading = page.getByRole('heading', {name: 'Multiplayer', exact: true});
  await multiplayer.or(heading).waitFor();
  if (await multiplayer.isVisible()) await multiplayer.tap();
  await heading.waitFor();
}

try {
  await page.addInitScript(() => {
    Object.defineProperty(Clipboard.prototype, 'writeText', {value: async value => { window.testCopied = value; }});
    Object.defineProperty(ServiceWorkerRegistration.prototype, 'pushManager', {get() {
      return window.testPushReady ? {subscribe: async () => ({toJSON: () => ({endpoint: 'https://example.invalid/push'})})} : undefined;
    }});
  });
  await page.goto(origin + '/game.html?mobile=1');
  await wait(() => window.goonkMobileState?.mode === 'menu' && window.goonkOnlineConfigured);
  const endpoint = await page.evaluate(() => window.goonkHostedAlerts?.endpoint);
  const simulateHostedSocket = () => page.evaluate(() => {
    const listeners = new Map();
    Module.websocket.on = (event, callback) => listeners.set(event, callback);
    Module._vcmiJoinHostedMatch = () => {
      listeners.get('open')?.();
      window.testHostedAttempts = (window.testHostedAttempts || 0) + 1;
      setTimeout(() => {
        if (window.testRejectHosted || window.testHostedFailures > 0) {
          if (window.testHostedFailures > 0) window.testHostedFailures--;
          listeners.get('close')?.();
        } else window.dispatchEvent(new CustomEvent('goonk-state', {detail: {
          ...window.goonkMobileState, sessionState: 6, onlineGame: true,
        }}));
      }, 750);
    };
  });
  if (endpoint) {
    const hostCode = 'H'.repeat(43);
    const map = {id: 'Maps/Alternate', name: 'Alternate scenario'};
    const matchId = '4b723f1c-987b-4213-b3bb-df22d36f21b1';
    let submitted, playable = false, revoke = false, alertsEnabled = false;
    await page.route(url => url.href === endpoint || url.href === endpoint + '?alerts=1', route => {
      const headers = {'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type'};
      if (route.request().method() === 'OPTIONS') return route.fulfill({status: 204, headers});
      assert.equal(route.request().headers().authorization, 'Bearer ' + hostCode);
      if (route.request().method() === 'PUT') {
        assert.equal(route.request().postDataJSON().subscription.endpoint, 'https://example.invalid/push');
        alertsEnabled = true;
        return route.fulfill({status: 204, headers});
      }
      if (route.request().method() === 'DELETE') {
        alertsEnabled = false;
        return route.fulfill({status: 204, headers});
      }
      if (route.request().method() === 'POST') {
        submitted = route.request().postDataJSON();
        return route.fulfill({status: 204, headers});
      }
      if (revoke) return route.fulfill({status: 401, headers});
      if (new URL(route.request().url()).searchParams.has('alerts')) {
        return route.fulfill({status: 200, headers, json: {matchId, alertsEnabled}});
      }
      return route.fulfill({status: 200, headers, json: {matchId, playable,
        ...(!playable ? {scenarioStatus: 'choose', scenarios: [map]} : {})}});
    });
    assert(await multiplayer.isVisible());
    assert(await dedicated.isHidden());
    assert(await hostDevice.isHidden());
    await openMultiplayer();
    await page.setViewportSize({width: 844, height: 390});
    assert(await dedicated.isVisible());
    assert(await hostDevice.isVisible());
    await page.getByRole('button', {name: 'Back', exact: true}).tap();
    await page.setViewportSize({width: 390, height: 844});
    assert(await multiplayer.isVisible());
    await openMultiplayer();
    await dedicated.tap();
    await page.getByRole('heading', {name: 'Multiplayer on a dedicated server', exact: true}).waitFor();
    await page.getByText('The server keeps the match available when the host closes the game.').waitFor();
    const seat = page.locator('#game-menu input[data-hosted-seat-code]');
    const joinExisting = page.getByRole('button', {name: 'Join existing game', exact: true});
    assert(await seat.isHidden());
    await joinExisting.tap();
    assert(await seat.isVisible());
    const {menuAllowed, touchSized} = await seat.evaluate(input => ({
      menuAllowed: input.dispatchEvent(new Event('contextmenu', {bubbles: true, cancelable: true})),
      touchSized: input.offsetHeight >= 48 && parseFloat(getComputedStyle(input).fontSize) >= 16,
    }));
    assert(menuAllowed, 'Seat code allows the native context menu');
    assert(touchSized, 'Seat code uses a touch-sized input and a font that avoids focus zoom');
    await seat.pressSequentially('bad');
    assert.equal(await seat.inputValue(), 'bad');
    assert(await page.getByRole('button', {name: 'Turn alerts', exact: true}).isDisabled());
    const alerts = page.getByRole('switch', {name: 'Turn alerts', exact: true});
    assert.equal(await page.getByRole('button', {name: 'Paste code', exact: true}).count(), 0);
    await seat.fill(hostCode);
    await alerts.waitFor();
    assert.equal(await alerts.getAttribute('aria-checked'), 'false');
    assert(await alerts.getByText('Off', {exact: true}).isVisible());
    await alerts.tap();
    await page.getByText('Notifications are unavailable here.', {exact: false}).waitFor();
    await page.evaluate(() => { window.testPushReady = true; });
    await alerts.tap();
    await page.getByText('Alerts enabled for this seat.', {exact: true}).waitFor();
    assert.equal(await alerts.getAttribute('aria-checked'), 'true');
    assert(await alerts.getByText('On', {exact: true}).isVisible());
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
    await openMultiplayer();
    await dedicated.tap();
    await joinExisting.tap();
    await seat.fill(hostCode);
    const join = page.getByRole('button', {name: 'Join match', exact: true});
    await page.evaluate(() => { window.testRejectHosted = true; });
    await join.tap();
    await page.getByText('Loading the match…', {exact: true}).waitFor();
    assert(await seat.isVisible());
    await page.getByText('The game connection was interrupted. Try again.', {exact: true}).waitFor();
    assert.equal(await seat.inputValue(), hostCode);
    await page.evaluate(() => { window.testRejectHosted = false; });
    await join.tap();
    await seat.waitFor({state: 'detached'});
    await page.reload();
    const resume = page.getByRole('button', {name: 'Resume match', exact: true});
    await resume.waitFor();
    await alerts.waitFor();
    assert.equal(await alerts.getAttribute('aria-checked'), 'true');
    await alerts.tap();
    await page.getByText('Alerts disabled for this seat.', {exact: true}).waitFor();
    assert.equal(await alerts.getAttribute('aria-checked'), 'false');
    await simulateHostedSocket();
    assert.equal(await seat.inputValue(), '');
    await page.evaluate(() => { window.testHostedFailures = 1; });
    await resume.tap();
    await page.getByText('Retrying the connection…', {exact: true}).waitFor();
    await seat.waitFor({state: 'detached'});
    assert.equal(await page.evaluate(() => window.testHostedAttempts), 2);
    revoke = true;
    await openMultiplayer();
    await dedicated.tap();
    await joinExisting.tap();
    await resume.tap();
    await page.getByText('This access has expired. Enter your seat code.').waitFor();
    assert(await resume.isHidden());
    await page.locator('#game-menu [data-menu=close]').tap();
  }

  const poolEndpoint = await page.evaluate(() => window.goonkHostedAlerts?.poolEndpoint);
  if (poolEndpoint) {
    const matchId = '527329c6-19f9-4284-9aa0-dace75c66a32';
    const hostToken = 'HG' + 'R'.repeat(41), guestToken = 'HG' + 'B'.repeat(41);
    const roomCode = 'KMRT';
    const scenarios = [
      {id: 'medium', name: 'Medium map', width: 72, castles: [[{id: 0, name: 'Castle'}], [{id: 3, name: 'Inferno'}]]},
      {id: 'small', name: 'Small map', width: 36, castles: [[{id: 0, name: 'Castle'}, {id: 1, name: 'Rampart'}], [{id: 3, name: 'Inferno'}, {id: 4, name: 'Necropolis'}]]},
    ];
    let request, attempts = 0;
    const reports = [];
    await page.route(new RegExp(new URL(poolEndpoint).origin + '/hosted/matches'), route => {
      const headers = {'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type'};
      if (route.request().method() === 'OPTIONS') return route.fulfill({status: 204, headers});
      assert.equal(route.request().headers().authorization, undefined);
      if (route.request().method() === 'GET') return route.fulfill({status: 200, headers, json: {scenarios}});
      if (new URL(route.request().url()).pathname.endsWith('/claim')) {
        assert.equal(route.request().postDataJSON().code, roomCode);
        return route.fulfill({status: 200, headers, json: {matchId, players: 2, token: guestToken}});
      }
      request = route.request().postDataJSON();
      return route.fulfill({status: 201, headers, json: {matchId, hostToken, roomCode}});
    });
    await page.route(url => url.href === poolEndpoint || url.href.startsWith(poolEndpoint + '?'), route => {
      const headers = {'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization'};
      if (route.request().method() === 'OPTIONS') return route.fulfill({status: 204, headers});
      const params = new URL(route.request().url()).searchParams;
      const preview = params.has('preview');
      const token = route.request().headers().authorization?.slice(7);
      assert([hostToken, guestToken].includes(token));
      if (params.has('alerts')) return route.fulfill({status: 200, headers, json: {matchId, alertsEnabled: false}});
      if (route.request().method() === 'POST') {
        reports.push({attempt: params.get('attempt'), result: params.get('result'), sockets: params.get('sockets')});
        return route.fulfill({status: 204, headers});
      }
      if (!preview && attempts++ === 0) return route.fulfill({status: 503, headers});
      return route.fulfill({status: 200, headers, json: {matchId, players: 2, connectedPlayers: 1,
        playable: token === hostToken, poolStatus: token === hostToken ? 'ready' : 'busy'}});
    });
    await openMultiplayer();
    await dedicated.tap();
    assert.equal(await page.locator('[data-hosted-seat-code]').inputValue(), '');
    const createNew = page.getByRole('button', {name: 'Create new game', exact: true});
    const joinExisting = page.getByRole('button', {name: 'Join existing game', exact: true});
    const seat = page.locator('[data-hosted-seat-code]');
    const back = page.locator('#game-menu [data-menu=back]');
    await createNew.tap();
    assert(await seat.isHidden());
    assert(await createNew.isHidden());
    assert(await joinExisting.isHidden());
    await page.locator('[data-create-map] option[value=small]').waitFor({state: 'attached'});
    assert.equal(await page.locator('[data-create-map]').inputValue(), 'small');
    await page.locator('[data-create-castles] select').first().selectOption('1');
    await page.getByRole('button', {name: 'Create match and get code', exact: true}).tap();
    await page.getByRole('button', {name: 'Copy code', exact: true}).tap();
    assert.equal(await page.evaluate(() => window.testCopied), roomCode);
    assert.equal(await page.locator('[data-create-codes] input').count(), 1);
    assert.deepEqual(request.factions, [1, null]);
    assert.equal(request.players, 2);
    assert.equal(request.codeFormat, 'room');
    await back.tap();
    assert(await createNew.isVisible());
    assert(await joinExisting.isVisible());
    await page.evaluate(() => {
      const fetch = window.fetch;
      window.fetch = (url, options) => {
        if (!String(url).endsWith('?alerts=1') || window.testAlertLookupStarted) return fetch(url, options);
        window.testAlertLookupStarted = true;
        return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => {
          window.testAlertLookupCancelled = true;
          reject(options.signal.reason);
        }, {once: true}));
      };
    });
    await joinExisting.tap();
    assert(await joinExisting.isHidden());
    assert(await createNew.isHidden());
    assert(await seat.isVisible());
    assert(await page.locator('[data-create-codes]').isHidden());
    assert(await page.getByRole('button', {name: 'Resume match', exact: true}).isVisible());
    await page.getByText('1 of 2 players connected', {exact: true}).waitFor();
    await seat.fill('kmrt');
    const guestReport = page.waitForResponse(response => new URL(response.url()).searchParams.get('result') === 'busy');
    await page.getByRole('button', {name: 'Join match', exact: true}).tap();
    await page.waitForFunction(() => window.testAlertLookupCancelled);
    await page.getByText(/Another match is using the server.*Ref\. [a-f0-9]{8}/).waitFor();
    await guestReport;
    await back.tap();
    assert(await createNew.isVisible());
    await createNew.tap();
    assert(await page.locator('[data-create-codes] [data-create-match=copy]').isVisible());
    assert(await page.getByRole('button', {name: 'Paste code', exact: true}).isHidden());
    await page.evaluate(() => {
      const schedule = window.setTimeout.bind(window);
      window.setTimeout = (callback, delay, ...args) => schedule(callback, delay === 30000 ? 25 : delay, ...args);
      Module._vcmiJoinHostedMatch = () => {};
    });
    const timeoutReport = page.waitForResponse(response => new URL(response.url()).searchParams.get('result') === 'socket-timeout');
    const launch = page.getByRole('button', {name: 'Launch game', exact: true});
    await launch.tap();
    await timeoutReport;
    assert(await page.getByRole('button', {name: 'Reload and retry', exact: true}).isHidden());
    assert(await page.locator('[data-create-codes] [data-create-match=copy]').isVisible());
    await simulateHostedSocket();
    const hostReport = page.waitForResponse(response => new URL(response.url()).searchParams.get('result') === 'connected');
    await launch.tap();
    await hostReport;
    await seat.waitFor({state: 'detached'});
    assert.deepEqual(reports.map(report => report.result), ['busy', 'socket-timeout', 'connected']);
    assert.deepEqual(reports.map(report => report.sockets), ['0', '2', '1']);
    assert(reports.every(report => /^[a-f0-9-]{36}$/.test(report.attempt)));
  }

  const multiplayerBack = page.locator('[data-multiplayer-back]');
  if (await multiplayerBack.isVisible()) await multiplayerBack.tap();
  await page.locator('.mobile-menu [data-action="20"]').tap();
  await wait(() => {
    const state = window.goonkMobileState;
    const map = state?.maps?.find(map => map.name === state.selectedMap);
    return state?.mode === 'lobby' && map?.width === 144 && map.castleChoice && state.factions?.length > 1;
  });
  assert.equal(await page.locator('#mobile-map-select option').filter({hasText: /^Goonks?( Online)?$/}).count(), 0);
  await page.locator('.lobby-footer [data-ui=back]').tap();
  await openMultiplayer();
  await hostDevice.tap();
  await page.getByRole('heading', {name: 'Multiplayer on the host’s device', exact: true}).waitFor();
  await page.getByText('The host needs to keep the game open during the match.').waitFor();
  await page.locator('.online-login input').fill('ScenarioHost' + String(Date.now()).slice(-6));
  await page.locator('.online-login [type=submit]').tap();
  await panel.locator('[data-room-action=create]').tap();
  await panel.locator('[data-room-action=limit][data-room-id="4"]').tap();
  await panel.locator('[data-room-action=confirm-room]').tap();
  await wait(() => goonkMobileState.onlineHost && goonkMobileState.onlineRoomLimit === 4 && goonkMobileState.onlineScenarios?.length);
  await wait(() => {
    const state = goonkMobileState;
    const selected = state.onlineScenarios?.find(map => map.index === state.onlineScenarioIndex);
    return selected?.width === 36 && selected.castleChoice;
  });
  assert(await panel.getByLabel('Your castle').isVisible());
  await panel.locator('[data-room-action=scenario]').tap();
  const chosen = await page.evaluate(() => {
    const maps = goonkMobileState.onlineScenarios;
    if (maps.some(map => map.humanSeats < 4)) throw Error('Map has too few human slots');
    if (maps.some(map => /^Goonks?( Online)?$/.test(map.name))) throw Error('Goonk map is still selectable');
    return maps.find(map => map.index !== goonkMobileState.onlineScenarioIndex);
  });
  assert(chosen, 'At least one alternate map fits the room');
  await panel.getByRole('searchbox').fill(chosen.name);
  await panel.locator(`[data-room-action=choose-scenario][data-room-id="${chosen.index}"]`).tap();
  await wait(index => goonkMobileState.onlineScenarioIndex === index, chosen.index);
  await panel.getByText(chosen.name, {exact: true}).waitFor();
  console.log('PASS hosted entry, code editing, push activation, resume after reload, invalidated access, match creation and copy, occupancy, XL solo and four-seat S multiplayer defaults');
} finally {
  await browser.close();
}
