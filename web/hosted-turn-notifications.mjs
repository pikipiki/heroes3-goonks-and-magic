import {mountHostedMatchCreation} from './hosted-match-create.mjs';

const legacySeatCodePattern = /^[A-Za-z0-9_-]{43}$/;
const shortSeatCodePattern = /^[0-9A-HJKMNP-TV-Z]{12}$/;
function normalizeSeatCode(value) {
  const compact = value.replace(/\s/g, '');
  if (legacySeatCodePattern.test(compact)) return compact;
  const short = compact.replace(/-/g, '').toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1');
  return shortSeatCodePattern.test(short) ? short : '';
}
const rememberedSeatKey = 'heroes-goonk.hosted-seat';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const matchPattern = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;

export function requestedHostedMatch(search = location.search) {
  const match = new URLSearchParams(search).get('match');
  return matchPattern.test(match ?? '') ? match : null;
}

function connectHostedMatch(runtime, destination, token, onLoading) {
  return new Promise((resolve, reject) => {
    const sockets = runtime.websocket;
    const {url, subprotocol} = sockets;
    const restoreSettings = () => { sockets.url = url; sockets.subprotocol = subprotocol; };
    let started = false;
    let timeout;
    const finish = (error) => {
      clearTimeout(timeout);
      restoreSettings();
      for (const event of ['open', 'close', 'error']) sockets.on(event, undefined);
      window.removeEventListener('goonk-state', update);
      if (error) reject(error);
      else resolve();
    };
    const update = ({detail: state}) => {
      if (state.sessionState === 6 && state.onlineGame) {
        finish();
      } else if (state.sessionState === 0 && started) {
        finish(new Error('Game connection ended.'));
      } else if (state.sessionState > 0) {
        started = true;
        if (state.sessionState === 5) onLoading();
      }
    };
    const failed = () => finish(new Error('Game connection rejected.'));
    const timeLimit = ms => {
      clearTimeout(timeout);
      timeout = setTimeout(() => finish(new Error('Game connection timed out.')), ms);
    };
    timeLimit(30000);
    try {
      window.addEventListener('goonk-state', update);
      sockets.on('open', () => {
        restoreSettings();
        timeLimit(90000);
        onLoading();
      });
      sockets.on('close', failed);
      sockets.on('error', failed);
      sockets.url = destination.href;
      sockets.subprotocol = 'binary, goonk.' + token;
      runtime._vcmiJoinHostedMatch();
    } catch (error) {
      finish(error);
    }
  });
}

