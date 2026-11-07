import {plainGameText} from './game-text.mjs';
import {creaturePortrait} from './creature-portraits.mjs';
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
const isGrail = building => building.key?.split(':').at(-1) === 'grail';
const constructionReason = building => building.needsGrail && building.state !== 2
  ? 'Amène un héros qui porte le Graal dans cette ville.'
  : buildReason(building.state);
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
  const images = new Map(), urls = new Map(), townProjects = new Map();
  let tab = 'unbuilt', filter = '', selected = null, lockedOpen = false;
  let signature, listScroll = 0, pending, preloadedFaction, unlockRoute = null, project = null, construction, constructionTimer;
  const routePriority = building => building.allowed ? 0 : building.state === 6 || building.state === 5 ? 1 : 2;
  function routeBuildings(state, target) {
    if (!target || target.built) return [];
    const missing = new Set(target.missingPrerequisites || []);
    return (state.buildings || []).filter(building => missing.has(building.id) && !building.built && !isGrail(building))
      .sort((a, b) => routePriority(a) - routePriority(b) ||
        (a.missingPrerequisites?.length || 0) - (b.missingPrerequisites?.length || 0)).concat(target);
  }
  function rememberProject(state, value) {
    project = value;
    if (unlockRoute || !Number.isInteger(state.armyTownId)) return;
    if (value) townProjects.set(state.armyTownId, value);
    else townProjects.delete(state.armyTownId);
  }
  function prerequisites(state, building) {
    if (!building || ![8, 9].includes(building.state)) return [];
    return routeBuildings(state, building).filter(item => item.id !== building.id);
  }
  function projectHeader(state, building) {
    const current = project || (prerequisites(state, building).length ?
      {id: building.id, steps: routeBuildings(state, building).map(item => item.id)} : null);
    const goal = current && state.buildings?.find(item => item.id === current.id);
    if (!goal) return '';
    const byId = new Map(state.buildings.map(item => [item.id, item]));
    const steps = current.steps.map(id => byId.get(id)).filter(Boolean);
    return `<section class="building-project" aria-label="Objectif de construction">
      <div><span>Objectif</span> · <strong>${escape(displayName(goal))}</strong></div>
      <ol>${steps.map((item, index) => `<li ${item.id === building?.id ? 'aria-current="step"' : ''} ${item.built ? 'data-built' : ''}>
        ${item.built ? '✓' : index + 1 + ' ·'} ${escape(displayName(item))}</li>`).join('')}</ol>
    </section>`;
  }
  function clearConstruction() {
    clearTimeout(constructionTimer);
    construction = undefined;
  }
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
    if (state.mode !== 'town' && state.mode !== 'fort') return [];
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
      building.allowed ? cost(state, building) : `<small>${escape(constructionReason(building))}</small>`;
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
    const grail = buildings.find(isGrail);
    const available = tab === 'unbuilt' ? visible.filter(building => state.turn && building.allowed) : [];
    const other = visible.filter(building => !available.includes(building));
    const grouped = categories.map(name => group(state, name, other.filter(building => category(building) === name))).join('');
    const collapse = available.length && other.length && !filter;
    return `<div class="building-controls"><div class="building-tabs" role="group" aria-label="Bâtiments">
      <button type="button" data-building-tab="built" aria-pressed="${tab === 'built'}">${count('Construits', builtCount)}</button>
      <button type="button" data-building-tab="unbuilt" aria-pressed="${tab === 'unbuilt'}">${count('À construire', buildings.length - builtCount)}</button>
      ${grail ? '<button type="button" data-building-grail>Graal</button>' : ''}
      </div><div class="building-filters" role="group" aria-label="Familles de bâtiments">
      ${filters.map(name => `<button type="button" data-building-filter="${name}" aria-pressed="${name === filter}">${name || 'Tous'}</button>`).join('')}
      </div></div>
      ${tab === 'unbuilt' && !state.turn ? '<p>Disponible à ton tour</p>' : ''}
      ${group(state, 'Disponibles maintenant', available)}
      ${collapse ? `<details class="building-locked" ${lockedOpen ? 'open' : ''}><summary>${count('À débloquer', other.length)}</summary>${grouped}</details>` : grouped}
      ${visible.length ? '' : `<p>${tab === 'built' ? 'Aucun bâtiment construit.' : 'Tous les bâtiments sont déjà construits.'}</p>`}`;
  }
  function detail(state, building) {
    const reason = building.built ? '' : !building.allowed ? constructionReason(building) : !state.turn ? 'Disponible à ton tour' : '';
    const descriptions = [...new Set((building.variants || [building]).map(description).filter(Boolean))];
    const effects = descriptions.length > 1 ? `<h4>Effets selon la variante</h4><ul>${descriptions.map(text => `<li>${escape(text)}</li>`).join('')}</ul>` :
      (descriptions.length ? `<p>${escape(descriptions[0])}</p>` : '');
    const prerequisite = prerequisites(state, building)[0];
    const blocker = prerequisite ? `<div class="building-prerequisite"><strong>Construis d’abord</strong>
      <span>${escape(displayName(prerequisite))}</span></div>
      <button type="button" class="primary" data-building-prerequisite="${prerequisite.id}">
        <span>Aller à</span> ${escape(displayName(prerequisite))} ›</button>` :
      (reason ? `<p class="building-reason">${escape(project && building.state === 5 ?
        'La ville a déjà construit aujourd’hui. Tu pourras reprendre demain.' : reason)}</p>` : '');
    const returnToGoal = project && project.id !== building.id ?
      '<button type="button" data-building-goal>← Revenir à l’objectif</button>' : '';
    const unit = building.unlocksCreature;
    const key = building.key?.split(':').at(-1);
    const growth = key === 'citadel' ? 50 : key === 'castle' ? 100 : 0;
    const benefit = unit ? `<div class="building-benefit-creature">${creaturePortrait(unit)}<div>
          <strong>${escape(unit.name)}</strong><p>🔒 Actuellement verrouillée</p></div></div>` :
      (growth ? `<strong><span>Croissance de base des créatures</span> +${growth} %</strong>` : '');
    return `<article class="building-detail">${picture(state, building)}
        <div><h3>${escape(displayName(building))}</h3>
        ${!building.built && (benefit || effects) ? `<section class="building-benefit">
          <h4>${unit ? 'Se débloque après construction' : 'Après construction'}</h4>
          ${benefit}${effects}</section>` : effects}
        ${building.built ? '' : cost(state, building)}
        ${blocker}
        ${prerequisite || unlockRoute && building.built ? '' : `<button type="button" class="primary" data-building-action ${reason || construction !== undefined ? 'disabled' : ''}>${construction === building.id ? 'Construction en cours…' : building.built ? 'Voir' : isGrail(building) ? 'Installer le Graal' : 'Construire'}</button>`}
        ${returnToGoal}</div></article>`;
  }
  function render(state) {
    const buildings = buildingCards(visibleBuildings(state.buildings));
    const building = (unlockRoute ? state.buildings : buildings)?.find(item => item.id === selected);
    const panel = document.createElement('div');
    panel.className = 'building-menu';
    const completedUnlock = unlockRoute && building?.id === unlockRoute.id && building.built
      ? `<p role="status"><span>Créature débloquée</span> · ${escape(unlockRoute.name)}</p>
        <button type="button" data-building-return>← Retour au recrutement</button>` : '';
    panel.innerHTML = building
      ? projectHeader(state, building) + detail(state, building) + completedUnlock
      : list(state, buildings);
    body.replaceChildren(panel);
    const locked = panel.querySelector('.building-locked');
    locked?.addEventListener('toggle', () => { if (locked.isConnected) lockedOpen = locked.open; });
    panel.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button || button.disabled) return;
      const current = getState();
      if (current.mode !== (unlockRoute ? 'fort' : 'town')) return;
      if (button.hasAttribute('data-building-return')) { closeSheet(); return; }
      const {buildingTab, buildingFilter, buildingId, buildingPrerequisite} = button.dataset;
      if (buildingPrerequisite !== undefined) {
        const item = current.buildings?.find(record => record.id === selected);
        const steps = routeBuildings(current, item);
        const next = steps.find(record => record.id === Number(buildingPrerequisite));
        if (!next || !item || next.id === item.id) return;
        if (!project) rememberProject(current, {id: item.id, steps: steps.map(record => record.id)});
        selectProjectBuilding(current, next.id);
      } else if (button.hasAttribute('data-building-goal') && project) {
        selectProjectBuilding(current, project.id);
      } else if (buildingTab !== undefined || buildingFilter !== undefined) {
        if (buildingTab !== undefined) { tab = buildingTab; filter = ''; }
        else filter = buildingFilter;
        lockedOpen = false;
        render(current);
        body.scrollTop = 0;
        body.querySelector(buildingTab !== undefined ? '[data-building-tab][aria-pressed=true]' : '[data-building-filter][aria-pressed=true]')?.focus({preventScroll:true});
      } else if (buildingId !== undefined || button.hasAttribute('data-building-grail')) {
        selected = buildingId !== undefined ? Number(buildingId) : current.buildings?.find(isGrail)?.id;
        if (selected === undefined) { selected = null; return; }
        listScroll = body.scrollTop;
        render(current);
        body.scrollTop = 0;
        backButton.focus({preventScroll:true});
      } else if (button.hasAttribute('data-building-action')) {
        const item = current.buildings?.find(record => record.id === selected);
        if (item?.built) { closeSheet(); command(39, item.id); }
        else if (item?.allowed && current.turn && construction === undefined) {
          if (project && !isGrail(item)) {
            construction = item.id;
            constructionTimer = setTimeout(() => {
              clearConstruction();
              update(getState());
              notify('Construction non confirmée.');
            }, 8000);
            update(current);
            command(8, item.id);
          } else {
            command(8, item.id);
            closeSheet();
            if (!isGrail(item)) notify('Construction demandée : ' + plainGameText(item.name));
          }
        }
      }
    });
  }
  function selectProjectBuilding(state, id) {
    selected = id;
    render(state);
    body.scrollTop = 0;
    backButton.focus({preventScroll:true});
  }
  function update(state) {
    const completed = construction === undefined ? null : state.buildings?.find(item => item.id === construction && item.built);
    if (completed) {
      clearConstruction();
      if (project) {
        selected = project.id;
        if (!unlockRoute && completed.id === project.id) rememberProject(state, null);
        body.scrollTop = 0;
      }
      notify('Bâtiment construit · ' + plainGameText(completed.name));
    }
    const next = JSON.stringify([state.turn, state.buildings, construction]);
    if (next === signature) return;
    signature = next;
    const scroll = body.scrollTop;
    const focus = document.activeElement;
    const selector = ['data-building-action','data-building-prerequisite','data-building-goal','data-building-id','data-building-tab','data-building-filter']
      .find(attribute => body.contains(focus) && focus.hasAttribute(attribute));
    const value = selector && focus.getAttribute(selector);
    render(state);
    body.scrollTop = scroll;
    if (selector) [...body.querySelectorAll(`[${selector}]`)].find(button => button.getAttribute(selector) === value)?.focus({preventScroll:true});
  }
  async function open(route = null) {
    const state = getState();
    if (!canOpen(route) || pending) return;
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
    const current = getState();
    if (!canOpen(route) || current.townName !== state.townName) return;
    const target = route && current.buildings?.find(item => item.id === route.id);
    if (route && !target) return;
    unlockRoute = route;
    if (target) project = {id: target.id, steps: routeBuildings(current, target).map(item => item.id)};
    else {
      project = townProjects.get(current.armyTownId) ?? null;
      if (project && !current.buildings?.some(item => item.id === project.id && !item.built)) rememberProject(current, null);
    }
    tab = 'unbuilt'; filter = ''; selected = project?.id ?? null; lockedOpen = false; signature = undefined;
    openSheet('build', 'Bâtiments');
    update(getState());
    body.scrollTop = 0;
  }
  function back() {
    if (selected === null) return false;
    const state = getState();
    if (project && selected !== project.id) {
      selectProjectBuilding(state, project.id);
      return true;
    }
    if (unlockRoute) return false;
    if (project) rememberProject(state, null);
    const id = selected;
    selected = null;
    render(getState());
    body.scrollTop = listScroll;
    const tile = body.querySelector(`[data-building-id="${id}"]`);
    const target = tile?.getClientRects().length ? tile : body.querySelector('[data-building-grail]');
    target?.focus({preventScroll:true});
    return true;
  }
  return {warm, open, update, back, cancel(resetProjects = false) {
    pending = null;
    clearConstruction();
    const route = unlockRoute;
    unlockRoute = project = null;
    if (resetProjects) townProjects.clear();
    return route;
  }};
}
