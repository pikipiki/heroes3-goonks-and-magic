import {equipmentSlotNames, paintArtifactIcons} from './hero-equipment.mjs';
import {plainGameText} from './game-text.mjs';

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const slotName=slot=>slot.backpack?'Sac à dos':equipmentSlotNames[slot.slot]||'Équipement';

export function createHeroExchange({root,command,refresh,portrait}){
 const panel=document.createElement('section');
 panel.className='hero-exchange-page';
 panel.setAttribute('aria-label','Échange entre héros');
 panel.hidden=true;
 root.querySelector('.mobile-play').append(panel);
 let heroes=[],classic=false,turn=false,classicOnly=false,signature='',tab='equipment';
 let source=null,destination=null,quantity=1,pending=null,message='';
 const slots=side=>tab==='troops'?heroes[side]?.roster:heroes[side]?.slots;
 const itemAt=selection=>slots(selection?.side)?.find(item=>item.slot===selection.slot&&item.id===selection.id);
 const troopSwap=(item,target)=>!!target.name&&target.id!==item.id;
 const mustKeepOne=hero=>hero.army.needsLastStack&&hero.roster.filter(slot=>slot.name).length===1;
 function maximum(item,side,target){
  if(!turn||!item||source.side===side)return 0;
  if(tab==='equipment')return item.destinations?.includes(target.slot)?1:0;
  const hero=heroes[source.side],swap=troopSwap(item,target);
  if(!hero.owned||swap&&!heroes[side].owned)return 0;
  const keepOne=mustKeepOne(hero)&&!swap;
  return item.count-(keepOne?1:0);
 }
 function clearSelection(){
  source=null;
  destination=null;
  quantity=1;
 }
 function setView(value){
  classic=value;
  panel.hidden=classic;
  root.dataset.exchangeView=classic?'classic':'mobile';
  refresh();
 }
 function render(){
  const troops=tab==='troops',item=itemAt(source),target=itemAt(destination);
  const targetHero=heroes[destination?.side];
  const countLimit=target?maximum(item,destination.side,target):0;
  const swap=target?.name&&(troops?troopSwap(item,target):true);
  const scroller=panel.querySelector('.exchange-inventories');
  const scroll=scroller?.scrollTop||0;
  const active=document.activeElement;
  const focused=panel.contains(active)?active.dataset.exchangeFocus:null;
  const focusedSlot=panel.contains(active)?active.dataset.exchangeSlot:null;
  const itemMarkup=(slot,side)=>{
   const compatible=maximum(item,side,slot)>0;
   const current=item===slot||target===slot;
   const disabled=!!pending||(item&&source.side!==side&&!compatible)||(!slot.name&&!compatible)||(troops&&!item&&!heroes[side].owned);
   const label=slot.name||(troops?'Emplacement vide':slot.backpack?'Déposer dans le sac':slotName(slot));
   return `<button type="button" class="exchange-slot${compatible?' can-receive':''}" data-exchange-slot="${side}:${slot.slot}"
    aria-pressed="${current}" ${disabled?'disabled':''}>
    ${slot.name?(troops?portrait(slot):`<canvas width="64" height="64" data-artifact-icon="${slot.icon}" aria-hidden="true"></canvas>`):'<span aria-hidden="true">＋</span>'}
    <span><strong>${escape(label)}${troops&&slot.name?` × ${slot.count}`:''}</strong>
    ${!troops&&!slot.backpack&&slot.name?`<small>${escape(slotName(slot))}</small>`:''}</span>
   </button>`;
  };
  const sideMarkup=(hero,side)=>{
   const group=(backpack,label)=>{
    const visible=hero.slots.filter(slot=>slot.backpack===backpack&&(slot.name||maximum(item,side,slot)>0));
    return `<h4>${label}</h4>${visible.length?visible.map(slot=>itemMarkup(slot,side)).join(''):'<p class="exchange-empty">Aucun objet</p>'}`;
   };
   return `<section class="exchange-inventory">
    <header><canvas class="exchange-face" width="48" height="56" data-exchange-face="${side}" aria-hidden="true"></canvas>
    <h3>${escape(hero.name)}</h3></header>
    ${troops?hero.roster.map(slot=>itemMarkup(slot,side)).join(''):group(false,'Objets équipés')+group(true,'Sac à dos')}
   </section>`;
  };
  const available=turn&&heroes.some(hero=>hero.owned);
  const hasDestination=item&&slots(1-source.side).some(slot=>maximum(item,1-source.side,slot)>0);
  const keepsOne=troops&&item&&mustKeepOne(heroes[source.side]);
  const instruction=!turn?'Disponible à ton tour':
   !item?(troops?(heroes.every(hero=>hero.owned)?'Choisis une troupe à transférer.':'Choisis une de tes troupes à donner à ton allié.'):'Choisis un objet à transférer.'):
   !hasDestination?(keepsOne?'Chaque héros doit garder au moins une créature.':'Aucun emplacement compatible chez l’autre héros.'):
   target&&keepsOne&&!swap?'Chaque héros doit garder au moins une créature.':
   !target?'Choisis un emplacement en surbrillance chez l’autre héros.':
   swap?(troops?'Les deux troupes vont changer de héros.':'Les deux objets vont changer de héros.'):
   (troops?'Les créatures vont rejoindre l’autre héros.':'L’objet va rejoindre l’autre héros.');
  const disabled=!target||!available||!!pending||quantity<1||quantity>countLimit;
  panel.innerHTML=`<header class="exchange-toolbar">
   <h2>Échange entre héros</h2>
   <button type="button" data-exchange-classic data-exchange-focus="classic" ${pending?'disabled':''}>Classique</button>
   <button type="button" data-exchange-close data-exchange-focus="close" aria-label="Fermer l’échange" ${pending?'disabled':''}>×</button>
  </header>
  <nav class="exchange-tabs" aria-label="Type d’échange">
   <button type="button" data-exchange-tab="equipment" data-exchange-focus="equipment" aria-pressed="${!troops}" ${pending?'disabled':''}>Équipement</button>
   <button type="button" data-exchange-tab="troops" data-exchange-focus="troops" aria-pressed="${troops}" ${pending?'disabled':''}>Troupes</button>
  </nav>
  <div class="exchange-inventories">${heroes.map(sideMarkup).join('')}</div>
  <footer class="exchange-detail">
   <div class="exchange-summary" aria-live="polite" aria-atomic="true">
    ${item?`<h3>${escape(item.name)}${troops?` × ${item.count}`:''}</h3>`:''}
    ${target?`<p class="exchange-route"><span>${escape(heroes[source.side].name)}</span> <span aria-hidden="true">${swap?'⇄':'→'}</span>
      <span>${escape(targetHero.name)}</span>${target.name||!troops?' · '+escape(target.name||slotName(target)):''}</p>`:''}
    <p>${message||instruction}</p>
    ${!target&&item?.description?`<p class="exchange-description">${escape(plainGameText(item.description))}</p>`:''}
   </div>
   ${item?`<div class="exchange-actions">
    ${troops&&target&&!swap?`<label class="exchange-quantity"><span>Quantité</span><input type="number" inputmode="numeric" min="1" max="${countLimit}"
     value="${quantity||''}" aria-label="Quantité" data-exchange-quantity ${pending?'disabled':''}></label>`:''}
    <button type="button" data-exchange-reset data-exchange-focus="reset" ${pending?'disabled':''}>Annuler</button>
    <button type="button" class="primary" data-exchange-confirm data-exchange-focus="confirm" ${disabled?'disabled':''}>${pending?'Transfert en cours…':swap?'Confirmer l’échange':'Confirmer le transfert'}</button>
   </div>`:''}
  </footer>`;
  panel.querySelector('.exchange-inventories').scrollTop=scroll;
  const previous=focused?panel.querySelector(`[data-exchange-focus="${focused}"]`):focusedSlot?panel.querySelector(`[data-exchange-slot="${focusedSlot}"]`):null;
  if(previous&&!previous.disabled)previous.focus({preventScroll:true});
 }

 panel.addEventListener('input',event=>{
  const input=event.target;
  if(!input.matches('[data-exchange-quantity]'))return;
  const value=input.valueAsNumber;
  quantity=Number.isInteger(value)?value:0;
  panel.querySelector('[data-exchange-confirm]').disabled=!input.validity.valid||quantity<1;
 });
 panel.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(!button||button.disabled)return;
  if(button.hasAttribute('data-exchange-classic')){setView(true);return;}
  if(button.hasAttribute('data-exchange-close')){command(93);return;}
  if(button.hasAttribute('data-exchange-confirm')){
   const item=itemAt(source),target=itemAt(destination);
   if(!item||!target||quantity<1||quantity>maximum(item,destination.side,target))return;
   const troops=tab==='troops';
   const expectedCount=troops?(troopSwap(item,target)?quantity:(target.count||0)+quantity):undefined;
   const timer=setTimeout(()=>{pending=null;message='Transfert non confirmé. Réessaie.';render();},8000);
   pending={timer,side:destination.side,slot:target.slot,id:item.id,count:expectedCount};
   if(troops)command(94,source.side,item.slot,target.slot,quantity,item.id);
   else command(92,source.side,item.slot,target.slot,item.id,target.id??-1);
  }else if(button.hasAttribute('data-exchange-reset')){
   clearSelection();
  }else if(button.dataset.exchangeTab){
   tab=button.dataset.exchangeTab;
   clearSelection();
   panel.querySelector('.exchange-inventories').scrollTop=0;
  }else if(button.dataset.exchangeSlot){
   const [side,slot]=button.dataset.exchangeSlot.split(':').map(Number);
   const item=slots(side).find(entry=>entry.slot===slot);
   const selection={side,slot,id:item.id};
   const limit=maximum(itemAt(source),side,item);
   if(limit>0){destination=selection;quantity=limit;}
   else if(item.name){source=selection;destination=null;quantity=1;}
  }
  message='';
  render();
 });

 return {
  get classic(){return classic;},
  showMobile(){if(!classicOnly){setView(false);render();}},
  update(state){
   if(state.mode!=='hero-exchange'||state.heroExchange?.heroes?.length!==2){
    if(pending)clearTimeout(pending.timer);
    heroes=[];clearSelection();pending=null;message='';signature='';classic=false;classicOnly=false;tab='equipment';
    panel.hidden=true;
    delete root.dataset.exchangeView;
    return;
   }
   const next=JSON.stringify([state.turn,state.heroExchange]);
   if(signature===next)return;
   signature=next;
   heroes=state.heroExchange.heroes.map(hero=>({...hero,roster:hero.army.slots.map((unit,slot)=>({...unit,slot}))}));
   turn=state.turn;
   classicOnly=state.heroExchange.classicOnly;
   if(pending){
    const receipt=itemAt(pending);
    if(receipt&&(pending.count===undefined||receipt.count===pending.count)){
     clearTimeout(pending.timer);pending=null;clearSelection();message='Transfert terminé.';
    }
   }
   if(classicOnly){clearSelection();setView(true);return;}
   const item=itemAt(source),target=itemAt(destination);
   if(!item)clearSelection();
   else if(!target||!maximum(item,destination.side,target))destination=null;
   else quantity=Math.min(quantity,maximum(item,destination.side,target));
   panel.hidden=classic;
   root.dataset.exchangeView=classic?'classic':'mobile';
   if(!classic)render();
  },
  paint(canvas){
   if(panel.hidden)return false;
   for(const face of panel.querySelectorAll('[data-exchange-face]')){
    const rect=heroes[Number(face.dataset.exchangeFace)].portrait;
    if(rect?.w)face.getContext('2d').drawImage(canvas,rect.x*canvas.width/800,rect.y*canvas.height/600,rect.w*canvas.width/800,rect.h*canvas.height/600,0,0,48,56);
   }
   paintArtifactIcons(panel);
   return true;
  },
 };
}
