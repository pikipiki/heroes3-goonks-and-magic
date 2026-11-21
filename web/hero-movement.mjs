import {createPopupMenu} from './ui/menu.mjs';
export function heroManaText(mana,limit,language='en'){if(!Number.isFinite(mana))return '';return `${language==='fr'?'Magie':'Mana'} ${Math.max(0,Math.floor(mana))}${Number.isFinite(limit)?'/'+Math.max(0,Math.floor(limit)):''}`;}
export function movementBand(hero){const points=Math.max(0,Number(hero.movement)||0),limit=Number(hero.movementLimit);return points===0?'empty':points>=(limit>0?limit*.5:1000)?'high':points>=(limit>0?limit*.2:400)?'medium':'low';}
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function heroMagicStatus(hero,language){
 const mana=heroManaText(hero.mana,hero.manaLimit,language);
 const noBook=hero.hasSpellbook===false;
 if(!mana&&!noBook)return '';
 const missing=language==='fr'?'Sans grimoire':'No spellbook';
 return `<span class="hero-magic-status">${mana?`<span class="hero-mana">${mana}</span>`:''}${noBook?`<span class="hero-no-spellbook">${missing}</span>`:''}</span>`;
}
// Movement points are native values, not an estimated number of terrain steps.
export function heroMovementSummary(state,language='en',{compact=false}={}){
 const heroes=state.heroes?.length?state.heroes:state.heroName?[{name:state.heroName,movement:state.movement,mana:state.heroMana,manaLimit:state.heroManaLimit,hasSpellbook:state.heroHasSpellbook}]:[];
 if(!heroes.length)return '';
 const selected=heroes.findIndex(hero=>Number.isInteger(hero.id)&&Number.isInteger(state.heroId)?hero.id===state.heroId:hero.name===state.heroName);
 const fr=language==='fr',unit=fr?'PM':'MP',label=fr?'Déplacements et magie restants des héros':'Heroes’ remaining movement and mana',solo=heroes.length<=1;
 if(compact){
  const hero=heroes[Math.max(0,selected)],points=Number.isFinite(hero.movement)?Math.max(0,Math.floor(hero.movement)).toLocaleString(fr?'fr-FR':'en-US'):'—';
  return `<section class="hero-movement-summary hero-movement-compact" data-ui="hero-movement" data-hero-solo="${solo}" aria-label="${label}"><button class="hero-picker" aria-label="${fr?'Choisir le héros':'Choose hero'}" ${!state.turn||solo?'disabled':''}><span class="hero-picker-name" translate="no">${escape(hero.name)}</span><span class="hero-picker-points">${points} ${unit}</span><span class="hero-picker-mana">${escape(heroManaText(hero.mana,hero.manaLimit,language))}</span>${solo?'':'<span class="hero-picker-chevron" aria-hidden="true">▾</span>'}</button><div class="hero-picker-options" hidden>${heroes.map((h,i)=>`<button data-hero-index="${Number.isInteger(h.index)?h.index:i}" aria-pressed="${i===Math.max(0,selected)}" ${!state.turn||solo?'disabled':''}>${escape(h.name)} · ${Number.isFinite(h.movement)?Math.max(0,Math.floor(h.movement)).toLocaleString(fr?'fr-FR':'en-US'):'—'} ${unit} · ${escape(heroManaText(h.mana,h.manaLimit,language))}${h.hasSpellbook===false?' · '+(fr?'Sans grimoire':'No spellbook'):''}</button>`).join('')}</div></section>`;
 }
 return `<section class="hero-movement-summary" data-ui="hero-movement" data-hero-solo="${solo}" aria-label="${label}"><button class="hero-scroll" data-hero-scroll="-1" aria-label="${fr?'Héros précédents':'Previous heroes'}" hidden>‹</button><ul class="hero-movement-list">${heroes.map((hero,i)=>{const points=Number.isFinite(hero.movement)?Math.max(0,Math.floor(hero.movement)):null;return `<li data-movement-band="${movementBand(hero)}" class="hero-movement-item${i===selected?' is-active':''}${points===0?' is-exhausted':''}"><button data-hero-index="${Number.isInteger(hero.index)?hero.index:i}" aria-pressed="${i===selected}" ${!state.turn||solo?'disabled':''}>${i===selected?'<span class="hero-selected-mark" aria-hidden="true">✓</span>':''}<strong translate="no">${escape(hero.name)}</strong><span>${points===null?'—':points.toLocaleString(fr?'fr-FR':'en-US')} ${unit}</span>${heroMagicStatus(hero,language)}</button></li>`;}).join('')}</ul><button class="hero-scroll" data-hero-scroll="1" aria-label="${fr?'Héros suivants':'More heroes'}" hidden>›</button></section>`;
}

// One observer for the persistent navigation, rather than one per state update.
export function watchHeroMovement(nav){
 let picker=null,menu=null;
 const paint=()=>{const next=nav.querySelector('.hero-picker');if(next!==picker){menu?.dispose();picker=next;menu=null;if(picker){const summary=picker.closest('.hero-movement-summary');menu=createPopupMenu({anchor:picker,container:summary,placement:'top-end'});}}if(menu)menu.list.append(...picker.closest('.hero-movement-summary').querySelectorAll('.hero-picker-options>button'));
 const list=nav.querySelector('.hero-movement-list');if(!list)return;const max=list.scrollWidth-list.clientWidth;for(const b of nav.querySelectorAll('[data-hero-scroll]')){b.hidden=max<2;b.disabled=Number(b.dataset.heroScroll)<0?list.scrollLeft<2:list.scrollLeft>=max-2;}};
 nav.addEventListener('scroll',paint,true);
 const observer=new ResizeObserver(paint);observer.observe(nav);
 return paint;
}
