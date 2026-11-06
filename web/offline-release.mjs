const updateCheckMs = 3500;
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

async function findWaitingRelease(registration) {
  if (registration.waiting) return registration.waiting;
  await registration.update().catch(() => {});
  if (registration.waiting || !registration.installing) return registration.waiting;
  const worker = registration.installing;
  return new Promise(resolve => {
    const check = () => {
      if (worker.state === 'installing') return;
      worker.removeEventListener('statechange', check);
      resolve(registration.waiting);
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
  const waiting = await withTimeout(registered.then(reg => reg && findWaitingRelease(reg)), updateCheckMs);
  if (changed()) return reload();
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
