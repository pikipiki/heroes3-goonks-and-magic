const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Movement points are native values, not an estimated number of terrain steps.
export function heroMovementSummary(state,language='en'){
 const heroes=state.heroes?.length?state.heroes:state.heroName?[{name:state.heroName,movement:state.movement}]:[];
 const fr=language==='fr',unit=fr?'PM':'MP',label=fr?'Déplacements restants des héros':'Heroes’ remaining movement';
 return `<section class="hero-movement-summary" data-ui="hero-movement" aria-label="${label}"><button class="hero-scroll" data-hero-scroll="-1" aria-label="${fr?'Héros précédents':'Previous heroes'}" hidden>‹</button><ul class="hero-movement-list">${heroes.length?heroes.map((hero,i)=>{const points=Number.isFinite(hero.movement)?Math.max(0,Math.floor(hero.movement)):null;return `<li class="hero-movement-item${hero.name===state.heroName?' is-active':''}${points===0?' is-exhausted':''}"><button data-hero-index="${Number.isInteger(hero.index)?hero.index:i}" aria-pressed="${hero.name===state.heroName}" ${!state.turn?'disabled':''}><strong translate="no">${escape(hero.name)}</strong><span>${points===null?'—':points.toLocaleString(fr?'fr-FR':'en-US')} ${unit}</span></button></li>`;}).join(''):`<li>${fr?'Aucun héros':'No heroes'}</li>`}</ul><button class="hero-scroll" data-hero-scroll="1" aria-label="${fr?'Héros suivants':'More heroes'}" hidden>›</button></section>`;
}

// One observer for the persistent navigation, rather than one per state update.
export function watchHeroMovement(nav){
 const paint=()=>{const list=nav.querySelector('.hero-movement-list');if(!list)return;const max=list.scrollWidth-list.clientWidth;for(const b of nav.querySelectorAll('[data-hero-scroll]')){b.hidden=max<2;b.disabled=Number(b.dataset.heroScroll)<0?list.scrollLeft<2:list.scrollLeft>=max-2;}};
 nav.addEventListener('scroll',paint,true);
 const observer=new ResizeObserver(paint);observer.observe(nav);
 return paint;
}
