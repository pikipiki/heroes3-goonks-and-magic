const status = document.querySelector('#hosting-status');
const retryKey = 'heroes-goonk.isolation.' + location.pathname;
try {
  if (!window.isSecureContext) throw Error('Ouvre ce site en HTTPS pour lancer le jeu.');
  if (!window.crossOriginIsolated) {
    if (!('serviceWorker' in navigator)) throw Error('Ce navigateur ne permet pas le démarrage du moteur. Essaie un navigateur récent.');
    if (Number(sessionStorage.getItem(retryKey) || 0) >= 2) throw Error('Le démarrage est bloqué. Autorise les service workers pour ce site, puis réessaie.');
    status.textContent = 'Préparation du premier lancement…';
    await navigator.serviceWorker.register('./coi-serviceworker.js', {scope: './', updateViaCache: 'none'});
    // The first installation must finish before isolated navigation.
    await Promise.race([
      (async () => {
        await navigator.serviceWorker.ready;
        if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, {once: true}));
      })(),
      new Promise((_, reject) => setTimeout(() => reject(Error('Le premier lancement prend trop de temps. Recharge la page.')), 120000))
    ]);
    sessionStorage.setItem(retryKey, String(Number(sessionStorage.getItem(retryKey) || 0) + 1));
    location.reload();
  } else {
    sessionStorage.removeItem(retryKey);
    const game = new URL('./game.html', location.href);
    game.search = location.search;
    game.hash = location.hash;
    location.replace(game);
  }
} catch (error) {
  status.textContent = error.message;
  document.querySelector('#hosting-retry').hidden = false;
}
document.querySelector('#hosting-retry').onclick = () => { sessionStorage.removeItem(retryKey); location.reload(); };
