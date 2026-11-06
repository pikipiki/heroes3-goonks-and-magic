import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {chromium, webkit} from 'playwright-core';

const worker = readFileSync('web/coi-serviceworker.js', 'utf8');
const updater = readFileSync('web/offline-release.mjs', 'utf8');
const script = `import {refreshOfflineRelease} from './offline-release.mjs';
if (!await refreshOfflineRelease(() => {})) document.body.dataset.ready = 'true';`;
const digest = value => createHash('sha256').update(value).digest('base64');
let version, networkAvailable;
const server = createServer((request, response) => {
  if (!networkAvailable) return request.socket.destroy();
  const file = new URL(request.url, 'http://localhost').pathname.split('/').slice(2).join('/');
  const html = `<!doctype html><head><meta name="goonk-release" content="${version}"></head>
    <body data-version="${version}"><script type="module" src="./web/start.mjs"></script></body>`;
  const files = {'game.html': html, 'web/start.mjs': script, 'web/offline-release.mjs': updater};
  const release = {id: version, files: Object.fromEntries(Object.entries(files).map(([name, value]) => [name, digest(value)])), htmlVersions: {'game.html': version}};
  const body = file === 'coi-serviceworker.js' ? worker.replace('/* OFFLINE_RELEASE */ null', JSON.stringify(release)) : files[file];
  response.writeHead(body === undefined ? 404 : 200, {
    'Content-Type': file.endsWith('.html') ? 'text/html' : 'text/javascript',
    'Cache-Control': 'no-store',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
  });
  if (version === 'slow' && file === 'game.html') {
    setTimeout(() => response.end(body), 4500);
  } else response.end(body);
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/heroes/game.html?mobile=1#resume`;
const ready = (page, version) => page.waitForSelector(`body[data-ready=true][data-version="${version}"]`, {state: 'attached'});
try {
  for (const [kind, engine, options] of [
    ['Chromium', chromium, {executablePath: process.env.CHROME_PATH}],
    ['WebKit', webkit, {executablePath: process.env.WEBKIT_PATH}],
  ]) {
    version = 'first';
    networkAvailable = true;
    const browser = await engine.launch(options);
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(url);
      await ready(page, 'first');
      await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
      await page.evaluate(() => localStorage.setItem('saved-game-fixture', 'keep'));

      const playing = await context.newPage();
      await playing.goto(url);
      await ready(playing, 'first');
      version = 'second';
      await page.reload();
      await ready(page, 'first');
      await page.waitForFunction(async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting));
      assert.equal(await playing.locator('body').getAttribute('data-version'), 'first');

      await playing.close();
      await page.reload();
      await ready(page, 'second');
      assert.equal(page.url(), url);
      assert.equal(await page.evaluate(() => localStorage.getItem('saved-game-fixture')), 'keep');

      version = 'slow';
      await page.reload();
      await ready(page, 'slow');
      assert.equal(page.url(), url);
      assert.equal(await page.evaluate(() => localStorage.getItem('saved-game-fixture')), 'keep');

      version = 'third';
      networkAvailable = false;
      await page.goto(url.replace('?mobile=1', '?mobile=1&offline=1'));
      await ready(page, 'slow');
      console.log('PASS', kind, 'update on launch, other game protected, offline launch');
    } finally {
      await browser.close();
    }
  }
} finally {
  server.close();
}
