const matchPattern = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;

export function requestedHostedMatch() {
  const match = new URLSearchParams(location.search).get('match');
  return matchPattern.test(match ?? '') ? match : null;
}

export function mountHostedTurnNotifications(container, {endpoint, publicKey}, language, onJoining) {
  if (!endpoint || !publicKey) return;
  const fr = language() === 'fr';
  const applicationServerKey = Uint8Array.from(atob(publicKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const field = document.createElement('section');
  field.innerHTML = '<h3></h3><label><span></span><input type="password" autocomplete="off" autocapitalize="off" spellcheck="false"></label><button type="button"></button><button type="button"></button><button type="button"></button><p role="status"></p>';
  const input = field.querySelector('input');
  const [enable, disable, join] = field.querySelectorAll('button');
  const status = field.querySelector('[role=status]');
  field.querySelector('h3').textContent = fr ? 'Partie dédiée' : 'Hosted match';
  field.querySelector('label span').textContent = fr ? 'Code de ta place' : 'Your seat code';
  enable.textContent = fr ? 'Activer sur cet appareil' : 'Enable on this device';
  disable.textContent = fr ? 'Désactiver pour cette place' : 'Disable for this seat';
  join.textContent = fr ? 'Rejoindre la partie' : 'Join match';
  const canSubscribe = navigator.serviceWorker && globalThis.PushManager;
  enable.hidden = disable.hidden = !canSubscribe;
  container.append(field);

  let manager;
  let pending = false;
  const render = () => {
    const valid = /^[A-Za-z0-9_-]{43}$/.test(input.value.trim());
    enable.disabled = !valid || !manager || pending;
    disable.disabled = !valid || pending;
    join.disabled = !valid || pending || !window.Module?._vcmiJoinHostedMatch;
    input.disabled = pending;
  };
  input.addEventListener('input', render);
  if (canSubscribe) navigator.serviceWorker.ready.then(registration => {
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

  async function joinMatch() {
    const token = input.value.trim();
    const runtime = window.Module;
    if (join.disabled || !runtime?._vcmiJoinHostedMatch) return;
    pending = true;
    render();
    try {
      const result = await fetch(endpoint, {
        headers: {Authorization: 'Bearer ' + token}, credentials: 'omit', redirect: 'error',
        signal: AbortSignal.timeout(10000),
      });
      if (!result.ok) throw new Error('Seat rejected.');
      const {matchId, playable} = await result.json();
      const requested = requestedHostedMatch();
      if (playable !== true || !matchPattern.test(matchId) || (requested && requested !== matchId))
        throw new Error('Wrong or unavailable match.');
      const destination = new URL('/hosted/game/' + matchId, endpoint);
      destination.protocol = destination.protocol === 'https:' ? 'wss:' : 'ws:';
      const sockets = runtime.websocket;
      const {url, subprotocol} = sockets;
      const restore = () => {
        sockets.url = url;
        sockets.subprotocol = subprotocol;
        sockets.on('open', undefined);
        sockets.on('error', undefined);
        clearTimeout(timeout);
      };
      const timeout = setTimeout(restore, 15000);
      sockets.on('open', restore);
      sockets.on('error', restore);
      sockets.url = destination.href;
      sockets.subprotocol = 'binary, goonk.' + token;
      runtime._vcmiJoinHostedMatch();
      const gameURL = new URL(location.href);
      gameURL.searchParams.set('match', matchId);
      history.replaceState(history.state, '', gameURL);
      input.value = '';
      onJoining();
    } catch {
      status.textContent = fr ? 'Partie indisponible. Vérifie le code et réessaie.' : 'Match unavailable. Check your code and try again.';
    } finally {
      pending = false;
      render();
    }
  }

  return button => {
    if (button === join) {
      void joinMatch();
      return true;
    }
    if (button !== enable && button !== disable) return false;
    void change(button === enable);
    return true;
  };
}
