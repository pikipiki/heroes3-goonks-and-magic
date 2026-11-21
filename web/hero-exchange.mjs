import {useScreenComponents,renderMarkup,requestMaterialConfirmation,chipMarkup,createPopupMenu,createUIElement} from './ui/material-components.mjs';
import {equipmentSlotNames, paintArtifactIcons, armySlotMarkup} from './hero-equipment.mjs';
import {plainGameText} from './game-text.mjs';
import {getLanguage} from './locale-state.mjs';

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const slotName=(slot,fr=true)=>slot.backpack?(fr?'Sac à dos':'Backpack'):equipmentSlotNames[slot.slot]||(fr?'Équipement':'Equipment');

export function createHeroExchange({root,command,refresh,portrait}){
 const fr=getLanguage()==='fr';
 const panel=document.createElement('section');
 panel.className='hero-exchange-page';useScreenComponents(panel);
 panel.setAttribute('aria-label',fr?'Échange entre héros':'Hero exchange');
 panel.hidden=true;
 root.querySelector('.mobile-play').append(panel);
 let joining=false,confirmFinish=false;let garrison=false,heroes=[],classic=false,turn=false,classicOnly=false,troopsOnly=false,signature='',tab='equipment';
 let source=null,destination=null,quantity=1,splitMode=false,pending=null,message='';
 let held=false,closing=false,actionsMenu=null;
 const slots=side=>tab==='troops'?heroes[side]?.roster:heroes[side]?.slots;
 const itemAt=selection=>slots(selection?.side)?.find(item=>item.slot===selection.slot&&item.id===selection.id);
 const troopSwap=(item,target)=>!!target.name&&target.id!==item.id;
 const mustKeepOne=hero=>hero.army.needsLastStack&&hero.roster.filter(slot=>slot.name).length===1;
 function maximum(item,side,target){
  if(!turn||!item||(source.side===side&&(!troopsOnly||tab!=='troops'||item.slot===target.slot)))return 0;
  if(tab==='equipment')return item.destinations?.includes(target.slot)?1:0;
  const hero=heroes[source.side],swap=troopSwap(item,target);
  if(!hero.owned||swap&&!heroes[side].owned)return 0;
  if(source.side!==side&&(hero.withdrawAllowed===false||swap&&heroes[side].withdrawAllowed===false))return 0;
  const keepOne=mustKeepOne(hero)&&!swap&&source.side!==side;
  return item.count-(keepOne?1:0);
 }
 function clearSelection(){
  source=null;
  destination=null;
  quantity=1;
  splitMode=false;
 }
 function setView(value){
  classic=value;
  panel.hidden=classic;
  root.dataset.exchangeView=classic?'classic':'mobile';
  refresh();
 }
 function render(){
  const troops=tab==='troops',item=itemAt(source),target=itemAt(destination);
  panel.dataset.armyView=String(troops);panel.dataset.joining=String(joining);
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
   const label=slot.name||(troops?(fr?'Emplacement vide':'Empty slot'):slot.backpack?(fr?'Déposer dans le sac':'Place in backpack'):slotName(slot,fr));
   if(troops){
    return armySlotMarkup(slot.slot,slot.name?slot:null,{
     selected:current,
     target:compatible,
     disabled,
     extraClass:`exchange-slot${compatible?' can-receive':''}${joining&&side===0?' exchange-joining-card':''}`,
     attrs:`data-exchange-slot="${side}:${slot.slot}"`,
     ariaLabel:`${escape(heroes[side].name)}, ${escape(label)}${slot.name?`, ${slot.count}`:''}`,
     portrait,
     fr
    });
   }
   return `<button type="button" aria-label="${escape(heroes[side].name)}, ${escape(label)}" class="exchange-slot${compatible?' can-receive':''}" data-exchange-slot="${side}:${slot.slot}"
    aria-pressed="${current}" ${disabled?'disabled':''}>
    ${slot.name?`<canvas width="64" height="64" data-artifact-icon="${slot.icon}" aria-hidden="true"></canvas>`:'<span aria-hidden="true">＋</span>'}
    <span class="${!slot.backpack&&slot.name?'ui-visually-hidden':''}"><strong>${escape(label)}</strong>
    ${!slot.backpack&&slot.name?`<small>${escape(slotName(slot,fr))}</small>`:''}</span>
   </button>`;
  };
  const sideMarkup=(hero,side)=>{
   const group=(backpack,label)=>{
    const visible=hero.slots.filter(slot=>slot.backpack===backpack&&(slot.name||maximum(item,side,slot)>0));
    return `<h4>${label}</h4>${visible.length?visible.map(slot=>itemMarkup(slot,side)).join(''):`<p class="exchange-empty">${fr?'Aucun objet':'No items'}</p>`}`;
   };
   const isJoiningPool=troops&&joining&&side===0;
   const occupied=troops?hero.roster.filter(slot=>slot.name&&slot.count>0):[];
   const visibleRoster=isJoiningPool?(occupied.length?occupied:[hero.roster[0]].filter(Boolean)):hero.roster;
   const badge=isJoiningPool?chipMarkup({label:fr?'En attente':'Pending'}):troops&&joining&&side===1?chipMarkup({label:`${occupied.length}/7${occupied.length>=7?(fr?' pleins':' full'):''}`}):troops&&hero.withdrawAllowed===false?chipMarkup({label:fr?'Retrait verrouillé':'Withdrawal locked'}):'';
   return `<section class="exchange-inventory${isJoiningPool?' exchange-joining-pool':''}" aria-label="${escape(hero.name)}">
    <header>${hero.portrait?.w?`<canvas class="exchange-face" width="48" height="56" data-exchange-face="${side}" aria-hidden="true"></canvas>`:''}
    <h3>${escape(isJoiningPool?(fr?'Créatures prêtes à rejoindre':'Joining creatures'):hero.name)}</h3>${badge}</header>
    ${troops?`<div class="${isJoiningPool?'exchange-joining-list':'exchange-troop-grid hero-army-slots'}">${visibleRoster.map(slot=>itemMarkup(slot,side)).join('')}</div>`:group(false,fr?'Objets équipés':'Equipped items')+group(true,fr?'Sac à dos':'Backpack')}
   </section>`;
  };
  const available=turn&&heroes.some(hero=>hero.owned);
  const hasDestination=item&&[0,1].some(side=>slots(side).some(slot=>maximum(item,side,slot)>0));
  const keepsOne=troops&&item&&mustKeepOne(heroes[source.side])&&(!destination||destination.side!==source.side);
  const instruction=!turn?(fr?'Disponible à ton tour':'Available on your turn'):
   !item?(troops?(heroes.every(hero=>hero.owned)?(fr?'Choisis une troupe à transférer.':'Choose a unit to transfer.'):(fr?'Choisis une de tes troupes à donner à ton allié.':'Choose one of your units to give to your ally.')):(fr?'Choisis un objet à transférer.':'Choose an item to transfer.')):
   troops&&heroes[source.side]?.withdrawAllowed===false&&!target?(fr?'Réorganise cette garnison ; ses troupes ne peuvent pas sortir.':'Rearrange this garrison; its units cannot leave.'):
   !hasDestination?(keepsOne?(fr?'Chaque héros doit garder au moins une créature.':'Each hero must keep at least one creature.'):(troopsOnly?(fr?'Aucun emplacement compatible.':'No compatible slot.'):(fr?'Aucun emplacement compatible chez l’autre héros.':'No compatible slot on the other hero.'))):
   target&&keepsOne&&!swap&&quantity>=countLimit?(fr?'Chaque héros doit garder au moins une créature.':'Each hero must keep at least one creature.'):
   !target?(troopsOnly?(fr?'Choisis un emplacement en surbrillance.':'Choose a highlighted slot.'):(fr?'Choisis un emplacement en surbrillance chez l’autre héros.':'Choose a highlighted slot on the other hero.')):
   swap?(troops?(troopsOnly?(fr?'Les deux troupes vont être échangées.':'Both units will swap places.'):(fr?'Les deux troupes vont changer de héros.':'Both units will swap heroes.')):(fr?'Les deux objets vont changer de héros.':'Both items will swap heroes.')):
   (troops?(troopsOnly?(fr?'Les créatures vont rejoindre cette armée.':'The creatures will join this army.'):(fr?'Les créatures vont rejoindre l’autre héros.':'The creatures will join the other hero.')):(fr?'L’objet va rejoindre l’autre héros.':'The item will join the other hero.'));
  const disabled=!target||!available||!!pending||quantity<1||quantity>countLimit;
  const canSplit=troops&&!!item?.name&&item.count>1&&(!target||!swap)&&turn&&!pending&&heroes[source.side]?.owned&&heroes[source.side]?.withdrawAllowed!==false;
  const splitMax=target&&!swap?countLimit:Math.max(1,(item?.count||1)-(troops&&item&&mustKeepOne(heroes[source.side])?1:0));
  const canDismiss=troops&&turn&&!pending&&item?.name&&heroes[source.side]?.owned&&heroes[source.side]?.withdrawAllowed!==false&&(!mustKeepOne(heroes[source.side])||heroes[source.side].roster.filter(u=>u.name&&u.count>0).length>1);
  if(actionsMenu){actionsMenu.dispose();actionsMenu=null;}
  renderMarkup(panel,`<header class="exchange-toolbar">
   <h2>${joining?(fr?'Faire de la place':'Make room'):troopsOnly?(garrison?(fr?'Laisser des gardes':'Leave guards'):(fr?'Répartir les troupes':'Arrange army')):(fr?'Échange entre héros':'Hero exchange')}</h2>
   <button type="button" data-exchange-close data-exchange-focus="close" aria-label="${troopsOnly?(fr?'Terminer la répartition':'Finish arranging army'):(fr?'Fermer l’échange':'Close exchange')}" ${confirmFinish?'hidden':''} ${pending?'disabled':''}>×</button>
  </header>
  <nav class="exchange-tabs" ${troopsOnly?'hidden':''} aria-label="${fr?'Type d’échange':'Exchange type'}">
   <button type="button" data-exchange-tab="equipment" data-exchange-focus="equipment" aria-pressed="${!troops}" ${pending?'disabled':''}>${fr?'Équipement':'Equipment'}</button>
   <button type="button" data-exchange-tab="troops" data-exchange-focus="troops" aria-pressed="${troops}" ${pending?'disabled':''}>${fr?'Troupes':'Army'}</button>
  </nav>
  ${joining&&!target?`<p class="exchange-joining-help">${fr?'Déplace, fusionne ou échange les troupes. Seules les créatures placées dans l’armée du héros le rejoindront.':'Move, merge or swap units. Only creatures placed in the hero’s army will join them.'}</p>`:''}
  <div class="exchange-inventories">${heroes.map(sideMarkup).join('')}</div>
  <footer class="exchange-detail">
   <div class="exchange-summary" aria-live="polite" aria-atomic="true">
    ${item?`<h3>${escape(item.name)}${troops?` × ${item.count}`:''}</h3>`:''}
    ${target?`<p class="exchange-route"><span>${escape(heroes[source.side].name)}</span> <span aria-hidden="true">${swap?'⇄':'→'}</span>
      <span>${escape(targetHero.name)}</span>${target.name||!troops?' · '+escape(target.name||slotName(target,fr)):''}</p>`:''}
    <p>${confirmFinish?escape((fr?'Terminer sans ces troupes : ':'Finish without these units: ')+heroes[0].roster.filter(u=>u.name&&u.count>0).map(u=>u.name+' × '+u.count).join(', ')):message||instruction}</p>
    ${!target&&item?.description?`<p class="exchange-description">${escape(plainGameText(item.description))}</p>`:''}
   </div>
   ${confirmFinish?`<div class="exchange-actions"><button data-exchange-cancel-finish>${fr?'Retour':'Back'}</button><button class="primary" data-exchange-commit-finish>${fr?'Confirmer et terminer':'Confirm and finish'}</button></div>`:item?`
    ${splitMode&&canSplit?`<label class="exchange-quantity"><span>${fr?'Quantité à scinder':'Split quantity'}</span><span class="exchange-stepper">
     <button type="button" data-exchange-qty-delta="-1" aria-label="${fr?'Diminuer la quantité':'Decrease quantity'}" ${quantity<=1||pending?'disabled':''}>−</button>
     <input type="number" inputmode="numeric" min="1" max="${splitMax}" value="${quantity||''}" aria-label="${fr?'Quantité':'Quantity'}" data-exchange-quantity ${pending?'disabled':''}>
     <button type="button" data-exchange-qty-delta="1" aria-label="${fr?'Augmenter la quantité':'Increase quantity'}" ${quantity>=splitMax||pending?'disabled':''}>+</button>
     ${splitMax>2?`<button type="button" class="exchange-quick-half" data-exchange-qty-half aria-label="${fr?'Séparer en deux':'Split in half'}" ${pending?'disabled':''}>½</button>`:''}
    </span></label>`:''}
    <div class="exchange-actions">
     <button type="button" data-exchange-reset data-exchange-focus="reset" ${pending?'disabled':''}>${splitMode?(fr?'Retour':'Back'):(fr?'Annuler':'Cancel')}</button>
     <button type="button" class="primary" data-exchange-actions data-exchange-focus="actions" ${pending?'disabled':''}>${pending?(fr?'Transfert en cours…':'Transferring…'):(fr?'Actions':'Actions')}</button>
    </div>`:''}
  </footer>`);
  const actionsBtn=panel.querySelector('[data-exchange-actions]');
  if(actionsBtn){
   const makeMenuItem=(label,attrs,className='',isDisabled=false)=>{
    const btn=createUIElement('button',{className});
    btn.type='button';
    btn.textContent=label;
    for(const [k,v] of Object.entries(attrs))btn.setAttribute(k,v);
    if(isDisabled)btn.disabled=true;
    return btn;
   };
   const menuItems=[
    makeMenuItem(swap?(fr?'Confirmer l’échange':'Confirm exchange'):(fr?'Confirmer le transfert':'Confirm transfer'),{'data-exchange-confirm':'','data-exchange-focus':'confirm'},'primary',disabled)
   ];
   if(canSplit)menuItems.push(makeMenuItem(splitMode?(fr?'Masquer la scission':'Hide split'):(fr?'Scinder':'Split'),{'data-exchange-split':'','data-exchange-focus':'split'},'',!!pending));
   if(troops&&item?.name&&heroes[source.side]?.owned)menuItems.push(makeMenuItem(fr?'Faire partir':'Dismiss',{'data-exchange-dismiss':'','data-exchange-focus':'dismiss'},'danger',!canDismiss||!!pending));
   if(troops&&item?.name)menuItems.push(makeMenuItem(fr?'Fiche':'Details',{'data-exchange-details':'','data-exchange-focus':'details'},'',!!pending));
   actionsMenu=createPopupMenu({anchor:actionsBtn,container:panel,placement:'top-end',className:'exchange-actions-menu',label:()=>fr?'Actions sur la troupe':'Unit actions'});
   actionsMenu.setItems(menuItems);
   actionsMenu.list.addEventListener('click',event=>{const b=event.target.closest('button');if(b){event.stopPropagation();handleButton(b);}});
  }
  panel.querySelector('.exchange-inventories').scrollTop=scroll;
  const previous=focused?panel.querySelector(`[data-exchange-focus="${focused}"]`):focusedSlot?panel.querySelector(`[data-exchange-slot="${focusedSlot}"]`):null;
  if(previous&&!previous.disabled)previous.focus({preventScroll:true});
  if(closing)for(const control of panel.querySelectorAll('button,input'))control.disabled=true;
 }

 panel.addEventListener('input',event=>{
  const input=event.target;
  if(!input.matches('[data-exchange-quantity]'))return;
  const value=input.valueAsNumber;
  quantity=Number.isInteger(value)?value:0;
  const confirmBtn=panel.querySelector('[data-exchange-confirm]')||actionsMenu?.list.querySelector('[data-exchange-confirm]');
  if(confirmBtn)confirmBtn.disabled=!input.validity.valid||quantity<1||!destination;
 });
 async function handleButton(button){
  if(!button||button.disabled||closing)return;
  if(button.hasAttribute('data-exchange-classic')){setView(true);return;}
  if(button.hasAttribute('data-exchange-split')){
   splitMode=!splitMode;
   const selected=itemAt(source);
   if(splitMode&&selected){
    const max=destination?maximum(selected,destination.side,itemAt(destination)):Math.max(1,selected.count-(tab==='troops'&&mustKeepOne(heroes[source.side])?1:0));
    if(quantity<1||quantity>=max)quantity=Math.max(1,Math.floor(max/2));
   }
   render();
   return;
  }
  if(button.hasAttribute('data-exchange-qty-delta')){
   const delta=Number(button.dataset.exchangeQtyDelta);
   const selected=itemAt(source);
   const max=destination?maximum(selected,destination.side,itemAt(destination)):Math.max(1,(selected?.count||1)-(tab==='troops'&&selected&&mustKeepOne(heroes[source.side])?1:0));
   quantity=Math.max(1,Math.min(max,quantity+delta));
   render();
   return;
  }
  if(button.hasAttribute('data-exchange-qty-half')){
   const selected=itemAt(source);
   const max=destination?maximum(selected,destination.side,itemAt(destination)):Math.max(1,(selected?.count||1)-(tab==='troops'&&selected&&mustKeepOne(heroes[source.side])?1:0));
   quantity=Math.max(1,Math.min(max,Math.floor(max/2)));
   render();
   return;
  }
  if(button.hasAttribute('data-exchange-details')){
   const selected=itemAt(source);
   if(tab==='troops'&&selected?.name)command(41,heroes[source.side].id,selected.slot);
   return;
  }
  if(button.hasAttribute('data-exchange-dismiss')){
   const selected=itemAt(source);
   const hero=heroes[source.side];
   if(!selected||!hero||!selected.name)return;
   const keepOne=mustKeepOne(hero);
   const totalStacks=hero.roster.filter(u=>u.name&&u.count>0).length;
   if(keepOne&&totalStacks<=1){
    message=fr?'Le héros doit garder au moins une créature.':'A hero must keep at least one creature.';
    render();
    return;
   }
   const confirmed=await requestMaterialConfirmation({
    container:panel,
    title:fr?'Renvoyer cette troupe ?':'Dismiss this unit?',
    message:fr?`Toutes les créatures (${selected.name} × ${selected.count}) quitteront définitivement ton armée. Confirmer ?`:`Are you sure you want to dismiss ${selected.name} × ${selected.count}? They will leave your army permanently.`,
    confirmLabel:fr?'Renvoyer':'Dismiss',
    cancelLabel:fr?'Annuler':'Cancel'
   });
   if(confirmed&&!closing&&!panel.hidden){
    const timer=setTimeout(()=>{pending=null;message=fr?'Renvoi non confirmé. Réessaie.':'Dismissal not confirmed. Retry.';render();},8000);
    pending={timer,side:source.side,slot:selected.slot,id:selected.id,count:0};
    command(113,hero.id,selected.slot,selected.id,selected.count);
    clearSelection();
    render();
   }
   return;
  }
  if(button.hasAttribute('data-exchange-cancel-finish')){confirmFinish=false;render();return;}
  if(button.hasAttribute('data-exchange-close')||button.hasAttribute('data-exchange-commit-finish')){
   if(joining&&!confirmFinish&&heroes[0].roster.some(u=>u.name&&u.count>0)){confirmFinish=true;render();panel.querySelector('[data-exchange-cancel-finish]')?.focus();return;}
   closing=true;for(const control of panel.querySelectorAll('button,input'))control.disabled=true;command(93);return;
  }
  if(button.hasAttribute('data-exchange-confirm')){
   const item=itemAt(source),target=itemAt(destination);
   if(!item||!target||quantity<1||quantity>maximum(item,destination.side,target))return;
   const troops=tab==='troops';
   const expectedCount=troops?(troopSwap(item,target)?quantity:(target.count||0)+quantity):undefined;
   const timer=setTimeout(()=>{pending=null;message=fr?'Transfert non confirmé. Réessaie.':'Transfer not confirmed. Retry.';render();},8000);
   pending={timer,side:destination.side,slot:target.slot,id:item.id,count:expectedCount};
   if(troops)command(94,source.side+(troopsOnly&&source.side===destination.side?2:0),item.slot,target.slot,quantity,item.id);
   else command(92,source.side,item.slot,target.slot,item.id,target.id??-1);
  }else if(button.hasAttribute('data-exchange-reset')){
   if(splitMode)splitMode=false;
   else clearSelection();
  }else if(button.dataset.exchangeTab){
   tab=button.dataset.exchangeTab;
   clearSelection();
   panel.querySelector('.exchange-inventories').scrollTop=0;
  }else if(button.dataset.exchangeSlot){
   const [side,slot]=button.dataset.exchangeSlot.split(':').map(Number);
   const item=slots(side).find(entry=>entry.slot===slot);
   if(tab==='troops'&&item?.name&&source?.side===side&&source.slot===slot&&source.id===item.id){command(41,heroes[side].id,slot);return;}
   const selection={side,slot,id:item.id};
   const limit=maximum(itemAt(source),side,item);
   if(limit>0){destination=selection;quantity=splitMode?Math.max(1,Math.min(limit,quantity)):limit;}
   else if(item.name){source=selection;destination=null;quantity=1;splitMode=false;}
  }
  message='';
  render();
 }
 panel.addEventListener('click',event=>{const button=event.target.closest('button');if(button)handleButton(button);});

 return {
  hold(next){
   if(troopsOnly&&!panel.hidden&&next.mode==='map'&&next.campaignPending){held=true;for(const control of panel.querySelectorAll('button,input'))control.disabled=true;return true;}
   return false;
  },
  get classic(){return classic;},
  showMobile(){if(!classicOnly){setView(false);render();}},
  update(state){
   if(state.mode!=='hero-exchange'||state.heroExchange?.heroes?.length!==2){
    if(pending)clearTimeout(pending.timer);
    if(actionsMenu){actionsMenu.dispose();actionsMenu=null;}
    joining=false;confirmFinish=false;heroes=[];clearSelection();pending=null;message='';signature='';classic=false;classicOnly=false;troopsOnly=false;held=false;closing=false;tab='equipment';
    panel.hidden=true;
    delete root.dataset.exchangeView;
    return;
   }
   const next=JSON.stringify([state.turn,state.heroExchange]);
   if(signature===next){if(held){held=false;render();}return;}
   held=false;
   signature=next;
   joining=state.heroExchange.joining===true;confirmFinish=false;troopsOnly=state.heroExchange.troopsOnly===true;if(troopsOnly)tab='troops';
   panel.dataset.troopsOnly=String(troopsOnly);panel.dataset.armyView=String(tab==='troops');garrison=state.heroExchange.garrison===true;
   panel.setAttribute('aria-label',troopsOnly?(fr?'Répartir les troupes':'Arrange army'):(fr?'Échange entre héros':'Hero exchange'));
   heroes=state.heroExchange.heroes.map((hero,side)=>({...hero,name:troopsOnly&&side===0&&!state.heroExchange.garrison?(joining?(fr?'Créatures à accueillir':'Joining creatures'):(fr?'Créatures proposées':'Available creatures')):hero.name,roster:hero.army.slots.map((unit,slot)=>({...unit,slot}))}));
   turn=state.turn;
   classicOnly=state.heroExchange.classicOnly;
   if(pending){
    const receipt=itemAt(pending);
    if(pending.count===0&&!receipt?.name){
     clearTimeout(pending.timer);pending=null;clearSelection();message=fr?'Troupe renvoyée.':'Unit dismissed.';
    }else if(receipt&&(pending.count===undefined||receipt.count===pending.count)){
     clearTimeout(pending.timer);pending=null;clearSelection();message=fr?'Transfert terminé.':'Transfer complete.';
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
   if(held)return true;
   for(const face of panel.querySelectorAll('[data-exchange-face]')){
    const rect=heroes[Number(face.dataset.exchangeFace)].portrait;
    if(rect?.w)face.getContext('2d').drawImage(canvas,rect.x*canvas.width/800,rect.y*canvas.height/600,rect.w*canvas.width/800,rect.h*canvas.height/600,0,0,48,56);
   }
   paintArtifactIcons(panel);
   return true;
  },
 };
}
