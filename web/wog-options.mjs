import {getLanguage} from './i18n.mjs';

const rules = [
  ['Commanders', 'Commandants', 'A commander accompanies each eligible hero.', 'Un commandant accompagne chaque héros compatible.'],
  ['Troop experience', 'Expérience des troupes', 'Troops gain ranks and their associated abilities.', 'Les troupes gagnent des rangs et les capacités associées.'],
  ['WoG map replacements', 'Transformations de la carte WoG', 'Apply the source replacement rules when a new adventure starts.', 'Appliquer les règles de remplacement d’origine au début de l’aventure.'],
  ['Two buildings per day', 'Deux constructions par jour', 'Each town can construct up to two buildings a day.', 'Chaque ville peut construire jusqu’à deux bâtiments par jour.'],
  ['Fourth creature upgrades', 'Quatrièmes évolutions', 'Enable the fourth level-seven variant in the nine original towns.', 'Activer la quatrième variante de niveau sept dans les neuf villes d’origine.'],
  ['Eighth creature families', 'Huitièmes familles de créatures', 'Enable the additional creature tier in the nine original towns.', 'Activer le rang de créatures supplémentaire dans les neuf villes d’origine.'],
];

export function createWogOptions({menu, command, onChange}) {
  let form, pending = null, timer, language, error = '';
  const fields = [];
  function finish(message = '') {
    clearTimeout(timer);
    pending = null;
    error = message;
  }
  function mount() {
    form = document.createElement('details');
    form.className = 'wog-options lobby-panel';
    form.innerHTML = '<summary></summary><div class="lobby-panel-body"><p class="lobby-help"></p><div class="wog-rules"></div><p class="wog-options-status" role="status"></p></div>';
    fields.length = 0;
    for (let index = 0; index < rules.length; index++) {
      const field = document.createElement('fieldset');
      field.innerHTML = `<legend></legend><p class="lobby-help"></p><div class="wog-rule-choices">${[-1, 1, 0].map(value => `<label><input type="radio" name="wog-${index}" data-wog-option="${index}" value="${value}"><span></span></label>`).join('')}</div>`;
      fields.push(field);
      form.querySelector('.wog-rules').append(field);
    }
    form.addEventListener('change', event => {
      const input = event.target.closest('input[data-wog-option]');
      if (!input || input.disabled || pending) return;
      const request = {index: Number(input.dataset.wogOption), value: Number(input.value)};
      pending = request;
      error = '';
      timer = setTimeout(() => {
        finish(getLanguage() === 'fr' ? 'Réglage non confirmé. Réessaie.' : 'Setting was not confirmed. Please retry.');
        onChange();
      }, 10000);
      onChange();
      command(109, request.index, request.value);
    });
    menu.querySelector('.lobby-extra-options').append(form);
    language = null;
  }
  return {
    get pending() { return pending !== null; },
    observe(state) {
      if (state.mode !== 'lobby') finish();
      else if (pending && state.wogOptions?.[pending.index] === pending.value) finish();
    },
    update(state, busy = false) {
      const visible = state.mode === 'lobby' && state.wogOptionsEditable && state.wogOptions?.length === rules.length;
      if (!visible) { if (form?.isConnected && !form.hidden) form.hidden = true; return; }
      if (!form?.isConnected) mount();
      if (form.hidden) form.hidden = false;
      const fr = getLanguage() === 'fr';
      if (language !== fr) {
        language = fr;
        form.querySelector('summary').textContent = 'Options WoG';
        form.querySelector('.lobby-panel-body > p').textContent = fr
          ? '« Carte » conserve les règles de son auteur. Ces choix concernent uniquement la nouvelle partie et sont enregistrés avec sa sauvegarde.'
          : '“Map” keeps the author’s rules. These choices apply only to the new game and are stored in its save.';
        fields.forEach((field, index) => {
          field.querySelector('legend').textContent = rules[index][fr ? 1 : 0];
          field.querySelector('p').textContent = rules[index][fr ? 3 : 2];
          [...field.querySelectorAll('span')].forEach((span, i) => { span.textContent = (fr ? ['Carte', 'Oui', 'Non'] : ['Map', 'On', 'Off'])[i]; });
        });
      }
      fields.forEach((field, index) => {
        const disabled = busy || !!pending || !state.lobbyReady;
        if (field.disabled !== disabled) field.disabled = disabled;
        for (const input of field.querySelectorAll('input')) {
          const checked = Number(input.value) === (pending?.index === index ? pending.value : state.wogOptions[index]);
          if (input.checked !== checked) input.checked = checked;
        }
      });
      const status = form.querySelector('[role=status]');
      const message = error || (pending ? fr ? 'Application du réglage…' : 'Applying setting…' : '');
      if (status.textContent !== message) status.textContent = message;
      const busyValue = String(!!pending);
      if (form.getAttribute('aria-busy') !== busyValue) form.setAttribute('aria-busy', busyValue);
    },
  };
}
