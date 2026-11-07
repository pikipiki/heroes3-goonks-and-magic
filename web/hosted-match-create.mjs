import {requestHostedMatch} from './hosted-match-request.mjs';
import {scenarioDetails} from './scenario-details.mjs';

export function mountHostedMatchCreation(root, open, endpoint, fr, onCreated, onLaunch) {
  if (!endpoint) return;
  const t = (en, french) => fr ? french : en;
  const section = document.createElement('section');
  section.className = 'hosted-match-settings';
  section.innerHTML = '<div class="hosted-match-settings" data-create-form hidden><label><span></span><select data-create-players></select></label><label><span></span><select data-create-map></select><small data-create-map-details></small></label><label data-create-timer-field hidden><span></span><select data-create-timer aria-describedby="hosted-timer-help"></select><small id="hosted-timer-help"></small></label><div class="hosted-match-settings" data-create-castles></div><button type="button" class="primary" data-create-match="submit"></button></div><div class="hosted-match-settings" data-create-codes hidden></div><p role="status"></p>';
  const submit = section.querySelector('[data-create-match=submit]');
  const form = section.querySelector('[data-create-form]');
  const players = section.querySelector('[data-create-players]');
  const map = section.querySelector('[data-create-map]');
  const timer = section.querySelector('[data-create-timer]');
  const timerField = timer.closest('label');
  const mapDetails = section.querySelector('[data-create-map-details]');
  const castles = section.querySelector('[data-create-castles]');
  const codes = section.querySelector('[data-create-codes]');
  const status = section.querySelector('[role=status]');
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = t('Retry loading scenarios', 'Réessayer de charger les scénarios');
  retry.hidden = true;
  status.after(retry);
  const launch = document.createElement('button');
  launch.type = 'button';
  launch.textContent = t('Launch game', 'Lancer la partie');
  launch.className = 'primary';
  const colors = fr ? ['Rouge', 'Bleu', 'Beige', 'Vert', 'Orange', 'Violet', 'Turquoise', 'Rose'] :
    ['Red', 'Blue', 'Tan', 'Green', 'Orange', 'Purple', 'Teal', 'Pink'];
  submit.textContent = t('Create match and get code', 'Créer la partie et obtenir le code');
  players.previousElementSibling.textContent = t('Number of players', 'Nombre de joueurs');
  map.previousElementSibling.textContent = t('Scenario', 'Scénario');
  timer.previousElementSibling.textContent = t('Adventure turn timer', 'Chrono du tour sur la carte');
  timer.nextElementSibling.textContent = t('Pauses during battles between players.', 'En pause pendant les combats entre joueurs.');
  players.replaceChildren(...Array.from({length: 7}, (_, index) => new Option(index + 2, index + 2)));
  root.prepend(section);
  let scenarios = [], pending = false, requestId, previousRequest;
  function render() {
    players.disabled = pending;
    timer.disabled = pending;
    map.disabled = pending || !map.options.length;
    submit.disabled = pending || !map.value;
    for (const input of castles.querySelectorAll('select')) input.disabled = pending;
  }
  const showServerWait = () => {
    status.textContent = t('Waiting for the dedicated server…', 'En attente du serveur dédié…');
  };
  const request = (path, options) => requestHostedMatch(new URL('/hosted/matches' + path, endpoint), {
    credentials: 'omit', redirect: 'error', ...options,
  }, showServerWait);
  const details = item => scenarioDetails({...item, height: item.height ?? item.width,
    players: Number(players.value), humanSeats: Number(players.value),
    castleChoices: item.castles?.filter(choices => choices?.length > 1).length}, fr);
  function showCastles() {
    const selected = scenarios.find(scenario => scenario.id === map.value);
    mapDetails.textContent = selected ? details(selected) : '';
    castles.replaceChildren(...(selected?.castles ?? []).map((choices, seat) => {
      const label = document.createElement('label');
      const select = document.createElement('select');
      label.hidden = !choices?.length;
      select.append(new Option(t('Map default', 'Par défaut'), ''), ...(choices ?? []).map(choice => new Option(choice.name, choice.id)));
      label.append(colors[seat], select);
      return label;
    }));
    render();
  }
  async function listMaps() {
    if (pending) return;
    pending = true;
    form.hidden = false;
    codes.hidden = retry.hidden = true;
    status.textContent = t('Loading scenarios…', 'Chargement des scénarios…');
    const waiting = setTimeout(showServerWait, 5000);
    render();
    try {
      const result = await request('?players=' + players.value);
      if (!result.ok) throw Error('Catalogue unavailable.');
      const catalogue = await result.json();
      if (!Array.isArray(catalogue.scenarios)) throw Error('Invalid catalogue.');
      scenarios = catalogue.scenarios;
      map.replaceChildren(...scenarios.map(item => new Option(`${details(item)} — ${item.name}`, item.id)));
      const durations = catalogue.turnMinutes;
      const previousTimer = timer.value;
      timerField.hidden = !Array.isArray(durations);
      timer.replaceChildren(...(timerField.hidden ? [] : durations.map(minutes => {
        const label = minutes === 0 ? t('No timer', 'Sans chrono') :
          minutes < 1 ? `${minutes * 60} s` : `${minutes} min`;
        return new Option(label, minutes);
      })));
      if ([...timer.options].some(option => option.value === previousTimer)) timer.value = previousTimer;
      const preferred = scenarios.find(item => item.width === 36 && item.castles?.every(choices => choices?.length > 1));
      if (preferred) map.value = preferred.id;
      status.textContent = scenarios.length ? '' : t('No compatible scenario for this player count.', 'Aucune carte compatible avec ce nombre de joueurs.');
    } catch {
      scenarios = [];
      map.replaceChildren();
      status.textContent = t('Could not load the scenario list.', 'Impossible de charger la liste des scénarios.');
      retry.hidden = false;
    } finally {
      clearTimeout(waiting);
      pending = false;
      showCastles();
    }
  }
  async function create() {
    if (pending || !map.value) return;
    const settings = {players: Number(players.value), scenario: map.value,
      ...(timerField.hidden ? {} : {turnMinutes: Number(timer.value)}),
      factions: [...castles.querySelectorAll('select')].map(select => select.value ? Number(select.value) : null)};
    const signature = JSON.stringify(settings);
    if (signature !== previousRequest) { requestId = crypto.randomUUID(); previousRequest = signature; }
    pending = true;
    status.textContent = t('Creating the match…', 'Création de la partie…');
    render();
    try {
      const response = await request('', {method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({...settings, requestId, codeFormat: 'room'})});
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        status.textContent = result.error === 'full' ? t('All dedicated slots are in use.', 'Toutes les places de sauvegarde dédiées sont occupées.') :
          result.error === 'rate-limit' ? t('Too many matches were created recently. Try again later.', 'Trop de parties ont été créées récemment. Réessaie plus tard.') :
          t('Could not create the match. Try again.', 'La création a échoué. Réessaie.');
        return;
      }
      const hostToken = result.hostToken ?? result.codes?.[0]?.code;
      const invited = result.roomCode ? [{code: result.roomCode}] : result.codes;
      if (!hostToken || !Array.isArray(invited)) throw Error('Invalid match response.');
      codes.replaceChildren(...invited.map(({seat, code}) => {
        const row = document.createElement('label');
        const value = document.createElement('input');
        const copy = document.createElement('button');
        value.type = 'text';
        value.readOnly = true;
        value.value = code;
        copy.type = 'button';
        copy.dataset.createMatch = 'copy';
        copy.textContent = t('Copy code', 'Copier le code');
        row.append(seat === undefined ? t('Game code', 'Code de la partie') : colors[seat], value, copy);
        return row;
      }), launch);
      form.hidden = true;
      codes.hidden = false;
      status.textContent = result.roomCode
        ? t('Share this code with your guests and launch the game so they can join.',
          'Partage ce code avec tes invités et lance la partie pour qu’ils puissent rejoindre.')
        : t('Share each invitation code with its player, then launch the game.',
          'Partage son code avec chaque joueur, puis lance la partie.');
      onCreated(result.matchId, hostToken, scenarios.find(item => item.id === settings.scenario)?.name, settings.players);
      previousRequest = undefined;
    } catch {
      status.textContent = t('Could not create the match. Try again.', 'La création a échoué. Réessaie.');
    } finally { pending = false; render(); }
  }
  players.addEventListener('change', () => void listMaps());
  map.addEventListener('change', showCastles);
  return button => {
    if (button === open) {
      if (codes.hidden && !map.options.length) void listMaps();
      return true;
    }
    if (!section.contains(button)) return false;
    if (button === submit) void create();
    if (button === retry) void listMaps();
    if (button === launch) {
      launch.disabled = true;
      void onLaunch().finally(() => { launch.disabled = false; });
    }
    if (button.dataset.createMatch === 'copy') {
      const input = button.previousElementSibling;
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(input.value).then(() => {
        button.textContent = t('Copied', 'Copié');
      }, () => { input.focus(); input.select(); });
      else { input.focus(); input.select(); }
    }
    return true;
  };
}
