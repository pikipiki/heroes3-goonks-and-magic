import {getLanguage} from './i18n.mjs';
import {spellIconURL} from './spell-icons.mjs';
import {plainGameText} from './game-text.mjs';
import {townBuildingCardImage} from './town-portrait.mjs';

const escapeText = value => plainGameText(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));
const pageSize = 6;

export function createMageGuild({root, command, pointer, resetView, asset}) {
  const panel = document.createElement('section');
  panel.className = 'mobile-mage-guild';
  panel.hidden = true;
  root.querySelector('.mobile-play').append(panel);

  let guild, level = 1, page = 0, selectedId, signature = '', classic = false;
  function render() {
    const fr = getLanguage() === 'fr';
    const t = (french, english) => fr ? french : english;
    const title = t('Tour de magie', 'Mage Guild');
    const spells = (guild.spells || []).filter(spell => spell.level === level);
    const pages = Math.max(1, Math.ceil(spells.length / pageSize));
    page = Math.min(page, pages - 1);
    const visible = spells.slice(page * pageSize, (page + 1) * pageSize);
    const selected = visible.find(spell => spell.id === selectedId) || visible[0];
    const floorCount = Math.max(5, guild.levels);
    const built = Number(guild.built) || 0;
    const status = number => guild.allSpells || number <= built ? 'open' :
      number <= guild.levels ? 'sealed' : 'unavailable';
    const viewLabel = classic ? t('Vue mobile', 'Mobile view') : t('Vue classique', 'Classic view');
    const header = `<header><h2>${title}</h2><button type="button" data-guild-view>${viewLabel}</button>
      <button type="button" data-guild-close aria-label="${t('Fermer', 'Close')}">✕</button></header>`;
    panel.setAttribute('aria-label', title);
    if (classic) { panel.innerHTML = header; return; }

    const illustration = townBuildingCardImage({townFaction: guild.faction}, {key: 'mageGuild' + Math.max(1, built)}, asset);
    const levelLabel = t('Niveau', 'Level');
    const shelf = status(level);
    const statusLabel = {open: t('Ouvert', 'Open'), sealed: t('Scellé', 'Sealed'), unavailable: t('Indisponible', 'Unavailable')};
    const emptyText = shelf === 'unavailable' ? t('Cette faction ne peut pas construire ce niveau.', 'This faction cannot build this guild level.') :
      shelf === 'sealed' ? t('Construis ce niveau de la guilde pour découvrir ses sorts.', 'Build this guild level to discover its spells.') :
      t('Aucun sort à ce niveau.', 'No spells at this level.');
    panel.innerHTML = `${header}
      <div class="mage-guild-library">
        <nav aria-label="${t('Étages de la tour', 'Guild floors')}">
          ${Array.from({length: floorCount}, (_, i) => {
            const number = i + 1, state = status(number);
            return `<button type="button" data-guild-level="${number}" data-floor-status="${state}" aria-pressed="${number === level}"
              aria-label="${levelLabel} ${number} · ${statusLabel[state]}"><span>${t('Niv.', 'Lv.')} ${number}</span>
              <span class="mage-guild-seal" aria-hidden="true">${state === 'open' ? '✦' : '◆'}</span></button>`;
          }).join('')}
        </nav>
        <section class="mage-guild-shelf" aria-label="${t('Rayon', 'Shelf')} ${level}">
          <div class="mage-guild-shelf-head"><h3>${t('Rayon', 'Shelf')} ${level} <small>${statusLabel[shelf]}</small></h3>
            ${illustration ? `<img src="${escapeText(illustration)}" alt="">` : ''}</div>
          ${guild.allSpells ? `<div class="mage-guild-empty"><button type="button" data-guild-all>${t('Tous les sorts', 'All spells')}</button></div>` :
            selected ? `<div class="mage-guild-archive">
              <div class="mage-guild-spells">
                ${visible.map(spell => `<button type="button" data-guild-spell="${spell.id}" aria-pressed="${spell.id === selected.id}">
                  <img src="${spellIconURL(spell.id)}" alt=""><span>${escapeText(spell.name)}</span></button>`).join('')}
              </div>
              <div class="mage-guild-detail" aria-live="polite"><h4>${escapeText(selected.name)}</h4>
                ${selected.description ? `<p>${escapeText(selected.description)}</p>` : ''}
                ${guild.canResearch || !selected.description ? `<button type="button" data-guild-inspect="${selected.id}">
                  ${guild.canResearch ? t('Rechercher', 'Research') : t('Voir le sort', 'View spell')}</button>` : ''}
              </div>
            </div>` : `<p class="mage-guild-empty">${emptyText}</p>`}
          ${pages > 1 ? `<footer><button type="button" data-guild-page="-1" aria-label="${t('Page précédente', 'Previous page')}" ${page === 0 ? 'disabled' : ''}>←</button>
            <span>${page + 1} / ${pages}</span><button type="button" data-guild-page="1" aria-label="${t('Page suivante', 'Next page')}" ${page + 1 === pages ? 'disabled' : ''}>→</button></footer>` : ''}
        </section>
      </div>`;
  }

  panel.addEventListener('error', event => {
    if (event.target instanceof HTMLImageElement) event.target.hidden = true;
  }, true);
  panel.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled || panel.hidden) return;
    if (button.hasAttribute('data-guild-close')) command(0);
    if (button.hasAttribute('data-guild-view')) {
      classic = !classic;
      root.dataset.mageGuildView = classic ? 'classic' : 'mobile';
      resetView();
      render();
      panel.querySelector('[data-guild-view]').focus({preventScroll: true});
    }
    if (button.dataset.guildLevel) {
      level = Number(button.dataset.guildLevel);
      page = 0;
      selectedId = undefined;
      render();
      panel.querySelector('[data-guild-level][aria-pressed=true]').focus({preventScroll: true});
    }
    if (button.dataset.guildPage) {
      page += Number(button.dataset.guildPage);
      render();
    }
    if (button.hasAttribute('data-guild-all')) pointer(guild.allSpells, 1);
    if (button.dataset.guildSpell !== undefined) {
      selectedId = Number(button.dataset.guildSpell);
      render();
      panel.querySelector('[data-guild-spell][aria-pressed=true]')?.focus({preventScroll: true});
    }
    if (button.dataset.guildInspect !== undefined) {
      const spell = guild.spells.find(item => item.id === Number(button.dataset.guildInspect) && item.level === level);
      if (spell) pointer(spell, 1);
    }
  });

  return {
    update(state) {
      panel.hidden = state.mode !== 'mage-guild';
      if (panel.hidden) {
        if (state.mode === 'town' && classic) {
          classic = false;
          signature = '';
        }
        delete root.dataset.mageGuildView;
        return;
      }
      root.dataset.mageGuildView = classic ? 'classic' : 'mobile';
      const next = state.mageGuild;
      if (next.town !== guild?.town || level > Math.max(5, next.levels)) { level = 1; page = 0; selectedId = undefined; }
      guild = next;
      const key = JSON.stringify(guild);
      if (key === signature) return;
      signature = key;
      render();
    },
    get active() { return !panel.hidden && !classic; },
  };
}
