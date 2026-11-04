const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Movement points are native values, not an estimated number of terrain steps.
export function heroMovementSummary(state,language='en'){
 const heroes=state.heroes?.length?state.heroes:state.heroName?[{name:state.heroName,movement:state.movement}]:[];
 const fr=language==='fr',unit=fr?'PM':'MP',label=fr?'Déplacements restants des héros':'Heroes’ remaining movement';
 return `<section class="hero-movement-summary" data-ui="hero-movement" aria-label="${label}"><ul class="hero-movement-list">${heroes.length?heroes.map(hero=>{const points=Number.isFinite(hero.movement)?Math.max(0,Math.floor(hero.movement)):null;return `<li class="hero-movement-item${hero.name===state.heroName?' is-active':''}${points===0?' is-exhausted':''}"><strong translate="no">${escape(hero.name)}</strong><span>${points===null?'—':points.toLocaleString(fr?'fr-FR':'en-US')} ${unit}</span></li>`;}).join(''):`<li>${fr?'Aucun héros':'No heroes'}</li>`}</ul></section>`;
}
