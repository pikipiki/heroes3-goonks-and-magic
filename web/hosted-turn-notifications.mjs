import {mountHostedMatchCreation} from './hosted-match-create.mjs';

const seatCodePattern = /^[A-Za-z0-9_-]{43}$/;
const rememberedSeatKey = 'heroes-goonk.hosted-seat';
const matchPattern = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;

export function requestedHostedMatch(search = location.search) {
  const match = new URLSearchParams(search).get('match');
  return matchPattern.test(match ?? '') ? match : null;
}

export function mountHostedTurnNotifications(container, {endpoint, poolEndpoint, publicKey}, language, onJoining, requested = null) {
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
  const savedMatch = document.createElement('select');
  const occupancy = document.createElement('p');
  savedMatch.setAttribute('aria-label', fr ? 'Partie à reprendre' : 'Match to resume');
  savedActions.className = 'hosted-match-actions';
  resume.type = forget.type = 'button';
  resume.className = 'primary';
  resume.textContent = fr ? 'Reprendre la partie' : 'Resume match';
  forget.textContent = fr ? 'Oublier cet accès' : 'Forget this access';
  savedActions.append(savedMatch, occupancy, resume, forget);
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

  function rememberedSeats() {
    try {
      const value = JSON.parse(localStorage.getItem(rememberedSeatKey));
      return (Array.isArray(value) ? value : [value]).filter(saved => saved &&
        (saved.endpoint === endpoint || (poolEndpoint && saved.endpoint === poolEndpoint)) &&
        matchPattern.test(saved.matchId) && seatCodePattern.test(saved.token));
    } catch { return []; }
  }

  const availableSeats = () => rememberedSeats().filter(saved => !requested || saved.matchId === requested);
  const sameMatch = (left, right) => left?.matchId === right?.matchId && left?.endpoint === right?.endpoint;
  function forgetSeat(saved) {
    try {
      localStorage.setItem(rememberedSeatKey, JSON.stringify(rememberedSeats().filter(item =>
        !sameMatch(item, saved) || item.token !== saved.token)));
    } catch {}
  }

  let saved = availableSeats()[0];
  let manager;
  let pending = false;
  const seatCode = () => input.value.replace(/\s/g, '');
  function remember(matchId, token, target, name, players) {
    const seats = rememberedSeats();
    const previous = seats.find(item => sameMatch(item, {matchId, endpoint: target}));
    saved = {endpoint: target, matchId, token, name: name || previous?.name, players: players || previous?.players};
    try { localStorage.setItem(rememberedSeatKey, JSON.stringify([saved, ...seats.filter(item => !sameMatch(item, saved))].slice(0, 101))); } catch {}
  }
  const creationAction = mountHostedMatchCreation(field, poolEndpoint, fr,
    () => seatCode() || rememberedSeats().find(item => item.endpoint === endpoint)?.token || '',
    (matchId, token, name, players) => { remember(matchId, token, poolEndpoint, name, players); render(); void updateOccupancy(); });

  async function hostedRequest(token, options, knownEndpoint) {
    const send = target => fetch(target, {
      credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(target === poolEndpoint ? 55000 : 10000),
      ...options, headers: {Authorization: 'Bearer ' + token, ...options?.headers},
    });
    let target = knownEndpoint || (poolEndpoint && token.startsWith('HG') ? poolEndpoint : endpoint);
    let response = await send(target);
    if (!knownEndpoint && poolEndpoint && response.status === 401) {
      target = target === endpoint ? poolEndpoint : endpoint;
      response = await send(target);
    }
    return {response, target};
  }
  const render = () => {
    const valid = seatCodePattern.test(seatCode());
    const hint = input.value && !valid
      ? (fr ? 'Le code doit contenir 43 caractères parmi les lettres, chiffres, tirets et tirets bas.' : 'Use the 43-character code with letters, numbers, hyphens or underscores.')
      : '';
    if (help.textContent !== hint) help.textContent = hint;
    const seats = availableSeats();
    savedMatch.hidden = !seats.length;
    const key = JSON.stringify(seats.map(item => [item.matchId, item.name, item.players]));
    if (savedMatch.dataset.key !== key) {
      savedMatch.dataset.key = key;
      savedMatch.replaceChildren(...seats.map(item => new Option(
        [item.name || (fr ? 'Partie dédiée' : 'Hosted match'), '#' + item.matchId.slice(0, 6),
          item.players && item.players + (fr ? ' places' : ' seats')].filter(Boolean).join(' · '), item.matchId)));
    }
    if (saved) savedMatch.value = saved.matchId;
    savedMatch.disabled = pending;
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
  async function updateOccupancy() {
    const selected = saved;
    occupancy.textContent = selected?.players ? selected.players + (fr ? ' places' : ' seats') : '';
    if (!selected || selected.endpoint !== poolEndpoint) return;
    try {
      const url = new URL(selected.endpoint);
      url.searchParams.set('preview', '1');
      const {response} = await hostedRequest(selected.token, {}, url.href);
      if (!response.ok) return;
      const {matchId, players, connectedPlayers} = await response.json();
      if (saved === selected && matchId === selected.matchId && Number.isInteger(players) && Number.isInteger(connectedPlayers)) {
        occupancy.textContent = fr ? `${connectedPlayers} joueurs connectés sur ${players}` : `${connectedPlayers} of ${players} players connected`;
      }
    } catch {}
  }
  const codeChanged = () => {
    chooser.hidden = start.hidden = true;
    status.textContent = '';
    render();
  };
  for (const type of ['input', 'change']) input.addEventListener(type, codeChanged);
  select.addEventListener('change', render);
  savedMatch.addEventListener('change', () => {
    saved = availableSeats().find(item => item.matchId === savedMatch.value);
    render();
    void updateOccupancy();
  });
  serviceWorker?.getRegistration().then(registration => {
    if (registration?.active) manager = registration.pushManager;
  }).catch(() => {});
  serviceWorker?.ready.then(registration => { manager = registration.pushManager; });
  render();
  void updateOccupancy();

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
      const {response} = await hostedRequest(token, {
        method: enabled ? 'PUT' : 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: subscription ? JSON.stringify({subscription: subscription.toJSON(), language: language()}) : undefined,
      });
      if (!response.ok) throw new Error('Registration rejected.');
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
      if (scenario) {
        const {response} = await hostedRequest(token, {method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({scenario})}, endpoint);
        if (!response.ok) throw new Error('Scenario rejected.');
        chooser.hidden = start.hidden = true;
        status.textContent = fr ? 'Le serveur démarre le scénario. Réessaie de rejoindre dans un instant.' :
          'The server is starting the scenario. Try joining again in a moment.';
        return;
      }
      let result = await hostedRequest(token, {}, remembered?.endpoint);
      let response = result.response.ok ? await result.response.json() : null;
      for (let retry = 0; retry < 24 && response?.poolStatus === 'starting' && input.isConnected; retry++) {
        status.textContent = fr ? 'Démarrage de la partie dédiée…' : 'Starting the dedicated match…';
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (!input.isConnected) return;
        result = await hostedRequest(token, {}, result.target);
        response = result.response.ok ? await result.response.json() : null;
      }
      const {target} = result;
      if (!input.isConnected) return;
      if (remembered && (result.response.status === 401 || (response && response.matchId !== remembered.matchId))) {
        forgetSeat(remembered);
        saved = availableSeats()[0];
        void updateOccupancy();
        status.textContent = fr ? 'Cet accès a expiré. Saisis le code de ta place.' :
          'This access has expired. Enter your seat code.';
        return;
      }
      const {matchId, name, players, playable, scenarioStatus, scenarios} = response ?? {};
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
      if (response.poolStatus === 'busy') {
        status.textContent = fr ? 'Une autre partie utilise le serveur. Réessaie quand ses joueurs sont déconnectés.' :
          'Another match is using the server. Try again when its players are disconnected.';
        return;
      }
      if (playable !== true) throw new Error('Match unavailable.');
      const destination = new URL('/hosted/game/' + matchId, target);
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
        remember(matchId, token, target, name, players);
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
    if (creationAction?.(button)) return true;
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
      saved = availableSeats()[0];
      void updateOccupancy();
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
