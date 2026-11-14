// Keep the engine, UI and asset catalogue together for each installed release.
// The game's large data files are already installed in OPFS.
const release = /* OFFLINE_RELEASE */ null;
const scope = new URL(self.registration.scope);
const prefix = 'heroes-goonk-shell:' + scope.pathname + ':';
const cacheName = prefix + release?.id;
const shell = new Map(Object.entries(release?.files || {}));
const fileURL = file => new URL(file, scope);
const cacheKey = (file, digest) => {
  const url = fileURL(file);
  url.searchParams.set('sha256', digest);
  return url.href;
};

self.addEventListener('install', event => {
  if (!release || release.lazy) return;
  event.waitUntil((async () => {
    const current = await caches.open(cacheName);
    const oldCaches = await Promise.all((await caches.keys())
      .filter(name => name.startsWith(prefix) && name !== cacheName)
      .map(name => caches.open(name)));
    const files = [...shell];
    try {
      for (let i = 0; i < files.length; i += 8) {
        await Promise.all(files.slice(i, i + 8).map(async ([file, digest]) => {
          const key = cacheKey(file, digest);
          for (const previous of oldCaches) {
            const response = await previous.match(key);
            if (response) {
              await current.put(key, response);
              return;
            }
          }
          // Some hosts append their own HTML snippets after the build.
          const htmlVersion = release.htmlVersions[file];
          const integrity = htmlVersion ? '' : 'sha256-' + digest;
          const response = await fetch(fileURL(file), {cache: 'reload', integrity});
          if (!response.ok) throw new Error('Offline install failed for ' + file);
          if (htmlVersion && !(await response.clone().text()).includes('<meta name="goonk-release" content="' + htmlVersion + '">')) {
            throw new Error('Offline release changed during install');
          }
          await current.put(key, response);
        }));
      }
    } catch (error) {
      await caches.delete(cacheName);
      if (!/quota|space|storage|disk|full/i.test(String(error?.name || '') + ' ' + String(error?.message || ''))) throw error;
    }
  })());
});

// A launch may opt in before starting the game. Keep the existing release
// while another window in this scope could be playing or starting a game.
self.addEventListener('message', event => {
  if (release?.lazy && event.data?.type === 'crossover.activate-launch') {
    event.waitUntil((async () => {
      const source = event.source?.url && new URL(event.source.url);
      if (!source || !['index.html', 'launch.html', ''].some(file => fileURL(file).pathname === source.pathname)) return;
      const windows = await self.clients.matchAll({type: 'window', includeUncontrolled: true});
      if (windows.some(client => client.id !== event.source.id && new URL(client.url).pathname === fileURL('game.html').pathname)) return;
      await self.skipWaiting();
    })());
    return;
  }
  if (event.data?.type !== 'goonk.apply-offline-release' || !event.ports[0]) return;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({type: 'window', includeUncontrolled: true});
    const source = event.source?.url && new URL(event.source.url);
    const game = fileURL('game.html');
    const otherWindow = windows.some(client => client.id !== event.source?.id && client.url.startsWith(scope.href));
    const ready = source?.origin === game.origin && source.pathname === game.pathname &&
      !otherWindow && Date.now() < event.data.deadline;
    event.ports[0].postMessage(ready);
    if (ready) await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => event.waitUntil((async () => {
  try {
    for (const name of await caches.keys()) {
      if (name.startsWith(prefix) && name !== cacheName) await caches.delete(name);
    }
  } catch (error) { if (!release?.lazy) throw error; }
  await self.clients.claim();
})()));

function isolated(response) {
  if (response.status === 0) return response;
  const headers = new Headers(response.headers);
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  return new Response(response.body, {status: response.status, statusText: response.statusText, headers});
}

const imageTypes = {png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', bmp: 'image/bmp'};
let installedImages;
async function readInstalledImage(file) {
  if (!navigator.storage?.getDirectory || !shell.has('asset-manifest.json')) return;
  installedImages ??= (async () => {
    const catalogue = await caches.match(cacheKey('asset-manifest.json', shell.get('asset-manifest.json')), {cacheName});
    const manifest = await catalogue.json();
    return new Map(manifest.files.filter(entry => entry.url && entry.path.startsWith('Mods/') &&
      imageTypes[entry.path.split('.').at(-1)?.toLowerCase()]).map(entry => [fileURL(entry.url).pathname, entry]));
  })();
  const entry = (await installedImages).get(fileURL(file).pathname);
  if (!entry) return;
  const parts = entry.path.split('/');
  if (parts.some(part => !part || part === '.' || part === '..')) return;
  const name = parts.pop();
  let dir = await navigator.storage.getDirectory();
  for (const part of ['home', 'web_user', '.local', 'share', 'vcmi', ...parts]) dir = await dir.getDirectoryHandle(part);
  const image = await (await dir.getFileHandle(name)).getFile();
  if (image.size !== entry.size) return;
  return new Response(image, {headers: {'Content-Type': imageTypes[name.split('.').at(-1).toLowerCase()]}});
}

self.addEventListener('fetch', event => {
  const {request} = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;

  const file = url.pathname.slice(scope.pathname.length) || 'index.html';
  const digest = shell.get(file);
  event.respondWith((async () => {
    if (digest && !request.headers.has('range')) {
      try {
        const response = await caches.match(cacheKey(file, digest), {cacheName});
        if (response) return isolated(response);
      } catch (error) { if (!release?.lazy) throw error; }
    }
    try {
      const response = await fetch(request, digest && release?.lazy ? {integrity: 'sha256-' + digest} : undefined);
      if (digest && release?.lazy && response.ok && !request.headers.has('range')) {
        const copy = response.clone();
        event.waitUntil(caches.open(cacheName).then(cache => cache.put(cacheKey(file, digest), copy)).catch(() => {}));
      }
      return isolated(response);
    } catch (error) {
      if (request.destination === 'image' && file.startsWith('assets/data/')) {
        const response = await readInstalledImage(file).catch(() => null);
        if (response) return isolated(response);
      }
      throw error;
    }
  })());
});

const turnNotificationTag = 'heroes-goonk-online-turn';
const hostedMatchPattern = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;

self.addEventListener('push', event => {
  let message;
  try {
    message = event.data?.json();
  } catch {
    return;
  }
  const encounter = message?.type === 'goonk.encounter-waiting.v1';
  if (!encounter && message?.type !== 'goonk.turn-started.v1') return;

  const match = hostedMatchPattern.test(message.matchId ?? '') ? message.matchId : null;
  event.waitUntil(self.registration.showNotification('Heroes Goonk', {
    body: encounter
      ? (message.language === 'fr' ? 'Une attaque attend ton retour.' : 'An attack is waiting for you to rejoin.')
      : (message.language === 'fr' ? 'C’est à toi de jouer.' : 'It’s your turn.'),
    icon: fileURL('dosvcmi.png').href,
    tag: match ? turnNotificationTag + ':' + match : turnNotificationTag,
    ...(match ? {data: {match}} : {}),
  }));
});

self.addEventListener('notificationclick', event => {
  const {tag, data} = event.notification;
  const match = hostedMatchPattern.test(data?.match ?? '') ? data.match : null;
  if (tag !== (match ? turnNotificationTag + ':' + match : turnNotificationTag)) return;
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({type: 'window', includeUncontrolled: true});
    const target = fileURL('game.html');
    if (match) target.searchParams.set('match', match);
    const game = windows.find(client => {
      const url = new URL(client.url);
      return url.pathname === target.pathname && (!match || url.searchParams.get('match') === match);
    });
    if (game) await game.focus();
    else await self.clients.openWindow(target.href);
  })());
});
