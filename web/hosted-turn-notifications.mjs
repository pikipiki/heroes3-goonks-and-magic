import {requestHostedMatch} from './hosted-match-request.mjs';
import {mountHostedMatchCreation} from './hosted-match-create.mjs';
import {createHostedCodeCopy} from './hosted-code-copy.mjs';

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

function connectHostedMatch(runtime, destination, token, onLoading, trace) {
  return new Promise((resolve, reject) => {
    const sockets = runtime.websocket;
    const {url, subprotocol} = sockets;
    const restoreSettings = () => { sockets.url = url; sockets.subprotocol = subprotocol; };
    let started = false;
    let opened = false;
    let finished = false;
    let timeout;
    const finish = (error) => {
      if (finished) return;
      finished = true;
      trace.opened = opened;
      clearTimeout(timeout);
      restoreSettings();
      for (const event of ['open', 'close', 'error']) sockets.on(event, undefined);
      window.removeEventListener('goonk-state', update);
      if (error) reject(error);
      else resolve();
    };
    const update = ({detail: state}) => {
      if (Number.isInteger(state.sessionState)) trace.engineState = state.sessionState;
      if (state.sessionState === 6 && state.onlineGame) {
        finish();
      } else if (state.sessionState === 0 && started) {
        fail('engine-ended');
      } else if (state.sessionState > 0) {
        started = true;
        if (state.sessionState === 5) onLoading();
      }
    };
    const fail = phase => finish(new Error('Hosted connection failed.', {cause: phase}));
    const timeLimit = ms => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fail(opened ? 'load-timeout' : 'socket-timeout'), ms);
    };
    timeLimit(30000);
    try {
      window.addEventListener('goonk-state', update);
      sockets.on('open', () => {
        opened = true;
        restoreSettings();
        timeLimit(90000);
        onLoading();
      });
      sockets.on('close', () => fail('socket-closed'));
      sockets.on('error', () => fail('socket-error'));
      sockets.url = destination.href;
      sockets.subprotocol = 'binary, goonk.' + token;
      runtime._vcmiJoinHostedMatch();
    } catch {
      fail('engine-error');
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
  const libraryMode = document.createElement('button');
  createMode.type = joinMode.type = libraryMode.type = 'button';
  createMode.dataset.nativeClick = joinMode.dataset.nativeClick = libraryMode.dataset.nativeClick = '';
  createMode.textContent = fr ? 'Créer une partie' : 'Create new game';
  joinMode.textContent = fr ? 'Rejoindre avec un code' : 'Join with a code';
  libraryMode.textContent = fr ? 'Mes parties' : 'My games';
  libraryMode.className = 'primary';
  createMode.hidden = !poolEndpoint;
  modes.append(libraryMode, joinMode, createMode);

  const createPanel = document.createElement('div');
  createPanel.id = 'hosted-create-panel';
  const library = document.createElement('section');
  library.className = 'hosted-game-library';
  library.innerHTML = '<h3></h3><div class="hosted-game-list"></div><p data-library-empty hidden></p>';
  library.querySelector('h3').tabIndex = -1;
  library.querySelector('h3').textContent = fr ? 'Mes parties' : 'My games';
  library.querySelector('[data-library-empty]').textContent = fr ? 'Aucune partie mémorisée sur cet appareil.' : 'No games saved on this device.';
  const gameList = library.querySelector('.hosted-game-list');
  const savedPanel = document.createElement('section');
  savedPanel.id = 'hosted-saved-panel';
  savedPanel.className = 'hosted-match-settings';
  const field = document.createElement('section');
  field.id = 'hosted-join-panel';
  createMode.setAttribute('aria-controls', createPanel.id);
  joinMode.setAttribute('aria-controls', field.id);
  let view = null, disposed = false, presenceTimer, polling = false;
  const summaries = new Map();
  function showMode(mode) {
    view = mode;
    modes.hidden = intro.hidden = Boolean(mode);
    status.textContent = '';
    container.scrollTop = 0;
    createPanel.hidden = mode !== 'create';
    field.hidden = mode !== 'join';
    library.hidden = mode !== 'saved-list';
    savedPanel.hidden = mode !== 'saved';
    createMode.setAttribute('aria-expanded', String(!createPanel.hidden));
    joinMode.setAttribute('aria-expanded', String(!field.hidden));
    libraryMode.setAttribute('aria-expanded', String(!library.hidden));
    render();
    if (mode === 'saved-list') library.querySelector('h3').focus({preventScroll: true});
    if (mode === 'saved') void refreshAlerts(true);
    void updateOccupancy();
  }
  field.className = 'hosted-match-settings';
  field.innerHTML = '<label><span></span><input type="password" data-hosted-seat-code autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false"></label><div class="hosted-match-actions"><button type="button"></button><button type="button"></button></div><p role="status"></p>';
  const input = field.querySelector('input');
  input.placeholder = fr ? 'Colle ou saisis ton code' : 'Paste or enter your code';
  const [join, alerts] = field.querySelectorAll('button');
  // Let the browser deliver the click even if the keyboard changes the viewport.
  join.dataset.nativeClick = alerts.dataset.nativeClick = '';
  join.dataset.hostedPlay = '';
  const status = field.querySelector('[role=status]');
  const loader = document.createElement('p');
  loader.className = 'hosted-match-loading';
  loader.setAttribute('role', 'status');
  loader.hidden = true;
  const chooser = document.createElement('label');
  const select = document.createElement('select');
  const start = document.createElement('button');
  const savedActions = document.createElement('div');
  const resume = document.createElement('button');
  const personalCode = createHostedCodeCopy(fr);
  const forget = document.createElement('button');
  const savedTitle = document.createElement('h3');
  const occupancy = document.createElement('p');
  const savedCodeHelp = document.createElement('p');

  savedActions.className = 'hosted-match-actions hosted-saved-actions';
  resume.type = forget.type = 'button';
  resume.className = 'primary';
  resume.textContent = fr ? 'Reprendre la partie' : 'Resume match';
  forget.textContent = fr ? 'Retirer de cet appareil' : 'Remove from this device';
  savedCodeHelp.id = 'hosted-saved-code-help';
  savedCodeHelp.textContent = fr
    ? 'Ton code personnel permet de retrouver la partie après avoir retiré ce raccourci.'
    : 'Your personal code lets you recover this game after removing this shortcut.';
  forget.setAttribute('aria-describedby', savedCodeHelp.id);
  const extras = document.createElement('details');
  extras.className = 'hosted-game-options';
  const extraSummary = document.createElement('summary');
  extraSummary.textContent = fr ? 'Code personnel et alertes' : 'Personal code and alerts';
  extras.append(extraSummary, personalCode.element);
  const management = document.createElement('details');
  management.className = 'hosted-game-options';
  const manageSummary = document.createElement('summary');
  manageSummary.textContent = fr ? 'Gérer cette partie' : 'Manage this game';
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.dataset.nativeClick = '';
  remove.className = 'hosted-delete';
  remove.textContent = fr ? 'Supprimer la partie du serveur' : 'Delete game from server';
  const removeHelp = document.createElement('p');
  management.append(manageSummary, remove, removeHelp, forget, savedCodeHelp);
  savedActions.append(savedTitle, occupancy, resume, extras, management);
  const deleteDialog = document.createElement('dialog');
  deleteDialog.className = 'hosted-delete-dialog';
  deleteDialog.setAttribute('aria-labelledby', 'hosted-delete-title');
  deleteDialog.innerHTML = '<header><h2 id="hosted-delete-title"></h2></header><div class="hosted-delete-body"><p data-delete-name></p><p data-delete-help></p><div class="hosted-match-actions"><button type="button" data-delete-cancel data-native-click autofocus></button><button type="button" data-delete-confirm data-native-click class="hosted-delete"></button></div></div>';
  deleteDialog.querySelector('h2').textContent = fr ? 'Supprimer cette partie ?' : 'Delete this game?';
  deleteDialog.querySelector('[data-delete-help]').textContent = fr ? 'La sauvegarde et les accès de tous les joueurs seront supprimés du serveur.' : 'The save and access for every player will be removed from the server.';
  const cancelDelete = deleteDialog.querySelector('[data-delete-cancel]');
  const confirmDelete = deleteDialog.querySelector('[data-delete-confirm]');
  cancelDelete.textContent = fr ? 'Annuler' : 'Cancel';
  confirmDelete.textContent = fr ? 'Supprimer' : 'Delete';
  let deleteTarget;
  deleteDialog.addEventListener('cancel', event => { if (pending) event.preventDefault(); });
  deleteDialog.addEventListener('close', () => { if (remove.isConnected && !savedPanel.hidden) remove.focus({preventScroll: true}); });
  const intro = document.createElement('p');
  intro.textContent = 'Le serveur garde la partie disponible quand l’hôte ferme le jeu.';
  savedPanel.append(savedActions);
  chooser.append(fr ? 'Scénario de la partie dédiée' : 'Hosted match scenario', select);
  start.type = 'button';
  start.textContent = fr ? 'Lancer avec ce scénario' : 'Start with this scenario';
  chooser.hidden = start.hidden = true;
  status.before(chooser, start);
  field.querySelector('label span').textContent = fr ? 'Code d’invitation ou code personnel' : 'Invitation or personal code';
  const alertsLabel = fr ? 'Alertes de tour' : 'Turn alerts';
  alerts.textContent = alertsLabel;
  const alertsStatus = document.createElement('p');
  alertsStatus.id = 'hosted-turn-alerts-status';
  alertsStatus.setAttribute('role', 'status');
  const alertsIndicator = document.createElement('strong');
  alertsIndicator.className = 'hosted-alert-indicator';
  alertsStatus.append(alertsLabel + ' · ', alertsIndicator);
  const alertsHelp = document.createElement('p');
  alertsHelp.id = 'hosted-turn-alerts-help';
  alerts.setAttribute('aria-describedby', alertsStatus.id + ' ' + alertsHelp.id);
  extras.append(alerts, alertsStatus, alertsHelp);
  const codeKinds = document.createElement('div');
  codeKinds.className = 'hosted-match-actions hosted-code-kinds';
  codeKinds.setAttribute('role', 'group');
  codeKinds.setAttribute('aria-label', fr ? 'Type de code' : 'Code type');
  codeKinds.innerHTML = '<button type="button" data-code-kind="invite"></button><button type="button" data-code-kind="personal"></button>';
  for (const button of codeKinds.children) button.dataset.nativeClick = '';
  codeKinds.children[0].textContent = fr ? 'Invitation' : 'Invitation';
  codeKinds.children[1].textContent = fr ? 'Mon code personnel' : 'My personal code';
  const codeHelp = document.createElement('p');
  field.prepend(codeKinds);
  field.querySelector('label').after(codeHelp);
  let codeKind = 'invite';
  join.textContent = fr ? 'Rejoindre la partie' : 'Join match';
  const {serviceWorker} = navigator;
  layout.append(modes, intro, loader, createPanel, library, savedPanel, field, status, deleteDialog);
  container.append(layout);

  function rememberedSeats() {
    try {
      const value = JSON.parse(localStorage.getItem(rememberedSeatKey));
      return (Array.isArray(value) ? value : [value]).filter(saved => saved &&
        (saved.endpoint === endpoint || (poolEndpoint && saved.endpoint === poolEndpoint)) &&
        matchPattern.test(saved.matchId) && typeof saved.token === 'string' && normalizeSeatCode(saved.token));
    } catch { return []; }
  }

  const availableSeats = () => rememberedSeats();
  const sameMatch = (left, right) => left?.matchId === right?.matchId && left?.endpoint === right?.endpoint;
  function forgetSeat(saved) {
    try {
      localStorage.setItem(rememberedSeatKey, JSON.stringify(rememberedSeats().filter(item =>
        !sameMatch(item, saved) || item.token !== saved.token)));
    } catch {}
  }

  let saved = availableSeats().find(item => item.matchId === requested) ?? availableSeats()[0], createdSeat;
  const claims = new Map();
  let manager;
  let pending = false;
  const seatCode = () => normalizeSeatCode(input.value);
  const inviteCode = () => {
    const code = input.value.replace(/\s/g, '').toUpperCase();
    return codeKind === 'invite' && poolEndpoint && /^[A-Z]{4}$/.test(code) && new Set(code).size === 4 ? code : '';
  };
  const alertSeat = () => input.value.trim() ? {token: seatCode()} : {
    token: normalizeSeatCode(saved?.token ?? ''), endpoint: saved?.endpoint,
  };
  let alertsState = {};
  let backgroundRequests = new AbortController();
  let previousReport;
  function remember(matchId, token, target, name, players) {
    const seats = rememberedSeats();
    const previous = seats.find(item => sameMatch(item, {matchId, endpoint: target}));
    saved = {endpoint: target, matchId, token: normalizeSeatCode(token), name: name || previous?.name, players: players || previous?.players};
    try { localStorage.setItem(rememberedSeatKey, JSON.stringify([saved, ...seats.filter(item => !sameMatch(item, saved))].slice(0, 101))); } catch {}
  }
  const creationAction = mountHostedMatchCreation(createPanel, createMode, poolEndpoint, fr,
    (matchId, token, name, players) => {
      remember(matchId, token, poolEndpoint, name, players);
      createdSeat = saved;
      if (view === 'saved') {
        void refreshAlerts();
        void updateOccupancy();
      }
    }, () => joinMatch({remembered: createdSeat}));

  async function hostedRequest(token, options, knownEndpoint, query = '', attempt, onWait) {
    const send = target => {
      const url = target + (attempt && target === poolEndpoint ? '?attempt=' + attempt : query);
      const init = {credentials: 'omit', redirect: 'error',
        ...options, headers: {Authorization: 'Bearer ' + token, ...options?.headers}};
      if (attempt && target === poolEndpoint && onWait) return requestHostedMatch(url, init, onWait);
      const timeout = AbortSignal.timeout(target === poolEndpoint ? 55000 : 10000);
      const signal = init.signal && AbortSignal.any ? AbortSignal.any([timeout, init.signal]) : timeout;
      return fetch(url, {...init, signal});
    };
    let target = knownEndpoint || (poolEndpoint && (shortSeatCodePattern.test(token) || token.startsWith('HG')) ? poolEndpoint : endpoint);
    let response = await send(target);
    if (!knownEndpoint && poolEndpoint && response.status === 401) {
      target = target === endpoint ? poolEndpoint : endpoint;
      response = await send(target);
    }
    return {response, target};
  }
  const render = () => {
    const valid = Boolean(seatCode() || inviteCode());
    const seats = availableSeats();
    libraryMode.textContent = (fr ? 'Mes parties' : 'My games') + (seats.length ? ` (${seats.length})` : '');
    library.querySelector('[data-library-empty]').hidden = seats.length > 0;
    const key = JSON.stringify(seats.map(item => [item.matchId, item.name, item.players, summaries.get(item.matchId)]));
    if (gameList.dataset.key !== key) {
      gameList.dataset.key = key;
      gameList.replaceChildren(...seats.map(item => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.savedId = item.matchId;
        button.dataset.nativeClick = '';
        button.innerHTML = '<strong></strong><small></small><span></span>';
        button.querySelector('strong').textContent = item.name || (fr ? 'Partie dédiée' : 'Hosted game');
        button.querySelector('small').textContent = '#' + item.matchId.slice(0, 6);
        button.querySelector('span').textContent = presenceText(item);
        return button;
      }));
    }
    for (const button of gameList.querySelectorAll('button')) button.disabled = pending;
    savedActions.hidden = !saved;
    savedTitle.textContent = saved ? (saved.name || (fr ? 'Partie dédiée' : 'Hosted game')) + ' · #' + saved.matchId.slice(0, 6) : '';
    occupancy.textContent = saved ? presenceText(saved) : '';
    const summary = summaries.get(saved?.matchId);
    remove.disabled = pending || summary?.canDelete !== true;
    removeHelp.textContent = summary?.isHost === false ?
      (fr ? 'Seul le créateur peut supprimer la partie du serveur.' : 'Only the creator can delete this game from the server.') :
      summary?.connectedPlayers > 0 ? (fr ? 'Suppression disponible quand tous les joueurs sont déconnectés.' : 'Available when all players are disconnected.') :
        (fr ? 'Le serveur vérifie qu’aucun joueur n’est connecté avant la suppression.' : 'The server checks that no players are connected before deleting.');
    personalCode.setCode(saved?.token);
    personalCode.button.disabled = pending;
    resume.disabled = pending || !window.Module?._vcmiJoinHostedMatch;
    forget.disabled = pending;
    const {token, endpoint} = alertSeat();
    const {enabled, checking} = alertsState.token === token && alertsState.endpoint === endpoint ? alertsState : {};
    const known = typeof enabled === 'boolean';
    const alertText = known
      ? (enabled ? (fr ? 'Activées' : 'On') : (fr ? 'Désactivées' : 'Off'))
      : checking ? (fr ? 'Vérification…' : 'Checking…') : (fr ? 'Non vérifiées' : 'Unverified');
    alertsIndicator.dataset.state = known ? (enabled ? 'on' : 'off') : 'unknown';
    if (alertsIndicator.textContent !== alertText) alertsIndicator.textContent = alertText;
    if (known) {
      alerts.setAttribute('role', 'switch');
      alerts.setAttribute('aria-checked', String(enabled));
    } else {
      alerts.removeAttribute('role');
      alerts.removeAttribute('aria-checked');
    }
    alertsHelp.textContent = token
      ? (fr ? 'État des alertes pour cette place. Active-les sur cet appareil. Les couper les arrête sur tous les appareils.'
        : 'Alert status for this seat. Switch on to receive alerts on this device. Switching off stops them on all devices.')
      : (fr ? 'Rejoins une partie ou sélectionne une partie mémorisée pour régler les alertes.'
        : 'Join a game or select a saved game to manage turn alerts.');
    start.disabled = !valid || !select.value || pending;
    select.disabled = pending;
    join.disabled = input.disabled = createMode.disabled = joinMode.disabled = libraryMode.disabled = pending;
    for (const button of codeKinds.children) {button.disabled = pending;button.setAttribute('aria-pressed', String(button.dataset.codeKind === codeKind));}
    field.querySelector('label span').textContent = codeKind === 'invite' ? (fr ? 'Code d’invitation' : 'Invitation code') : (fr ? 'Code personnel de reprise' : 'Personal resume code');
    const inputType = codeKind === 'invite' ? 'text' : 'password';
    if (input.type !== inputType) input.type = inputType;
    input.placeholder = codeKind === 'invite' ? 'XXXX' : (fr ? 'Colle ton code personnel' : 'Paste your personal code');
    codeHelp.textContent = codeKind === 'invite' ? (fr ? 'Les quatre lettres fournies par l’hôte te donnent une place libre.' : 'The four letters from the host give you a free seat.') : (fr ? 'Retrouve ta place depuis un autre appareil avec le code que tu as copié.' : 'Resume your seat on another device using the code you copied.');
    join.textContent = codeKind === 'invite' ? (fr ? 'Rejoindre la partie' : 'Join game') : (fr ? 'Reprendre ma place' : 'Resume my seat');
  };
  async function refreshAlerts(force = false) {
    if (pending) return;
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
      const {response, target} = await hostedRequest(token, {signal: backgroundRequests.signal}, endpoint, '?alerts=1');
      if (!response.ok) return;
      const {matchId, alertsEnabled} = await response.json();
      if (matchPattern.test(matchId) && typeof alertsEnabled === 'boolean') {
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
  function presenceText(item) {
    const summary = summaries.get(item.matchId);
    const total = summary?.players ?? item.players;
    const count = summary?.connectedPlayers;
    if (!Number.isInteger(count)) {
      const capacity = Number.isInteger(total) ? `${total} ${fr ? 'places' : 'seats'} · ` : '';
      return capacity + (fr ? 'Présence non vérifiée' : 'Presence unverified');
    }
    const computer = summary.computerPlayers;
    const connected = fr ? `${count}/${total} joueurs connectés` : `${count}/${total} players connected`;
    if (!computer) return connected;
    return connected + (fr ? ` · ${computer} ordinateur${computer > 1 ? 's' : ''}` : ` · ${computer} AI`);
  }
  function schedulePresence() {
    clearTimeout(presenceTimer);
    if (!disposed && ['saved', 'saved-list'].includes(view))
      presenceTimer = setTimeout(() => void updateOccupancy(), 15000);
  }
  async function updateOccupancy() {
    if (disposed || polling || !['saved', 'saved-list'].includes(view)) return;
    if (pending) {schedulePresence();return;}
    polling = true;
    const signal = backgroundRequests.signal;
    try {
      const seats = view === 'saved' ? [saved].filter(Boolean) : availableSeats();
      for (const item of seats) {
        if (signal.aborted || disposed || !['saved', 'saved-list'].includes(view)) return;
        if (item.endpoint !== poolEndpoint) continue;
        try {
          const {response} = await hostedRequest(item.token, {signal}, item.endpoint, '?preview=1');
          if (signal.aborted || disposed) return;
          if (response.status === 401) {
            forgetSeat(item);
            summaries.delete(item.matchId);
            if (sameMatch(saved, item)) {
              saved = availableSeats()[0];
              if (view === 'saved') showMode('saved-list');
            }
          } else if (response.ok) {
            const summary = await response.json();
            if (summary.matchId === item.matchId && Number.isInteger(summary.players) && Number.isInteger(summary.connectedPlayers))
              summaries.set(item.matchId, summary);
          } else summaries.delete(item.matchId);
        } catch { if (!signal.aborted) summaries.delete(item.matchId); }
        if (!disposed) render();
      }
    } finally {polling = false;schedulePresence();}
  }

  async function deleteSelected() {
    if (pending || !deleteTarget) return;
    const target = deleteTarget;
    pending = true;
    confirmDelete.disabled = cancelDelete.disabled = true;
    confirmDelete.textContent = fr ? 'Suppression…' : 'Deleting…';
    deleteDialog.setAttribute('aria-busy', 'true');
    backgroundRequests.abort();
    clearTimeout(presenceTimer);
    backgroundRequests = new AbortController();
    render();
    try {
      const url = new URL('/hosted/matches/' + target.matchId, target.endpoint);
      const response = await requestHostedMatch(url, {method: 'DELETE', credentials: 'omit', redirect: 'error',
        headers: {Authorization: 'Bearer ' + target.token}}, () => {});
      const result = response.ok ? {} : await response.json().catch(() => ({}));
      if (response.ok || (response.status === 404 && result.error === 'match-not-found')) {
        forgetSeat(target);
        summaries.delete(target.matchId);
        saved = availableSeats()[0];
        deleteDialog.close();
        showMode('saved-list');
        status.textContent = fr ? 'Partie supprimée du serveur.' : 'Game deleted from server.';
      } else {
        deleteDialog.close();
        status.textContent = result.error === 'players-connected' ?
          (fr ? 'Un joueur est connecté. La partie a été conservée.' : 'A player is connected. The game has been kept.') :
          response.status === 403 ? (fr ? 'Seul le créateur peut supprimer cette partie.' : 'Only the creator can delete this game.') :
            (fr ? 'La suppression n’a pas abouti. Réessaie.' : 'The game could not be deleted. Try again.');
      }
    } catch {
      deleteDialog.close();
      status.textContent = fr ? 'Impossible de confirmer la suppression. Réessaie.' : 'Could not confirm deletion. Try again.';
    } finally {
      pending = false;
      confirmDelete.disabled = cancelDelete.disabled = false;
      confirmDelete.textContent = fr ? 'Supprimer' : 'Delete';
      deleteDialog.removeAttribute('aria-busy');
      render();
      if (status.textContent && status.isConnected) status.scrollIntoView({block: 'nearest'});
      void updateOccupancy();
    }
  }
  const codeChanged = () => {
    chooser.hidden = start.hidden = true;
    status.textContent = '';
    if (seatCode()) codeKind = 'personal';
    if (view === 'saved') void refreshAlerts();
    else render();
  };
  for (const type of ['input', 'change']) input.addEventListener(type, codeChanged);
  select.addEventListener('change', render);
  serviceWorker?.getRegistration().then(registration => {
    if (registration?.active) manager = registration.pushManager;
  }).catch(() => {});
  serviceWorker?.ready.then(registration => { manager = registration.pushManager; });
  showMode(requested ? (saved ? 'saved' : 'join') : null);

  function showActionStatus(message) {
    status.textContent = message;
    if (status.isConnected && ['saved', 'join', 'saved-list'].includes(view)) status.scrollIntoView({block: 'nearest'});
  }

  const codeHint = () => /^#?[a-f0-9]{6}$/i.test(input.value.trim())
    ? (fr ? 'Ceci est le numéro de la partie. Demande à l’hôte son code d’invitation.' :
      'This is the match number. Ask the host for the invitation code.')
    : codeKind === 'personal' ? (fr ? 'Colle ton code personnel pour retrouver ta place.' : 'Paste your personal code to resume your seat.') :
      (fr ? 'Saisis les quatre lettres du code d’invitation.' : 'Enter the four-letter invitation code.');

  async function claimInvitation(invitation, attempt, onWait) {
    const key = 'heroes-goonk.invite.' + invitation;
    let claimId = claims.get(invitation);
    if (!claimId) {
      claimId = crypto.randomUUID();
      try {
        claimId = localStorage.getItem(key) || sessionStorage.getItem(key) || claimId;
        localStorage.setItem(key, claimId);
        sessionStorage.removeItem(key);
      } catch {}
      claims.set(invitation, claimId);
    }
    const url = new URL('/hosted/matches/claim', poolEndpoint);
    url.searchParams.set('attempt', attempt);
    const response = await requestHostedMatch(url, {
      method: 'POST', credentials: 'omit', redirect: 'error',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({code: invitation, claimId}),
    }, onWait);
    const claim = await response.json().catch(() => ({}));
    if (!response.ok) {
      showActionStatus(claim.error === 'host-offline'
        ? (fr ? 'Demande à l’hôte de lancer la partie avant de rejoindre.' : 'Ask the host to launch the game before joining.')
        : claim.error === 'no-seats'
          ? (fr ? 'Toutes les places ont été attribuées. Utilise Reprendre la partie si tu as déjà joué.' :
            'All seats are taken. Use Resume match if you already joined.')
          : response.status === 401
            ? (fr ? 'Code inconnu ou invitation déjà utilisée.' : 'Unknown game code or already used invitation.')
            : (fr ? 'Impossible de vérifier le code pour le moment. Réessaie plus tard.' : 'Could not verify the code right now. Try again later.'));
      return false;
    }
    if (!matchPattern.test(claim.matchId) || !normalizeSeatCode(claim.token ?? '')) throw new Error('Invalid invitation response.');
    remember(claim.matchId, claim.token, poolEndpoint, claim.name, claim.players);
    input.value = '';
    return true;
  }

  async function checkAlertsAfterClick() {
    const {token, endpoint} = alertSeat();
    status.textContent = '';
    await refreshAlerts(true);
    if (!input.isConnected || alertsState.token !== token || alertsState.endpoint !== endpoint) return;
    if (alertsState.enabled === undefined) {
      showActionStatus(fr ? 'Le serveur n’a pas confirmé l’état des alertes. Réessaie.' :
        'The server could not confirm the alert status. Try again.');
    } else if (!alertsState.enabled) {
      showActionStatus(fr ? 'Appuie sur Alertes de tour pour les activer.' :
        'Tap Turn alerts to switch them on.');
    }
  }

  async function toggleAlerts() {
    if (pending) return;
    if (alertsState.checking) {
      alertsStatus.scrollIntoView({block: 'nearest'});
      return;
    }
    const {token, endpoint} = alertSeat();
    if (!token) {
      const invitation = inviteCode();
      input.blur();
      if (!invitation) {
        showActionStatus(codeHint());
        return;
      }
      pending = true;
      render();
      const checking = () => showActionStatus(fr ? 'Vérification du code d’invitation…' : 'Checking the invitation code…');
      checking();
      let claimed;
      const attempt = crypto.randomUUID();
      try {
        claimed = await claimInvitation(invitation, attempt, checking);
      } catch {
        showActionStatus(fr ? 'Impossible de vérifier le code. Réessaie.' : 'Could not verify the code. Try again.');
      } finally {
        if (!claimed && status.textContent) status.textContent += ' · Ref. ' + attempt.slice(0, 8);
        pending = false;
        render();
      }
      if (claimed) await checkAlertsAfterClick();
      return;
    }
    const current = alertsState;
    if (current.token !== token || current.endpoint !== endpoint || typeof current.enabled !== 'boolean') {
      await checkAlertsAfterClick();
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
    if (!remembered && view === 'saved' && !input.value.trim()) remembered = saved;
    let token = remembered ? normalizeSeatCode(remembered.token) : seatCode();
    const invitation = !remembered && inviteCode();
    const runtime = window.Module;
    if (pending || (scenario && start.disabled)) return;
    if (!token && !invitation) {
      input.blur();
      showActionStatus(codeHint());
      return;
    }
    if (!runtime?._vcmiJoinHostedMatch) {
      showActionStatus(fr ? 'Le jeu se charge encore. Réessaie dans un instant.' :
        'The game is still loading. Try again in a moment.');
      return;
    }
    input.blur();
    pending = true;
    // Safari can fail the WebSocket upgrade while another HTTP request to the
    // same origin is in flight. Cancel UI lookups before querying readiness.
    backgroundRequests.abort();
    backgroundRequests = new AbortController();
    status.textContent = '';
    const showLoading = (french, english) => {
      loader.hidden = false;
      const message = fr ? french : english;
      if (loader.textContent !== message) loader.textContent = message;
      if (loader.isConnected && ['saved', 'join'].includes(view)) loader.scrollIntoView({block: 'nearest'});
    };
    showLoading('Vérification de l’accès…', 'Checking access…');
    const showServerWait = () => showLoading('En attente du serveur dédié…', 'Waiting for the dedicated server…');
    render();
    let opening = false;
    const attempt = crypto.randomUUID();
    const startedAt = performance.now();
    let tracePool = Boolean(poolEndpoint && (remembered?.endpoint === poolEndpoint || invitation ||
      (!remembered && (shortSeatCodePattern.test(token) || token.startsWith('HG')))));
    let outcome = 'request-error';
    let socketAttempts = 0;
    const socketTrace = {};
    try {
      await previousReport;
      if (scenario) {
        const {response} = await hostedRequest(token, {method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({scenario})}, endpoint);
        if (!response.ok) throw new Error('Scenario rejected.');
        chooser.hidden = start.hidden = true;
        status.textContent = fr ? 'Le serveur démarre le scénario. Réessaie de rejoindre dans un instant.' :
          'The server is starting the scenario. Try joining again in a moment.';
        return;
      }
      if (invitation) {
        if (!await claimInvitation(invitation, attempt, showServerWait)) return;
        remembered = saved;
        token = saved.token;
      }
      let result = await hostedRequest(token, {}, remembered?.endpoint, '', attempt, showServerWait);
      tracePool = result.target === poolEndpoint;
      let response = result.response.ok ? await result.response.json() : null;
      const startupDeadline = Date.now() + 90000;
      while (response?.poolStatus === 'starting' || (result.target === poolEndpoint && [502, 503, 504].includes(result.response.status))) {
        if (Date.now() >= startupDeadline) {
          outcome = 'server-timeout';
          status.textContent = fr ? 'Le serveur met trop de temps à démarrer la partie. Réessaie dans un instant.'
            : 'The server is taking too long to start the match. Try again shortly.';
          return;
        }
        showLoading('Démarrage de la partie dédiée…', 'Starting the dedicated match…');
        await pause(1500);
        if (!input.isConnected) return;
        result = await hostedRequest(token, {}, result.target, '', attempt);
        response = result.response.ok ? await result.response.json() : null;
      }
      const {target} = result;
      if (!input.isConnected) return;
      if (remembered && (result.response.status === 401 || (response && response.matchId !== remembered.matchId))) {
        forgetSeat(remembered);
        saved = availableSeats()[0];
        showMode('saved-list');
        status.textContent = fr ? 'Cet accès a expiré. Saisis le code de ta place.' :
          'This access has expired. Enter your seat code.';
        return;
      }
      const {matchId, name, players, playable, scenarioStatus, scenarios} = response ?? {};
      if (!matchPattern.test(matchId))
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
        outcome = 'busy';
        status.textContent = fr ? 'Une autre partie utilise le serveur. Réessaie quand ses joueurs sont déconnectés.' :
          'Another match is using the server. Try again when its players are disconnected.';
        return;
      }
      if (playable !== true) throw new Error('Match unavailable.');
      const destination = new URL('/hosted/game/' + matchId, target);
      destination.protocol = destination.protocol === 'https:' ? 'wss:' : 'ws:';
      if (tracePool) destination.searchParams.set('attempt', attempt);
      opening = true;
      showLoading('Connexion à la partie…', 'Connecting to the match…');
      const loadMatch = () => {
        socketAttempts++;
        socketTrace.engineState = window.goonkGameMenuState?.native?.sessionState;
        return connectHostedMatch(runtime, destination, token,
          () => showLoading('Chargement de la partie…', 'Loading the match…'), socketTrace);
      };
      try {
        await loadMatch();
      } catch (error) {
        showLoading('Nouvelle tentative de connexion…', 'Retrying the connection…');
        const retryDeadline = performance.now() + 5000;
        do {
          await pause(250);
          if (!input.isConnected) return;
        } while (window.goonkGameMenuState?.native?.sessionState !== 0 && performance.now() < retryDeadline);
        if (window.goonkGameMenuState?.native?.sessionState !== 0) throw error;
        await loadMatch();
      }
      outcome = 'connected';
      remember(matchId, token, target, name, players);
      const gameURL = new URL(location.href);
      gameURL.searchParams.set('match', matchId);
      try { history.replaceState(history.state, '', gameURL); } catch {}
      input.value = '';
      onJoining();
    } catch (error) {
      if (opening) {
        outcome = error.cause ?? 'engine-error';
        // Keep the button disabled while the engine publishes the disconnected state.
        if (window.goonkGameMenuState?.native?.sessionState > 0) await pause(1000);
      }
      status.textContent = opening
        ? (fr ? 'La connexion à la partie a été interrompue. Réessaie.' : 'The game connection was interrupted. Try again.')
        : (fr ? 'Partie indisponible. Vérifie le code et réessaie.' : 'Match unavailable. Check your code and try again.');
      if (input.isConnected) status.scrollIntoView({block: 'nearest'});
    } finally {
      if (tracePool) {
        const ms = Math.round(performance.now() - startedAt);
        const details = {sockets: socketAttempts, engine: socketTrace.engineState ?? '', opened: Number(Boolean(socketTrace.opened))};
        const query = '?' + new URLSearchParams({attempt, result: outcome, ms, ...details});
        console.info('Hosted connection', {attempt, outcome, ms, ...details});
        if (token) previousReport = hostedRequest(token, {
          method: 'POST', keepalive: true, signal: AbortSignal.timeout(2000),
        }, poolEndpoint, query).then(({response}) => response.text()).catch(() => {});
        if (outcome !== 'connected' && status.textContent) status.textContent += ' · Ref. ' + attempt.slice(0, 8);
      }
      loader.hidden = true;
      pending = false;
      render();
    }
  }

  function activate(button) {
    if (button === libraryMode) {showMode('saved-list');return true;}
    if (button === joinMode) {input.value = '';showMode('join');return true;}
    if (button.dataset.savedId !== undefined) {
      saved = availableSeats().find(item => item.matchId === button.dataset.savedId);
      input.value = '';
      if (saved) showMode('saved');
      return true;
    }
    if (button.dataset.codeKind) {
      codeKind = button.dataset.codeKind;
      input.value = '';
      codeChanged();
      return true;
    }
    if (button === remove) {
      if (remove.disabled || !saved) return true;
      deleteTarget = {...saved};
      deleteDialog.querySelector('[data-delete-name]').textContent = saved.name || '#' + saved.matchId.slice(0, 6);
      deleteDialog.showModal();
      return true;
    }
    if (button === cancelDelete) {if (!pending) deleteDialog.close();return true;}
    if (button === confirmDelete) {void deleteSelected();return true;}
    if (button === createMode) showMode('create');
    if (creationAction?.(button)) return true;
    if (button === start) {
      void joinMatch({scenario: select.value});
      return true;
    }
    if (button === resume) {
      if (saved) void joinMatch({remembered: saved});
      return true;
    }
    if (button === personalCode.button) {
      void personalCode.copy();
      return true;
    }
    if (button === forget) {
      forgetSeat(saved);
      saved = availableSeats()[0];
      showMode('saved-list');
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
    dispose() {disposed = true;clearTimeout(presenceTimer);backgroundRequests.abort();},
    back() {
      if (view === 'saved' && !pending) {showMode('saved-list');return true;}
      if (modes.hidden) {
        if (!pending) showMode(null);
        return true;
      }
      return false;
    },
  };
}
