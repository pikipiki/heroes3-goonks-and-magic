export function mountHostedTurnNotifications(container, {endpoint, publicKey}, language) {
  if (!endpoint || !publicKey || !navigator.serviceWorker || !globalThis.PushManager) return;
  const fr = language() === 'fr';
  const applicationServerKey = Uint8Array.from(atob(publicKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const field = document.createElement('section');
  field.innerHTML = '<h3></h3><label><span></span><input type="password" autocomplete="off" autocapitalize="off" spellcheck="false"></label><button type="button"></button><button type="button"></button><p role="status"></p>';
  const input = field.querySelector('input');
  const [enable, disable] = field.querySelectorAll('button');
  const status = field.querySelector('[role=status]');
  field.querySelector('h3').textContent = fr ? 'Alertes de partie dédiée' : 'Hosted match alerts';
  field.querySelector('label span').textContent = fr ? 'Code de ta place' : 'Your seat code';
  enable.textContent = fr ? 'Activer sur cet appareil' : 'Enable on this device';
  disable.textContent = fr ? 'Désactiver pour cette place' : 'Disable for this seat';
  container.append(field);

  let manager;
  let pending = false;
  const render = () => {
    const valid = /^[A-Za-z0-9_-]{43}$/.test(input.value.trim());
    enable.disabled = !valid || !manager || pending;
    disable.disabled = !valid || pending;
    input.disabled = pending;
  };
  input.addEventListener('input', render);
  navigator.serviceWorker.ready.then(registration => {
    manager = registration.pushManager;
    render();
  });
  render();

  async function change(enabled) {
    if (pending) return;
    const token = input.value.trim();
    if (!/^[A-Za-z0-9_-]{43}$/.test(token) || (enabled && !manager)) return;
    pending = true;
    render();
    try {
      // Call subscribe directly from the tap, before any network request.
      const subscription = enabled ? await manager.subscribe({userVisibleOnly: true, applicationServerKey}) : undefined;
      const result = await fetch(endpoint, {
        method: enabled ? 'PUT' : 'DELETE',
        headers: {Authorization: 'Bearer ' + token, 'Content-Type': 'application/json'},
        credentials: 'omit',
        redirect: 'error',
        body: subscription ? JSON.stringify({subscription: subscription.toJSON(), language: language()}) : undefined,
      });
      if (!result.ok) throw new Error('Registration rejected.');
      input.value = '';
      status.textContent = enabled
        ? (fr ? 'Alertes activées pour cette place.' : 'Alerts enabled for this seat.')
        : (fr ? 'Alertes désactivées pour cette place.' : 'Alerts disabled for this seat.');
    } catch {
      status.textContent = fr
        ? 'Vérifie le code, la connexion et l’autorisation des notifications.'
        : 'Check the seat code, connection and notification permission.';
    } finally {
      pending = false;
      render();
    }
  }

  return button => {
    if (button !== enable && button !== disable) return false;
    void change(button === enable);
    return true;
  };
}
