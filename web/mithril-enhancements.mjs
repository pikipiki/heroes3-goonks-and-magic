import {createUIElement} from './ui/material-components.mjs';
import {useScreenComponents,renderMarkup} from './ui/material-components.mjs';
import {getLanguage} from './i18n.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const upgradeText=offer=>Array.isArray(offer.upgrades)&&offer.upgrades.length?offer.upgrades.join(', '):offer.upgrade||'';
export function renderMithrilOffers(data,{pending=false,canAct=false,selectedTerrains={}}={}){
 const fr=getLanguage()==='fr';
 const labels=fr?['Production doublée pendant 7 jours','Améliorer les créatures','Production hebdomadaire doublée','Université avancée : compétences de base améliorables pour 3000 or','Changer le sort proposé','Changer la compétence proposée','Explorer les sorties','Construire un phare','Terrain magique de siège']:['Double production for 7 days','Upgrade creatures','Double weekly production','Advanced University: upgrade Basic skills for 3000 gold','Change the offered spell','Change the offered skill','Explore exits','Build a lighthouse','Magical siege terrain'];
 const terrains=fr?['Terres saintes','Trèfles','Brouillard maléfique','Champs de feu','Lacs lucides','Nuages magiques','Rocailles','Plaines magiques','Terre maudite']:['Holy Ground','Clover Field','Evil Fog','Fiery Fields','Lucid Pools','Magic Clouds','Rocklands','Magic Plains','Cursed Ground'];
 const seenTowns=new Set(),offers=[];
 for(const offer of data.offers||[]){
  if(offer.kind!==8){offers.push(offer);continue;}
  if(seenTowns.has(offer.id))continue;seenTowns.add(offer.id);
  const choices=data.offers.filter(row=>row.kind===8&&row.id===offer.id);
  const selected=choices.find(row=>(row.choice??0)===selectedTerrains[offer.id])||choices[0];
  offers.push({...selected,terrainChoices:choices});
 }
 return `${data.information?'':`<p>${data.amount??0} Mithril</p>`}<div class="mithril-offers">${offers.map(offer=>`<article>
 <h3>${esc(offer.name)} <small>(${offer.x}, ${offer.y})</small></h3>
 <p>${esc(offer.kind===0&&offer.protection?(fr?'Protéger contre le prochain changement hebdomadaire de ressource':'Protect against the next weekly resource change'):labels[offer.kind]||offer.description||'')}${offer.kind===8?` · ${terrains[offer.choice??0]}`:''}${upgradeText(offer)?` · ${esc(upgradeText(offer))}`:''}</p>
 ${offer.current?`<p>${fr?'Actuellement':'Current'} : ${esc(offer.current)}</p>`:''}
 ${offer.dailyIncome!==undefined?`<p>${offer.dailyIncome} ${esc(offer.resource)} / ${fr?'jour':'day'}${offer.incomePercent!==undefined&&offer.incomePercent!==100?` · ${fr?'Avant handicap de revenus':'Before income handicap'} (${offer.incomePercent} %)` : ''}</p>`:''}
 ${offer.terrainChoices?`<label>${fr?'Terrain de siège':'Siege terrain'}<select data-mithril-terrain="${offer.id}" ${pending||!canAct?'disabled':''}>${offer.terrainChoices.map(row=>`<option value="${row.choice??0}" ${(row.choice??0)===(offer.choice??0)?'selected':''}>${esc(terrains[row.choice??0])} · ${row.cost} Mithril</option>`).join('')}</select></label>`:''}
 ${offer.active?`<p>${offer.days?`${offer.days} ${fr?'jours restants':'days remaining'}`:(fr?'Amélioré':'Enhanced')}</p>`:`<button data-mithril-buy="${offer.id}" data-mithril-choice="${offer.choice??0}" ${pending||!canAct||!offer.available?'disabled':''}>${fr?'Améliorer':'Enhance'} · ${offer.cost} Mithril</button>`}
 </article>`).join('')}</div>${data.offers?.length?'':`<p>${fr?'Aucun site améliorable accessible. Les mines et logements doivent appartenir à ton équipe ; place un héros à côté des autres sites.':'No eligible site is accessible. Mines and dwellings must belong to your team; move a hero next to other sites.'}</p>`}`;
}
export function createMithrilEnhancements({root,command}){
 const button=createUIElement('button');button.dataset.mithrilOpen='';button.textContent='Mithril';button.hidden=true;
 root.querySelector('.scene-tools').append(button);
 const panel=document.createElement('section');panel.className='mithril-panel';useScreenComponents(panel);panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','mithril-title');
 renderMarkup(panel,'<header><h2 id="mithril-title">Mithril</h2><button data-mithril-close aria-label="Fermer">✕</button></header><div class="mithril-content"></div>');
 root.append(panel);
 let open=false,state={},signature='',pending=null,pendingKind=null,pricesOpen=false;
 const selectedTerrains={};
 const close=()=>{open=false;pending=null;pendingKind=null;panel.hidden=true;root.dataset.mithrilOpen='false';command(1201,0);};
 button.addEventListener('click',()=>{open=true;signature='';root.dataset.mithrilOpen='true';command(1201,1);});
 panel.addEventListener('change',event=>{
  const select=event.target.closest('[data-mithril-terrain]');if(!select||select.disabled)return;
  selectedTerrains[select.dataset.mithrilTerrain]=Number(select.value);signature='';render();
 });
 panel.addEventListener('click',event=>{
  if(event.target.closest('[data-mithril-close]')){close();return;}
  if(event.target.closest('[data-mithril-prices]')){pricesOpen=!pricesOpen;signature='';render();return;}
  const buy=event.target.closest('[data-mithril-buy]');if(!buy||buy.disabled||pending!==null)return;
  pending=state.mithril?.revision??0;
  pendingKind=state.mithril?.offers?.find(row=>row.id===Number(buy.dataset.mithrilBuy)&&(row.choice??0)===Number(buy.dataset.mithrilChoice))?.kind??null;
  command(1200,Number(buy.dataset.mithrilBuy),Number(buy.dataset.mithrilChoice),pending);
  signature='';render();
 });
 function render(){
  if(!open||!state.mithril)return;
  panel.hidden=false;
  const next=JSON.stringify([state.mithril,state.turn,pending,getLanguage(),selectedTerrains,pricesOpen]);if(signature===next)return;signature=next;
  const content=panel.querySelector('.mithril-content'),scroll=content.scrollTop;
  const info=state.mithril.information,fr=getLanguage()==='fr';
  const information=info?`<section class="mithril-information"><p>${esc(info.total)}</p>${info.prices?.length?`<button data-mithril-prices aria-expanded="${pricesOpen}" aria-controls="mithril-price-list">${esc(info.title)}</button><section id="mithril-price-list" ${pricesOpen?'':'hidden'}><h3>${esc(info.title)}</h3><p>${esc(info.help)}</p><ol>${info.prices.map(row=>`<li>${esc(row)}</li>`).join('')}</ol></section>`:''}</section>`:'';
  panel.querySelector('[data-mithril-close]').setAttribute('aria-label',fr?'Fermer':'Close');
  renderMarkup(content,information+(state.mithrilEnabled?renderMithrilOffers(state.mithril,{pending:pending!==null,canAct:state.turn,selectedTerrains}):''));content.scrollTop=scroll;
 }
 return {update(next){state=next;const available=next.mithrilEnabled||next.mithrilDisplayEnabled;button.hidden=!available||next.mode!=='map';if(open&&(next.mode!=='map'||!available)){close();return;}if(pending!==null&&next.mithril?.revision!==pending){const preview=pendingKind===6&&next.mithril?.revision>pending;pending=null;pendingKind=null;if(preview){close();return;}}render();},get active(){return open;}};
}
