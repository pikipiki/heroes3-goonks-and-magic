const preference = 'heroes-goonk.turn-notifications';
const tag = 'heroes-goonk-online-turn';

export function createTurnNotifications({
  storage = localStorage,
  notification = globalThis.Notification,
  serviceWorker = navigator.serviceWorker,
  hidden = () => document.hidden,
  language = () => 'en',
} = {}) {
  let enabled = false, hadTurn = false, pending = false;
  try { enabled = storage.getItem(preference) === 'true'; } catch {}

  const api = {
    get supported() { return Boolean(notification?.requestPermission && serviceWorker); },
    get enabled() { return enabled && notification?.permission === 'granted'; },
    get pending() { return pending; },
    async toggle() {
      if (!api.supported || pending) return false;
      pending = true;
      try {
        enabled = api.enabled ? false : await notification.requestPermission() === 'granted';
        try { storage.setItem(preference, String(enabled)); } catch {}
        return enabled;
      } catch {
        return false;
      } finally {
        pending = false;
      }
    },
    update(state) {
      const turn = Boolean(state.onlineGame && state.turn && state.day);
      const notify = turn && !hadTurn && hidden() && api.enabled;
      hadTurn = turn;
      if (!notify) return Promise.resolve(false);
      return (async () => {
        try {
          const registration = await serviceWorker.getRegistration();
          if (!registration?.active || !hadTurn || !api.enabled || !hidden()) return false;
          await registration.showNotification('Heroes Goonk', {
            body: language() === 'fr' ? 'C’est à toi de jouer.' : 'It’s your turn.',
            icon: new URL('../dosvcmi.png', import.meta.url).href,
            tag,
          });
          return true;
        } catch {
          return false;
        }
      })();
    },
  };
  return api;
}
