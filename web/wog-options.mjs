import {getLanguage} from './i18n.mjs';
import {radioChoicesMarkup} from './ui/components.mjs';

const rules = [
  ['Commanders', 'Commandants', 'A commander accompanies each eligible hero.', 'Un commandant accompagne chaque héros compatible.'],
  ['Troop experience', 'Expérience des troupes', 'Troops gain ranks and their associated abilities.', 'Les troupes gagnent des rangs et les capacités associées.'],
  ['WoG map replacements', 'Transformations de la carte WoG', 'Apply the source replacement rules when a new adventure starts.', 'Appliquer les règles de remplacement d’origine au début de l’aventure.'],
  ['Two buildings per day', 'Deux constructions par jour', 'Each town can construct up to two buildings a day.', 'Chaque ville peut construire jusqu’à deux bâtiments par jour.'],
  ['Fourth creature upgrades', 'Quatrièmes évolutions', 'Enable the fourth level-seven variant in the nine original towns.', 'Activer la quatrième variante de niveau sept dans les neuf villes d’origine.'],
  ['Eighth creature families', 'Huitièmes familles de créatures', 'Enable the additional creature tier in the nine original towns.', 'Activer le rang de créatures supplémentaire dans les neuf villes d’origine.'],
  ['Mithril enhancements', 'Améliorations au mithril', 'Spend mithril to enhance sites and towns.', 'Dépenser du mithril pour améliorer les sites et les villes.'],
  ['Daily magic plains', 'Plaines magiques quotidiennes', 'Heroes create magic plains each day on eligible tiles.', 'Les héros créent des plaines magiques chaque jour sur les cases compatibles.'],
  ['All creatures attack twice', 'Deux attaques pour toutes les créatures', 'Eligible creatures gain a second attack.', 'Les créatures compatibles gagnent une seconde attaque.'],
  ['Double hero movement', 'Déplacement des héros doublé', 'Double hero movement on land and at sea.', 'Doubler les déplacements des héros sur terre et en mer.'],
  ['Mines change resources weekly', 'Production des mines modifiée chaque semaine', 'Mines change their resource at the start of each new week.', 'Les mines changent de ressource au début de chaque nouvelle semaine.'],
  ['Multiple Capitols', 'Plusieurs Capitoles', 'Allow a Capitol in every town.', 'Permettre un Capitole dans chaque ville.'],
  ['Breath attacks for all creatures', 'Souffle pour toutes les créatures', 'Eligible creatures strike through two adjacent hexes.', 'Les créatures compatibles frappent à travers deux cases adjacentes.'],
  ['Daily army growth', 'Croissance quotidienne des armées', 'Original hero stacks grow by 4% each day, up to 100,000 creatures.', 'Les groupes des héros d’origine grandissent de 4 % par jour, jusqu’à 100 000 créatures.'],
  ['Grails in all towns', 'Graal dans toutes les villes', 'Build Grails at the start, only if the map contains no Conflux town.', 'Construire les Graals au départ, uniquement si la carte ne contient aucune ville Conflux.'],
  ['Monthly site visits', 'Visites des sites chaque mois', 'Original heroes can revisit stat sites, schools and knowledge sites each month.', 'Les héros d’origine peuvent revisiter les sites de caractéristiques, les écoles et les lieux de savoir chaque mois.'],
  ['Boars in dwellings', 'Sangliers dans les habitations', 'Add twelve boars to eligible original dwellings at the start.', 'Ajouter douze sangliers dans les habitations d’origine compatibles au départ.'],
  ['Grounded fliers without retaliation', 'Créatures volantes au sol sans riposte', 'Flying creatures lose their natural flight and their attacks cannot be retaliated against.', 'Les créatures volantes perdent leur vol naturel et leurs attaques ne provoquent plus de riposte.'],
  ['Inverted creature speeds', 'Vitesses des créatures inversées', 'Invert base speeds around the fastest eligible creature at the start.', 'Inverser les vitesses de base selon la créature compatible la plus rapide au départ.'],
  ['Weekly mithril in gardens and mills', 'Mithril hebdomadaire dans les jardins et moulins', 'Gardens and windmills can yield mithril each Monday. Enhanced mills double their stored weekly reward.', 'Les jardins et moulins à vent peuvent produire du mithril chaque lundi. Les moulins améliorés doublent leur réserve hebdomadaire.'],
  ['Mithril piles and campfires', 'Piles et feux de camp au mithril', 'Place mithril among eligible resource piles and campfires at the start.', 'Placer du mithril parmi les piles de ressources et les feux de camp compatibles au départ.'],
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
      field.innerHTML = `<legend></legend><p class="lobby-help"></p>${radioChoicesMarkup({name:`wog-${index}`,className:"wog-rule-choices",choices:[-1,1,0].map(value=>({value,attributes:`data-wog-option="${index}"`}))})}`;
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
      const visible = state.mode === 'lobby' && state.wogOptionsEditable && state.wogOptions?.length >= 6;
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
        const supported = index < state.wogOptions.length;
        if (field.hidden === supported) field.hidden = !supported;
        const disabled = !supported || busy || !!pending || !state.lobbyReady;
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
