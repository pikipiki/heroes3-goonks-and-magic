import {getLanguage} from './i18n.mjs';

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
export function createHeroEquipment({root,command,pointer=()=>{},onViewChange=()=>{},portrait=()=>'',notify=()=>{}}){
 const panel=document.createElement('section');panel.className='hero-equipment-page';panel.hidden=true;panel.setAttribute('aria-label','Hero equipment');root.querySelector('.mobile-play').append(panel);panel.addEventListener('dragstart',e=>e.preventDefault());let state={},tab='worn',selected=null,signature='',classic=false,selectedArmySlot=null,splitActive=false,splitAmount=1;const scrollPositions={worn:0,backpack:0,skills:0,army:0};
 const switchView=value=>{classic=value;root.dataset.heroView=value?'classic':'mobile';panel.hidden=classic||state.mode!=='hero';onViewChange();};
 const slots=()=>tab==='worn'?state.heroWindow?.slots||[]:tab==='backpack'?state.heroWindow?.backpack||[]:[];
 function openCreatureDetails(slot){
  if(slot===null||slot===undefined)return;
  const hero=state.heroWindow||{};
  const heroArmy=(state.armies||[]).find(a=>(Number.isInteger(hero.id)&&a.id===hero.id)||a.name===hero.name)||(state.armies||[])[0];
  pointer?.({x: 44 + slot * 66, y: 517}, 2);
  if(heroArmy)command?.(41, heroArmy.id, slot);
 }
 function slotMarkup(a){const picked=state.heroWindow?.picked;const label=tab==='worn'?equipmentSlotNames[a.slot]||'Equipment':'Backpack '+(a.slot-18);return `<button class="hero-artifact-slot${picked&&a.allowed?' can-receive':''}" data-hero-slot="${a.slot}" aria-pressed="${a.slot===selected}" ${picked&&!a.allowed?'disabled':''} aria-label="${esc(label+': '+(a.name||'Empty'))}" title="${esc(label+': '+(a.name||'Empty'))}"><small>${label}${a.locked?' · Locked':''}</small>${a.name?`<canvas width="64" height="64" data-artifact-icon="${a.icon}" aria-hidden="true"></canvas><strong>${esc(a.name)}</strong>`:'<span class="hero-empty" aria-hidden="true">＋</span><strong>Empty</strong>'}</button>`;}
 function renderSkills(hero){
  const description=text=>esc(text?.replace(/[{}]/g,''));
  const specialty=hero.specialty?.name?`<section class="hero-specialty">
   ${heroIcon(hero.specialty.icon)}<div><h3>Specialty</h3><strong>${esc(hero.specialty.name)}</strong><p>${description(hero.specialty.description)}</p></div>
  </section>`:'';
  const combatStats=[['Morale',hero.morale],['Luck',hero.luck]].filter(([,stat])=>stat);
  const combat=combatStats.length?`<dl class="hero-combat-stats">${combatStats.map(([name,stat])=>`<div>
   <dt>${name}</dt><dd>${heroIcon(stat.icon)}${stat.value}</dd>
  </div>`).join('')}</dl>`:'';
  return `${specialty}${combat}<section class="hero-secondary">
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
    <p class="hero-army-help">${fr?'Armée du héros (7 emplacements) : touche une troupe pour la scinder ou voir sa fiche animée.':'Hero army (7 slots): tap a unit to split or view animated details.'}</p>
   </div>
   <div class="hero-army-slots">
    ${items.map((unit,slot)=>{
     const isSelected=selectedArmySlot===slot;
     const isTarget=selectedArmySlot!==null&&selectedArmySlot!==slot;
     if(!unit){
      return `
      <button type="button" class="hero-army-slot hero-army-empty${isTarget?' can-target':''}" data-army-slot="${slot}" aria-pressed="false" aria-label="${fr?`Emplacement libre #${slot+1}`:`Empty slot #${slot+1}`}">
       <span class="hero-army-slot-num">#${slot+1}</span>
       <div class="hero-army-empty-content">
        <span class="hero-empty" aria-hidden="true">＋</span>
        <span class="hero-army-empty-label">${fr?'Libre':'Empty'}</span>
       </div>
      </button>`;
     }
     return `
     <button type="button" class="hero-army-slot${isSelected?' selected':''}${isTarget?' can-target':''}" data-army-slot="${slot}" aria-pressed="${isSelected}" aria-label="${esc(`${unit.name} × ${unit.count}`)}">
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
        <dl class="creature-stats">
         <div><dt aria-label="Attack">ATK</dt><dd>${unit.attack??0}</dd></div>
         <div><dt aria-label="Defense">DEF</dt><dd>${unit.defense??0}</dd></div>
         <div><dt aria-label="Damage">DMG</dt><dd>${unit.damageMin??0}–${unit.damageMax??0}</dd></div>
         <div><dt aria-label="Health">HP</dt><dd>${unit.health??0}</dd></div>
         <div><dt aria-label="Speed">SPD</dt><dd>${unit.speed??0}</dd></div>
        </dl>
       </div>
      </div>
     </button>`;
    }).join('')}
   </div>
  </div>`;
 }
 function render(){
  const grid=panel.querySelector('.hero-equipment-grid');
  if(grid)scrollPositions[panel.dataset.inventory||tab]=grid.scrollTop;
  panel.dataset.inventory=tab;
  const hero=state.heroWindow||{},picked=hero.picked,items=slots(),item=items.find(a=>a.slot===selected);
  const fr=getLanguage()==='fr';
  const backpack=tab==='backpack',skills=tab==='skills',isArmy=tab==='army';
  const bagCount=hero.backpack?.filter(a=>a.name).length||0;
  const heroArmy=(state.armies||[]).find(a=>(Number.isInteger(hero.id)&&a.id===hero.id)||a.name===hero.name)||(state.armies||[])[0];
  const armySlots=heroArmy?.slots||[];
  const armyCount=armySlots.filter(s=>s&&s.count>0).length;
  const selectedUnit=Number.isInteger(selectedArmySlot)?armySlots[selectedArmySlot]:null;
  if(selectedUnit&&selectedUnit.count>1){
   splitAmount=Math.max(1,Math.min(selectedUnit.count-1,splitAmount));
  }
  const extraSlots=[9,10,11,12,18,13,14,15,16,17];
  const extra=extraSlots.flatMap(slot=>items.filter(a=>a.slot===slot)).map(slotMarkup).join('');
  const contents=isArmy?renderArmy(hero,heroArmy):skills?renderSkills(hero):backpack?`<p class="hero-bag-help">The backpack stores artefacts you are carrying but have not equipped. To equip one, move it from the backpack to a compatible slot.</p>${items.map(slotMarkup).join('')}`:
   `<div class="hero-body-layout">
    <div class="hero-body-stage" aria-label="Equipment on the hero’s body">
     <img class="hero-body-figure" src="./web/h3-theme/hero-silhouette.svg" alt="">${items.filter(a=>a.slot>=0&&a.slot<=8).map(slotMarkup).join('')}
    </div>
    <section class="hero-extra-equipment"><h3>Accessories &amp; war machines</h3><div>${extra}</div></section>
   </div>`;
  const hint=hero.owned===false?'Select an item to read its effects.':backpack?'Select an item to read its effects or move it.':
   'Five slots hold accessories. Ballista, ammo cart, first aid tent and catapult have one slot each. The spellbook has its own slot.';
  panel.innerHTML=`<header class="hero-card-head">
   <canvas class="hero-face" width="58" height="64" aria-hidden="true"></canvas>
   <div><h2>${esc(hero.name)}</h2><p>Level ${hero.level??1} ${esc(hero.className)}</p>
    <div class="hero-vitals"><span>${heroIcon(hero.manaIcon)}${hero.mana??0} / ${hero.manaLimit??0} mana</span>
     ${hero.experience===undefined?'':`<span>${heroIcon(hero.experienceIcon)}${hero.experience.toLocaleString()} XP</span>`}</div></div>
   <button data-hero-close aria-label="${hero.owned===false?'Back':'Back to map'}">← ${fr?'Retour':'Back'}</button>
  </header>
  <dl class="hero-primary" aria-label="Primary stats">${['Attack','Defense','Power','Knowledge'].map((name,i)=>`<div><dt>${name}</dt><dd>${heroIcon(hero.primaryIcons?.[i])}${hero.primarySkills?.[i]??0}</dd></div>`).join('')}</dl>
  <nav class="hero-bag-tabs" aria-label="Hero sheet">
   <button data-hero-tab="army" aria-pressed="${isArmy}" ${picked?'disabled':''}>${fr?'Armée':'Army'} · ${armyCount}</button>
   <button data-hero-tab="worn" aria-pressed="${tab==='worn'}">${fr?'Équipement':'Equipment'}</button>
   <button data-hero-tab="backpack" aria-pressed="${backpack}">${fr?'Sac':'Backpack'} · ${bagCount}</button>
   <button data-hero-tab="skills" aria-pressed="${skills}" ${picked?'disabled':''}>${fr?'Compétences':'Skills'}</button>
   ${hero.owned===false?'':'<button data-hero-classic>Classic</button>'}
   ${Number.isInteger(hero.commanderIcon)?`<button data-hero-commander aria-label="Open commander" title="Commander" ${picked?'disabled':''}>${heroIcon(hero.commanderIcon)}</button>`:''}
  </nav>
  <section class="hero-equipment-grid" aria-label="${isArmy?'Army':skills?'Skills':backpack?'Backpack artefacts':'Worn artefacts'}">${contents}</section>
  <section class="hero-artifact-detail" aria-live="polite" ${skills?'hidden':''}>
   ${isArmy?`
    <h3>${selectedUnit?esc(selectedUnit.name+' × '+selectedUnit.count):(fr?'Gestion des troupes':'Manage troops')}</h3>
    <p class="hero-artifact-description">${selectedUnit?(selectedUnit.count>1?(fr?'Touche un emplacement libre pour déplacer, ou coche « Scinder » pour séparer les troupes.':'Tap another slot to move, or check « Split » to separate troops.'):(fr?'Touche un autre emplacement pour déplacer ou fusionner.':'Tap another slot to move or merge.')):(fr?'Touche une troupe pour la réorganiser, la scinder ou voir sa fiche.':'Tap a unit stack to manage, split or view details.')}</p>
    <div class="hero-army-dock-tools">
     <label class="hero-army-split-toggle">
      <input type="checkbox" id="hero-army-split" ${splitActive?'checked':''} ${!selectedUnit||selectedUnit.count<2||!state.turn?'disabled':''}>
      <span>${fr?'Scinder':'Split'}</span>
     </label>
     <div class="hero-army-split-amount" ${!splitActive?'hidden':''}>
      <button type="button" data-hero-split-delta="-1">−</button>
      <input type="number" id="hero-army-split-num" min="1" max="${selectedUnit?selectedUnit.count-1:1}" value="${splitAmount}">
      <button type="button" data-hero-split-delta="1">+</button>
     </div>
     <button type="button" class="hero-army-details-btn" data-hero-army-details ${!selectedUnit?'disabled':''} title="${fr?'Voir la fiche détaillée de la créature':'View creature details'}">${fr?'🔍 Fiche / Détails':'🔍 Details'}</button>
    </div>
   `:`
    <h3>${esc(picked?'Moving: '+picked.name:item?.name||'Choose an artefact')}</h3>
    <p class="hero-artifact-description">${picked?'Choose a highlighted destination. Switch between Equipment and Backpack to move the item.':esc(item?.description?.replace(/[{}]/g,'')||hint)}</p>
    ${hero.owned===false?'':`<div class="hero-artifact-actions">
     <button class="primary" data-hero-move ${!item?.name||item.locked||item.movable===false||picked||!state.turn?'disabled':''}>Move item</button>
     <button data-hero-cancel ${!picked?'disabled':''}>Cancel move</button>
    </div>`}
   `}
  </section>`;
  panel.querySelector('.hero-equipment-grid').scrollTop=scrollPositions[tab]||0;
 }
 panel.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button||button.disabled)return;
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
   else if(slot===17&&slots().find(a=>a.slot===slot)?.name&&state.heroWindow?.owned!==false&&state.turn){command(62,slot);}
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
 return{showMobile(){switchView(false);},update(next){if(state.mode!=='hero'&&next.mode==='hero'&&next.heroWindow?.owned===false){tab='worn';selected=null;selectedArmySlot=null;splitActive=false;scrollPositions.worn=0;scrollPositions.backpack=0;scrollPositions.skills=0;scrollPositions.army=0;}state=next;if(next.mode!=='hero'){panel.hidden=true;signature='';classic=false;delete root.dataset.heroView;return;}root.dataset.heroView=classic?'classic':'mobile';panel.hidden=classic;const key=JSON.stringify([next.heroWindow,next.turn,next.armies]);if(key!==signature){signature=key;render();}},paint(source){if(panel.hidden||classic)return false;if(document.hidden)return true;const rect=state.heroWindow?.portrait,face=panel.querySelector('.hero-face');if(face&&rect?.w){face.getContext('2d').drawImage(source,rect.x*source.width/800,rect.y*source.height/600,rect.w*source.width/800,rect.h*source.height/600,0,0,58,64);}const heroAtlas=window.goonkHeroIconAtlas;
  if(heroAtlas){
   for(const canvas of panel.querySelectorAll('[data-hero-icon]')){
    if(canvas._heroIconAtlas===heroAtlas)continue;
    const index=Number(canvas.dataset.heroIcon),size=canvas.width,columns=heroAtlas.width/size,ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,size,size);
    ctx.drawImage(heroAtlas,index%columns*size,Math.floor(index/columns)*size,size,size,0,0,size,size);
    canvas._heroIconAtlas=heroAtlas;
   }
  }
  paintArtifactIcons(panel);
  return true;
 }};
}
