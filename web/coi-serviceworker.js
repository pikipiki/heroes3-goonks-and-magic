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
  if (!release) return;
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
      throw error;
    }
  })());
});

// Let a waiting release activate only when the existing game tabs close.
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const name of await caches.keys()) {
    if (name.startsWith(prefix) && name !== cacheName) await caches.delete(name);
  }
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
      const response = await caches.match(cacheKey(file, digest), {cacheName});
      if (response) return isolated(response);
    }
    try {
      return isolated(await fetch(request));
    } catch (error) {
      if (request.destination === 'image' && file.startsWith('assets/data/')) {
        const response = await readInstalledImage(file).catch(() => null);
        if (response) return isolated(response);
      }
      throw error;
    }
  })());
});

self.addEventListener('notificationclick', event => {
  if (event.notification.tag !== 'heroes-goonk-online-turn') return;
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({type: 'window', includeUncontrolled: true});
    const game = windows.find(client => new URL(client.url).pathname === fileURL('game.html').pathname);
    if (game) await game.focus();
    else await self.clients.openWindow(fileURL('game.html').href);
  })());
});
