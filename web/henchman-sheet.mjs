import {getLanguage} from './locale-state.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderHenchmanSheet(hero,{portrait=()=>'',canAct=false,pending=false}={}){
 const fr=getLanguage()==='fr',state=hero.henchman;
 if(!state)return '';
 const unit=state.unit,held=!!hero.picked,disabled=!canAct||pending||held;
 const banners=fr?['Vitalité','Attaque','Défense','Dégâts','Vitesse','Expérience','Réduction de défense','Blocage partiel','Ripostes']:['Health','Attack','Defence','Damage','Speed','Experience','Defence reduction','Partial block','Retaliations'];
 return `<div class="henchman-sheet">
  <section class="hero-specialty"><div>
   <h3>${fr?'Compagnon':'Henchman'}</h3>
   <p>${fr?'Choisis une créature de ton armée : elle combat et progresse comme compagnon, en plus de ton commandant.':'Choose a creature from your army to fight and gain experience as a companion alongside your commander.'}</p>
   ${unit?`${portrait(unit)}<h4>${esc(unit.name)} · ${fr?'Niveau':'Level'} ${state.level}</h4>
   <p>${state.alive?(fr?'En vie':'Alive'):(fr?'Mort':'Dead')} · ${state.experience} XP · ${state.nextLevel} ${fr?'XP avant le niveau suivant':'XP until next level'}</p>
   ${state.stackExperienceEnabled?`<p>${fr?'Expérience de troupe':'Stack experience'} : ${state.stackExperience} · ${fr?'Rang':'Rank'} ${state.rank}</p>`:''}
   <dl class="creature-stats"><div><dt>ATK</dt><dd>${unit.attack}</dd></div><div><dt>DEF</dt><dd>${unit.defense}</dd></div><div><dt>DMG</dt><dd>${unit.damageMin}–${unit.damageMax}</dd></div><div><dt>HP</dt><dd>${unit.health}</dd></div><div><dt>SPD</dt><dd>${unit.speed}</dd></div></dl>
   <div class="henchman-actions">${state.alive?'':`<button data-henchman-action="2" ${disabled||!state.canResurrect?'disabled':''}>${fr?'Ressusciter':'Resurrect'} · ${state.resurrectionCost} ${fr?'or':'gold'}</button>`}
   <button data-henchman-action="1" ${disabled?'disabled':''}>${fr?'Renvoyer':'Dismiss'}</button></div>
   ${state.bannerEnabled&&state.bannerStyle>=0?`<p>${fr?'Renvoyer le compagnon fait perdre sa bannière. Tu peux d’abord la remettre dans le sac.':'Dismissing the henchman loses its banner. You can return it to your backpack first.'}</p>`:''}
   ${state.alive?'':`<p>${state.reviveAnywhere?(fr?'Tu peux ressusciter ton compagnon ici.':'You can resurrect your henchman here.'):(fr?'La résurrection se fait dans une ville qui t’appartient.':'Resurrection requires visiting one of your towns.')}</p>`}`:`<p>${fr?'Aucun compagnon choisi.':'No companion selected.'}</p>`}
  </div></section>
  ${unit&&state.bannerEnabled?`<section class="hero-secondary"><h3>${fr?'Bannière de guerre':'Warlord’s Banner'}</h3>
  ${held&&state.canEquipHeldBanner?`<button data-henchman-action="6" ${!canAct||pending?'disabled':''}>${fr?'Donner la bannière portée':'Give held banner'}</button>`:''}
  ${state.bannerStyle>=0?`<p>${fr?'Style équipé':'Equipped style'} : ${banners[state.bannerStyle]||''}</p>
  <div class="henchman-candidates">${banners.map((name,style)=>`<button data-henchman-action="4" data-henchman-slot="${style}" aria-pressed="${state.bannerStyle===style}" ${disabled||state.bannerStyle===style?'disabled':''}>${name}</button>`).join('')}</div>
  <button data-henchman-action="5" ${disabled||!state.canReturnBanner?'disabled':''}>${fr?'Remettre dans le sac':'Return to backpack'}</button>`:
  `<p>${fr?'Une bannière de guerre dans le sac peut être confiée au compagnon.':'A Warlord’s Banner in your backpack can be given to the henchman.'}</p><button data-henchman-action="3" ${disabled||!state.canEquipBanner?'disabled':''}>${fr?'Équiper la bannière':'Equip banner'}</button>`}</section>`:''}
  <section class="hero-secondary"><h3>${fr?'Choisir un compagnon':'Choose a henchman'}</h3>
  <p>${fr?'Une créature quitte son groupe pour devenir ton compagnon.':'One creature leaves its stack to become your companion.'} ${state.returnToArmy===false?(fr?'Lors d’un remplacement, le précédent compagnon quitte le héros.':'When replaced, the previous henchman leaves the hero.'):(fr?'Lors d’un remplacement, ton ancien compagnon vivant retourne dans ton armée.':'Replacing a living henchman returns it to your army.')}</p>
  ${state.replacementLossPercent>0?`<p>${fr?'Un remplacement fait perdre':'Replacement loses'} ${state.replacementLossPercent} % ${fr?'de l’expérience de combat du compagnon.':'of the henchman’s battle experience.'}</p>`:''}
  <div class="henchman-candidates">${(state.candidates||[]).map(candidate=>`<button data-henchman-action="0" data-henchman-slot="${candidate.slot}" data-henchman-creature="${candidate.id}" ${disabled||!candidate.available?'disabled':''}>${portrait(candidate)}<span>${esc(candidate.name)}</span></button>`).join('')}</div></section>
 </div>`;
}
