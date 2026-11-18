import {useScreenComponents,screenHeaderMarkup} from './ui/components.mjs';
import {getLanguage} from './i18n.mjs';
const tr=(en,fr)=>getLanguage()==='fr'?fr:en;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(typeof Image!=='undefined')for(const name of ['troop-leave','troop-dismiss']){const icon=new Image();icon.src=new URL('./h3-theme/'+name+'.svg',import.meta.url).href;icon.decode?.().catch(()=>{});}
export function troopActionCapabilities(state,armyId,slot){
 const army=state.armies?.find(a=>a.id===armyId),unit=army?.slots?.[slot];
 const owned=state.heroWindow?.owned!==false&&!!state.turn;
 const dismiss=owned&&!!unit&&(unit.canDismiss??(!army.needsLastStack||army.slots.filter(Boolean).length>1));
 const deploy=state.troopDeployment;
 const leave=owned&&!!unit&&deploy?.heroId===armyId&&deploy.troops.some(t=>t.slot===slot&&t.maximum>0)&&deploy.targets.some(t=>t.available);
 return{army,unit,dismiss,leave:!!leave};
}
export function createTroopActions({root,command,portrait=()=>'',onLeave=()=>{}}){
 const panel=document.createElement('section');panel.className='progression-page troop-actions-page';useScreenComponents(panel);panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','troop-actions-title');root.append(panel);
 let state={},selection=null,confirming=false,pending=false,timer,opener,message='',signature='';
 const close=()=>{panel.hidden=true;signature='';selection=null;pending=false;clearTimeout(timer);root.removeAttribute('data-troop-actions');if(opener?.isConnected)opener.focus({preventScroll:true});};
 function render(){
  if(!selection)return;const cap=troopActionCapabilities(state,selection.army,selection.slot);if(!cap.unit){close();return;}
  const key=JSON.stringify([selection,cap,state.turn,confirming,pending,message,getLanguage()]);if(key===signature)return;signature=key;
  panel.hidden=false;root.setAttribute('data-troop-actions','');
  const keep=cap.army.needsLastStack&&cap.army.slots.filter(Boolean).length===1;
  const leaveReason=state.mode==='town'?tr('Close the town and open the hero army to leave troops on the map.','Ferme le château et ouvre l’armée du héros pour laisser une troupe sur la carte.'):tr('Leaving troops requires a hero on land, an eligible troop and an empty adjacent tile.','Pour laisser une troupe : un héros à terre, une troupe autorisée et une case adjacente libre.');
  panel.innerHTML=`${screenHeaderMarkup({title:tr('Manage troop','Gérer la troupe'),titleId:'troop-actions-title'})}<div class="progression-scroll">
   <article class="troop-action-unit">${portrait(cap.unit)}<div><h3>${esc(cap.unit.name)} × ${cap.unit.count}</h3><p>${esc(cap.army.name)}</p></div></article>
   ${confirming?`<h3>${tr('Dismiss this troop?','Renvoyer cette troupe ?')}</h3><p>${tr('All creatures in this stack will leave your army permanently. They will not remain on the map.','Toutes les créatures de cette troupe quitteront définitivement ton armée. Elles ne resteront pas sur la carte.')}</p>`:
   `<div class="troop-action-choices"><button data-troop-action="leave" ${cap.leave?'':'disabled'}><img src="./web/h3-theme/troop-leave.svg" alt=""><strong>${tr('Leave on the map','Laisser sur la carte')}</strong><span>${tr('Choose the quantity and an adjacent tile.','Choisis la quantité et une case adjacente.')}</span></button><button data-troop-action="dismiss" ${cap.dismiss?'':'disabled'}><img src="./web/h3-theme/troop-dismiss.svg" alt=""><strong>${tr('Dismiss','Renvoyer')}</strong><span>${tr('The troop leaves permanently. Confirmation required.','La troupe part définitivement. Confirmation requise.')}</span></button></div>
   ${keep?`<p>${(cap.unit.count>1?tr('The hero must keep at least one creature. Split this stack first to keep some of them.','Le héros doit garder au moins une créature. Scinde cette troupe pour en garder une partie.'):tr('The hero must keep their last creature.','Le héros doit garder sa dernière créature.'))}</p>`:''}${!cap.leave?`<p>${leaveReason}</p>`:''}`}
   </div><footer><p role="status">${esc(pending?tr('Waiting for the game…','En attente du jeu…'):message)}</p>${confirming?`<button class="primary" data-troop-action="confirm" ${pending||!cap.dismiss?'disabled':''}>${tr('Dismiss permanently','Renvoyer définitivement')}</button>`:''}<button data-troop-action="back" ${pending?'disabled':''}>${confirming?tr('Cancel','Annuler'):tr('Back','Retour')}</button></footer>`;
 }
 panel.addEventListener('click',e=>{const b=e.target.closest('[data-troop-action]');if(!b||b.disabled||pending||!selection)return;const cap=troopActionCapabilities(state,selection.army,selection.slot);
  switch(b.dataset.troopAction){
   case 'back':if(confirming){confirming=false;render();}else close();break;
   case 'leave':if(cap.leave){const slot=selection.slot;close();onLeave(slot);}break;
   case 'dismiss':if(cap.dismiss){confirming=true;render();panel.querySelector('[data-troop-action=back]').focus();}break;
   case 'confirm':if(cap.dismiss){pending=true;command(113,selection.army,selection.slot,cap.unit.id,cap.unit.count);timer=setTimeout(()=>{pending=false;message=tr('Dismissal not confirmed. Check the troop and try again.','Renvoi non confirmé. Vérifie la troupe puis réessaie.');render();},5000);render();}break;
  }
 });
 panel.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!pending){e.preventDefault();if(confirming){confirming=false;render();panel.querySelector('[data-troop-action=back]')?.focus();}else close();}
  if(e.key==='Tab'){const buttons=[...panel.querySelectorAll('button:not(:disabled)')];if(!buttons.length){e.preventDefault();return;}const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
 });
 return{show(army,slot){const cap=troopActionCapabilities(state,army,slot);if(!cap.unit)return;opener=document.activeElement;selection={army,slot,id:cap.unit.id,count:cap.unit.count,mode:state.mode};confirming=false;pending=false;message='';render();panel.querySelector('button:not(:disabled)')?.focus();},update(next){state=next;if(!selection)return;const current=troopActionCapabilities(state,selection.army,selection.slot).unit;if(state.mode!==selection.mode||!current||current.id!==selection.id||current.count!==selection.count||!state.turn){close();return;}render();},close};
}
