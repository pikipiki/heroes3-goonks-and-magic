import {useScreenComponents,renderMarkup} from './ui/material-components.mjs';
import {createNativeViewport} from './ui/native-viewport.mjs';
import {getLanguage} from './locale-state.mjs';
import {spellIconURL} from './spell-icons.mjs';
import {plainGameText} from './game-text.mjs';
import {townBuildingCardImage} from './town-portrait.mjs';

const escapeText = value => plainGameText(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

export function createMageGuild({root, command, pointer, resetView, asset}) {
  const panel = document.createElement('section');
  panel.className = 'mobile-mage-guild';useScreenComponents(panel);
  panel.hidden = true;
  root.querySelector('.mobile-play').append(panel);

  const nativeViewport = createNativeViewport(root.querySelector('#mobile-scene'), {className:'mage-guild-native-viewport ui-screen-content'});
  let guild, level = 1, selectedId, signature = '', classic = false;
  function render() {
    const fr = getLanguage() === 'fr';
    const t = (french, english) => fr ? french : english;
    const title = t('Tour de magie', 'Mage Guild');
    const spells = (guild.spells || []).filter(spell => spell.level === level);
    const visible = spells;
    const selected = visible.find(spell => spell.id === selectedId) || visible[0];
    const floorCount = Math.max(1, Number(guild.levels)||1);
    const built = Number(guild.built) || 0;
    const status = number => guild.allSpells || number <= built ? 'open' :
      number <= guild.levels ? 'sealed' : 'unavailable';
    const viewLabel = classic ? t('Vue mobile', 'Mobile view') : t('Vue classique', 'Classic view');
    const illustration = townBuildingCardImage({townFaction: guild.faction}, {key: 'mageGuild' + Math.max(1, built)}, asset);
    const header = `<header>${illustration ? `<img class="mage-guild-title-art" src="${escapeText(illustration)}" alt="">` : ''}<h2>${title}</h2><button type="button" data-guild-view>${viewLabel}</button>
      <button type="button" data-guild-close aria-label="${t('Fermer', 'Close')}">✕</button></header>`;
    panel.setAttribute('aria-label', title);
    if (classic) {
      nativeViewport.restore();
      renderMarkup(panel,header);
      nativeViewport.mount(panel);
      return;
    }
    nativeViewport.restore();

    const levelLabel = t('Niveau', 'Level');
    const shelf = status(level);
    const emptyText = shelf === 'unavailable' ? t('Cette faction ne peut pas construire ce niveau.', 'This faction cannot build this guild level.') :
      shelf === 'sealed' ? t('Construis ce niveau de la guilde pour découvrir ses sorts.', 'Build this guild level to discover its spells.') :
      t('Aucun sort à ce niveau.', 'No spells at this level.');
    const shellKey = JSON.stringify([fr, floorCount, built, guild.town, illustration]);
    if (panel.dataset.guildShell !== shellKey || !panel.querySelector('[data-guild-level-select]')) {
      renderMarkup(panel,`${header}
        <div class="mage-guild-level-field" translate="no"><select data-guild-level-select aria-label="${t('Niveau de magie','Spell level')}">${Array.from({length:floorCount},(_,i)=>{const number=i+1;return `<option value="${number}" ${number===level?'selected':''}>${levelLabel} ${number}</option>`;}).join('')}</select></div>
        <div class="mage-guild-library"><section class="mage-guild-shelf"></section></div>`);
      panel.dataset.guildShell = shellKey;
    }
    const field = panel.querySelector('[data-guild-level-select]');
    field.value = String(level);
    const shelfPanel = panel.querySelector('.mage-guild-shelf');
    shelfPanel.setAttribute('aria-label', `${t('Niveau de magie','Spell level')} ${level}`);
    renderMarkup(shelfPanel,`
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
`);
  }

  window.addEventListener('goonk-language',()=>{ if (guild && !panel.hidden) render(); });

  panel.addEventListener('change',event=>{
    if(!event.target.matches('[data-guild-level-select]'))return;
    level=Number(event.target.value);selectedId=undefined;render();
  });
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
        nativeViewport.restore();
        if (state.mode === 'town' && classic) {
          classic = false;
          signature = '';
        }
        delete root.dataset.mageGuildView;
        return;
      }
      root.dataset.mageGuildView = classic ? 'classic' : 'mobile';
      const next = state.mageGuild;
      if (next.town !== guild?.town || level > Math.max(1, next.levels)) { level = 1; selectedId = undefined; }
      guild = next;
      const key = JSON.stringify(guild);
      if (key === signature) { if(classic) nativeViewport.mount(panel); return; }
      signature = key;
      render();
    },
    get active() { return !panel.hidden && !classic; },
  };
}
