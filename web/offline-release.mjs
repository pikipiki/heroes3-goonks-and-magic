const updateCheckMs = 12000;
const installationMs = 120000;
const activationRequestMs = 8000;
const activationMs = 8000;
const backgroundCheckIntervalMs = 30000;

async function withTimeout(promise, ms) {
  let timer;
  try {
    return await Promise.race([promise, new Promise(resolve => { timer = setTimeout(resolve, ms); })]);
  } finally {
    clearTimeout(timer);
  }
}

async function findPendingRelease(registration) {
  if (registration.waiting) return registration.waiting;
  const updating = registration.update().catch(() => {});
  if (registration.installing) await updating;
  else if (registration.waiting) await Promise.race([updating, new Promise(resolve => setTimeout(resolve, 1500))]);
  else await updating;
  return registration.installing || registration.waiting;
}

function waitForInstallation(worker) {
  return new Promise(resolve => {
    const check = () => {
      if (worker.state === 'installing') return;
      worker.removeEventListener('statechange', check);
      resolve();
    };
    worker.addEventListener('statechange', check);
    check();
  });
}

export async function refreshOfflineRelease(showStatus) {
  const {serviceWorker} = navigator;
  if (!serviceWorker || !crossOriginIsolated || !navigator.onLine) return false;
  const controller = serviceWorker.controller;
  const registration = serviceWorker.register(new URL('../coi-serviceworker.js', import.meta.url), {updateViaCache: 'none'});
  const registered = registration.catch(error => console.warn('Offline cache unavailable:', error.message));
  if (!controller) return false;

  const changed = () => serviceWorker.controller && serviceWorker.controller !== controller;
  const reload = () => { location.reload(); return true; };
  const pending = await withTimeout(registered.then(reg => reg && findPendingRelease(reg)), updateCheckMs);
  if (changed()) return reload();
  if (pending?.state === 'installing') {
    showStatus('Téléchargement de la mise à jour…');
    await withTimeout(waitForInstallation(pending), installationMs);
    if (changed()) return reload();
  }
  const waiting = pending && (await registered)?.waiting;
  if (!waiting) return false;

  const channel = new MessageChannel();
  const events = new AbortController();
  const switched = new Promise(resolve => serviceWorker.addEventListener('controllerchange', () => {
    if (changed()) resolve(true);
  }, {signal: events.signal}));
  try {
    const accepted = new Promise(resolve => { channel.port1.onmessage = event => resolve(event.data === true); });
    try {
      waiting.postMessage({type: 'goonk.apply-offline-release', deadline: Date.now() + activationRequestMs}, [channel.port2]);
    } catch (error) {
      if (changed()) return reload();
      if (waiting.state === 'redundant') return false;
      throw error;
    }
    if (!await withTimeout(Promise.race([accepted, switched]), activationRequestMs)) return changed() ? reload() : false;
    showStatus('Application de la mise à jour…');
    if (changed() || await withTimeout(switched, activationMs)) return reload();
    throw Error('La mise à jour est prête mais le navigateur ne l’a pas encore activée.');
  } finally {
    channel.port1.close();
    events.abort();
  }
}

export async function watchOfflineRelease(onReady) {
  const {serviceWorker} = navigator;
  if (!serviceWorker || !crossOriginIsolated) return () => {};
  const registration = await serviceWorker.getRegistration().catch(() => null);
  if (!registration) return () => {};

  let lastCheck = Date.now();
  let notifiedWorker = null;
  const notify = worker => {
    if (!worker || worker === notifiedWorker || worker.state === 'redundant') return;
    notifiedWorker = worker;
    onReady?.(worker);
  };
  const trackInstalling = worker => {
    if (!worker) return;
    if (worker.state === 'installed') { notify(worker); return; }
    const onState = () => {
      if (worker.state === 'installed') {
        worker.removeEventListener('statechange', onState);
        notify(worker);
      } else if (worker.state === 'redundant') {
        worker.removeEventListener('statechange', onState);
      }
    };
    worker.addEventListener('statechange', onState);
  };

  if (registration.waiting) notify(registration.waiting);
  else if (registration.installing) trackInstalling(registration.installing);

  const onUpdateFound = () => trackInstalling(registration.installing);
  const check = () => {
    if (document.visibilityState !== 'visible' || !navigator.onLine) return;
    const now = Date.now();
    if (now - lastCheck < backgroundCheckIntervalMs) return;
    lastCheck = now;
    registration.update().catch(() => {});
  };
  const onVisible = () => check();
  const onOnline = () => { lastCheck = 0; check(); };
  registration.addEventListener('updatefound', onUpdateFound);
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('online', onOnline);
  return () => {
    registration.removeEventListener('updatefound', onUpdateFound);
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('online', onOnline);
  };
}
