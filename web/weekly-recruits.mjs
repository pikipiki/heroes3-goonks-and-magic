import {creaturePortrait} from './creature-portraits.mjs';
import {gameDate} from './game-calendar.mjs';
import {getLanguage} from './i18n.mjs';

const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({
 '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

export function createWeeklyRecruits(body){
 let townId, signature;
 function update(state){
  const towns=state.towns || [];
  const town=towns.find(item=>item.id===townId) || towns[0];
  townId=town?.id;
  const language=getLanguage(), fr=language==='fr', date=gameDate(state.day);
  const next=JSON.stringify([state.weeklyRecruitsReady,date,language,towns.map(item=>[item.id,item.name]),town?.weeklyRecruits]);
  if(signature===next)return;
  signature=next;
  if(!state.weeklyRecruitsReady){body.innerHTML=fr?'<p role="status">Chargement des recrues…</p>':'<p role="status">Loading recruits…</p>';return;}
  if(!town){body.innerHTML=fr?'<p>Aucune ville sous ton contrôle.</p>':'<p>No towns under your control.</p>';return;}

  const rows=(town.weeklyRecruits || []).map(row=>{
   const [first]=row.forms || [];
   if(!first)return '';
   const forms=row.forms.map(unit=>`<li class="${unit.built?'':'weekly-locked'}"><span>${escape(unit.name)}</span>${unit.built?'':' <span role="img" aria-label="'+(fr?'Verrouillée':'Locked')+'">🔒</span>'}</li>`).join('');
   const growth=Number.isInteger(row.growth)?`+${row.growth}`:'—';
   return `<tr><th scope="row"><div class="weekly-creatures">${creaturePortrait(first)}<ul>${forms}${row.summoned?(fr?'<li class="weekly-locked">Portail d’invocation</li>':'<li class="weekly-locked">Summoning portal</li>'):''}</ul></div></th><td>${row.count}</td><td class="weekly-incoming">${growth}</td></tr>`;
  }).join('');
  const renewal=date && gameDate(state.day+date.untilNextWeek);
  const caption=renewal?(fr?`Jour 1 · Semaine ${renewal.week} · Mois ${renewal.month}`:`Day 1 · Week ${renewal.week} · Month ${renewal.month}`):'';
  const townControl=towns.length>1?`<label class="weekly-town">${fr?'Ville':'Town'} <select>${towns.map(item=>`<option value="${item.id}" ${item.id===townId?'selected':''}>${escape(item.name)}</option>`).join('')}</select></label>`:`<h3>${escape(town.name)}</h3>`;
  const focused=body.contains(document.activeElement)&&document.activeElement.matches('select');
  const scroll=body.scrollTop;
  body.innerHTML=`<section class="weekly-roster">${townControl}<p class="weekly-date">${caption}</p>
   <table aria-label="${fr?'Recrues par niveau':'Recruits by level'}"><thead><tr><th scope="col">${fr?'Créatures':'Creatures'}</th><th scope="col">${fr?'En stock':'In stock'}</th><th scope="col">${fr?'Semaine suivante':'Next week'}</th></tr></thead><tbody>${rows}</tbody></table>
   <p class="weekly-note">${fr?'🔒 Forme verrouillée. Stock partagé entre les formes débloquées d’une même ligne.':'🔒 Locked tier. Stock shared across unlocked tiers of the same line.'}</p>
   <p class="weekly-note">${fr?'Prévision selon les bâtiments actuels et les bonus connus. Les semaines spéciales peuvent la modifier.':'Estimate based on current buildings and known bonuses. Special weeks may alter this.'}</p></section>`;
  const selector=body.querySelector('select');
  selector?.addEventListener('change',event=>{townId=Number(event.target.value);update(state);});
  if(focused)selector?.focus({preventScroll:true});
  body.scrollTop=scroll;
 }
 return {open(state){townId=state.armyTownId;signature=undefined;update(state);},update};
}
