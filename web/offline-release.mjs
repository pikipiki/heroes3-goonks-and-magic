const updateCheckMs = 3500;
const installationMs = 30000;
const activationRequestMs = 1500;
const activationMs = 8000;

async function withTimeout(promise, ms) {
  let timer;
  try {
    return await Promise.race([promise, new Promise(resolve => { timer = setTimeout(resolve, ms); })]);
  } finally {
    clearTimeout(timer);
  }
}

async function findPendingRelease(registration) {
  if (!registration.waiting && !registration.installing) await registration.update().catch(() => {});
  return registration.waiting || registration.installing;
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
