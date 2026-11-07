import {scenarioSize} from './scenario-details.mjs';

const standardSizes = ['S', 'M', 'L', 'XL', 'H', 'XH', 'G'];
const searchKey = text => text.toLocaleLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

export function mountScenarioFilters(root) {
  const search = root.querySelector('input[type=search]');
  const empty = root.querySelector('.lobby-picker-empty');
  const panel = document.createElement('div');
  panel.className = 'scenario-filters';
  panel.innerHTML = `
    <details>
      <summary data-filter-summary></summary>
      <div class="scenario-filter-fields">
        <label><span></span><select data-filter="size"></select></label>
        <label><span></span><select data-filter="players"></select></label>
        <label><span></span><select data-filter="humans"></select></label>
        <label><span></span><select data-filter="computers"></select></label>
        <label><span></span><select data-filter="faction"></select></label>
      </div>
    </details>
    <div class="scenario-filter-status"><span role="status"></span><button type="button" data-filter-reset hidden></button></div>`;
  search.closest('label').after(panel);
  const disclosure = panel.querySelector('details');
  const summary = panel.querySelector('summary');
  const count = panel.querySelector('[role=status]');
  const reset = panel.querySelector('[data-filter-reset]');
  const size = panel.querySelector('[data-filter=size]');
  const players = panel.querySelector('[data-filter=players]');
  const humans = panel.querySelector('[data-filter=humans]');
  const computers = panel.querySelector('[data-filter=computers]');
  const faction = panel.querySelector('[data-filter=faction]');
  const fields = [...panel.querySelectorAll('select')];
  const countsFor = map => map.humanCounts ?? (Number.isInteger(map.humans) ? [map.humans] : []);
  let rows = [], fr = false;
  const t = (en, french) => fr ? french : en;

  function apply() {
    const query = searchKey(search.value.trim());
    let visible = 0;
    for (const {row, name, map, showComposition} of rows) {
      const humanCount = matchingHumans(map);
      const match = name.includes(query) &&
        (!size.value || size.value === scenarioSize(map)) &&
        (!players.value || Number(players.value) === map.players) &&
        ((!humans.value && !computers.value) || humanCount !== undefined) &&
        (!faction.value || faction.value === (map.castleChoices > 0 ? 'choice' : map.castleChoices === 0 ? 'fixed' : ''));
      row.hidden = !match;
      if (match) {
        visible++;
        showComposition?.(humanCount);
      }
    }
    const active = fields.filter(select => select.value).length;
    summary.textContent = t('Filters', 'Filtres') + (active ? ` (${active})` : '');
    count.textContent = fr ? `${visible} ${visible === 1 ? 'carte' : 'cartes'}` : `${visible} ${visible === 1 ? 'map' : 'maps'}`;
    empty.hidden = visible > 0;
    reset.hidden = !active && !query;
  }

  function matchingHumans(map) {
    return countsFor(map).find(value =>
      (!humans.value || Number(humans.value) === value) &&
      (!computers.value || Number(computers.value) === map.players - value));
  }

  function countOptions(values) {
    return [...new Set(values.filter(Number.isInteger))].sort((a, b) => a - b).map(value => [value, value]);
  }

  function setOptions(select, label, options) {
    const selected = select.value;
    select.previousElementSibling.textContent = label;
    select.replaceChildren(new Option(t('Any', 'Indifférent'), ''), ...options.map(([value, text]) => new Option(text, value)));
    select.value = options.some(([value]) => String(value) === selected) ? selected : '';
  }

  function clear() {
    search.value = '';
    for (const field of fields) field.value = '';
    apply();
  }
  function resetFilters() {
    clear();
    summary.focus({preventScroll: true});
  }
  reset.addEventListener('click', resetFilters);
  search.addEventListener('input', apply);
  panel.addEventListener('change', apply);

  return {
    clear,
    matchingHumans,
    get compositionFiltered() { return Boolean(humans.value || computers.value); },
    reset: resetFilters,
    update(entries, {french = false, enabled = true} = {}) {
      fr = french;
      rows = entries.map(({row, map = {}, showComposition}) => ({
        row, map, showComposition, name: searchKey(row.querySelector('.lobby-choice-name').textContent),
      }));
      panel.hidden = !enabled;
      if (!enabled) {
        disclosure.open = false;
        clear();
        return;
      }
      const sizes = [...new Set(rows.map(({map}) => scenarioSize(map)).filter(Boolean))];
      const ordered = standardSizes.filter(value => sizes.includes(value)).concat(sizes.filter(value => !standardSizes.includes(value)));
      setOptions(size, t('Size', 'Taille'), ordered.map(value => [value, value]));
      setOptions(players, t('Players', 'Joueurs'), countOptions(rows.map(({map}) => map.players)));
      setOptions(humans, t('Humans', 'Humains'), countOptions(rows.flatMap(({map}) => countsFor(map))));
      setOptions(computers, t('Computers', 'Ordinateurs'),
        countOptions(rows.flatMap(({map}) => countsFor(map).map(value => map.players - value))));
      setOptions(faction, t('Faction', 'Faction'), [['choice', t('Choice', 'Au choix')], ['fixed', t('Fixed', 'Imposée')]]);
      empty.textContent = t('No maps match your filters.', 'Aucune carte ne correspond à ces filtres.');
      reset.textContent = t('Reset', 'Réinitialiser');
      apply();
    },
  };
}
