import {createUIField,createUIElement,renderMarkup} from './ui/material-components.mjs';
import {createActionTile} from './ui/action-tile.mjs';
import {createPopupMenu} from './ui/menu.mjs';
import {bulkTransferSummary} from './army-transfer.mjs';
import {bindPress} from './mobile-press.mjs';
import {getLanguage} from './locale-state.mjs';

// The roster never changes geometry when a troop is selected or split.
export function renderArmyPanel({body,armies=[],portrait=()=>'',onMove,onTransferAll,onInfo,onManage,onUpgradeAll,onBack,showVisitorPlaceholder=false,readOnly=false,onMessage=()=>{}}){
 const fr=getLanguage()==='fr';
 const panel=document.createElement('div');panel.className='army-panel';panel.dataset.armyCount=String(showVisitorPlaceholder?Math.max(2,armies.length):armies.length);
 const rosters=document.createElement('div');rosters.className='army-rosters';
 const dock=document.createElement('footer');dock.id='army-options';dock.className='army-dock';
 const status=document.createElement('p');status.className='army-selection';status.setAttribute('role','status');status.textContent=readOnly?(fr?'Disponible à ton tour':'Available on your turn'):(fr?'Choisis une troupe, puis sa destination.':'Choose a unit, then choose its destination.');
 const tools=document.createElement('div');tools.className='army-transfer-tools';
 const splitLabel=document.createElement('label');splitLabel.className='army-split-toggle';
 const splitField=createUIField({type:'checkbox',disabled:true}),split=splitField.input;split.id='army-split';split.type='checkbox';split.disabled=true;splitLabel.append(splitField.element,fr?'Scinder':'Split');
 const amountField=createUIField({type:'number',disabled:true,value:1,min:1}),amount=amountField.input;amount.type='number';amount.min='1';amount.step='1';amount.value='1';amount.disabled=true;amount.enterKeyHint='done';amount.setAttribute('aria-label',fr?'Nombre de créatures à séparer':'Number of creatures to split');
 amount.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();amount.blur();}});
 const info=createUIElement('button');info.type='button';info.textContent=fr?'Fiche':'Details';info.disabled=true;info.hidden=!onInfo;
 const manage=createUIElement('button');manage.type='button';manage.textContent=fr?'Gérer':'Manage';manage.disabled=true;manage.hidden=readOnly||!onManage;
 const app=body.closest('#mobile-app'),landscape=!!(app&&app.clientWidth>app.clientHeight);
 const hasMore=landscape&&onBack&&(!manage.hidden||!info.hidden);
 let moreButton=null,moreMenu=null;
 if(!readOnly)tools.append(splitLabel,amountField.element);
 if(hasMore){
  moreButton=createUIElement('button');moreButton.type='button';moreButton.className='ui-overflow-trigger';moreButton.textContent=fr?'Plus':'More';moreButton.disabled=true;
  tools.append(moreButton);
  moreMenu=createPopupMenu({anchor:moreButton,container:tools,placement:'top-end',label:()=>fr?'Actions sur la troupe':'Troop actions'});
  if(!manage.hidden)moreMenu.list.append(manage);
  if(!info.hidden)moreMenu.list.append(info);
 }else{
  if(!readOnly)tools.append(manage);
  tools.append(info);
 }
 if(onBack){const back=createUIElement('button');back.type='button';back.className='army-back back-button';back.textContent=fr?'Retour':'Back';bindPress(back,onBack);tools.append(back);}dock.append(status,tools);panel.append(rosters,dock);body.replaceChildren(panel);
 let selection=null,pending=false;const buttons=[];
 const select=record=>{
  selection=record;split.disabled=!record||record.unit.count<2;if(split.disabled)split.checked=false;amount.disabled=!split.checked||!record||record.unit.count<2;amount.max=String(record?record.unit.count-1:1);amount.value=String(record?Math.max(1,Math.floor(record.unit.count/2)):1);info.disabled=!record||!onInfo;manage.disabled=!record;if(moreButton){moreButton.disabled=info.disabled&&manage.disabled;if(moreButton.disabled)moreMenu?.close(false);}
  status.textContent=readOnly?(record?`${record.unit.name} × ${record.unit.count}`:(fr?'Disponible à ton tour':'Available on your turn')):record?`${record.unit.name} × ${record.unit.count} · `+(fr?'Choisis la destination.':'Choose the destination.'):(fr?'Choisis une troupe, puis sa destination.':'Choose a unit, then choose its destination.');
  for(const item of buttons){const active=!!record&&item.army===record.army&&item.slot===record.slot;item.button.classList.toggle('selected',active);item.button.setAttribute('aria-pressed',String(active));}
 };
 split.addEventListener('change',()=>{amount.disabled=!split.checked||!selection||selection.unit.count<2;});
 bindPress(manage,()=>{if(selection&&!pending)onManage?.(selection.army,selection.slot);});
 bindPress(info,()=>{if(selection&&!pending)onInfo?.(selection.army,selection.slot);});
 for(const army of armies){
  const section=document.createElement('section');section.className='army-roster';section.setAttribute('aria-label',army.name);
  const heading=document.createElement('h3');heading.textContent=army.name;
  const grid=document.createElement('div');grid.className='army-grid';section.append(heading,grid);rosters.append(section);
  const destination=army;const source=armies.find(other=>other.id!==army.id);
  if(!readOnly&&onTransferAll&&showVisitorPlaceholder){const transfer=createUIElement('button');transfer.type='button';transfer.className='army-transfer-all';transfer.textContent=source?(fr?'Tout vers ':'All to ')+destination.name:(fr?'Transférer vers le héros':'Transfer to hero');transfer.disabled=!source||bulkTransferSummary(source,destination).count===0;transfer.title=fr?'Fusionne les créatures identiques. Les troupes sans place restent dans leur armée ; le héros garde au moins une créature.':'Merge matching creatures. Units that do not fit stay in their army; the hero keeps at least one creature.';transfer.setAttribute('aria-label',source?(fr?'Tout transférer : ':'Transfer all: ')+source.name+' → '+destination.name:(fr?'Aucun héros en visite':'No visiting hero'));bindPress(transfer,()=>{if(pending||!source)return;pending=true;transfer.setAttribute('aria-busy','true');for(const item of panel.querySelectorAll('button,input'))item.disabled=true;status.textContent=fr?'Transfert et fusion en cours…':'Transferring and merging…';onTransferAll(source.id,destination.id);});section.append(transfer);}
  const unitKey=u=>u?`${u.id??''}|${u.name}|${u.count}`:'';
  for(let slot=0;slot<7;slot++){
   const unit=army.slots?.[slot]||null,button=createUIElement('button');button.type='button';button.className='army-troop';button.dataset.army=String(army.id);button.dataset.slot=String(slot);button.toggleAttribute('data-empty',!unit);button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',`${army.name}, ${fr?'emplacement':'slot'} ${slot+1} : ${unit?unit.name+', '+unit.count+(fr?' créatures':' creatures'):(fr?'libre':'empty')}`);
   const art=document.createElement('span');art.className='army-slot-art';renderMarkup(art,unit?portrait(unit):'<span class="army-empty" aria-hidden="true">＋</span>');
   const name=document.createElement('span');name.className='army-slot-name';name.textContent=unit?unit.name:(fr?'Libre':'Empty');
   const count=document.createElement('strong');count.className='army-slot-count';count.textContent=unit?String(unit.count):'';
   art.append(count);button.append(art,name);grid.append(button);buttons.push({button,army:army.id,slot,unit,artKey:unit?`${unit.id??''}|${unit.name}`:'',unitKey:unitKey(unit)});
   bindPress(button,()=>{
    if(pending)return;
    const currentUnit=(armies.find(a=>a.id===army.id)?.slots?.[slot])||null;
    if(!selection||readOnly){if(currentUnit)select({army:army.id,slot,unit:currentUnit});return;}
    if(selection.army===army.id&&selection.slot===slot){if(onInfo)onInfo(army.id,slot);else select(null);return;}
    const separated=split.checked?Number(amount.value):0;
    if(split.checked&&(currentUnit||!Number.isInteger(separated)||separated<1||separated>=selection.unit.count)){onMessage(currentUnit?(fr?'Choisis un emplacement libre pour scinder.':'Choose an empty slot to split.'):(fr?'Choisis une quantité entre 1 et '+(selection.unit.count-1)+'.':'Choose an amount between 1 and '+(selection.unit.count-1)+'.'));return;}
    pending=true;split.disabled=true;amount.disabled=true;info.disabled=true;manage.disabled=true;status.textContent=fr?'Déplacement en cours…':'Moving…';
    onMove({fromArmy:selection.army,fromSlot:selection.slot,toArmy:army.id,toSlot:slot,amount:separated});
   });
  }
  if(!readOnly&&onUpgradeAll){const tile=createActionTile({className:'army-upgrade-all',cellClassName:'army-upgrade-cell',captionClassName:'army-slot-name',iconSrc:'./web/h3-theme/troops.svg',label:fr?'Tout améliorer':'Upgrade all',disabled:!army.slots?.some(Boolean),withCell:showVisitorPlaceholder});bindPress(tile.button,()=>{if(!pending)onUpgradeAll(army.id);});(showVisitorPlaceholder?grid:section).append(tile.root);}
 }
 if(showVisitorPlaceholder&&armies.length<2){const absent=document.createElement('section');absent.className='army-roster army-absent';const title=document.createElement('h3');title.textContent=fr?'Héros en visite':'Visiting hero';const note=document.createElement('p');note.textContent=fr?'Aucun héros en visite. Fais entrer ton héros dans ce château pour échanger les troupes.':'No visiting hero. Move your hero into this town to exchange troops.';absent.append(title,note);rosters.append(absent);}
 panel.refreshArmies=(nextArmies=[],focusTarget=null)=>{
  const nextCount=String(showVisitorPlaceholder?Math.max(2,nextArmies.length):nextArmies.length);
  if(panel.dataset.armyCount!==nextCount||nextArmies.length!==armies.length)return false;
  for(let i=0;i<nextArmies.length;i++)if(nextArmies[i].id!==armies[i].id)return false;
  armies=nextArmies;pending=false;
  split.disabled=false;amount.disabled=false;
  for(const army of armies){
   const section=rosters.querySelector(`.army-roster[aria-label="${CSS.escape(army.name)}"]`);
   const source=armies.find(other=>other.id!==army.id);
   const transfer=section?.querySelector('.army-transfer-all');
   if(transfer){transfer.disabled=!source||bulkTransferSummary(source,army).count===0;transfer.removeAttribute('aria-busy');}
   const upgrade=section?.querySelector('.army-upgrade-all');
   if(upgrade)upgrade.disabled=!army.slots?.some(Boolean);
   for(let slot=0;slot<7;slot++){
    const unit=army.slots?.[slot]||null;
    const entry=buttons.find(b=>b.army===army.id&&b.slot===slot);
    if(!entry)continue;
    const nextArtKey=unit?`${unit.id??''}|${unit.name}`:'';
    const nextUnitKey=unit?`${nextArtKey}|${unit.count}`:'';
    entry.unit=unit;
    if(entry.unitKey===nextUnitKey)continue;
    entry.unitKey=nextUnitKey;
    const button=entry.button;
    button.toggleAttribute('data-empty',!unit);
    button.setAttribute('aria-label',`${army.name}, ${fr?'emplacement':'slot'} ${slot+1} : ${unit?unit.name+', '+unit.count+(fr?' créatures':' creatures'):(fr?'libre':'empty')}`);
    const art=button.querySelector('.army-slot-art');
    const name=button.querySelector('.army-slot-name');
    if(art){
     const countEl=art.querySelector('.army-slot-count');
     if(entry.artKey!==nextArtKey){
      entry.artKey=nextArtKey;
      renderMarkup(art,unit?portrait(unit):'<span class="army-empty" aria-hidden="true">＋</span>');
      if(countEl)art.append(countEl);
     }
     if(countEl)countEl.textContent=unit?String(unit.count):'';
    }
    if(name)name.textContent=unit?unit.name:(fr?'Libre':'Empty');
   }
  }
  select(null);
  return true;
 };
 return panel;
}
