import {getLanguage} from './i18n.mjs';
import {spellIconURL} from './spell-icons.mjs';

const escapeText = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));
const pageSize = 6;

export function createMageGuild({root, command, pointer}) {
  const panel = document.createElement('section');
  panel.className = 'mobile-mage-guild';
  panel.hidden = true;
  root.querySelector('.mobile-play').append(panel);

  let guild, level = 1, page = 0, signature = '';
  function render() {
    const fr = getLanguage() === 'fr';
    const title = fr ? 'Guilde des sortilèges' : 'Mage Guild';
    const spells = (guild.spells || []).filter(spell => spell.level === level);
    const pages = Math.max(1, Math.ceil(spells.length / pageSize));
    page = Math.min(page, pages - 1);
    panel.setAttribute('aria-label', title);
    panel.innerHTML = `
      <header><h2>${title}</h2><button data-guild-close aria-label="${fr ? 'Fermer' : 'Close'}">✕</button></header>
      <nav aria-label="${fr ? 'Niveaux de sorts' : 'Spell levels'}">${Array.from({length: guild.levels}, (_, i) => {
        const number = i + 1, name = (fr ? 'Niveau ' : 'Level ') + number;
        const locked = number > guild.built && !guild.allSpells;
        return `<button data-guild-level="${number}" aria-pressed="${number === level}" aria-label="${name}${locked ? (fr ? ' · non construit' : ' · not built') : ''}">${number}</button>`;
      }).join('')}</nav>
      <div class="mage-guild-spells">
        ${guild.allSpells ? `<button data-guild-all>${fr ? 'Tous les sorts' : 'All spells'}</button>` :
          spells.length ? spells.slice(page * pageSize, (page + 1) * pageSize).map(spell =>
            `<button data-guild-spell="${spell.id}"><img src="${spellIconURL(spell.id)}" alt=""><span>${escapeText(spell.name)}</span></button>`).join('') :
            `<p>${level > guild.built ? (fr ? 'Construis ce niveau de guilde pour accéder à ses sorts.' : 'Build this guild level to unlock its spells.') :
              (fr ? 'Aucun sort à ce niveau.' : 'No spells at this level.')}</p>`}
      </div>
      ${pages > 1 ? `<footer><button data-guild-page="-1" ${page === 0 ? 'disabled' : ''}>←</button><span>${page + 1} / ${pages}</span><button data-guild-page="1" ${page + 1 === pages ? 'disabled' : ''}>→</button></footer>` : ''}`;
  }

  panel.addEventListener('error', event => {
    if (event.target instanceof HTMLImageElement) event.target.hidden = true;
  }, true);
  panel.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || panel.hidden) return;
    if (button.hasAttribute('data-guild-close')) command(0);
    if (button.dataset.guildLevel) {
      level = Number(button.dataset.guildLevel);
      page = 0;
      render();
      panel.querySelector('[aria-pressed=true]').focus({preventScroll: true});
    }
    if (button.dataset.guildPage) {
      page += Number(button.dataset.guildPage);
      render();
    }
    if (button.hasAttribute('data-guild-all')) pointer(guild.allSpells, 1);
    if (button.dataset.guildSpell) {
      const spell = guild.spells.find(item => item.id === Number(button.dataset.guildSpell) && item.level === level);
      if (spell) pointer(spell, 1);
    }
  });

  return {
    update(state) {
      panel.hidden = state.mode !== 'mage-guild';
      if (panel.hidden) return;
      const next = state.mageGuild;
      if (next.town !== guild?.town || level > next.levels) { level = 1; page = 0; }
      guild = next;
      const key = JSON.stringify(guild);
      if (key === signature) return;
      signature = key;
      render();
    },
    get active() { return !panel.hidden; },
  };
}
