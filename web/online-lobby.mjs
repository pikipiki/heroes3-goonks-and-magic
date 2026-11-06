import {isVisibleScenario,scenarioTitle} from './scenario-title.mjs';
import {getLanguage} from './i18n.mjs';

const escape = value => String(value ?? '').replace(/[&<>"']/g, character => (
  {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]
));
const turnLimits = [0, 1, 2, 3, 5, 10];

function sendRoomAction(action, id) {
  const module = window.Module;
  if (!module?._vcmiOnlineRoomAction) return;
  const bytes = new TextEncoder().encode(id);
  const pointer = module._malloc(bytes.length);
  if (!pointer) return;
  try {
    module.HEAPU8.set(bytes, pointer);
    module._vcmiOnlineRoomAction(action, pointer, bytes.length);
  } finally {
    module._free(pointer);
  }
}

export function createOnlineLobby(root, command) {
  const panel = document.createElement('section');
  panel.className = 'online-lobby';
  panel.hidden = true;
  panel.setAttribute('aria-labelledby', 'online-lobby-title');
  panel.innerHTML = '<header><div><h2 id="online-lobby-title"></h2><p data-online-account></p></div><button type="button" data-room-action="classic"></button></header><div class="online-lobby-body"></div><footer class="online-lobby-actions"></footer>';
  root.querySelector('.mobile-play').append(panel);
  const classic = panel.querySelector('[data-room-action=classic]');
  const body = panel.querySelector('.online-lobby-body');
  const footer = panel.querySelector('footer');
  const title = panel.querySelector('h2');
  const account = panel.querySelector('[data-online-account]');
  let state = {}, page = '', classicMode = false, sending = '', pendingTimer;
  let limit = 2, privateRoom = true, loadGame = false, roomView = '', pendingScenario;
  const requested = new Map();
  const t = (english, french) => getLanguage() === 'fr' ? french : english;
  const button = (label, action, {primary = false, disabled = false, pressed, id} = {}) =>
    `<button type="button" data-room-action="${action}"${id ? ` data-room-id="${escape(id)}"` : ''}${pressed === undefined ? '' : ` aria-pressed="${pressed}"`}${disabled ? ' disabled' : ''}${primary ? ' class="primary"' : ''}>${escape(label)}</button>`;
  const write = (element, html) => {
    if (element.dataset.markup !== html) {
      element.dataset.markup = html;
      element.innerHTML = html;
    }
  };
  const back = () => button(t('Back', 'Retour'), 'back');
  const roomList = (rooms, invited) => rooms.map(room => button(
    `${invited ? t('Invitation from ', 'Invitation de ') : ''}${room.host} · ${room.name || t('New game', 'Nouvelle partie')} · ${room.size}/${room.limit}`,
    'preview', {id: room.id, primary: invited}
  )).join('');

  function filterPlayers() {
    const search = body.querySelector('input');
    if (!search) return;
    const query = search.value.trim().toLocaleLowerCase();
    let found = false;
    for (const row of body.querySelectorAll('[data-invite-name]')) {
      row.hidden = !row.dataset.inviteName.toLocaleLowerCase().includes(query);
      found ||= !row.hidden;
    }
    body.querySelector('[data-no-players]').hidden = found;
  }

  let defaultScenario = false;
  function renderScenarios() {
    const query = body.querySelector('[data-online-scenario-search]').value.trim().toLocaleLowerCase();
    const scenarios = (state.onlineScenarios || []).filter(isVisibleScenario).filter(map => scenarioTitle(map.name).toLocaleLowerCase().includes(query));
    write(body.querySelector('[data-online-scenarios]'), scenarios.map(map =>
      button(`${scenarioTitle(map.name)} · ${map.humanSeats} ${t('human seats', 'places humaines')}`, 'choose-scenario', {
        id: String(map.index), pressed: map.index === state.onlineScenarioIndex, disabled: !!sending,
      })).join('') || `<p>${state.mapsLoading ? t('Loading scenarios…', 'Chargement des scénarios…') :
        t('No matching scenario for this room.', 'Aucun scénario correspondant pour ce salon.')}</p>`);
  }

  function render() {
    panel.hidden = !page || classicMode;
    root.toggleAttribute('data-mobile-online', !panel.hidden);
    if (panel.hidden) return;
    const view = page === 'match' && roomView ? roomView : page;
    panel.dataset.onlineView = view;
    title.textContent = {
      browser: t('Rooms and invitations', 'Salons et invitations'), create: t('Create a room', 'Créer un salon'),
      preview: t('Join a room', 'Rejoindre un salon'), match: t('Your room', 'Ton salon'),
      invite: t('Invite players', 'Inviter des joueurs'), scenario: t('Choose a scenario', 'Choisir un scénario')
    }[view];
    account.textContent = state.onlineAccount || '';
    classic.textContent = t('Classic view', 'Vue classique');
    classic.hidden = view === 'invite' || view === 'scenario' || !!sending || !!state.onlineCreating;
    if (view === 'browser') {
      const invitations = state.onlineInvites || [];
      const rooms = state.onlineRooms || [];
      write(body, `<section><h3>${t('Invitations', 'Invitations')}</h3><div class="online-list">${roomList(invitations, true) || `<p>${t('Invitations from your friends will appear here.', 'Les invitations de tes amis apparaîtront ici.')}</p>`}</div></section>
        <section><h3>${t('Public rooms', 'Salons publics')}</h3><div class="online-list">${roomList(rooms, false) || `<p>${t('No public rooms available.', 'Aucun salon public disponible.')}</p>`}</div></section>`);
      write(footer, back() + button(t('Create game', 'Créer une partie'), 'create', {primary: true}));
    } else if (view === 'create') {
      const busy = state.onlineCreating || !!sending;
      write(body, `<section><h3>${t('Players, including you', 'Joueurs, toi compris')}</h3><div class="online-player-count">${Array.from({length:7}, (_, index) => button(index + 2, 'limit', {pressed:limit === index + 2, disabled:busy, id:String(index + 2)})).join('')}</div></section>
        <section><h3>${t('Room access', 'Accès au salon')}</h3><div class="online-pair">${button(t('Private', 'Privé'), 'private', {pressed:privateRoom, disabled:busy})}${button(t('Public', 'Public'), 'public', {pressed:!privateRoom, disabled:busy})}</div></section>
        <section><h3>${t('Game mode', 'Mode de jeu')}</h3><div class="online-pair">${button(t('New game', 'Nouvelle partie'), 'new', {pressed:!loadGame, disabled:busy})}${button(t('Load game', 'Charger une partie'), 'load', {pressed:loadGame, disabled:busy})}</div></section>`);
      write(footer, button(t('Back', 'Retour'), 'back', {disabled:busy}) + button(
        busy ? t('Creating room…', 'Création du salon…') : t('Create room', 'Créer le salon'),
        'confirm-room', {primary:true, disabled:busy}
      ));
    } else if (view === 'preview') {
      const room = state.onlinePreview;
      write(body, `<section><h3>${escape(room?.name || room?.host || '')}</h3><p>${escape(room ? `${room.host} · ${room.size}/${room.limit}` : '')}</p><p role="status">${escape(state.onlineJoinError || t('Ready to join.', 'Tu peux rejoindre le salon.'))}</p></section>`);
      write(footer, back() + button(sending ? t('Joining…', 'Connexion…') : t('Join room', 'Rejoindre'), 'join', {
        primary:true, disabled:!!sending || !!state.onlineJoinError || !room
      }));
    } else if (view === 'invite') {
      if (!body.querySelector('[data-online-player-search]')) {
        write(body, `<section><label>${t('Find a player', 'Chercher un joueur')}<input type="search" data-online-player-search autocomplete="off"></label>
          <div class="online-list" data-online-players></div><p data-no-players>${t('No matching players online.', 'Aucun joueur en ligne ne correspond.')}</p></section>`);
        body.querySelector('input').addEventListener('input', filterPlayers);
      }
      const list = body.querySelector('[data-online-players]');
      const candidates = (state.onlineInviteCandidates || []).filter(player => !state.onlinePlayers?.includes(player.name));
      write(list, candidates.map(player => {
        const pending = (requested.get(player.id) || 0) > Date.now();
        const status = player.invited ? t('Invited', 'Invité') : pending ? t('Sending…', 'Envoi…') : '';
        return `<div data-invite-name="${escape(player.name)}">${button(
          status ? `${player.name} · ${status}` : player.name,
          'send-invite', {id:player.id, disabled:player.invited || pending}
        )}</div>`;
      }).join(''));
      filterPlayers();
      write(footer, button(t('Back to room', 'Retour au salon'), 'room'));
    } else if (view === 'scenario') {
      if (!body.querySelector('[data-online-scenario-search]')) {
        write(body, `<label>${t('Search maps', 'Chercher une carte')}<input type="search" data-online-scenario-search></label><div class="online-list" data-online-scenarios></div>`);
        body.querySelector('input').addEventListener('input', renderScenarios);
      }
      renderScenarios();
      write(footer, button(t('Back to room', 'Retour au salon'), 'room', {disabled: !!sending}));
    } else {
      const count = state.onlinePlayerCount || 0;
      const limitLabel = state.onlineRoomLimit ? `${count}/${state.onlineRoomLimit}` : String(count);
      const minutes = state.onlineTurnMinutes || 0;
      write(body, `<section><h3>${t('Players in the room', 'Joueurs dans le salon')} · ${limitLabel}</h3>
        ${state.onlinePlayers?.length ? `<ul>${state.onlinePlayers.map(name => `<li>${escape(name)}</li>`).join('')}</ul>` : ''}
        ${count < 2 ? `<p>${t('Waiting for another player to join.', 'En attente d’un autre joueur.')}</p>` : ''}
        ${state.onlineHost ? button(t('Invite players', 'Inviter des joueurs'), 'invite') : ''}</section>
        <section><h3>${t('Scenario', 'Scénario')}</h3><p>${escape(scenarioTitle(state.selectedMap) || t('No scenario selected.', 'Aucun scénario sélectionné.'))}</p>
        ${state.onlineFactions?.length > 1 ? `<label>${t('Your castle', 'Ton château')}<select data-online-faction>${(state.onlineRandomFaction ? [{id:-1,name:t('Random','Aléatoire')}] : []).concat(state.onlineFactions).map(faction => `<option value="${faction.id}"${faction.id===state.onlineFaction?' selected':''}>${escape(faction.name)}</option>`).join('')}</select></label>` : ''}
        ${state.onlineHost && !state.onlineLoading ? `<div class="online-pair">${button(t('Choose a scenario', 'Choisir un scénario'), 'scenario', {disabled: !state.onlineRoomLimit})}${button(`${t('Turn timer', 'Chrono')} · ${minutes ? minutes + ' min' : t('Off', 'Désactivé')}`, 'timer', {disabled:!state.selectedMap})}</div>` : ''}
        ${state.onlineHost && state.onlineLoading && state.onlineSaveAvailable ? button(t('Last online save', 'Dernière sauvegarde en ligne'), 'save') : ''}</section>`);
      const canStart = pendingScenario === undefined && count >= 2 && !!state.selectedMap && (state.onlineLoading ? state.onlineCanResume : state.onlineScenarioFits !== false);
      write(footer, back() + (state.onlineHost ? button(
        sending ? t('Starting…', 'Démarrage…') : state.onlineLoading ? t('Resume game', 'Reprendre') : t('Start game', 'Commencer'),
        'start', {primary:true, disabled:!canStart || !!sending}
      ) : `<p>${t('Waiting for the host to start.', 'En attente du lancement par l’hôte.')}</p>`));
    }
  }

  function begin(action, ...args) {
    sending = action;
    render();
    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(() => { sending = ''; render(); }, 6000);
    command(...args);
  }

  function openScenarios() {
    if (page !== 'match' || !state.onlineHost || state.onlineLoading || !state.onlineRoomLimit) return;
    classicMode = false;
    roomView = 'scenario';
    render();
    body.scrollTop = 0;
  }

  panel.addEventListener('click', event => {
    const target = event.target.closest('[data-room-action]');
    if (!target || target.disabled) return;
    const {roomAction: action, roomId: id} = target.dataset;
    switch (action) {
      case 'classic': classicMode = true; render(); break;
      case 'back': command(0); break;
      case 'create': command(81); break;
      case 'limit': limit = Number(id); render(); break;
      case 'private': case 'public': privateRoom = action === 'private'; render(); break;
      case 'new': case 'load': loadGame = action === 'load'; render(); break;
      case 'confirm-room': begin(action, 82, limit, Number(privateRoom), Number(loadGame)); break;
      case 'preview': sendRoomAction(0, id); break;
      case 'join': begin(action, 83); break;
      case 'invite': case 'room': roomView = action === 'invite' ? action : ''; render(); body.scrollTop = 0; break;
      case 'send-invite': requested.set(id, Date.now() + 6000); sendRoomAction(1, id); render(); break;
      case 'scenario': openScenarios(); break;
      case 'choose-scenario': {
        const index = Number(id);
        defaultScenario = true;
        if (index === state.onlineScenarioIndex) { roomView = ''; render(); break; }
        pendingScenario = index;
        begin(action, 84, index);
        break;
      }
      case 'timer': command(79, turnLimits[(turnLimits.indexOf(state.onlineTurnMinutes || 0) + 1) % turnLimits.length]); break;
      case 'save': command(80); break;
      case 'start': begin(action, 22); break;
    }
  });

  panel.addEventListener('change', event => {
    if (event.target.matches('[data-online-faction]')) command(37, Number(event.target.value));
  });
  return {
    get active() { return !panel.hidden; },
    get classic() { return classicMode && !!page; },
    show() { classicMode = false; render(); },
    openScenarios,
    update(next) {
      state = next;
      const newPage = next.mode === 'online-lobby' && window.Module?._vcmiOnlineRoomAction ? next.onlinePage || '' : '';
      if (newPage !== page) {
        clearTimeout(pendingTimer);
        sending = '';
        roomView = '';
        pendingScenario = undefined;
        defaultScenario = false;
        requested.clear();
        if (!newPage) classicMode = false;
        if (newPage === 'create') { limit = 2; privateRoom = true; loadGame = false; }
        page = newPage;
        body.scrollTop = 0;
      }
      if (pendingScenario !== undefined && pendingScenario === next.onlineScenarioIndex) {
        clearTimeout(pendingTimer);
        sending = roomView = '';
        pendingScenario = undefined;
      }
      if (page === 'match' && next.onlineHost && !next.onlineLoading && !defaultScenario && next.onlineRoomLimit) {
        const visible = (next.onlineScenarios || []).filter(isVisibleScenario);
        const preferred = visible.find(map => map.width === 36 && map.castleChoice);
        if (preferred || !next.mapsLoading) {
          defaultScenario = true;
          const chosen = preferred || ((!next.onlineScenarioFits || !isVisibleScenario({name:next.selectedMap})) && visible[0]);
          if (chosen && chosen.index !== next.onlineScenarioIndex) {
            pendingScenario = chosen.index;
            command(84, chosen.index);
          }
        }
      }
      render();
    }
  };
}
