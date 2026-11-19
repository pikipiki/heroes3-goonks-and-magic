import {useActionDock,renderMarkup} from './ui/material-components.mjs';
import {getLanguage} from './i18n.mjs';
import {plainGameText} from './game-text.mjs';
import {creaturePortrait} from './creature-portraits.mjs';
import {buildReason} from './mobile-layout.mjs';
import {resourceDescriptors, resourceIconURL} from './resources.mjs';
import {townBuildingCardImage} from './town-portrait.mjs';

const tr=(en,fr)=>getLanguage()==='fr'?fr:en;
const categoryLabels={Magie:'Magic','Défenses':'Defenses','Économie':'Economy','Recrutement':'Recruitment','Spéciaux':'Special'};
const goldCost=new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0});
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

const routePriority = building => building.allowed ? 0 : building.state === 6 || building.state === 5 ? 1 : 2;
function routeBuildings(state, target) {
  if (!target || target.built) return [];
  const missing = new Set(target.missingPrerequisites || []);
  return (state.buildings || []).filter(building => missing.has(building.id) && !building.built && !isGrail(building))
    .sort((a, b) => routePriority(a) - routePriority(b) ||
      (a.missingPrerequisites?.length || 0) - (b.missingPrerequisites?.length || 0)).concat(target);
}
function prerequisites(state, building) {
  if (!building || ![8, 9].includes(building.state)) return [];
  return routeBuildings(state, building).filter(item => item.id !== building.id);
}
export function nextBuildingPrerequisite(state, building) {
  return prerequisites(state, building)[0];
}

