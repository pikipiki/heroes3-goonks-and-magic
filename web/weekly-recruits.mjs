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
  const language=getLanguage(), date=gameDate(state.day);
  const next=JSON.stringify([state.weeklyRecruitsReady,date,language,towns.map(item=>[item.id,item.name]),town?.weeklyRecruits]);
  if(signature===next)return;
  signature=next;
  if(!state.weeklyRecruitsReady){body.innerHTML='<p role="status">Chargement des recrues…</p>';return;}
  if(!town){body.innerHTML='<p>Aucune ville sous ton contrôle.</p>';return;}

  const rows=(town.weeklyRecruits || []).map(row=>{
   const [first]=row.forms || [];
   if(!first)return '';
   const forms=row.forms.map(unit=>`<li class="${unit.built?'':'weekly-locked'}"><span>${escape(unit.name)}</span>${unit.built?'':' <span role="img" aria-label="Verrouillée">🔒</span>'}</li>`).join('');
   const growth=Number.isInteger(row.growth)?`+${row.growth}`:'—';
   return `<tr><th scope="row"><div class="weekly-creatures">${creaturePortrait(first)}<ul>${forms}${row.summoned?'<li class="weekly-locked">Portail d’invocation</li>':''}</ul></div></th><td>${row.count}</td><td class="weekly-incoming">${growth}</td></tr>`;
  }).join('');
  const renewal=date && gameDate(state.day+date.untilNextWeek);
  const caption=renewal?(language==='fr'?`Jour 1 · Semaine ${renewal.week} · Mois ${renewal.month}`:`Day 1 · Week ${renewal.week} · Month ${renewal.month}`):'';
  const townControl=towns.length>1?`<label class="weekly-town">Ville <select>${towns.map(item=>`<option value="${item.id}" ${item.id===townId?'selected':''}>${escape(item.name)}</option>`).join('')}</select></label>`:`<h3>${escape(town.name)}</h3>`;
  const focused=body.contains(document.activeElement)&&document.activeElement.matches('select');
  const scroll=body.scrollTop;
  body.innerHTML=`<section class="weekly-roster">${townControl}<p class="weekly-date">${caption}</p>
   <table aria-label="Recrues par niveau"><thead><tr><th scope="col">Créatures</th><th scope="col">En stock</th><th scope="col">Semaine suivante</th></tr></thead><tbody>${rows}</tbody></table>
   <p class="weekly-note">🔒 Forme verrouillée. Stock partagé entre les formes débloquées d’une même ligne.</p>
   <p class="weekly-note">Prévision selon les bâtiments actuels et les bonus connus. Les semaines spéciales peuvent la modifier.</p></section>`;
  const selector=body.querySelector('select');
  selector?.addEventListener('change',event=>{townId=Number(event.target.value);update(state);});
  if(focused)selector?.focus({preventScroll:true});
  body.scrollTop=scroll;
 }
 return {open(state){townId=state.armyTownId;signature=undefined;update(state);},update};
}
