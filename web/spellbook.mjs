import {useScreenComponents,renderMarkup} from './ui/material-components.mjs';
import {createSpellScroll} from './spell-scroll.mjs';
import {spellOneClick} from './battle-preferences.mjs';
import {getLanguage} from './locale-state.mjs';
import {spellSchoolIds,spellSchoolIndex} from './spell-schools.mjs';
import {spellIconURL,warmSpellIcons} from './spell-icons.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const targets = {
 ally: ['✧', 'Ally'],
 enemy: ['✦', 'Enemy'],
 location: ['▧', 'Battlefield tile'],
 creature: ['◇', 'Creature'],
 none: ['◎', 'No target to choose'],
};
const schools = [['✦', 'All'], ['≋', 'Air'], ['◆', 'Earth'], ['✹', 'Fire'], ['◈', 'Water']];
const icon = spell => `<span class="spell-symbol" aria-hidden="true"><img class="spell-icon" decoding="sync" data-icon="${spell.id}" src="${spellIconURL(spell.id)}" alt=""></span>`;

export function createMobileSpellbook({root,command}){
 warmSpellIcons();
 const panel=document.createElement('section');panel.className='mobile-spellbook';useScreenComponents(panel);panel.hidden=true;panel.setAttribute('aria-label','Spellbook');root.querySelector('.mobile-play').append(panel);
 let signature='',state={},book={},pending=null,reusing=null,pendingReuse=false,navigation=null,selected=null;const used=new Map();
 const scrollBook=createSpellScroll(command);
 const hero=()=>state.heroId??state.heroName??'current';
 function choose(spell){if(pending||book.readOnly)return;pending={...spell,hero:hero(),mana:book.mana,school:book.school,page:spell.nativePage??book.page,combatSpells:book.combatSpells};reusing=null;scrollBook.choose(spell,()=>command(49,spell.id));}
 panel.addEventListener('error',event=>{const img=event.target;if(!img.matches?.('.spell-icon'))return;const spell=book.spells?.find(s=>s.id===Number(img.dataset.icon));const original=document.querySelector('#canvas');if(spell&&original&&Number.isFinite(spell.x)&&Number.isFinite(spell.y)){const canvas=document.createElement('canvas');canvas.width=65;canvas.height=64;canvas.setAttribute('aria-hidden','true');canvas.getContext('2d').drawImage(original,spell.x,spell.y,65,64,0,0,65,64);img.replaceWith(canvas);}else img.hidden=true;},true);
 panel.addEventListener('click',event=>{const b=event.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.spell!==undefined){const spell=book.spells?.find(s=>s.id===Number(b.dataset.spell));if(spell){selected=spell.id;if(book.inCombat===true&&spellOneClick()&&!book.readOnly&&spell.enabled){choose(spell);return;}signature='';render();panel.querySelector('[data-spell="'+selected+'"]')?.focus({preventScroll:true});}return;}
  if(b.dataset.castSpell!==undefined){const spell=book.spells?.find(s=>s.id===selected);if(spell?.enabled)choose(spell);return;}
  if(b.dataset.reuse!==undefined){const previous=used.get(hero());if(book.readOnly||!previous||book.mana<previous.cost)return;reusing={...previous};navigation=null;signature='';advanceReuse();return;}
  reusing=null;if(b.dataset.spellContext!==undefined){selected=null;command(70,Number(b.dataset.spellContext));return;}if(b.dataset.school!==undefined||b.dataset.page!==undefined){selected=null;panel.querySelector('.spell-list').scrollTop=0;}if(b.dataset.school!==undefined)command(51,Number(b.dataset.school));if(b.dataset.page!==undefined)command(50,Number(b.dataset.page));if(b.dataset.closeBook!==undefined){pending=null;command(0);}
 });
 panel.addEventListener('change',event=>{if(event.target.matches('[data-school-select]')){selected=null;panel.querySelector('.spell-list').scrollTop=0;command(51,Number(event.target.value));}});
 function advanceReuse(){if(!reusing)return;const position=JSON.stringify(book);if(position===navigation)return;navigation=position;const spell=book.spells?.find(s=>s.id===reusing.id);if(spell){if(spell.enabled)choose(spell);else reusing=null;return;}
  if(book.inCombat===false&&typeof reusing.combatSpells==='boolean'&&book.combatSpells!==reusing.combatSpells){command(70,reusing.combatSpells?1:0);return;}
  if(book.school!==reusing.school){command(51,spellSchoolIndex(reusing.school));return;}
  if(book.page!==reusing.page&&reusing.page<book.pages){command(50,book.page<reusing.page?1:-1);return;}
  reusing=null;
 }
 function render(){
  panel.dataset.browsing=String(book.inCombat===false);
  panel.dataset.scrolling=String(book.inCombat===true);
  panel.dataset.readOnly=String(!!book.readOnly);
  const schoolLabels=getLanguage()==='fr'?['Tous','Air','Terre','Feu','Eau']:schools.map(([,name])=>name);
  panel.dataset.spellPalette=String(Math.max(0,spellSchoolIndex(book.school)));
  const scroll=panel.querySelector('.spell-list')?.scrollTop||0;
  const previous=used.get(hero()),spells=book.spells||[];if(!spells.some(s=>s.id===selected))selected=(spells.find(s=>s.enabled)||spells[0])?.id;const active=spells.find(s=>s.id===selected);
  const reuseDisabled=book.readOnly||!previous||book.mana<previous.cost||!!reusing;
  panel.dataset.hasReuse=String(!book.readOnly&&!!previous);
  const target=targets[active?.target];
  const warning=book.mana<active?.cost?'Not enough mana':'Spell unavailable now';
  const power=book.inCombat===true?book.heroSpellPower:undefined;
  const powerText=power&&Number.isFinite(power.original)&&Number.isFinite(power.effective)&&power.original!==power.effective?`${getLanguage()==='fr'?'Puissance':'Power'} ${power.original} → ${power.effective}`:'';
  const manaLimit=Number.isFinite(book.manaLimit)?` / ${book.manaLimit}`:'';
  const castLabel=book.inCombat===false?(book.combatSpells?'View spell':'Cast spell'):active?.target==='none'?'Cast spell':'Choose target';
  renderMarkup(panel,`
   <header>
    <h2>Spellbook <small>${book.mana??0}${manaLimit} mana</small>${powerText?`<small class="spell-effective-power">${esc(powerText)}</small>`:''}</h2>
    <button data-close-book aria-label="Close spellbook">✕</button>
   </header>
   ${book.readOnly?`<p class="spell-top-actions spell-inspection-note">${getLanguage()==='fr'?'Grimoire du héros à recruter · consultation uniquement.':'Hero for hire spellbook · read only.'}</p>`:`<div class="spell-top-actions">
    <button data-reuse ${reuseDisabled?'disabled':''} ${reusing?'aria-busy="true"':''} title="${esc(previous?previous.name:'No spell used yet')}">
     ${previous&&!reuseDisabled?`<span><strong>${esc(previous.name)}</strong><small>${previous.cost} mana</small></span>`:'Reuse last spell'}
    </button>
   </div>`}
   <div class="spell-workspace">
   ${book.inCombat===false?`<nav class="spell-contexts" aria-label="Spell types"><button data-spell-context="0" aria-pressed="${!book.combatSpells}">Adventure spells</button><button data-spell-context="1" aria-pressed="${!!book.combatSpells}">Combat spells</button></nav>`:''}
   <label class="spell-school-picker"><select data-school-select aria-label="${getLanguage()==='fr'?'École de magie':'Magic school'}">${schools.map(([,name],index)=>`<option value="${index}" ${spellSchoolIds[index]===book.school?'selected':''}>${schoolLabels[index]}</option>`).join('')}</select></label>
   <div class="spell-content">
    <div class="spell-list" aria-label="Spells">
     ${spells.map(spell=>`<button class="spell-row${spell.enabled?'':' is-unavailable'}" data-spell="${spell.id}" aria-pressed="${spell.id===selected}">
      ${icon(spell)}<strong>${esc(spell.name)}</strong><small>${spell.cost} mana</small>
     </button>`).join('')||'<p>No spells in this category.</p>'}
    </div>
    <article class="spell-selection" aria-live="polite">
     ${active?`<div class="spell-illumination">${icon(active)}<div><h3>${esc(active.name)}</h3>
      <small>Level ${active.level} · ${active.cost} mana</small>
      ${target?`<p class="spell-target" data-spell-target="${active.target}"><span aria-hidden="true">${target[0]}</span> ${target[1]}</p>`:''}</div></div>
      <p>${esc(active.description).replace(/[{}]/g,'')}</p>
      ${active.enabled||book.readOnly?'':`<p class="spell-warning">${warning}</p>`}`:'<p>Select a spell to see its effects.</p>'}
    </article>
   </div>

   </div>
   <footer ${book.readOnly?'hidden':''}>
    ${book.readOnly?'':`<button class="spell-confirm primary" data-cast-spell ${active?.enabled?'':'disabled'}>${castLabel}${active?` · ${active.cost} mana`:''}</button>`}
   </footer>`);
  panel.querySelector('.spell-list').scrollTop=scroll;
 }
 return{update(next){const wasBook=state.mode==='spellbook';state=next;const mana=next.spellbook?.mana??next.heroMana;
  if(pending&&hero()===pending.hero&&Number.isFinite(mana)&&mana<pending.mana){used.set(pending.hero,{...pending});pending=null;signature='';}
  // Closing the book and ending targeting can both precede the mana update.
  // Keep the candidate through battle snapshots; reopening without a mana debit
  // confirms cancellation and must not replace the last successfully used spell.
  if(pending&&(hero()!==pending.hero||(next.mode==='spellbook'&&!wasBook)||!['spellbook','battle'].includes(next.mode)))pending=null;
  if(!['spellbook','battle'].includes(next.mode)||(next.mode==='battle'&&next.spellTargeting))pendingReuse=false;
  panel.hidden=next.mode!=='spellbook';if(panel.hidden){signature='';reusing=null;selected=null;scrollBook.reset();return;}
  book=scrollBook.accept(next.spellbook||{},hero());const previous=used.get(hero());
  if(!wasBook&&pendingReuse){pendingReuse=false;if(previous&&!book.readOnly&&book.mana>=previous.cost)reusing={...previous};}
  const key=JSON.stringify([book,previous,reusing]);if(key===signature)return;signature=key;
  render();
  if(reusing)queueMicrotask(advanceReuse);
 },get active(){return !panel.hidden;},lastSpell(nextState=state){const key=nextState?.heroId??nextState?.heroName??'current';return used.get(key)||null;},reuseLast(nextState=state){const key=nextState?.heroId??nextState?.heroName??'current';const previous=used.get(key);if(!previous)return false;pendingReuse=true;return true;}};
}