export function createTownBuildingMenu({body, getState, asset, backButton, canOpen, openSheet, closeSheet, command, notify}) {
  const images = new Map(), urls = new Map(), townProjects = new Map();
  let tab = 'unbuilt', filter = '', selected = null, lockedOpen = false, projectExpanded;
  let commandDock;
  let signature, listScroll = 0, pending, preloadedSignature = '', preloadedEntries = [], unlockRoute = null, project = null, construction, constructionTimer;
  function rememberProject(state, value) {
    project = value;
    if (unlockRoute || !Number.isInteger(state.armyTownId)) return;
    if (value) townProjects.set(state.armyTownId, value);
    else townProjects.delete(state.armyTownId);
  }
  function projectHeader(state, building) {
    const current = project || (prerequisites(state, building).length ?
      {id: building.id, steps: routeBuildings(state, building).map(item => item.id)} : null);
    const goal = current && state.buildings?.find(item => item.id === current.id);
    if (!goal) return '';
    const byId = new Map(state.buildings.map(item => [item.id, item]));
    const steps = current.steps.map(id => byId.get(id)).filter(Boolean);
    const viewport=body.closest('#mobile-app'),wide=viewport&&viewport.clientWidth>viewport.clientHeight&&viewport.clientWidth>=640;
    return `<details ${projectExpanded??wide?'open':''} class="building-project" aria-label="${tr('Construction dependencies','Dépendances de construction')}">
      <summary><span class="building-project-head"><small>${tr('Goal','Objectif')}</small><span>${escape(displayName(goal))}</span></span></summary>
      <ol data-ui-stepper aria-label="${tr('Construction steps','Étapes de construction')}">${steps.map(item=>`<li ${item.id===building?.id?'aria-current="step"':''} ${item.built?'data-built':''}><button type="button" data-building-project-step="${item.id}" ${item.id===building?.id?'aria-current="step"':''}>${escape(displayName(item))}</button></li>`).join('')}</ol>
    </details>`;
  }
  function clearConstruction() {
    clearTimeout(constructionTimer);
    construction = undefined;
  }
  function preload(url) {
    if (!images.has(url)) {
      const image = new Image();
      let done;
      const entry = {image, ready: false, done:new Promise(resolve=>{done=resolve;})};
      const finish=()=>{entry.ready=image.naturalWidth>0;done(entry);};
      image.onload = image.onerror = finish;
      image.src = url;
      if(image.complete)finish();
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
    const nextSignature = `${state.townFaction || ''}:${state.buildings?.length || 0}:${state.resourceTypes?.length || 0}`;
    if (nextSignature === preloadedSignature && preloadedEntries.length) return preloadedEntries;
    preloadedSignature = nextSignature;
    const resourceArt = resourceDescriptors([0,0,0,0,0,0,0], state.resourceTypes).map(iconURL).filter(Boolean);
    preloadedEntries = [preload(fallback), ...resourceArt.map(preload),
      ...visibleBuildings(state.buildings).map(building => preload(artURL(state, building)))];
    return preloadedEntries;
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
      const url = iconURL(resource), name = escape(resource.name),value=resource.key==='gold'?goldCost.format(resource.value).replace(/\u202f/g,' '):String(resource.value);
      return images.get(url)?.ready
        ? `<span role="img" aria-label="${value} ${name}" title="${name}"><img src="${escape(url)}" alt="">${value}</span>`
        : `<span>${value} ${name}</span>`;
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
    return `<div class="building-controls">
      <nav class="building-tabs" data-ui-tabs aria-label="${tr('Building status','État des bâtiments')}">
       <button type="button" data-building-tab="built" aria-pressed="${tab==='built'}">${count(tr('Built','Construits'),builtCount)}</button>
       <button type="button" data-building-tab="unbuilt" aria-pressed="${tab==='unbuilt'}">${count(tr('To build','À construire'),buildings.length-builtCount)}</button>
      </nav>
      <label class="building-category-filter"><span class="building-control-label">${tr('Category','Catégorie')}</span><select data-building-category aria-label="${tr('Building category','Catégorie de bâtiment')}">${filters.map(value=>`<option value="${value}" ${value===filter?'selected':''}>${value?(getLanguage()==='fr'?value:categoryLabels[value]):tr('All','Toutes')}</option>`).join('')}</select></label>
      ${grail?'<button type="button" data-building-grail>Graal</button>':''}
     </div><div class="building-list">
      ${tab==='unbuilt'&&!state.turn?`<p>${tr('Available on your turn','Disponible à ton tour')}</p>`:''}
      ${group(state,tr('Available now','Disponibles maintenant'),available)}
      ${collapse?`<details class="building-locked" ${lockedOpen?'open':''}><summary>${count(tr('To unlock','À débloquer'),other.length)}</summary>${grouped}</details>`:grouped}
      ${visible.length?'':`<p>${tab==='built'?tr('No buildings constructed yet.','Aucun bâtiment construit.'):tr('All buildings are already constructed.','Tous les bâtiments sont déjà construits.')}</p>`}
     </div>`;
  }
  function sideInfo(state,building,completed=''){
   return `<article class="building-side-info" data-dock-cost="${!building.built&&!nextBuildingPrerequisite(state,building)}"><p class="building-availability">${escape(building.built?tr('Already built','Déjà construit'):building.allowed&&state.turn?tr('Ready to build','Prêt à construire'):[8,9].includes(building.state)?tr('To unlock','À débloquer'):tr('Unavailable','Indisponible'))}</p>${building.built?'':`<div class="building-price" aria-label="${tr('Construction cost','Coût de construction')}"><small>${tr('Construction cost','Coût de construction')}</small>${cost(state,building)}</div>`}${completed}</article>`;
  }

  function detail(state, building) {
    const reason = building.built ? '' : !building.allowed ? constructionReason(building) : !state.turn ? 'Disponible à ton tour' : '';
    const descriptions = [...new Set((building.variants || [building]).map(description).filter(Boolean))];
    const effects = descriptions.length > 1 ? `<h4>Effets selon la variante</h4><ul>${descriptions.map(text => `<li>${escape(text)}</li>`).join('')}</ul>` :
      (descriptions.length ? `<p>${escape(descriptions[0])}</p>` : '');
    const prerequisite = nextBuildingPrerequisite(state, building);
    const blocker = prerequisite ? `<div class="building-prerequisite"><strong>Construis d’abord</strong>
      <span>${escape(displayName(prerequisite))}</span></div>
      ` :
      (reason ? `<p class="building-reason">${escape(project && building.state === 5 ?
        'La ville a déjà construit aujourd’hui. Tu pourras reprendre demain.' : reason)}</p>` : '');
    const unit = building.unlocksCreature;
    const key = building.key?.split(':').at(-1);
    const growth = key === 'citadel' ? 50 : key === 'castle' ? 100 : 0;
    const benefit = unit ? `<div class="building-benefit-creature">${creaturePortrait(unit)}<div>
          <strong>${escape(unit.name)}</strong><p>🔒 Actuellement verrouillée</p></div></div>` :
      (growth ? `<strong><span>Croissance de base des créatures</span> +${growth} %</strong>` : '');
    return `<article class="building-detail">${picture(state, building)}
        <div><h3 tabindex="-1">${escape(displayName(building))}</h3>
        ${!building.built && (benefit || effects) ? `<section class="building-benefit">
          <h4>${unit ? 'Se débloque après construction' : 'Après construction'}</h4>
          ${benefit}${effects}</section>` : effects}
        ${blocker}
</div></article>`;
  }
  function actionsFor(state,building){
    if(!building||unlockRoute&&building.built)return '';
    const prerequisite=nextBuildingPrerequisite(state,building);
    if(prerequisite)return `<button type="button" class="primary" data-building-prerequisite="${prerequisite.id}"><span>${tr('Go to','Aller à')} ${escape(displayName(prerequisite))} ›</span></button>`;
    const reason=building.built?'':!building.allowed?constructionReason(building):!state.turn?tr('Available on your turn','Disponible à ton tour'):'';
    return `${building.built?'':`<div class="building-dock-cost" aria-label="${tr('Construction cost','Coût de construction')}">${cost(state,building)}</div>`}<button type="button" class="primary" data-building-action ${reason||construction!==undefined?'disabled':''}>${construction===building.id?tr('Building…','Construction en cours…'):building.built?tr('View','Voir'):isGrail(building)?tr('Install Grail','Installer le Graal'):tr('Build','Construire')}</button>`;
  }
  function render(state) {
    const buildings = buildingCards(visibleBuildings(state.buildings));
    const building = (unlockRoute ? state.buildings : buildings)?.find(item => item.id === selected);
    const panel = document.createElement('div');
    panel.className = 'building-menu';
    const completedUnlock = unlockRoute && building?.id === unlockRoute.id && building.built
      ? `<p class="building-completed" role="status"><span>${tr('Creature unlocked','Créature débloquée')}</span> · ${escape(unlockRoute.name)}</p>` : '';
    renderMarkup(panel,building
      ? '<div class="building-content">'+projectHeader(state, building)+detail(state, building)+'</div>'+sideInfo(state,building,completedUnlock)
      : list(state, buildings));
    commandDock?.remove();commandDock=undefined;
    const sheet=body.closest('.mobile-sheet');
    if(sheet){sheet.dataset.buildingView=building?'detail':'list';sheet.dataset.buildingProject=String(!!panel.querySelector('.building-project'));sheet.dataset.buildingCompleted=String(!!completedUnlock);sheet.dataset.buildingBack=String(!!building&&!completedUnlock&&(!unlockRoute||project&&selected!==project.id));}
    body.replaceChildren(panel);
    const commands=actionsFor(state,building);if(commands&&sheet){commandDock=document.createElement('footer');commandDock.className='building-actions';renderMarkup(commandDock,commands);sheet.append(commandDock);useActionDock(commandDock,{surface:'plain'});}
    if(!building&&document.activeElement===backButton)sheet?.querySelector('[data-ui=close-sheet]')?.focus({preventScroll:true});
    panel.addEventListener('change',event=>{if(!event.target.matches('[data-building-category]'))return;filter=event.target.value;lockedOpen=false;queueMicrotask(()=>{if(!panel.isConnected)return;render(getState());const list=body.querySelector('.building-list');if(list)list.scrollTop=0;requestAnimationFrame(()=>body.querySelector('.building-category-filter [role=combobox]')?.focus({preventScroll:true}));});});
    const goal=panel.querySelector('.building-project');goal?.addEventListener('toggle',()=>{projectExpanded=goal.open;});
    const locked = panel.querySelector('.building-locked');
    locked?.addEventListener('toggle', () => { if (locked.isConnected) lockedOpen = locked.open; });
    const handleClick=event=>{
      const button = event.target.closest('button');
      if (!button || button.disabled) return;
      const current = getState();
      if (current.mode !== (unlockRoute ? 'fort' : 'town')) return;
      if (button.hasAttribute('data-building-return')) { closeSheet(); return; }
      const {buildingTab, buildingFilter, buildingId, buildingPrerequisite} = button.dataset;
      if(button.dataset.buildingProjectStep!==undefined){if(!project){const goal=current.buildings?.find(item=>item.id===selected);if(goal&&prerequisites(current,goal).length)rememberProject(current,{id:goal.id,steps:routeBuildings(current,goal).map(item=>item.id)});}if(!project)return;const id=Number(button.dataset.buildingProjectStep);if(project.steps.includes(id))selectProjectBuilding(current,id);return;}
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
        listScroll = body.querySelector('.building-list')?.scrollTop??body.scrollTop;
        render(current);
        body.scrollTop = 0;
        body.querySelector('.building-detail h3')?.focus({preventScroll:true});
      } else if (button.hasAttribute('data-building-action')) {
        const item = current.buildings?.find(record => record.id === selected);
        if (item?.built) { closeSheet(); command(39, item.id); }
        else if (item?.allowed && current.turn && construction === undefined) {
          if (!isGrail(item)) {
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
          }
        }
      }
    };
    panel.addEventListener('click',handleClick);commandDock?.addEventListener('click',handleClick);
  }
  function selectProjectBuilding(state, id) {
    selected = id;
    render(state);
    body.scrollTop = 0;
    body.querySelector('.building-detail h3')?.focus({preventScroll:true});
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
    const viewport=body.closest('#mobile-app');
    const wide=!!viewport&&viewport.clientWidth>viewport.clientHeight&&viewport.clientWidth>=640;
    const next = JSON.stringify([state.turn, state.buildings, construction,wide]);
    if (next === signature) return;
    signature = next;
    const regions=['.building-list','.building-detail','.building-project [data-ui-stepper]'].map(selector=>({selector,top:body.querySelector(selector)?.scrollTop??0}));
    const scroll = body.scrollTop;
    const focus = document.activeElement;
    const selector = ['data-building-action','data-building-prerequisite','data-building-goal','data-building-id','data-building-tab','data-building-filter']
      .find(attribute => (body.contains(focus)||commandDock?.contains(focus)) && focus.hasAttribute(attribute));
    const value = selector && focus.getAttribute(selector);
    render(state);
    body.scrollTop = scroll;
    for(const region of regions){const node=body.querySelector(region.selector);if(node)node.scrollTop=region.top;}
    if (selector) [...body.querySelectorAll(`[${selector}]`),...(commandDock?.querySelectorAll(`[${selector}]`)||[])].find(button => button.getAttribute(selector) === value)?.focus({preventScroll:true});
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
    tab = 'unbuilt'; filter = ''; selected = project?.id ?? null; lockedOpen = false; projectExpanded=undefined; signature = undefined;
    openSheet('build', 'Bâtiments');
    update(getState());
    body.closest('.mobile-sheet')?.querySelector('[data-ui=close-sheet]')?.focus({preventScroll:true});
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
    const list=body.querySelector('.building-list');if(list)list.scrollTop=listScroll;
    const tile = body.querySelector(`[data-building-id="${id}"]`);
    const target = tile?.getClientRects().length ? tile : body.querySelector('[data-building-grail]');
    target?.focus({preventScroll:true});
    return true;
  }
  const viewport=body.closest('#mobile-app');if(viewport&&typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{if(viewport.dataset.sheet==='build'&&!body.closest('.mobile-sheet')?.hidden)update(getState());}).observe(viewport);
  return {warm, open, update, back, artURL, cancel(resetProjects = false) {
    pending = null;
    const sheet=body.closest('.mobile-sheet');if(sheet)for(const name of ['buildingView','buildingProject','buildingCompleted','buildingBack'])delete sheet.dataset[name];
    clearConstruction();
    commandDock?.remove();commandDock=undefined;
    const route = unlockRoute;
    unlockRoute = project = null;
    if (resetProjects) townProjects.clear();
    return route;
  }};
}
