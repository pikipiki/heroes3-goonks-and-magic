import {plainGameText} from './game-text.mjs';
import {buildReason} from './mobile-layout.mjs';
import {resourceDescriptors, resourceIconURL} from './resources.mjs';
import {townBuildingCardImage} from './town-portrait.mjs';

const categories = ['Magie', 'Défenses', 'Économie', 'Recrutement', 'Spéciaux'];
const fallback = new URL('./h3-theme/town-hall.png', import.meta.url).href;
const escape = text => String(text ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

function category({key}) {
  const name = String(key ?? '').split(':').at(-1);
  if (/^mageGuild/.test(name)) return 'Magie';
  if (/^(fort|citadel|castle)$/.test(name)) return 'Défenses';
  if (/^(villageHall|townHall|cityHall|capitol|marketplace|resourceSilo)$/.test(name)) return 'Économie';
  if (/^(dwelling|tavern|blacksmith)/.test(name)) return 'Recrutement';
  return 'Spéciaux';
}

const buildingText = text => plainGameText(text).replaceAll('{}', '').trim();
const name = building => buildingText(building.name);
const description = building => buildingText(building.description);
const visibleBuildings = buildings => (buildings || []).filter(building => name(building) || description(building));

function buildingCards(buildings) {
  const groups = new Map();
  return buildings.flatMap(building => {
    const label = name(building);
    if (!building.built || !label) return [building];
    const key = label.toLocaleLowerCase();
    const group = groups.get(key);
    if (group) {
      if (!group.variants.some(variant => description(variant) === description(building))) group.variants.push(building);
      return [];
    }
    const first = {...building, variants: [building]};
    groups.set(key, first);
    return [first];
  });
}

export function createTownBuildingMenu({body, getState, asset, backButton, canOpen, openSheet, closeSheet, command, notify}) {
  const images = new Map(), urls = new Map();
  let tab = 'unbuilt', filter = '', selected = null, lockedOpen = false;
  let signature, listScroll = 0, pending, preloadedFaction;
  function preload(url) {
    if (!images.has(url)) {
      const image = new Image();
      image.src = url;
      const entry = {image, ready: false};
      entry.done = image.decode().then(() => { entry.ready = true; }, () => {});
      images.set(url, entry);
    }
    return images.get(url);
  }
  function artURL(state, building) {
    const key = state.townFaction + '/' + building.key;
    if (!urls.has(key)) {
      const base = state.buildings?.find(item => item.id === building.baseId);
      urls.set(key, townBuildingCardImage(state, building, asset) ||
        (base && townBuildingCardImage(state, base, asset)) || fallback);
    }
    return urls.get(key);
  }
  function warm(state) {
    if (state.mode !== 'town') return [];
    if (preloadedFaction !== state.townFaction) {
      for (const url of images.keys()) if (url !== fallback) images.delete(url);
      preloadedFaction = state.townFaction;
    }
    const resourceArt = resourceDescriptors([0,0,0,0,0,0,0], state.resourceTypes).map(iconURL).filter(Boolean);
    return [preload(fallback), ...resourceArt.map(preload),
      ...visibleBuildings(state.buildings).map(building => preload(artURL(state, building)))];
  }
  function picture(state, building) {
    const url = artURL(state, building);
    const decoded = images.get(url)?.ready ? url : images.get(fallback)?.ready ? fallback : '';
    return decoded ? `<img class="building-card-image" src="${escape(decoded)}" alt="">` : '<span class="building-card-image"></span>';
  }
  const count = (label, amount) => `${label} <span class="building-count">${amount}</span>`;
  const iconURL = resource => resourceIconURL(resource, window.goonkAssetURLs);
  function cost(state, building) {
    const rows = resourceDescriptors(building.cost, state.resourceTypes).filter(resource => resource.value);
    if (!rows.length) return '';
    return `<span class="building-cost">${rows.map(resource => {
      const url = iconURL(resource), name = escape(resource.name);
      return images.get(url)?.ready
        ? `<span role="img" aria-label="${resource.value} ${name}" title="${name}"><img src="${escape(url)}" alt="">${resource.value}</span>`
        : `<span>${resource.value} ${name}</span>`;
    }).join('')}</span>`;
  }
  const displayName = building => name(building) || 'Bâtiment sans nom';
  function tile(state, building) {
    const text = description(building);
    const summary = text.match(/^[\s\S]*?[.!?](?=\s|$)/)?.[0] || text;
    const variants = building.variants?.length ?? 0;
    const caption = building.built ? (variants > 1 ? `<small>${variants} variantes</small>` : '') :
      building.allowed ? cost(state, building) : `<small>${escape(buildReason(building.state))}</small>`;
    return `<button type="button" class="building-tile" data-building-id="${building.id}">${picture(state, building)}
      <strong>${escape(displayName(building))}</strong>
      <span class="building-summary">${escape(summary)}</span>
      ${caption}</button>`;
  }
  function group(state, label, buildings) {
    if (!buildings.length) return '';
    return `<section class="building-group"><h3>${count(label, buildings.length)}</h3>
      <div class="building-cards">${buildings.map(building => tile(state, building)).join('')}</div></section>`;
  }
  function list(state, buildings) {
    const current = buildings.filter(building => Boolean(building.built) === (tab === 'built'));
    const visible = filter ? current.filter(building => category(building) === filter) : current;
    const filters = ['', ...categories.filter(name => current.some(building => category(building) === name))];
    const builtCount = buildings.filter(building => building.built).length;
    const available = tab === 'unbuilt' ? visible.filter(building => state.turn && building.allowed) : [];
    const other = visible.filter(building => !available.includes(building));
    const grouped = categories.map(name => group(state, name, other.filter(building => category(building) === name))).join('');
    const collapse = available.length && other.length && !filter;
    return `<div class="building-controls"><div class="building-tabs" role="group" aria-label="Bâtiments">
      <button type="button" data-building-tab="built" aria-pressed="${tab === 'built'}">${count('Construits', builtCount)}</button>
      <button type="button" data-building-tab="unbuilt" aria-pressed="${tab === 'unbuilt'}">${count('À construire', buildings.length - builtCount)}</button>
      </div><div class="building-filters" role="group" aria-label="Familles de bâtiments">
      ${filters.map(name => `<button type="button" data-building-filter="${name}" aria-pressed="${name === filter}">${name || 'Tous'}</button>`).join('')}
      </div></div>
      ${tab === 'unbuilt' && !state.turn ? '<p>Disponible à ton tour</p>' : ''}
      ${group(state, 'Disponibles maintenant', available)}
      ${collapse ? `<details class="building-locked" ${lockedOpen ? 'open' : ''}><summary>${count('À débloquer', other.length)}</summary>${grouped}</details>` : grouped}
      ${visible.length ? '' : `<p>${tab === 'built' ? 'Aucun bâtiment construit.' : 'Tous les bâtiments sont déjà construits.'}</p>`}`;
  }
  function detail(state, building) {
    const reason = building.built ? '' : !building.allowed ? buildReason(building.state) : !state.turn ? 'Disponible à ton tour' : '';
    const descriptions = [...new Set((building.variants || [building]).map(description).filter(Boolean))];
    const effects = descriptions.length > 1 ? `<h4>Effets selon la variante</h4><ul>${descriptions.map(text => `<li>${escape(text)}</li>`).join('')}</ul>` :
      (descriptions.length ? `<p>${escape(descriptions[0])}</p>` : '');
    return `<article class="building-detail">${picture(state, building)}
        <div><h3>${escape(displayName(building))}</h3>
        ${effects}
        ${building.built ? '' : cost(state, building)}
        ${reason ? `<p class="building-reason">${escape(reason)}</p>` : ''}
        <button type="button" class="primary" data-building-action ${reason ? 'disabled' : ''}>${building.built ? 'Voir' : 'Construire'}</button>
        </div></article>`;
  }
  function render(state) {
    const buildings = buildingCards(visibleBuildings(state.buildings));
    const building = buildings.find(item => item.id === selected);
    const panel = document.createElement('div');
    panel.className = 'building-menu';
    panel.innerHTML = building ? detail(state, building) : list(state, buildings);
    body.replaceChildren(panel);
    const locked = panel.querySelector('.building-locked');
    locked?.addEventListener('toggle', () => { if (locked.isConnected) lockedOpen = locked.open; });
    panel.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button || button.disabled) return;
      const current = getState();
      if (current.mode !== 'town') return;
      const {buildingTab, buildingFilter, buildingId} = button.dataset;
      if (buildingTab !== undefined || buildingFilter !== undefined) {
        if (buildingTab !== undefined) { tab = buildingTab; filter = ''; }
        else filter = buildingFilter;
        lockedOpen = false;
        render(current);
        body.scrollTop = 0;
        body.querySelector(buildingTab !== undefined ? '[data-building-tab][aria-pressed=true]' : '[data-building-filter][aria-pressed=true]')?.focus({preventScroll:true});
      } else if (buildingId !== undefined) {
        selected = Number(buildingId);
        listScroll = body.scrollTop;
        render(current);
        body.scrollTop = 0;
        backButton.focus({preventScroll:true});
      } else if (button.hasAttribute('data-building-action')) {
        const item = current.buildings?.find(record => record.id === selected);
        if (item?.built) { closeSheet(); command(39, item.id); }
        else if (item?.allowed && current.turn) {
          command(8, item.id);
          closeSheet();
          notify('Construction demandée : ' + plainGameText(item.name));
        }
      }
    });
  }
  function update(state) {
    const next = JSON.stringify([state.turn, state.buildings]);
    if (next === signature) return;
    signature = next;
    const scroll = body.scrollTop;
    const focus = document.activeElement;
    const selector = ['data-building-action','data-building-id','data-building-tab','data-building-filter']
      .find(attribute => body.contains(focus) && focus.hasAttribute(attribute));
    const value = selector && focus.getAttribute(selector);
    render(state);
    body.scrollTop = scroll;
    if (selector) [...body.querySelectorAll(`[${selector}]`)].find(button => button.getAttribute(selector) === value)?.focus({preventScroll:true});
  }
  async function open() {
    const state = getState();
    if (!canOpen() || pending) return;
    const request = {};
    pending = request;
    const entries = warm(state);
    if (entries.some(entry => !entry.ready)) {
      let timeout;
      await Promise.race([
        Promise.all(entries.map(entry => entry.done)),
        new Promise(resolve => { timeout = setTimeout(resolve, 1600); }),
      ]);
      clearTimeout(timeout);
    }
    if (pending !== request) return;
    pending = null;
    if (!canOpen() || getState().townName !== state.townName) return;
    tab = 'unbuilt'; filter = ''; selected = null; lockedOpen = false; signature = undefined;
    openSheet('build', 'Bâtiments');
    update(getState());
    body.scrollTop = 0;
  }
  function back() {
    if (selected === null) return false;
    const id = selected;
    selected = null;
    render(getState());
    body.scrollTop = listScroll;
    body.querySelector(`[data-building-id="${id}"]`)?.focus({preventScroll:true});
    return true;
  }
  return {warm, open, update, back, cancel() { pending = null; }};
}
