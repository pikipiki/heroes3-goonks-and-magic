import {requestHostedMatch} from './hosted-match-request.mjs';
import {createHostedCodeCopy} from './hosted-code-copy.mjs';
import {scenarioDetails} from './scenario-details.mjs';
import {mountScenarioFilters} from './scenario-filters.mjs';
import {scenarioTitle} from './scenario-title.mjs';

export function mountHostedMatchCreation(root, open, endpoint, fr, onCreated, onLaunch) {
  if (!endpoint) return;
  const t = (en, french) => fr ? french : en;
  const section = document.createElement('section');
  section.className = 'hosted-match-settings';
  section.innerHTML = `
    <div class="hosted-match-settings" data-create-form hidden>
      <label><span></span><select data-create-players></select><small data-player-help></small></label>
      <button type="button" class="hosted-scenario-choice" data-create-map data-native-click aria-haspopup="dialog" aria-controls="hosted-map-picker">
        <img src="./web/h3-theme/adventure-map.svg" alt="">
        <span><strong data-create-map-name></strong><small data-create-map-details></small><span data-create-map-label></span></span>
      </button>
      <label data-create-timer-field hidden><span></span><select data-create-timer aria-describedby="hosted-timer-help"></select><small id="hosted-timer-help"></small></label>
      <div class="hosted-match-settings" data-create-castles></div>
      <button type="button" class="primary" data-create-match="submit"></button>
    </div>
    <div class="hosted-match-settings" data-create-codes hidden></div><p data-create-status role="status"></p>
    <dialog id="hosted-map-picker" class="lobby-picker" data-kind="map" aria-labelledby="hosted-map-title">
      <header><h2 id="hosted-map-title" tabindex="-1" autofocus></h2><button type="button" data-picker-close data-native-click>✕</button></header>
      <div class="lobby-picker-content">
        <label class="lobby-picker-search"><span></span><input type="search"></label>
        <div class="lobby-picker-grid" role="group" aria-labelledby="hosted-map-title"></div>
        <p class="lobby-picker-empty" hidden></p>
      </div>
      <footer><button type="button" data-picker-close data-native-click></button></footer>
    </dialog>`;
  const submit = section.querySelector('[data-create-match=submit]');
  const form = section.querySelector('[data-create-form]');
  const players = section.querySelector('[data-create-players]');
  const map = section.querySelector('[data-create-map]');
  const picker = section.querySelector('#hosted-map-picker');
  picker.addEventListener('close', () => map.focus({preventScroll: true}));
  const pickerTitle = picker.querySelector('h2');
  const pickerContent = picker.querySelector('.lobby-picker-content');
  const pickerGrid = picker.querySelector('.lobby-picker-grid');
  const filters = mountScenarioFilters(picker, {playerFilter: false});
  picker.querySelector('[data-filter-reset]').dataset.nativeClick = '';
  picker.querySelector('header button').setAttribute('aria-label', t('Close map picker', 'Fermer le choix de carte'));
  picker.querySelector('footer button').textContent = t('← Back', '← Retour');
  picker.querySelector('.lobby-picker-search span').textContent = t('Search maps', 'Chercher une carte');
  const timer = section.querySelector('[data-create-timer]');
  const timerField = timer.closest('label');
  const mapName = section.querySelector('[data-create-map-name]');
  const mapDetails = section.querySelector('[data-create-map-details]');
  const castles = section.querySelector('[data-create-castles]');
  const codes = section.querySelector('[data-create-codes]');
  const personalCode = createHostedCodeCopy(fr);
  const status = section.querySelector('[data-create-status]');
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
  section.querySelector('[data-player-help]').textContent = t('Only maps with this many human seats are shown.', 'La liste affiche les cartes prévues pour ce nombre de joueurs.');
  mapName.textContent = t('Choose a map', 'Choisir une carte');
  section.querySelector('[data-create-map-label]').textContent = t('Browse maps ›', 'Parcourir les cartes ›');
  timer.previousElementSibling.textContent = t('Adventure turn timer', 'Chrono du tour sur la carte');
  timer.nextElementSibling.textContent = t('Pauses during battles between players.', 'En pause pendant les combats entre joueurs.');
  players.replaceChildren(...Array.from({length: 7}, (_, index) => new Option(index + 2, index + 2)));
  root.prepend(section);
  let scenarios = [], selected, pending = false, requestId, previousRequest;
  function render() {
    players.disabled = pending;
    timer.disabled = pending;
    map.disabled = pending || !scenarios.length;
    submit.disabled = pending || !selected;
    for (const input of castles.querySelectorAll('select')) input.disabled = pending;
  }
  const showServerWait = () => {
    status.textContent = t('Waiting for the dedicated server…', 'En attente du serveur dédié…');
  };
  const request = (path, options) => requestHostedMatch(new URL('/hosted/matches' + path, endpoint), {
    credentials: 'omit', redirect: 'error', ...options,
  }, showServerWait);
  const metadata = item => ({...item, height: item.height ?? item.width,
    players: Number(players.value), humanSeats: Number(players.value),
    castleChoices: item.castles?.filter(choices => choices?.length > 1).length});
  function showPicker() {
    pickerTitle.textContent = t(`Maps for ${players.value} players`, `Cartes pour ${players.value} joueurs`);
    const rows = scenarios.map(item => {
      const row = document.createElement('button');
      row.type = 'button';
      row.dataset.choiceValue = item.id;
      row.dataset.nativeClick = '';
      row.setAttribute('aria-pressed', String(item === selected));
      row.innerHTML = '<img src="./web/h3-theme/adventure-map.svg" alt=""><span class="lobby-choice-copy"><span class="lobby-choice-name"></span><small class="lobby-map-meta"></small></span><span class="lobby-choice-check" aria-hidden="true"></span>';
      const data = metadata(item);
      row.querySelector('.lobby-choice-name').textContent = scenarioTitle(item.name);
      row.querySelector('.lobby-map-meta').textContent = scenarioDetails(data, fr);
      if (item === selected) row.querySelector('.lobby-choice-check').textContent = '✓';
      return {row, map: data};
    });
    pickerGrid.replaceChildren(...rows.map(({row}) => row));
    filters.update(rows, {french: fr});
    picker.showModal();
    pickerContent.scrollTop = 0;
  }
  function showCastles() {
    mapName.textContent = selected ? scenarioTitle(selected.name) : t('Choose a map', 'Choisir une carte');
    mapDetails.textContent = selected ? scenarioDetails(metadata(selected), fr) : '';
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
    filters.clear();
    try {
      const result = await request('?players=' + players.value);
      if (!result.ok) throw Error('Catalogue unavailable.');
      const catalogue = await result.json();
      if (!Array.isArray(catalogue.scenarios)) throw Error('Invalid catalogue.');
      scenarios = catalogue.scenarios;
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
      selected = preferred ?? scenarios[0];
      status.textContent = scenarios.length ? '' : t('No compatible scenario for this player count.', 'Aucune carte compatible avec ce nombre de joueurs.');
    } catch {
      scenarios = [];
      selected = undefined;
      status.textContent = t('Could not load the scenario list.', 'Impossible de charger la liste des scénarios.');
      retry.hidden = false;
    } finally {
      clearTimeout(waiting);
      pending = false;
      showCastles();
    }
  }
  async function create() {
    if (pending || !selected) return;
    const settings = {players: Number(players.value), scenario: selected.id,
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
      personalCode.setCode(hostToken);
      codes.replaceChildren(...invited.filter(({code}) => code !== hostToken).map(({seat, code}) => {
        const row = document.createElement('label');
        const value = document.createElement('input');
        const copy = document.createElement('button');
        value.type = 'text';
        value.readOnly = true;
        value.value = code;
        copy.type = 'button';
        copy.dataset.createMatch = 'copy';
        copy.textContent = t('Copy code', 'Copier le code');
        row.append(seat === undefined ? t('Invitation code', 'Code d’invitation') : colors[seat], value, copy);
        return row;
      }), launch, personalCode.element);
      form.hidden = true;
      codes.hidden = false;
      status.textContent = result.roomCode
        ? t('Share this code with your guests and launch the game so they can join.',
          'Partage ce code avec tes invités et lance la partie pour qu’ils puissent rejoindre.')
        : t('Share each invitation code with its player, then launch the game.',
          'Partage son code avec chaque joueur, puis lance la partie.');
      onCreated(result.matchId, hostToken, scenarioTitle(selected.name), settings.players);
      previousRequest = undefined;
    } catch {
      status.textContent = t('Could not create the match. Try again.', 'La création a échoué. Réessaie.');
    } finally { pending = false; render(); }
  }
  players.addEventListener('change', () => void listMaps());
  return button => {
    if (button === open) {
      if (codes.hidden && !scenarios.length) void listMaps();
      return true;
    }
    if (!section.contains(button)) return false;
    if (button === map && !map.disabled) showPicker();
    if (button.hasAttribute('data-picker-close')) picker.close();
    if (button.hasAttribute('data-filter-reset')) filters.reset();
    if (button.hasAttribute('data-choice-value') && picker.open) {
      const choice = scenarios.find(item => item.id === button.dataset.choiceValue);
      picker.close();
      if (choice && choice !== selected) {
        selected = choice;
        showCastles();
      }
    }
    if (button === submit) void create();
    if (button === retry) void listMaps();
    if (button === launch) {
      launch.disabled = true;
      void onLaunch().finally(() => { launch.disabled = false; });
    }
    if (button === personalCode.button) void personalCode.copy();
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
