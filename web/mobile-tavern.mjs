import {plainGameText} from './game-text.mjs';
import {getLanguage} from './i18n.mjs';
import {canCloseTavern} from './native-dialog.mjs';

const escape = value => plainGameText(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

export function createMobileTavern({root, command, pointer}) {
  const panel = document.createElement('section');
  panel.className = 'mobile-tavern';
  panel.hidden = true;
  panel.setAttribute('aria-labelledby', 'mobile-tavern-title');
  root.querySelector('.mobile-play').append(panel);
  let state, signature, portraits = [];

  function render() {
    const fr = getLanguage() === 'fr';
    const t = (french, english) => fr ? french : english;
    const tavern = state.tavern || {};
    const heroes = Object.entries(state.tavernHeroes || {});
    const canRecruit = state.turn && tavern.canRecruit;
    const reason = !state.turn ? t('Recrutement disponible à ton tour.', 'You can recruit on your turn.') :
      !canRecruit && heroes.length ? tavern.recruitReason || t('Recrutement indisponible.', 'Recruitment unavailable.') : '';
    const amount = Number.isFinite(tavern.cost) ? new Intl.NumberFormat(fr ? 'fr-FR' : 'en-US').format(tavern.cost) : '';
    const rumorOpen = panel.querySelector('details')?.open;
    panel.innerHTML = `<header class="tavern-header"><h2 id="mobile-tavern-title">${t('Taverne', 'Tavern')}</h2>
      ${amount ? `<span class="tavern-cost"><img src="./web/h3-theme/resource-gold.png" alt="">${amount} ${t('or par héros', 'gold per hero')}</span>` : ''}
      <button type="button" data-tavern-close aria-label="${t('Fermer la taverne', 'Close tavern')}">✕</button></header>
      <div class="tavern-heroes" aria-label="${t('Héros à recruter', 'Heroes for hire')}">
        ${heroes.map(([index, hero]) => `<article class="tavern-hero">
          <div class="tavern-identity"><canvas width="116" height="128" data-tavern-portrait="${index}" aria-hidden="true"></canvas>
            <div><h3>${escape(hero.name)}</h3><p>${escape(hero.className)}${hero.level ? ` · ${t('Niv.', 'Lv.')} ${hero.level}` : ''}</p></div></div>
          <div class="tavern-actions">
            <button type="button" data-tavern-equipment="${index}" aria-label="${t('Équipement de', 'Equipment of')} ${escape(hero.name)}">${t('Équipement', 'Equipment')}</button>
            <button type="button" class="primary" data-tavern-recruit="${index}" aria-label="${t('Recruter', 'Recruit')} ${escape(hero.name)}" ${canRecruit && Number.isInteger(hero.id) ? '' : 'disabled'}>${t('Recruter', 'Recruit')}</button>
          </div></article>`).join('') || `<p>${t('Aucun héros à recruter.', 'No heroes available for hire.')}</p>`}
      </div>
      ${reason ? `<p class="tavern-status" role="status">${escape(reason)}</p>` : ''}
      <footer class="tavern-extras">
        ${tavern.thievesGuild ? `<button type="button" data-tavern-extra="thievesGuild">${t('Guilde des voleurs', 'Thieves’ Guild')}</button>` : ''}
        ${tavern.invite ? `<button type="button" data-tavern-extra="invite">${t('Inviter un héros', 'Invite a hero')}</button>` : ''}
        ${tavern.rumor ? `<details ${rumorOpen ? 'open' : ''}><summary>${t('Rumeur', 'Rumor')}</summary><p>${escape(tavern.rumor)}</p></details>` : ''}
      </footer>`;
    portraits = [...panel.querySelectorAll('[data-tavern-portrait]')].map(canvas => ({
      canvas, context: canvas.getContext('2d'), rect: state.tavernHeroes[canvas.dataset.tavernPortrait].rect,
    }));
  }

  panel.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled || panel.hidden) return;
    const {tavernEquipment, tavernRecruit, tavernExtra} = button.dataset;
    if (button.hasAttribute('data-tavern-close')) command(40);
    else if (tavernEquipment !== undefined && state.tavernHeroes?.[tavernEquipment]) command(72, Number(tavernEquipment));
    else if (tavernRecruit !== undefined && state.turn && state.tavern?.canRecruit) {
      const hero = state.tavernHeroes?.[tavernRecruit];
      if (Number.isInteger(hero?.id)) command(86, Number(tavernRecruit), hero.id);
    } else if (tavernExtra === 'thievesGuild' || tavernExtra === 'invite') {
      const area = state.tavern?.[tavernExtra];
      if (area) pointer({x: Math.floor(area.x + area.w / 2), y: Math.floor(area.y + area.h / 2)}, 1);
    }
  });

  return {
    update(next) {
      state = next;
      panel.hidden = !canCloseTavern(next);
      root.toggleAttribute('data-mobile-tavern', !panel.hidden);
      if (panel.hidden) {
        if (signature === undefined) return;
        signature = undefined;
        portraits = [];
        panel.replaceChildren();
        return;
      }
      const key = JSON.stringify([getLanguage(), next.turn, next.tavern, next.tavernHeroes]);
      if (key !== signature) { signature = key; render(); }
    },
    paint(source) {
      if (panel.hidden) return false;
      const sx = source.width / 800, sy = source.height / 600;
      for (const {canvas, context, rect} of portraits) {
        if (rect?.w > 0 && rect.h > 0) {
          context.drawImage(source, rect.x * sx, rect.y * sy, rect.w * sx, rect.h * sy, 0, 0, canvas.width, canvas.height);
        }
      }
      return true;
    },
  };
}
