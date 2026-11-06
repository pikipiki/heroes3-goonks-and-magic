const seatCodePattern = /^[A-Za-z0-9_-]{43}$/;
const rememberedSeatKey = 'heroes-goonk.hosted-seat';
const matchPattern = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;

export function requestedHostedMatch(search = location.search) {
  const match = new URLSearchParams(search).get('match');
  return matchPattern.test(match ?? '') ? match : null;
}

export function mountHostedTurnNotifications(container, {endpoint, publicKey}, language, onJoining, requested = null) {
  if (!endpoint || !publicKey) return;
  const fr = language() === 'fr';
  const applicationServerKey = Uint8Array.from(atob(publicKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const field = document.createElement('section');
  field.className = 'hosted-match-settings';
  field.innerHTML = '<label><span></span><input type="password" data-hosted-seat-code autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" aria-describedby="hosted-seat-code-help"></label><button type="button" class="hosted-paste"></button><small id="hosted-seat-code-help"></small><div class="hosted-match-actions"><button type="button"></button><button type="button"></button><button type="button"></button></div><p role="status"></p>';
  const input = field.querySelector('input');
  const [paste, enable, disable, join] = field.querySelectorAll('button');
  const help = field.querySelector('small');
  const status = field.querySelector('[role=status]');
  const chooser = document.createElement('label');
  const select = document.createElement('select');
  const start = document.createElement('button');
  const savedActions = document.createElement('div');
  const resume = document.createElement('button');
  const forget = document.createElement('button');
  savedActions.className = 'hosted-match-actions';
  resume.type = forget.type = 'button';
  resume.className = 'primary';
  resume.textContent = fr ? 'Reprendre la partie' : 'Resume match';
  forget.textContent = fr ? 'Oublier cet accès' : 'Forget this access';
  savedActions.append(resume, forget);
  field.prepend(savedActions);
  chooser.append(fr ? 'Scénario de la partie dédiée' : 'Hosted match scenario', select);
  start.type = 'button';
  start.textContent = fr ? 'Lancer avec ce scénario' : 'Start with this scenario';
  chooser.hidden = start.hidden = true;
  status.before(chooser, start);
  field.querySelector('label span').textContent = fr ? 'Code de ta place' : 'Your seat code';
  paste.textContent = fr ? 'Coller le code' : 'Paste code';
  paste.hidden = !navigator.clipboard?.readText;
  enable.textContent = fr ? 'Activer sur cet appareil' : 'Enable on this device';
  disable.textContent = fr ? 'Désactiver pour cette place' : 'Disable for this seat';
  join.textContent = fr ? 'Rejoindre la partie' : 'Join match';
  const {serviceWorker} = navigator;
  container.append(field);

  function rememberedSeat() {
    try {
      const saved = JSON.parse(localStorage.getItem(rememberedSeatKey));
      if (saved?.endpoint === endpoint && matchPattern.test(saved.matchId) && seatCodePattern.test(saved.token)) return saved;
    } catch {}
    return null;
  }

  function forgetSeat(saved) {
    const current = rememberedSeat();
    if (saved && current?.token === saved.token && current.matchId === saved.matchId) {
      try { localStorage.removeItem(rememberedSeatKey); } catch {}
    }
  }

  let saved = rememberedSeat();
  if (requested && saved?.matchId !== requested) saved = null;
  let manager;
  let pending = false;
  const seatCode = () => input.value.replace(/\s/g, '');
  const render = () => {
    const valid = seatCodePattern.test(seatCode());
    const hint = input.value && !valid
      ? (fr ? 'Le code doit contenir 43 caractères parmi les lettres, chiffres, tirets et tirets bas.' : 'Use the 43-character code with letters, numbers, hyphens or underscores.')
      : '';
    if (help.textContent !== hint) help.textContent = hint;
    savedActions.hidden = !saved;
    resume.disabled = pending || !window.Module?._vcmiJoinHostedMatch;
    forget.disabled = pending;
    paste.disabled = pending;
    enable.disabled = !valid || pending;
    disable.disabled = !valid || pending;
    join.disabled = !valid || pending || !window.Module?._vcmiJoinHostedMatch;
    start.disabled = !valid || !select.value || pending;
    select.disabled = pending;
    input.disabled = pending;
  };
  const codeChanged = () => {
    chooser.hidden = start.hidden = true;
    status.textContent = '';
    render();
  };
  for (const type of ['input', 'change']) input.addEventListener(type, codeChanged);
  select.addEventListener('change', render);
  serviceWorker?.getRegistration().then(registration => {
    if (registration?.active) manager = registration.pushManager;
  }).catch(() => {});
  serviceWorker?.ready.then(registration => { manager = registration.pushManager; });
  render();

  async function pasteCode() {
    try {
      const code = await navigator.clipboard.readText();
      if (!code.trim() || pending || !input.isConnected) return;
      input.value = code.replace(/\s/g, '');
      codeChanged();
    } catch {
      input.focus();
      status.textContent = fr ? 'Fais un appui long sur le champ, puis choisis Coller.' :
        'Touch and hold the field, then choose Paste.';
    }
  }

  async function change(enabled) {
    if (pending) return;
    const token = seatCode();
    if (!seatCodePattern.test(token)) return;
    input.blur();
    pending = true;
    render();
    try {
      if (enabled) {
        if (!manager) {
          const registration = await serviceWorker?.getRegistration();
          if (registration?.active) manager = registration.pushManager;
        }
        if (!manager?.subscribe) {
          status.textContent = fr
            ? 'Les notifications ne sont pas disponibles ici. Ouvre le jeu dans Chrome sur Android, ou depuis l’écran d’accueil sur iPhone.'
            : 'Notifications are unavailable here. Open the game in Chrome on Android, or from the Home Screen on iPhone.';
          return;
        }
        if (globalThis.Notification?.permission === 'denied') {
          status.textContent = fr ? 'Autorise les notifications de ce site dans les réglages du navigateur.' :
            'Allow notifications for this site in your browser settings.';
          return;
        }
      }
      // Request permission on the tap when the registration is ready.
      const subscription = enabled ? await manager.subscribe({userVisibleOnly: true, applicationServerKey}) : undefined;
      const result = await fetch(endpoint, {
        method: enabled ? 'PUT' : 'DELETE',
        headers: {Authorization: 'Bearer ' + token, 'Content-Type': 'application/json'},
        credentials: 'omit',
        redirect: 'error',
        signal: AbortSignal.timeout(10000),
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

  async function joinMatch({scenario, remembered} = {}) {
    const token = remembered?.token ?? seatCode();
    const runtime = window.Module;
    if (pending || !seatCodePattern.test(token) || (scenario && start.disabled) || !runtime?._vcmiJoinHostedMatch) return;
    input.blur();
    pending = true;
    render();
    try {
      const request = options => fetch(endpoint, {
        credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(10000), ...options,
        headers: {Authorization: 'Bearer ' + token, ...options?.headers},
      });
      if (scenario) {
        const result = await request({method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({scenario})});
        if (!result.ok) throw new Error('Scenario rejected.');
        chooser.hidden = start.hidden = true;
        status.textContent = fr ? 'Le serveur démarre le scénario. Réessaie de rejoindre dans un instant.' :
          'The server is starting the scenario. Try joining again in a moment.';
        return;
      }
      const result = await request();
      const response = result.ok ? await result.json() : null;
      if (!input.isConnected) return;
      if (remembered && (result.status === 401 || (response && response.matchId !== remembered.matchId))) {
        forgetSeat(remembered);
        saved = null;
        status.textContent = fr ? 'Cet accès a expiré. Saisis le code de ta place.' :
          'This access has expired. Enter your seat code.';
        return;
      }
      const {matchId, playable, scenarioStatus, scenarios} = response ?? {};
      if (!matchPattern.test(matchId) || (requested && requested !== matchId))
        throw new Error('Wrong or unavailable match.');
      if (playable !== true && scenarioStatus) {
        if (Array.isArray(scenarios) && scenarios.length) {
          select.replaceChildren(...scenarios.map(scenario => new Option(scenario.name, scenario.id)));
          chooser.hidden = start.hidden = false;
          status.textContent = fr ? 'Choisis la carte que le serveur doit démarrer.' : 'Choose the map for the server to start.';
        } else {
          chooser.hidden = start.hidden = true;
          status.textContent = scenarioStatus === 'choose'
            ? (fr ? 'L’hôte doit choisir un scénario.' : 'The host must choose a scenario.')
            : (fr ? 'Le serveur prépare la partie. Réessaie dans un instant.' : 'The server is preparing the match. Try again in a moment.');
        }
        return;
      }
      if (playable !== true) throw new Error('Match unavailable.');
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
      sockets.on('open', () => {
        restore();
        try { localStorage.setItem(rememberedSeatKey, JSON.stringify({endpoint, matchId, token})); } catch {}
      });
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
    if (button === paste) {
      void pasteCode();
      return true;
    }
    if (button === start) {
      void joinMatch({scenario: select.value});
      return true;
    }
    if (button === resume) {
      if (saved) void joinMatch({remembered: saved});
      return true;
    }
    if (button === forget) {
      forgetSeat(saved);
      saved = null;
      status.textContent = fr ? 'Accès oublié sur cet appareil.' : 'Access forgotten on this device.';
      render();
      return true;
    }
    if (button === join) {
      void joinMatch();
      return true;
    }
    if (button !== enable && button !== disable) return false;
    void change(button === enable);
    return true;
  };
}
