import {getLanguage} from './i18n.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const upgradeText=offer=>Array.isArray(offer.upgrades)&&offer.upgrades.length?offer.upgrades.join(', '):offer.upgrade||'';
export function renderMithrilOffers(data,{pending=false,canAct=false}={}){
 const fr=getLanguage()==='fr';
 const labels=fr?['Production doublée pendant 7 jours','Améliorer les créatures','Production hebdomadaire doublée','Université avancée : compétences de base améliorables pour 3000 or','Changer le sort proposé','Changer la compétence proposée','Explorer les sorties','Construire un phare','Terrain magique de siège']:['Double production for 7 days','Upgrade creatures','Double weekly production','Advanced University: upgrade Basic skills for 3000 gold','Change the offered spell','Change the offered skill','Explore exits','Build a lighthouse','Magical siege terrain'];
 const terrains=fr?['Terres saintes','Trèfles','Brouillard maléfique','Champs de feu','Lacs lucides','Nuages magiques','Rocailles','Plaines magiques','Terre maudite']:['Holy Ground','Clover Field','Evil Fog','Fiery Fields','Lucid Pools','Magic Clouds','Rocklands','Magic Plains','Cursed Ground'];
 return `<p>${data.amount??0} Mithril</p><div class="mithril-offers">${(data.offers||[]).map(offer=>`<article>
 <h3>${esc(offer.name)} <small>(${offer.x}, ${offer.y})</small></h3>
 <p>${esc(offer.kind===0&&offer.protection?(fr?'Protéger contre le prochain changement hebdomadaire de ressource':'Protect against the next weekly resource change'):labels[offer.kind]||offer.description||'')}${offer.kind===8?` · ${terrains[offer.choice??0]}`:''}${upgradeText(offer)?` · ${esc(upgradeText(offer))}`:''}</p>
 ${offer.current?`<p>${fr?'Actuellement':'Current'} : ${esc(offer.current)}</p>`:''}
 ${offer.dailyIncome!==undefined?`<p>${offer.dailyIncome} ${esc(offer.resource)} / ${fr?'jour':'day'}</p>`:''}
 ${offer.active?`<p>${offer.days?`${offer.days} ${fr?'jours restants':'days remaining'}`:(fr?'Amélioré':'Enhanced')}</p>`:`<button data-mithril-buy="${offer.id}" data-mithril-choice="${offer.choice??0}" ${pending||!canAct||!offer.available?'disabled':''}>${fr?'Améliorer':'Enhance'} · ${offer.cost} Mithril</button>`}
 </article>`).join('')}</div>${data.offers?.length?'':`<p>${fr?'Aucun site améliorable accessible. Les mines et logements doivent appartenir à ton équipe ; place un héros à côté des autres sites.':'No eligible site is accessible. Mines and dwellings must belong to your team; move a hero next to other sites.'}</p>`}`;
}
export function createMithrilEnhancements({root,command}){
 const button=document.createElement('button');button.dataset.mithrilOpen='';button.textContent='Mithril';button.hidden=true;
 root.querySelector('.scene-tools').append(button);
 const panel=document.createElement('section');panel.className='mithril-panel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','mithril-title');
 panel.innerHTML='<header><h2 id="mithril-title">Mithril</h2><button data-mithril-close aria-label="Fermer">✕</button></header><div class="mithril-content"></div>';
 root.append(panel);
 let open=false,state={},signature='',pending=null,pendingKind=null;
 const close=()=>{open=false;pending=null;pendingKind=null;panel.hidden=true;root.dataset.mithrilOpen='false';command(1201,0);};
 button.addEventListener('click',()=>{open=true;signature='';root.dataset.mithrilOpen='true';command(1201,1);});
 panel.addEventListener('click',event=>{
  if(event.target.closest('[data-mithril-close]')){close();return;}
  const buy=event.target.closest('[data-mithril-buy]');if(!buy||buy.disabled||pending!==null)return;
  pending=state.mithril?.revision??0;
  pendingKind=state.mithril?.offers?.find(row=>row.id===Number(buy.dataset.mithrilBuy)&&(row.choice??0)===Number(buy.dataset.mithrilChoice))?.kind??null;
  command(1200,Number(buy.dataset.mithrilBuy),Number(buy.dataset.mithrilChoice),pending);
  signature='';render();
 });
 function render(){
  if(!open||!state.mithril)return;
  panel.hidden=false;
  const next=JSON.stringify([state.mithril,state.turn,pending,getLanguage()]);if(signature===next)return;signature=next;
  const content=panel.querySelector('.mithril-content'),scroll=content.scrollTop;
  content.innerHTML=renderMithrilOffers(state.mithril,{pending:pending!==null,canAct:state.turn});content.scrollTop=scroll;
 }
 return {update(next){state=next;button.hidden=!next.mithrilEnabled||next.mode!=='map';if(open&&(next.mode!=='map'||!next.mithrilEnabled)){close();return;}if(pending!==null&&next.mithril?.revision!==pending){const preview=pendingKind===6&&next.mithril?.revision>pending;pending=null;pendingKind=null;if(preview){close();return;}}render();},get active(){return open;}};
}
