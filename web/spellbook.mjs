import {getLanguage} from './i18n.mjs';
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
 const panel=document.createElement('section');panel.className='mobile-spellbook';panel.hidden=true;panel.setAttribute('aria-label','Spellbook');root.querySelector('.mobile-play').append(panel);
 let signature='',state={},book={},pending=null,reusing=null,navigation=null,selected=null;const used=new Map();
 const hero=()=>state.heroId??state.heroName??'current';
 function choose(spell){pending={...spell,hero:hero(),mana:book.mana,school:book.school,page:book.page,combatSpells:book.combatSpells};reusing=null;command(49,spell.id);}
 panel.addEventListener('error',event=>{const img=event.target;if(!img.matches?.('.spell-icon'))return;const spell=book.spells?.find(s=>s.id===Number(img.dataset.icon));const original=document.querySelector('#canvas');if(spell&&original&&Number.isFinite(spell.x)&&Number.isFinite(spell.y)){const canvas=document.createElement('canvas');canvas.width=65;canvas.height=64;canvas.setAttribute('aria-hidden','true');canvas.getContext('2d').drawImage(original,spell.x,spell.y,65,64,0,0,65,64);img.replaceWith(canvas);}else img.hidden=true;},true);
 panel.addEventListener('click',event=>{const b=event.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.spell!==undefined){const spell=book.spells?.find(s=>s.id===Number(b.dataset.spell));if(spell){selected=spell.id;signature='';render();panel.querySelector('[data-spell="'+selected+'"]')?.focus({preventScroll:true});}return;}
  if(b.dataset.castSpell!==undefined){const spell=book.spells?.find(s=>s.id===selected);if(spell?.enabled)choose(spell);return;}
  if(b.dataset.reuse!==undefined){const previous=used.get(hero());if(!previous||book.mana<previous.cost)return;reusing={...previous};navigation=null;signature='';advanceReuse();return;}
  reusing=null;if(b.dataset.spellContext!==undefined){selected=null;command(70,Number(b.dataset.spellContext));return;}if(b.dataset.school!==undefined||b.dataset.page!==undefined){selected=null;panel.querySelector('.spell-list').scrollTop=0;}if(b.dataset.school!==undefined)command(51,Number(b.dataset.school));if(b.dataset.page!==undefined)command(50,Number(b.dataset.page));if(b.dataset.closeBook!==undefined){pending=null;command(0);}
 });
 function advanceReuse(){if(!reusing)return;const position=JSON.stringify(book);if(position===navigation)return;navigation=position;const spell=book.spells?.find(s=>s.id===reusing.id);if(spell){if(spell.enabled)choose(spell);else reusing=null;return;}
  if(book.inCombat===false&&typeof reusing.combatSpells==='boolean'&&book.combatSpells!==reusing.combatSpells){command(70,reusing.combatSpells?1:0);return;}
  if(book.school!==reusing.school){command(51,spellSchoolIndex(reusing.school));return;}
  if(book.page!==reusing.page&&reusing.page<book.pages){command(50,book.page<reusing.page?1:-1);return;}
  reusing=null;
 }
 function render(){
  panel.dataset.browsing=String(book.inCombat===false);
  panel.dataset.spellPalette=String(Math.max(0,spellSchoolIndex(book.school)));
  const scroll=panel.querySelector('.spell-list')?.scrollTop||0;
  const previous=used.get(hero()),spells=book.spells||[];if(!spells.some(s=>s.id===selected))selected=(spells.find(s=>s.enabled)||spells[0])?.id;const active=spells.find(s=>s.id===selected);
  const reuseDisabled=!previous||book.mana<previous.cost||!!reusing;
  const target=targets[active?.target];
  const warning=book.mana<active?.cost?'Not enough mana':'Spell unavailable now';
  const power=book.inCombat===true?book.heroSpellPower:undefined;
  const powerText=power&&Number.isFinite(power.original)&&Number.isFinite(power.effective)&&power.original!==power.effective?`${getLanguage()==='fr'?'Puissance':'Power'} ${power.original} → ${power.effective}`:'';
  const manaLimit=Number.isFinite(book.manaLimit)?` / ${book.manaLimit}`:'';
  const castLabel=book.inCombat===false?(book.combatSpells?'View spell':'Cast spell'):active?.target==='none'?'Cast spell':'Choose target';
  panel.innerHTML=`
   <header>
    <h2>Spellbook <small>${book.mana??0}${manaLimit} mana</small>${powerText?`<small class="spell-effective-power">${esc(powerText)}</small>`:''}</h2>
    <button data-close-book aria-label="Close spellbook">✕</button>
   </header>
   <div class="spell-top-actions">
    <button data-reuse ${reuseDisabled?'disabled':''} ${reusing?'aria-busy="true"':''} title="${esc(previous?previous.name:'No spell used yet')}">
     ${previous?`<img class="last-spell-icon" decoding="sync" src="${spellIconURL(previous.id)}" alt=""><span><small>Reuse last spell</small><strong>${esc(previous.name)}</strong></span><small>${previous.cost} mana</small>`:'Reuse last spell'}
    </button>
   </div>
   ${book.inCombat===false?`<nav class="spell-contexts" aria-label="Spell types"><button data-spell-context="0" aria-pressed="${!book.combatSpells}">Adventure spells</button><button data-spell-context="1" aria-pressed="${!!book.combatSpells}">Combat spells</button></nav>`:''}
   <nav class="spell-schools" aria-label="Spell categories">${schools.map(([symbol,name],i)=>`<button data-school="${i}" aria-pressed="${spellSchoolIds[i]===book.school}"><span aria-hidden="true">${symbol}</span> ${name}</button>`).join('')}</nav>
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
      ${active.enabled?'':`<p class="spell-warning">${warning}</p>`}`:'<p>Select a spell to see its effects.</p>'}
    </article>
   </div>
   <footer>
    <div class="spell-pagination"><button data-page="-1" ${book.page>0?'':'disabled'}>← Previous page</button><span>Page ${(book.page??0)+1}</span><button data-page="1" ${book.page+1>=book.pages?'disabled':''}>Next page →</button></div>
    <button class="spell-confirm primary" data-cast-spell ${active?.enabled?'':'disabled'}>${castLabel}${active?` · ${active.cost} mana`:''}</button>
   </footer>`;
  panel.querySelector('.spell-list').scrollTop=scroll;
 }
 return{update(next){state=next;const mana=next.spellbook?.mana??next.heroMana;
  if(pending&&hero()===pending.hero&&Number.isFinite(mana)&&mana<pending.mana){used.set(pending.hero,{...pending});pending=null;signature='';}
  if(pending&&next.mode!=='spellbook'&&(next.mode!=='battle'||(!next.spellTargeting&&next.canAct)))pending=null;
  panel.hidden=next.mode!=='spellbook';if(panel.hidden){signature='';reusing=null;selected=null;return;}
  book=next.spellbook||{};const previous=used.get(hero()),key=JSON.stringify([book,previous,reusing]);if(key===signature)return;signature=key;
  render();
  if(reusing)queueMicrotask(advanceReuse);
 },get active(){return !panel.hidden;}};
}
