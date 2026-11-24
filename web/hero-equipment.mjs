import {useScreenComponents,renderMarkup,creatureStatsMarkup} from './ui/material-components.mjs';
import {paintCreaturePortraits} from './creature-portraits.mjs';
import {getLanguage} from './locale-state.mjs';
import {createTroopEquipment} from './troop-equipment.mjs';
import {createTroopDeployment} from './troop-deployment.mjs';
import {renderHenchmanSheet} from './henchman-sheet.mjs';

// Decode the paper-doll silhouette while the game initializes, before opening equipment.
if(typeof Image!=='undefined'){const silhouette=new Image();silhouette.src=new URL('./h3-theme/hero-silhouette.svg',import.meta.url).href;silhouette.decode?.().catch(()=>{});}
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const heroIcon=index=>Number.isInteger(index)?`<canvas class="hero-icon" width="48" height="48" data-hero-icon="${index}" aria-hidden="true"></canvas>`:'';
export const equipmentSlotNames=['Head','Shoulders','Neck','Right hand','Left hand','Torso','Right ring','Left ring','Feet','Accessory 1','Accessory 2','Accessory 3','Accessory 4','Ballista','Ammo cart','First aid tent','Catapult','Spellbook','Accessory 5'];
let artifactVersion=0;
if(typeof window!=='undefined')window.addEventListener('goonk-artifacts',()=>artifactVersion++);
export function paintArtifactIcons(panel){
 const atlas=window.goonkArtifactAtlas,ids=window.goonkArtifactIds;
 if(!atlas||!ids)return;
 for(const canvas of panel.querySelectorAll('[data-artifact-icon]')){
  const id=Number(canvas.dataset.artifactIcon),index=ids.get(id),key=id+':'+artifactVersion;
  if(index===undefined||canvas._artifactKey===key)continue;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,64,64);
  ctx.drawImage(atlas,index%8*96,Math.floor(index/8)*96,96,96,0,0,64,64);
  canvas._artifactKey=key;
 }
}
export function armySlotMarkup(slot,unit,{selected=false,target=false,disabled=false,extraClass='',attrs='',ariaLabel='',portrait=()=>'',fr=true}={}){
 const label=ariaLabel||(unit?esc(`${unit.name} × ${unit.count}`):(fr?`Emplacement libre #${slot+1}`:`Empty slot #${slot+1}`));
 if(!unit){
  return `<button type="button" class="hero-army-slot hero-army-empty${target?' can-target':''}${extraClass?' '+extraClass:''}" ${attrs} aria-pressed="false" aria-label="${label}"${disabled?' disabled':''}>
   <span class="hero-army-slot-num">#${slot+1}</span>
   <div class="hero-army-empty-content">
    <span class="hero-empty" aria-hidden="true">＋</span>
    <span class="hero-army-empty-label">${fr?'Libre':'Empty'}</span>
   </div>
  </button>`;
 }
 return `<button type="button" class="hero-army-slot${selected?' selected':''}${target?' can-target':''}${extraClass?' '+extraClass:''}" ${attrs} aria-pressed="${selected}" aria-label="${label}"${disabled?' disabled':''}>
  <span class="hero-army-slot-num">#${slot+1}</span>
  <div class="hero-army-slot-content">
   <div class="hero-army-slot-art">
    ${portrait(unit)}
    <strong class="hero-army-slot-count">× ${unit.count}</strong>
   </div>
   <div class="hero-army-slot-info">
    <div class="hero-army-slot-title">
     <span class="hero-army-slot-name">${esc(unit.name)}</span>
     ${unit.shooter?'<span class="hero-army-shooter-badge" title="Ranged">🏹</span>':''}
    </div>
    ${creatureStatsMarkup(unit,{compact:true})}
   </div>
  </div>
 </button>`;
}
export function createHeroEquipment({root,command,pointer=()=>{},onViewChange=()=>{},portrait=()=>'',notify=()=>{},onManage=()=>{},onUpgradeAll=()=>{}}){
 let henchmanPending=null;
 const troopEquipment=createTroopEquipment({root,command});
 const troopDeployment=createTroopDeployment({root,command});
 const panel=document.createElement('section');panel.className='hero-equipment-page';useScreenComponents(panel);panel.hidden=true;panel.setAttribute('aria-label','Hero equipment');root.querySelector('.mobile-play').append(panel);panel.addEventListener('dragstart',e=>e.preventDefault());let requestedDeployment=null;let state={},tab='worn',selected=null,signature='',classic=false,selectedArmySlot=null,splitActive=false,splitAmount=1;const scrollPositions={worn:0,backpack:0,skills:0,army:0};
 const switchView=value=>{classic=value;root.dataset.heroView=value?'classic':'mobile';panel.hidden=classic||state.mode!=='hero';onViewChange();};
 const slots=()=>tab==='worn'?state.heroWindow?.slots||[]:tab==='backpack'?state.heroWindow?.backpack||[]:[];
 function openCreatureDetails(slot){
  if(slot===null||slot===undefined)return;
  const hero=state.heroWindow||{};
  const heroArmy=(state.armies||[]).find(a=>(Number.isInteger(hero.id)&&a.id===hero.id)||a.name===hero.name)||(state.armies||[])[0];
  if(heroArmy)command?.(41, heroArmy.id, slot);
 }
 function slotMarkup(a){const picked=state.heroWindow?.picked;const label=tab==='worn'?equipmentSlotNames[a.slot]||'Equipment':'Backpack '+(a.slot-18),caption=tab==='worn'&&a.slot===14&&getLanguage()==='fr'?'Munitions':label;return `<button class="hero-artifact-slot${picked&&a.allowed?' can-receive':''}" data-hero-slot="${a.slot}" aria-pressed="${a.slot===selected}" ${picked&&!a.allowed?'disabled':''} aria-label="${esc(label+': '+(a.name||'Empty'))}" title="${esc(label+': '+(a.name||'Empty'))}"><small>${caption}${a.locked?' · Locked':''}</small>${a.name?`<canvas width="64" height="64" data-artifact-icon="${a.icon}" aria-hidden="true"></canvas><strong>${esc(a.name)}</strong>`:'<span class="hero-empty" aria-hidden="true">＋</span><strong>Empty</strong>'}</button>`;}
 function renderSkills(hero){
  const description=text=>esc(text?.replace(/[{}]/g,''));
  const specialty=hero.specialty?.name?`<section class="hero-specialty">
   ${heroIcon(hero.specialty.icon)}<div><h3>Specialty</h3><strong>${esc(hero.specialty.name)}</strong><p>${description(hero.specialty.description)}</p>${hero.specialty.sourceProgression?`<p class="hero-source-specialty">${getLanguage()==='fr'?'Bonus TUM en combat uniquement':'TUM bonus during combat only'} · ${hero.specialty.sourceProgression.warMachines?(getLanguage()==='fr'?'Baliste, tente et chariot':"Ballista, tent and cart"):esc(hero.specialty.sourceProgression.family)} : +${hero.specialty.sourceProgression.attackDefense} ${hero.specialty.sourceProgression.warMachines?(getLanguage()==='fr'?'DEF (ATK pour la baliste)':'DEF (ATK for ballista)'):'ATK/DEF'} · +${hero.specialty.sourceProgression.damage} ${hero.specialty.sourceProgression.warMachines?(getLanguage()==='fr'?'dégâts de baliste':'ballista damage'):(getLanguage()==='fr'?'dégâts':'damage')} · +${hero.specialty.sourceProgression.healthPercent}% ${getLanguage()==='fr'?'PV':'HP'}</p>`:''}</div>
  </section>`:'';
  const fr=getLanguage()==='fr';
  const effects=Array.isArray(hero.campaignEffects)?hero.campaignEffects.filter(e=>[4,65].includes(e.kind)&&Number.isInteger(e.delta)&&Number.isInteger(e.remainingDays)):[];
  const campaign=effects.length?`<section class="hero-specialty"><div><h3>${fr?'Effets de campagne':'Campaign effects'}</h3><ul class="hero-campaign-effects">${effects.map(e=>{
   const amount=`${e.delta>0?'+':e.delta<0?'−':''}${Math.abs(e.delta)}`,label=e.kind===4?(fr?'Or':'Gold'):(fr?'Déplacement':'Movement');
   const duration=e.permanent?'Permanent':e.remainingDays===0?(fr?'Dernier jour':'Last day'):`${e.remainingDays} ${fr?(e.remainingDays===1?'jour restant':'jours restants'):(e.remainingDays===1?'day remaining':'days remaining')}`;
   return `<li>${label} : ${amount} ${fr?'par jour':'per day'} · ${duration}</li>`;
  }).join('')}</ul></div></section>`:'';
  const combatStats=[['Morale',hero.morale],['Luck',hero.luck]].filter(([,stat])=>stat);
  const combat=combatStats.length?`<dl class="hero-combat-stats">${combatStats.map(([name,stat])=>`<div>
   <dt>${name}</dt><dd>${heroIcon(stat.icon)}${stat.value}</dd>
  </div>`).join('')}</dl>`:'';
  return `${specialty}${campaign}${hero.caveEffects?`<section class="hero-specialty"><div><h3>Grotte mystérieuse</h3><p>${description(hero.caveEffects)}</p></div></section>`:''}${combat}<section class="hero-secondary">
   <h3>Secondary skills</h3>${hero.skills?.length?`<ul>${hero.skills.map(skill=>`<li>
    ${heroIcon(skill.icon)}<div><h4>${esc(skill.name)} <span>${esc(skill.mastery)}</span></h4><p>${description(skill.description)}</p></div>
   </li>`).join('')}</ul>`:'<p>No secondary skills learned.</p>'}
  </section>`;
 }
 function renderArmy(hero,heroArmy){
  const fr=getLanguage()==='fr';
  const slots=heroArmy?.slots||[];
  const items=Array.from({length:7},(_,i)=>slots[i]||null);
  return `<div class="hero-army-panel">
   <div class="hero-army-head">
    <p class="hero-army-help">${hero.owned===false?(fr?'Armée du héros à recruter : touche une troupe pour consulter sa fiche.':'Hero for hire: tap a unit to inspect its details.'):(fr?'Armée du héros (7 emplacements) : touche une troupe pour la scinder ou voir sa fiche animée.':'Hero army (7 slots): tap a unit to split or view animated details.')}</p>
   </div>
   <div class="hero-army-slots">
    ${items.map((unit,slot)=>{
     const isSelected=selectedArmySlot===slot;
     const isTarget=hero.owned!==false&&state.turn&&selectedArmySlot!==null&&selectedArmySlot!==slot;
     return armySlotMarkup(slot,unit,{selected:isSelected,target:isTarget,attrs:`data-army-slot="${slot}"`,portrait,fr});
    }).join('')}
   </div>
   <button class="army-upgrade-all" data-hero-upgrade-all ${!state.turn||hero.owned===false||!items.some(Boolean)?'disabled':''}><img src="./web/h3-theme/troops.svg" alt="" aria-hidden="true"><span>${fr?'Tout améliorer':'Upgrade all'}</span></button>
  </div>`;
 }
 function render(){
  const prevInventory=panel.dataset.inventory;
  const grid=panel.querySelector('.hero-equipment-grid');
  const navScrollLeft=panel.querySelector('.hero-bag-tabs')?.scrollLeft||0;
  const rebalanceFocused=panel.querySelector('[data-hero-source-rebalance]')===document.activeElement;
  const focusedArmySlot=document.activeElement?.closest?.('[data-army-slot]')?.dataset.armySlot;
  if(grid)scrollPositions[prevInventory||tab]=grid.scrollTop;
  panel.dataset.inventory=tab;
  const hero=state.heroWindow||{},picked=hero.picked,items=slots(),item=items.find(a=>a.slot===selected);
  panel.dataset.artifactSelected=String(!!item?.name||!!picked);
  const fr=getLanguage()==='fr';
  const backpack=tab==='backpack',skills=tab==='skills',isArmy=tab==='army',isHenchman=tab==='henchman';
  const bagCount=hero.backpack?.filter(a=>a.name).length||0;
  const heroArmy=(state.armies||[]).find(a=>(Number.isInteger(hero.id)&&a.id===hero.id)||a.name===hero.name)||(state.armies||[])[0];
  const armySlots=heroArmy?.slots||[];
  const armyCount=armySlots.filter(s=>s&&s.count>0).length;
  const selectedUnit=Number.isInteger(selectedArmySlot)?armySlots[selectedArmySlot]:null;panel.dataset.armySelected=String(!!selectedUnit);
  if(selectedUnit&&selectedUnit.count>1){
   splitAmount=Math.max(1,Math.min(selectedUnit.count-1,splitAmount));
  }
  const slotsContainer=isArmy&&prevInventory==='army'?panel.querySelector('.hero-army-slots'):null;
  const nextSlots=isArmy?Array.from({length:7},(_,i)=>armySlots[i]||null):null;
  if(slotsContainer&&panel._armyHeroId===hero.id&&panel._armyLang===fr){
   const prevSlots=panel._armyPrevSlots||[];
   let needsPaint=false;
   for(let slot=0;slot<7;slot++){
    const unit=nextSlots[slot],prev=prevSlots[slot]||null;
    const isSelected=selectedArmySlot===slot;
    const isTarget=hero.owned!==false&&state.turn&&selectedArmySlot!==null&&selectedArmySlot!==slot;
    const existing=slotsContainer.querySelector(`[data-army-slot="${slot}"]`);
    if(!existing)continue;
    existing.classList.toggle('hero-army-empty',!unit);
    existing.classList.toggle('selected',isSelected);
    existing.classList.toggle('can-target',isTarget);
    existing.setAttribute('aria-pressed',String(isSelected));
    if(JSON.stringify(unit)!==JSON.stringify(prev)){
     const label=unit?`${unit.name} × ${unit.count}`:(fr?`Emplacement libre #${slot+1}`:`Empty slot #${slot+1}`);
     existing.setAttribute('aria-label',label);
     const tpl=document.createElement('template');
     tpl.innerHTML=armySlotMarkup(slot,unit,{selected:isSelected,target:isTarget,attrs:`data-army-slot="${slot}"`,portrait,fr});
     const nextContent=tpl.content.firstElementChild?.querySelector('.hero-army-slot-content,.hero-army-empty-content');
     const curContent=existing.querySelector('.hero-army-slot-content,.hero-army-empty-content');
     if(nextContent&&curContent)curContent.replaceWith(nextContent);
     needsPaint=true;
    }
   }
   panel._armyPrevSlots=nextSlots.map(u=>u?{...u}:null);
   if(needsPaint)paintCreaturePortraits(slotsContainer);
   const upgradeAll=panel.querySelector('[data-hero-upgrade-all]');
   if(upgradeAll)upgradeAll.disabled=!state.turn||hero.owned===false||!nextSlots.some(Boolean);
   const detailTitle=panel.querySelector('.hero-artifact-detail h3');
   if(detailTitle)detailTitle.textContent=selectedUnit?(selectedUnit.name+' × '+selectedUnit.count):(fr?'Gestion des troupes':'Manage army');
   const detailDesc=panel.querySelector('.hero-artifact-detail .hero-artifact-description');
   if(detailDesc)detailDesc.textContent=hero.owned===false?(fr?'Consulte la fiche des troupes avant de recruter ce héros.':'Inspect this hero’s troops before recruiting them.'):selectedUnit?(selectedUnit.count>1?(fr?'Touche un emplacement libre pour déplacer, ou coche « Scinder » pour séparer les troupes.':'Tap another slot to move, or check « Split » to split the army.'):(fr?'Touche un autre emplacement pour déplacer ou fusionner.':'Tap another slot to move or merge.')):(fr?'Touche une troupe pour la réorganiser, la scinder ou voir sa fiche.':'Tap a unit stack to manage, split or view details.');
   const manageBtn=panel.querySelector('[data-hero-manage-troops]');
   if(manageBtn)manageBtn.disabled=!selectedUnit||!state.turn;
   const splitChk=panel.querySelector('#hero-army-split');
   if(splitChk){splitChk.checked=splitActive;splitChk.disabled=hero.owned===false||!selectedUnit||selectedUnit.count<2||!state.turn;}
   const splitBox=panel.querySelector('.hero-army-split-amount');
   if(splitBox)splitBox.hidden=!splitActive;
   const splitInput=panel.querySelector('#hero-army-split-num');
   if(splitInput){splitInput.max=String(selectedUnit?selectedUnit.count-1:1);splitInput.value=String(splitAmount);}
   const detailsBtn=panel.querySelector('[data-hero-army-details]');
   if(detailsBtn)detailsBtn.disabled=!selectedUnit;
   if(focusedArmySlot!==undefined)panel.querySelector(`[data-army-slot="${focusedArmySlot}"]`)?.focus({preventScroll:true});
   return;
  }
  const extraSlots=[9,10,11,12,18,13,14,15,16,17];
  const extra=extraSlots.flatMap(slot=>items.filter(a=>a.slot===slot)).map(slotMarkup).join('');
  if(henchmanPending&&(henchmanPending.hero!==hero.id||henchmanPending.revision!==hero.henchman?.revision))henchmanPending=null;
  const contents=isHenchman?renderHenchmanSheet(hero,{portrait,canAct:state.turn&&hero.owned!==false,pending:!!henchmanPending}):isArmy?renderArmy(hero,heroArmy):skills?renderSkills(hero):backpack?`<p class="hero-bag-help">The backpack stores artefacts you are carrying but have not equipped. To equip one, move it from the backpack to a compatible slot.</p>${items.map(slotMarkup).join('')}`:
   `<div class="hero-body-layout">
    <div class="hero-body-stage" aria-label="Equipment on the hero’s body">
     <img class="hero-body-figure" src="./web/h3-theme/hero-silhouette.svg" alt="">${items.filter(a=>a.slot>=0&&a.slot<=8).map(slotMarkup).join('')}
    </div>
    <section class="hero-extra-equipment"><h3>Accessories &amp; war machines</h3><div>${extra}</div></section>
   </div>`;
  const hint=!item?.name&&!picked?(fr?'Choisis un objet pour lire ses effets.':'Choose an item to read its effects.'):hero.owned===false?'Select an item to read its effects.':backpack?'Select an item to read its effects or move it.':
   'Five slots hold accessories. Ballista, ammo cart, first aid tent and catapult have one slot each. The spellbook has its own slot.';
  renderMarkup(panel,`<header class="hero-card-head">
   <canvas class="hero-face" width="58" height="64" aria-hidden="true"></canvas>
   <div><h2>${esc(hero.name)}</h2><p>${fr?'Niveau':'Level'} ${hero.level??1} ${esc(hero.className)}</p>
    <div class="hero-vitals"><span>${heroIcon(hero.manaIcon)}${hero.mana??0} / ${hero.manaLimit??0} mana</span>
     ${hero.experience===undefined?'':`<span>${heroIcon(hero.experienceIcon)}${hero.experience.toLocaleString()} XP</span>`}</div></div>
   <button data-hero-close aria-label="${hero.owned===false?'Back':'Back to map'}">✕</button>
  </header>
  <dl class="hero-primary" translate="no" aria-label="Primary stats">${(getLanguage()==='fr'?['Attaque','Défense','Puissance','Connaissance']:['Attack','Defense','Power','Knowledge']).map((name,i)=>`<div><dt><span class="hero-stat-label-full">${name}</span><abbr class="hero-stat-label-short" title="${name}">${(getLanguage()==='fr'?['ATQ','DÉF','PUI','CON']:['ATK','DEF','PWR','KNW'])[i]}</abbr></dt><dd>${heroIcon(hero.primaryIcons?.[i])}${hero.primarySkills?.[i]??0}</dd></div>`).join('')}</dl>
  <nav class="hero-bag-tabs" aria-label="Hero sheet">
   <button data-hero-tab="army" aria-pressed="${isArmy}" ${picked?'disabled':''}>${fr?'Armée':'Army'} · ${armyCount}</button>
   <button data-hero-tab="worn" aria-pressed="${tab==='worn'}">${fr?'Équipement':'Equipment'}</button>
   ${hero.canRebalanceSourceArtifacts?`<button type="button" data-hero-source-rebalance ${picked||!state.turn||hero.owned===false?'disabled':''} title="${fr?'Actualiser les bonus des objets qui équilibrent les caractéristiques':'Refresh equipped artifacts that balance primary stats'}">${fr?'Rééquilibrer':'Rebalance'}</button>`:''}
   <button data-hero-tab="backpack" aria-pressed="${backpack}">${fr?'Sac':'Backpack'} · ${bagCount}</button>
   <button data-hero-tab="skills" aria-pressed="${skills}" ${picked?'disabled':''}>${fr?'Compétences':'Skills'}</button>
   ${hero.henchman?`<button data-hero-tab="henchman" aria-pressed="${isHenchman}" ${picked&&!hero.henchman.canEquipHeldBanner?'disabled':''}>${fr?'Compagnon':'Henchman'}</button>`:''}
   ${hero.owned===false?'':'<button data-hero-classic>Classic</button>'}
   ${Number.isInteger(hero.commanderIcon)?`<button data-hero-commander aria-label="${fr?'Ouvrir le commandant':'Open commander'}" ${picked?'disabled':''}><span class="hero-commander-art" aria-hidden="true"><img src="./web/h3-theme/commander/defense.svg" alt="" width="24" height="24"><canvas class="hero-icon" width="48" height="48" data-hero-icon="${hero.commanderIcon}" hidden></canvas></span><span>${fr?'Commandant':'Commander'}</span></button>`:''}
  </nav>
  <section class="hero-equipment-grid" aria-label="${isArmy?'Army':skills?'Skills':backpack?'Backpack artefacts':'Worn artefacts'}">${contents}</section>
  ${skills||isHenchman?'':isArmy?`
    <div class="hero-army-dock-tools">
     ${state.troopEquipment?`<button type="button" data-hero-troop-equipment title="${fr?'Équiper une troupe avec un objet du sac':'Equip a troop with an item from your backpack'}">${fr?'Objets de troupe':'Troop items'}</button>`:''}
     ${hero.owned===false?'':`<button type="button" data-hero-manage-troops ${!selectedUnit||!state.turn?'disabled':''}>${fr?'Gérer la troupe':'Manage troop'}</button>`}
     <label class="hero-army-split-toggle">
      <input type="checkbox" id="hero-army-split" ${splitActive?'checked':''} ${hero.owned===false||!selectedUnit||selectedUnit.count<2||!state.turn?'disabled':''}>
      <span>${fr?'Scinder':'Split'}</span>
     </label>
     <div class="hero-army-split-amount" ${!splitActive?'hidden':''}>
      <button type="button" data-hero-split-delta="-1">−</button>
      <input type="number" id="hero-army-split-num" min="1" max="${selectedUnit?selectedUnit.count-1:1}" value="${splitAmount}">
      <button type="button" data-hero-split-delta="1">+</button>
     </div>
     <button type="button" class="hero-army-details-btn" data-hero-army-details ${!selectedUnit?'disabled':''} title="${fr?'Voir la fiche détaillée de la créature':'View creature details'}">${fr?'🔍 Fiche':'🔍 Details'}</button>
    </div>
   `:`<section class="hero-artifact-detail" aria-live="polite">
    <h3>${esc(picked?'Moving: '+picked.name:item?.name||'Choose an artefact')}</h3>
    <p class="hero-artifact-description">${picked?'Choose a highlighted destination. Switch between Equipment and Backpack to move the item.':esc(item?.description?.replace(/[{}]/g,'')||hint)}</p>
    ${hero.owned===false?'':`<div class="hero-artifact-actions">
     <button class="primary" data-hero-move ${!item?.name||item.locked||item.movable===false||picked||!state.turn?'disabled':''}>Move item</button>
     ${!picked&&item?.canDisassemble?`<button data-hero-combine="1" ${!state.turn?'disabled':''}>${fr?'Démonter':'Disassemble'}</button>`:!picked&&item?.canAssemble?`<button data-hero-combine="0" ${!state.turn?'disabled':''}>${fr?'Assembler':'Assemble'}</button>`:`<button data-hero-cancel ${!picked?'disabled':''}>Cancel move</button>`}
    </div>`}
   </section>`}`);
  if(isArmy){
   panel._armyHeroId=hero.id;panel._armyLang=fr;
   panel._armyPrevSlots=Array.from({length:7},(_,i)=>armySlots[i]?{...armySlots[i]}:null);
   paintCreaturePortraits(panel);
  }
  panel.querySelector('.hero-equipment-grid').scrollTop=scrollPositions[tab]||0;
  panel.querySelector('.hero-bag-tabs').scrollLeft=navScrollLeft;
  if(rebalanceFocused)panel.querySelector('[data-hero-source-rebalance]')?.focus({preventScroll:true});
  if(focusedArmySlot!==undefined)panel.querySelector(`[data-army-slot="${focusedArmySlot}"]`)?.focus({preventScroll:true});
 }
 panel.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button||button.disabled)return;
  if(button.hasAttribute('data-henchman-action')){
   const hero=state.heroWindow;if(!hero?.henchman||henchmanPending||!state.turn||hero.owned===false)return;
   henchmanPending={hero:hero.id,revision:hero.henchman.revision};
   command(112,hero.id,Number(button.dataset.henchmanAction),Number(button.dataset.henchmanSlot??-1),Number(button.dataset.henchmanCreature??-1),hero.henchman.revision);render();return;
  }
  if(button.hasAttribute('data-hero-combine')){if(Number.isInteger(selected)&&!state.heroWindow?.picked){button.disabled=true;command(111,state.heroWindow.id,selected,Number(button.dataset.heroCombine));}return;}
  if(button.hasAttribute('data-hero-source-rebalance')){command(102,state.heroWindow.id);notify(getLanguage()==='fr'?'Actualisation des bonus demandée.':'Artifact refresh requested.');return;}
  if(button.hasAttribute('data-hero-upgrade-all')){const army=(state.armies||[]).find(a=>a.id===state.heroWindow?.id)||state.armies?.[0];if(army)onUpgradeAll(army.id);return;}
  if(button.hasAttribute('data-hero-manage-troops')){const hero=state.heroWindow||{};const army=(state.armies||[]).find(a=>a.id===hero.id)||state.armies?.[0];if(army&&selectedArmySlot!==null)onManage(army.id,selectedArmySlot);return;}
  if(button.hasAttribute('data-hero-troop-equipment')){troopEquipment.show(selectedArmySlot);return;}
  if(button.hasAttribute('data-hero-commander')){command(85);return;}
  if(button.hasAttribute('data-hero-classic')){switchView(true);return;}
  if(button.hasAttribute('data-hero-close')){command(63);return;}
  if(button.dataset.heroTab){tab=button.dataset.heroTab;selected=null;selectedArmySlot=null;splitActive=false;render();return;}
  if(button.dataset.heroSplitDelta!==undefined){
   const delta=Number(button.dataset.heroSplitDelta);
   const hero=state.heroWindow||{};
   const heroArmy=(state.armies||[]).find(a=>(Number.isInteger(hero.id)&&a.id===hero.id)||a.name===hero.name)||(state.armies||[])[0];
   const selUnit=Number.isInteger(selectedArmySlot)?heroArmy?.slots?.[selectedArmySlot]:null;
   if(selUnit&&selUnit.count>1){
    splitAmount=Math.max(1,Math.min(selUnit.count-1,splitAmount+delta));
    render();
   }
   return;
  }
  if(button.hasAttribute('data-hero-army-details')){
   if(selectedArmySlot!==null){
    openCreatureDetails(selectedArmySlot);
   }
   return;
  }
  if(button.dataset.armySlot!==undefined){
   const slot=Number(button.dataset.armySlot);
   const hero=state.heroWindow||{};
   const heroArmy=(state.armies||[]).find(a=>(Number.isInteger(hero.id)&&a.id===hero.id)||a.name===hero.name)||(state.armies||[])[0];
   if(!heroArmy)return;
   const unit=heroArmy.slots?.[slot]||null;
   if(unit&&event.target.closest('.hero-army-slot-art')){selectedArmySlot=slot;openCreatureDetails(slot);return;}
   if(selectedArmySlot===null){
    if(unit){
     selectedArmySlot=slot;
     splitActive=false;
     splitAmount=Math.max(1,Math.floor(unit.count/2));
     render();
    }
    return;
   }
   if(selectedArmySlot===slot){
    openCreatureDetails(slot);
    return;
   }
   if(hero.owned!==false&&state.turn){
    if(splitActive&&splitAmount>0){
     const selUnit=Number.isInteger(selectedArmySlot)?heroArmy?.slots?.[selectedArmySlot]:null;
     if(unit&&selUnit&&unit.id!==selUnit.id){
      notify(getLanguage()==='fr'?'Choisis un emplacement libre pour scinder.':'Choose an empty slot to split.');
      return;
     }
     command(11,heroArmy.id,selectedArmySlot,heroArmy.id,slot,splitAmount);
     selectedArmySlot=null;splitActive=false;render();
    }else{
     const fromUnit=heroArmy.slots?.[selectedArmySlot]||null,toUnit=heroArmy.slots?.[slot]||null;
     if(heroArmy.slots&&fromUnit&&(!toUnit||fromUnit.id!==toUnit.id)){
      heroArmy.slots[slot]=fromUnit;
      heroArmy.slots[selectedArmySlot]=toUnit;
     }
     command(10,heroArmy.id,selectedArmySlot,heroArmy.id,slot,0);
     selectedArmySlot=null;render();
    }
   }else{
    if(unit){selectedArmySlot=slot;render();}
   }
   return;
  }
  if(button.dataset.heroSlot!==undefined){
   const slot=Number(button.dataset.heroSlot);
   if(state.heroWindow?.picked){if(slots().find(a=>a.slot===slot)?.allowed)command(62,slot);}
   else if(slot===17&&slots().find(a=>a.slot===slot)?.name&&(state.heroWindow?.owned===false||state.turn)){command(62,slot);}
   else{selected=slot;render();}
   return;
  }
  if(button.hasAttribute('data-hero-move')&&selected!==null)command(62,selected);
  if(button.hasAttribute('data-hero-cancel'))command(64);
 });
 panel.addEventListener('input',event=>{
  if(event.target.id==='hero-army-split-num'){
   const val=Number(event.target.value);
   const hero=state.heroWindow||{};
   const heroArmy=(state.armies||[]).find(a=>(Number.isInteger(hero.id)&&a.id===hero.id)||a.name===hero.name)||(state.armies||[])[0];
   const selUnit=Number.isInteger(selectedArmySlot)?heroArmy?.slots?.[selectedArmySlot]:null;
   if(selUnit&&Number.isInteger(val)&&val>=1&&val<selUnit.count){
    splitAmount=val;
   }
  }
 });
 panel.addEventListener('change',event=>{
  if(event.target.id==='hero-army-split'){
   splitActive=event.target.checked;
   const hero=state.heroWindow||{};
   const heroArmy=(state.armies||[]).find(a=>(Number.isInteger(hero.id)&&a.id===hero.id)||a.name===hero.name)||(state.armies||[])[0];
   const selUnit=Number.isInteger(selectedArmySlot)?heroArmy?.slots?.[selectedArmySlot]:null;
   if(selUnit)splitAmount=Math.max(1,Math.floor(selUnit.count/2));
   render();
  }
 });
 return{showDeployment(slot){if(state.mode==='hero')troopDeployment.show(slot);else if(state.mode==='map'){requestedDeployment=slot;command(55);}},showMobile(){switchView(false);},showArmy(){tab='army';selected=null;selectedArmySlot=null;splitActive=false;if(state.mode==='hero')switchView(false);},update(next){troopDeployment.update(next);troopEquipment.update(next);if(!['hero','creature'].includes(state.mode)&&next.mode==='hero'&&next.heroWindow?.owned===false){tab='skills';selected=null;selectedArmySlot=null;splitActive=false;scrollPositions.worn=0;scrollPositions.backpack=0;scrollPositions.skills=0;scrollPositions.army=0;}state=next;if(requestedDeployment!==null&&next.mode==='hero'){const slot=requestedDeployment;requestedDeployment=null;troopDeployment.show(slot);}if(next.mode!=='hero'){panel.hidden=true;signature='';classic=false;delete root.dataset.heroView;return;}root.dataset.heroView=classic?'classic':'mobile';panel.hidden=classic;const key=JSON.stringify([next.heroWindow,next.turn,next.armies,next.troopDeployment]);if(key!==signature){signature=key;render();}},paint(source){if(troopDeployment.paint())return true;if(troopEquipment.paint())return true;if(panel.hidden||classic)return false;if(document.hidden)return true;const rect=state.heroWindow?.portrait,face=panel.querySelector('.hero-face');if(face&&rect?.w){face.getContext('2d').drawImage(source,rect.x*source.width/800,rect.y*source.height/600,rect.w*source.width/800,rect.h*source.height/600,0,0,58,64);}const heroAtlas=window.goonkHeroIconAtlas;
  if(heroAtlas){
   for(const canvas of panel.querySelectorAll('[data-hero-icon]')){
    if(canvas._heroIconAtlas===heroAtlas)continue;
    const index=Number(canvas.dataset.heroIcon),size=canvas.width,columns=heroAtlas.width/size,ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,size,size);
    ctx.drawImage(heroAtlas,index%columns*size,Math.floor(index/columns)*size,size,size,0,0,size,size);
    canvas._heroIconAtlas=heroAtlas;
    const commanderArt=canvas.closest('.hero-commander-art');if(commanderArt){canvas.hidden=false;commanderArt.querySelector('img').hidden=true;}
   }
  }
  paintArtifactIcons(panel);
  return true;
 }};
}