export function mountHostedTurnNotifications(container, {endpoint, poolEndpoint, publicKey}, language, onJoining, requested = null) {
  if (!endpoint || !publicKey) return;
  const fr = language() === 'fr';
  const applicationServerKey = Uint8Array.from(atob(publicKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const layout = document.createElement('div');
  layout.className = 'hosted-match-settings';
  const modes = document.createElement('div');
  modes.className = 'hosted-match-actions';
  const createMode = document.createElement('button');
  const joinMode = document.createElement('button');
  createMode.type = joinMode.type = 'button';
  createMode.textContent = fr ? 'Créer une partie' : 'Create new game';
  joinMode.textContent = fr ? 'Rejoindre une partie existante' : 'Join existing game';
  createMode.hidden = !poolEndpoint;
  modes.append(createMode, joinMode);

  const createPanel = document.createElement('div');
  createPanel.id = 'hosted-create-panel';
  const field = document.createElement('section');
  field.id = 'hosted-join-panel';
  createMode.setAttribute('aria-controls', createPanel.id);
  joinMode.setAttribute('aria-controls', field.id);
  function showMode(mode) {
    modes.hidden = intro.hidden = Boolean(mode);
    container.scrollTop = 0;
    createPanel.hidden = mode !== 'create';
    field.hidden = mode !== 'join';
    createMode.setAttribute('aria-expanded', String(!createPanel.hidden));
    joinMode.setAttribute('aria-expanded', String(!field.hidden));
  }
  field.className = 'hosted-match-settings';
  field.innerHTML = '<label><span></span><input type="password" data-hosted-seat-code autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" aria-describedby="hosted-seat-code-help"></label><button type="button" class="hosted-paste"></button><small id="hosted-seat-code-help"></small><div class="hosted-match-actions"><button type="button"></button><button type="button"></button></div><p role="status"></p>';
  const input = field.querySelector('input');
  input.placeholder = 'XXXX-XXXX-XXXX';
  const [paste, join, alerts] = field.querySelectorAll('button');
  const help = field.querySelector('small');
  const status = field.querySelector('[role=status]');
  const loader = document.createElement('p');
  loader.className = 'hosted-match-loading';
  loader.setAttribute('role', 'status');
  loader.hidden = true;
  field.prepend(loader);
  const chooser = document.createElement('label');
  const select = document.createElement('select');
  const start = document.createElement('button');
  const savedActions = document.createElement('div');
  const resume = document.createElement('button');
  const forget = document.createElement('button');
  const savedMatch = document.createElement('select');
  const occupancy = document.createElement('p');
  const savedCodeHelp = document.createElement('p');
  savedMatch.setAttribute('aria-label', fr ? 'Partie à reprendre' : 'Match to resume');
  savedActions.className = 'hosted-match-actions';
  resume.type = forget.type = 'button';
  resume.className = 'primary';
  resume.textContent = fr ? 'Reprendre la partie' : 'Resume match';
  forget.textContent = fr ? 'Effacer le code mémorisé' : 'Remove saved code';
  savedCodeHelp.id = 'hosted-saved-code-help';
  savedCodeHelp.textContent = fr
    ? 'Après avoir effacé le code, tu devras le ressaisir pour reprendre cette partie sur cet appareil.'
    : 'If you remove the code, you’ll need to enter it again to resume this match on this device.';
  forget.setAttribute('aria-describedby', savedCodeHelp.id);
  savedActions.append(savedMatch, occupancy, resume, forget, savedCodeHelp);
  const intro = document.createElement('p');
  intro.textContent = 'Le serveur garde la partie disponible quand l’hôte ferme le jeu.';
  showMode(requested ? 'join' : null);
  field.prepend(savedActions);
  chooser.append(fr ? 'Scénario de la partie dédiée' : 'Hosted match scenario', select);
  start.type = 'button';
  start.textContent = fr ? 'Lancer avec ce scénario' : 'Start with this scenario';
  chooser.hidden = start.hidden = true;
  status.before(chooser, start);
  field.querySelector('label span').textContent = fr ? 'Code de ta place' : 'Your seat code';
  paste.textContent = fr ? 'Coller le code' : 'Paste code';
  paste.hidden = !navigator.clipboard?.readText;
  const alertsLabel = fr ? 'Alertes de tour' : 'Turn alerts';
  const alertsHelp = document.createElement('p');
  alertsHelp.id = 'hosted-turn-alerts-help';
  alerts.setAttribute('aria-describedby', alertsHelp.id);
  alerts.parentElement.after(alertsHelp);
  join.textContent = fr ? 'Rejoindre la partie' : 'Join match';
  const {serviceWorker} = navigator;
  layout.append(modes, intro, createPanel, field);
  container.append(layout);

  function rememberedSeats() {
    try {
      const value = JSON.parse(localStorage.getItem(rememberedSeatKey));
      return (Array.isArray(value) ? value : [value]).filter(saved => saved &&
        (saved.endpoint === endpoint || (poolEndpoint && saved.endpoint === poolEndpoint)) &&
        matchPattern.test(saved.matchId) && typeof saved.token === 'string' && normalizeSeatCode(saved.token));
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
  const seatCode = () => normalizeSeatCode(input.value);
  const alertSeat = () => input.value.trim() ? {token: seatCode()} : {
    token: normalizeSeatCode(saved?.token ?? ''), endpoint: saved?.endpoint,
  };
  let alertsState = {};
  function remember(matchId, token, target, name, players) {
    const seats = rememberedSeats();
    const previous = seats.find(item => sameMatch(item, {matchId, endpoint: target}));
    saved = {endpoint: target, matchId, token: normalizeSeatCode(token), name: name || previous?.name, players: players || previous?.players};
    try { localStorage.setItem(rememberedSeatKey, JSON.stringify([saved, ...seats.filter(item => !sameMatch(item, saved))].slice(0, 101))); } catch {}
  }
  const creationAction = mountHostedMatchCreation(createPanel, createMode, poolEndpoint, fr,
    (matchId, token, name, players) => {
      remember(matchId, token, poolEndpoint, name, players);
      if (!field.hidden) {
        void refreshAlerts();
        void updateOccupancy();
      }
    });

  async function hostedRequest(token, options, knownEndpoint, query = '') {
    const send = target => fetch(target + query, {
      credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(target === poolEndpoint ? 55000 : 10000),
      ...options, headers: {Authorization: 'Bearer ' + token, ...options?.headers},
    });
    let target = knownEndpoint || (poolEndpoint && (shortSeatCodePattern.test(token) || token.startsWith('HG')) ? poolEndpoint : endpoint);
    let response = await send(target);
    if (!knownEndpoint && poolEndpoint && response.status === 401) {
      target = target === endpoint ? poolEndpoint : endpoint;
      response = await send(target);
    }
    return {response, target};
  }
  const render = () => {
    const valid = Boolean(seatCode());
    const hint = input.value && !valid
      ? (fr ? 'Saisis les 12 caractères de ton code court ou colle ton ancien code.' : 'Enter the 12 characters of your short code or paste your previous code.')
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
    const {token} = alertSeat();
    const {enabled, checking} = alertsState;
    alerts.disabled = !token || pending || checking;
    if (typeof enabled === 'boolean') {
      alerts.setAttribute('role', 'switch');
      alerts.setAttribute('aria-checked', String(enabled));
      alerts.setAttribute('aria-label', alertsLabel);
      alerts.textContent = alertsLabel + ' · ' + (fr ? (enabled ? 'Activées' : 'Désactivées') : (enabled ? 'On' : 'Off'));
    } else {
      for (const attribute of ['role', 'aria-checked', 'aria-label']) alerts.removeAttribute(attribute);
      alerts.textContent = checking ? (fr ? 'Vérification des alertes…' : 'Checking turn alerts…')
        : token ? (fr ? 'Vérifier les alertes' : 'Check turn alerts') : alertsLabel;
    }
    alertsHelp.textContent = token
      ? (fr ? 'Active les alertes sur cet appareil. Les couper les arrête pour cette place sur tous les appareils.'
        : 'Switch on to get alerts on this device. Switching off stops alerts for this seat on any device.')
      : (fr ? 'Saisis ton code ou choisis une partie mémorisée pour régler les alertes.'
        : 'Enter your seat code or select a saved game to manage turn alerts.');
    join.disabled = !valid || pending || !window.Module?._vcmiJoinHostedMatch;
    start.disabled = !valid || !select.value || pending;
    select.disabled = pending;
    input.disabled = createMode.disabled = joinMode.disabled = pending;
  };
  async function refreshAlerts(force = false) {
    const {token, endpoint} = alertSeat();
    if (!force && token === alertsState.token && endpoint === alertsState.endpoint) {
      render();
      return;
    }
    const request = {token, endpoint, checking: Boolean(token)};
    alertsState = request;
    render();
    if (!token) return;
    try {
      const {response, target} = await hostedRequest(token, {}, endpoint, '?alerts=1');
      if (!response.ok) return;
      const {matchId, alertsEnabled} = await response.json();
      if (matchPattern.test(matchId) && (!requested || requested === matchId) && typeof alertsEnabled === 'boolean') {
        request.enabled = alertsEnabled;
        request.target = target;
      }
    } catch {
      // A failed lookup leaves the state unknown and can be retried.
    } finally {
      request.checking = false;
      if (alertsState === request && input.isConnected) render();
    }
  }
  async function updateOccupancy() {
    const selected = saved;
    occupancy.textContent = selected?.players ? selected.players + (fr ? ' places' : ' seats') : '';
    if (!selected || selected.endpoint !== poolEndpoint) return;
    try {
      const {response} = await hostedRequest(selected.token, {}, selected.endpoint, '?preview=1');
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
    void refreshAlerts();
  };
  for (const type of ['input', 'change']) input.addEventListener(type, codeChanged);
  select.addEventListener('change', render);
  savedMatch.addEventListener('change', () => {
    saved = availableSeats().find(item => item.matchId === savedMatch.value);
    input.value = '';
    codeChanged();
    void updateOccupancy();
  });
  serviceWorker?.getRegistration().then(registration => {
    if (registration?.active) manager = registration.pushManager;
  }).catch(() => {});
  serviceWorker?.ready.then(registration => { manager = registration.pushManager; });
  render();
  if (requested) {
    void refreshAlerts();
    void updateOccupancy();
  }

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

  async function toggleAlerts() {
    const current = alertsState;
    if (pending || !current.token || current.checking) return;
    if (typeof current.enabled !== 'boolean') {
      await refreshAlerts(true);
      return;
    }
    const enabled = !current.enabled;
    pending = true;
    input.blur();
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
      const {response} = await hostedRequest(current.token, {
        method: enabled ? 'PUT' : 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: subscription ? JSON.stringify({subscription: subscription.toJSON(), language: language()}) : undefined,
      }, current.target);
      if (!response.ok) throw new Error('Registration rejected.');
      current.enabled = enabled;
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
    const token = remembered ? normalizeSeatCode(remembered.token) : seatCode();
    const runtime = window.Module;
    if (pending || !token || (scenario && start.disabled) || !runtime?._vcmiJoinHostedMatch) return;
    input.blur();
    pending = true;
    status.textContent = '';
    const showLoading = (french, english) => {
      loader.hidden = false;
      const message = fr ? french : english;
      if (loader.textContent !== message) loader.textContent = message;
    };
    showLoading('Vérification de l’accès…', 'Checking access…');
    render();
    let opening = false;
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
      const startupDeadline = Date.now() + 90000;
      while (response?.poolStatus === 'starting' || (result.target === poolEndpoint && [502, 503, 504].includes(result.response.status))) {
        if (Date.now() >= startupDeadline) {
          status.textContent = fr ? 'Le serveur met trop de temps à démarrer la partie. Réessaie dans un instant.'
            : 'The server is taking too long to start the match. Try again shortly.';
          return;
        }
        showLoading('Démarrage de la partie dédiée…', 'Starting the dedicated match…');
        await pause(1500);
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
      opening = true;
      showLoading('Connexion à la partie…', 'Connecting to the match…');
      const loadMatch = () => connectHostedMatch(runtime, destination, token,
        () => showLoading('Chargement de la partie…', 'Loading the match…'));
      try {
        await loadMatch();
      } catch (error) {
        showLoading('Nouvelle tentative de connexion…', 'Retrying the connection…');
        await pause(1000);
        if (!input.isConnected) return;
        if (window.goonkGameMenuState?.native?.sessionState !== 0) throw error;
        await loadMatch();
      }
      remember(matchId, token, target, name, players);
      const gameURL = new URL(location.href);
      gameURL.searchParams.set('match', matchId);
      try { history.replaceState(history.state, '', gameURL); } catch {}
      input.value = '';
      onJoining();
    } catch {
      status.textContent = opening
        ? (fr ? 'La connexion à la partie a été interrompue. Réessaie.' : 'The game connection was interrupted. Try again.')
        : (fr ? 'Partie indisponible. Vérifie le code et réessaie.' : 'Match unavailable. Check your code and try again.');
      if (input.isConnected) status.scrollIntoView({block: 'nearest'});
    } finally {
      loader.hidden = true;
      pending = false;
      render();
    }
  }

  function activate(button) {
    if (button === joinMode) {
      showMode('join');
      void refreshAlerts(true);
      void updateOccupancy();
      return true;
    }
    if (button === createMode) showMode('create');
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
      status.textContent = fr ? 'Code effacé sur cet appareil.' : 'Saved code removed from this device.';
      void refreshAlerts();
      return true;
    }
    if (button === join) {
      void joinMatch();
      return true;
    }
    if (button !== alerts) return false;
    void toggleAlerts();
    return true;
  }

  return {
    activate,
    back() {
      if (modes.hidden) {
        if (!pending) showMode(null);
        return true;
      }
      return false;
    },
  };
}
