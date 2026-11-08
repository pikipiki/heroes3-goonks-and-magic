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
export function createHeroEquipment({root,command,onViewChange=()=>{},portrait=()=>''}){
 const panel=document.createElement('section');panel.className='hero-equipment-page';panel.hidden=true;panel.setAttribute('aria-label','Hero equipment');root.querySelector('.mobile-play').append(panel);let state={},tab='worn',selected=null,signature='',classic=false;const scrollPositions={worn:0,backpack:0,skills:0,army:0};
 const switchView=value=>{classic=value;root.dataset.heroView=value?'classic':'mobile';panel.hidden=classic||state.mode!=='hero';onViewChange();};
 const slots=()=>tab==='worn'?state.heroWindow?.slots||[]:tab==='backpack'?state.heroWindow?.backpack||[]:[];
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
    <p class="hero-army-help">${fr?'Armée du héros (7 emplacements). Touche une troupe pour voir sa fiche ou réorganise ci-dessous.':'Hero army (7 slots). Tap any unit for details or manage below.'}</p>
    ${hero.owned!==false&&state.turn?`<button type="button" class="primary hero-army-manage-btn" data-hero-open-army>${fr?'⚔️ Organiser / Scinder les troupes':'⚔️ Manage / Split troops'}</button>`:''}
   </div>
   <div class="hero-army-slots">
    ${items.map((unit,slot)=>`
     <button type="button" class="hero-army-slot" data-army-slot="${slot}" ${unit?'':'disabled'} aria-label="${esc(unit?`${unit.name} × ${unit.count}`:(fr?'Emplacement libre':'Empty slot'))}">
      <span class="hero-army-slot-num">#${slot+1}</span>
      <div class="hero-army-slot-content">
       ${unit?`
        <div class="hero-army-slot-art">
         ${portrait(unit)}
         <strong class="hero-army-slot-count">× ${unit.count}</strong>
        </div>
        <div class="hero-army-slot-info">
         <span class="hero-army-slot-name">${esc(unit.name)}</span>
         ${unit.attack!==undefined?`<small class="hero-army-slot-stats">⚔️ ${unit.attack} 🛡️ ${unit.defense}</small>`:''}
        </div>
       `:`
        <span class="hero-empty" aria-hidden="true">＋</span>
        <span class="hero-army-empty-label">${fr?'Libre':'Empty'}</span>
       `}
      </div>
     </button>
    `).join('')}
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
  const armyCount=(heroArmy?.slots||[]).filter(s=>s&&s.count>0).length;
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
  <section class="hero-artifact-detail" aria-live="polite" ${skills||isArmy?'hidden':''}>
   <h3>${esc(picked?'Moving: '+picked.name:item?.name||'Choose an artefact')}</h3>
   <p class="hero-artifact-description">${picked?'Choose a highlighted destination. Switch between Equipment and Backpack to move the item.':esc(item?.description?.replace(/[{}]/g,'')||hint)}</p>
   ${hero.owned===false?'':`<div class="hero-artifact-actions">
    <button class="primary" data-hero-move ${!item?.name||item.locked||item.movable===false||picked||!state.turn?'disabled':''}>Move item</button>
    <button data-hero-cancel ${!picked?'disabled':''}>Cancel move</button>
   </div>`}
  </section>`;
  panel.querySelector('.hero-equipment-grid').scrollTop=scrollPositions[tab]||0;
 }
 panel.addEventListener('click',event=>{const button=event.target.closest('button');if(!button||button.disabled)return;if(button.hasAttribute('data-hero-commander')){command(85);return;}if(button.hasAttribute('data-hero-classic')){switchView(true);return;}if(button.hasAttribute('data-hero-close')){command(63);return;}if(button.hasAttribute('data-hero-open-army')){root.dispatchEvent(new CustomEvent('goonk-open-army'));return;}if(button.dataset.heroTab){tab=button.dataset.heroTab;selected=null;render();return;}if(button.dataset.armySlot!==undefined){const slot=Number(button.dataset.armySlot);const hero=state.heroWindow||{};const heroArmy=(state.armies||[]).find(a=>(Number.isInteger(hero.id)&&a.id===hero.id)||a.name===hero.name)||(state.armies||[])[0];if(heroArmy&&!heroTransition?.pending)command(41,heroArmy.id,slot);return;}if(button.dataset.heroSlot!==undefined){const slot=Number(button.dataset.heroSlot);if(state.heroWindow?.picked){if(slots().find(a=>a.slot===slot)?.allowed)command(62,slot);}else if(slot===17&&slots().find(a=>a.slot===slot)?.name&&state.heroWindow?.owned!==false&&state.turn){command(62,slot);}else{selected=slot;render();}return;}if(button.hasAttribute('data-hero-move')&&selected!==null)command(62,selected);if(button.hasAttribute('data-hero-cancel'))command(64);});
 return{showMobile(){switchView(false);},update(next){if(state.mode!=='hero'&&next.mode==='hero'&&next.heroWindow?.owned===false){tab='worn';selected=null;scrollPositions.worn=0;scrollPositions.backpack=0;scrollPositions.skills=0;scrollPositions.army=0;}state=next;if(next.mode!=='hero'){panel.hidden=true;signature='';classic=false;delete root.dataset.heroView;return;}root.dataset.heroView=classic?'classic':'mobile';panel.hidden=classic;const key=JSON.stringify([next.heroWindow,next.turn,next.armies]);if(key!==signature){signature=key;render();}},paint(source){if(panel.hidden||classic)return false;if(document.hidden)return true;const rect=state.heroWindow?.portrait,face=panel.querySelector('.hero-face');if(face&&rect?.w){face.getContext('2d').drawImage(source,rect.x*source.width/800,rect.y*source.height/600,rect.w*source.width/800,rect.h*source.height/600,0,0,58,64);}const heroAtlas=window.goonkHeroIconAtlas;
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
