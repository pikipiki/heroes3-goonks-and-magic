export function mountHostedMatchCreation(root, endpoint, fr, getCode, onCreated) {
  if (!endpoint) return;
  const t = (en, french) => fr ? french : en;
  const section = document.createElement('section');
  section.className = 'hosted-match-settings';
  section.innerHTML = '<button type="button" data-create-match="open"></button><div class="hosted-match-settings" data-create-form hidden><label><span></span><select data-create-players></select></label><label><span></span><select data-create-map></select></label><div class="hosted-match-settings" data-create-castles></div><button type="button" class="primary" data-create-match="submit"></button></div><div class="hosted-match-settings" data-create-codes hidden></div><p role="status"></p>';
  const open = section.querySelector('[data-create-match=open]');
  const submit = section.querySelector('[data-create-match=submit]');
  const form = section.querySelector('[data-create-form]');
  const players = section.querySelector('[data-create-players]');
  const map = section.querySelector('[data-create-map]');
  const castles = section.querySelector('[data-create-castles]');
  const codes = section.querySelector('[data-create-codes]');
  const status = section.querySelector('[role=status]');
  const colors = fr ? ['Rouge', 'Bleu', 'Beige', 'Vert', 'Orange', 'Violet', 'Turquoise', 'Rose'] :
    ['Red', 'Blue', 'Tan', 'Green', 'Orange', 'Purple', 'Teal', 'Pink'];
  open.textContent = t('Create a hosted match', 'Créer une partie dédiée');
  submit.textContent = t('Create match and get codes', 'Créer la partie et obtenir les codes');
  players.previousElementSibling.textContent = t('Number of players', 'Nombre de joueurs');
  map.previousElementSibling.textContent = t('Scenario', 'Scénario');
  players.replaceChildren(...Array.from({length: 7}, (_, index) => new Option(index + 2, index + 2)));
  root.prepend(section);
  let scenarios = [], invited = [], pending = false, requestId, previousRequest;
  function render() {
    open.disabled = players.disabled = map.disabled = pending;
    submit.disabled = pending || !map.value;
    for (const input of castles.querySelectorAll('select')) input.disabled = pending;
  }
  const request = (path, options) => fetch(new URL('/hosted/matches' + path, endpoint), {
    credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(55000), ...options,
    headers: {Authorization: 'Bearer ' + getCode(), ...options?.headers},
  });
  function showCastles() {
    const selected = scenarios.find(scenario => scenario.id === map.value);
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
    if (!/^[A-Za-z0-9_-]{43}$/.test(getCode())) {
      status.textContent = t('Enter your existing host code below to create a match.', 'Saisis ton code d’hôte existant ci-dessous pour créer une partie.');
      return;
    }
    pending = true;
    form.hidden = false;
    codes.hidden = true;
    status.textContent = t('Loading scenarios…', 'Chargement des scénarios…');
    render();
    try {
      const result = await request('?players=' + players.value);
      if (result.status === 403) {
        form.hidden = true;
        status.textContent = t('This code cannot create a match.', 'Ce code ne permet pas de créer une partie.');
        return;
      }
      if (!result.ok) throw Error('Catalogue unavailable.');
      ({scenarios} = await result.json());
      map.replaceChildren(...scenarios.map(item => new Option(item.name, item.id)));
      const preferred = scenarios.find(item => item.width === 36 && item.castles?.every(choices => choices?.length > 1));
      if (preferred) map.value = preferred.id;
      status.textContent = scenarios.length ? '' : t('No compatible scenario for this player count.', 'Aucune carte compatible avec ce nombre de joueurs.');
    } catch {
      map.replaceChildren();
      status.textContent = t('The hosted server is unavailable. Try again shortly.', 'Le serveur dédié est indisponible. Réessaie dans un instant.');
    } finally {
      pending = false;
      showCastles();
    }
  }
  async function create() {
    if (pending || !map.value) return;
    const settings = {players: Number(players.value), scenario: map.value,
      factions: [...castles.querySelectorAll('select')].map(select => select.value ? Number(select.value) : null)};
    const signature = JSON.stringify(settings);
    if (signature !== previousRequest) { requestId = crypto.randomUUID(); previousRequest = signature; }
    pending = true;
    render();
    try {
      const response = await request('', {method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({...settings, requestId})});
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        status.textContent = result.error === 'full' ? t('All dedicated slots are in use.', 'Toutes les places de sauvegarde dédiées sont occupées.') :
          t('Could not create the match. Try again.', 'La création a échoué. Réessaie.');
        return;
      }
      invited = result.codes;
      codes.replaceChildren(...invited.map(({seat, code}) => {
        const row = document.createElement('label');
        const value = document.createElement('input');
        const copy = document.createElement('button');
        value.type = 'text';
        value.readOnly = true;
        value.value = code;
        copy.type = 'button';
        copy.dataset.createMatch = 'copy';
        copy.dataset.seat = seat;
        copy.textContent = t('Copy code', 'Copier le code');
        row.append(colors[seat], value, copy);
        return row;
      }));
      form.hidden = true;
      codes.hidden = false;
      status.textContent = t('Match created. Keep the codes and share only each player’s own code.',
        'Partie créée. Garde les codes et partage avec chaque joueur uniquement le sien.');
      onCreated(result.matchId, invited[0].code, scenarios.find(item => item.id === settings.scenario)?.name, settings.players);
      previousRequest = undefined;
    } catch {
      status.textContent = t('Could not create the match. Try again.', 'La création a échoué. Réessaie.');
    } finally { pending = false; render(); }
  }
  players.addEventListener('change', () => void listMaps());
  map.addEventListener('change', showCastles);
  return button => {
    if (!section.contains(button)) return false;
    if (button === open) void listMaps();
    if (button === submit) void create();
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
