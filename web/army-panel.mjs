import {bulkTransferSummary} from './army-transfer.mjs';
import {bindPress} from './mobile-press.mjs';

// The roster never changes geometry when a troop is selected or split.
export function renderArmyPanel({body,armies=[],portrait=()=>'',onMove,onTransferAll,onInfo,showVisitorPlaceholder=false,readOnly=false,onMessage=()=>{}}){
 const panel=document.createElement('div');panel.className='army-panel';panel.dataset.armyCount=String(showVisitorPlaceholder?Math.max(2,armies.length):armies.length);
 const rosters=document.createElement('div');rosters.className='army-rosters';
 const dock=document.createElement('footer');dock.id='army-options';dock.className='army-dock';
 const status=document.createElement('p');status.className='army-selection';status.setAttribute('role','status');status.textContent=readOnly?'Disponible à ton tour':'Choisis une troupe, puis sa destination.';
 const tools=document.createElement('div');tools.className='army-transfer-tools';
 const splitLabel=document.createElement('label');splitLabel.className='army-split-toggle';
 const split=document.createElement('input');split.id='army-split';split.type='checkbox';split.disabled=true;splitLabel.append(split,'Scinder');
 const amount=document.createElement('input');amount.type='number';amount.min='1';amount.step='1';amount.value='1';amount.disabled=true;amount.setAttribute('aria-label','Nombre de créatures à séparer');
 const info=document.createElement('button');info.type='button';info.textContent='Fiche';info.disabled=true;info.hidden=!onInfo;
 if(!readOnly)tools.append(splitLabel,amount);tools.append(info);dock.append(status,tools);panel.append(rosters,dock);body.replaceChildren(panel);
 let selection=null,pending=false;const buttons=[];
 const select=record=>{
  selection=record;split.disabled=!record||record.unit.count<2;if(split.disabled)split.checked=false;amount.disabled=!split.checked||!record||record.unit.count<2;amount.max=String(record?record.unit.count-1:1);amount.value=String(record?Math.max(1,Math.floor(record.unit.count/2)):1);info.disabled=!record||!onInfo;
  status.textContent=readOnly?(record?`${record.unit.name} × ${record.unit.count}`:'Disponible à ton tour'):record?`${record.unit.name} × ${record.unit.count} · Choisis la destination.`:'Choisis une troupe, puis sa destination.';
  for(const item of buttons){const active=!!record&&item.army===record.army&&item.slot===record.slot;item.button.classList.toggle('selected',active);item.button.setAttribute('aria-pressed',String(active));}
 };
 split.addEventListener('change',()=>{amount.disabled=!split.checked||!selection||selection.unit.count<2;});
 bindPress(info,()=>{if(selection&&!pending)onInfo?.(selection.army,selection.slot);});
 for(const army of armies){
  const section=document.createElement('section');section.className='army-roster';section.setAttribute('aria-label',army.name);
  const heading=document.createElement('h3');heading.textContent=army.name;
  const grid=document.createElement('div');grid.className='army-grid';section.append(heading,grid);rosters.append(section);
  const destination=armies.find(other=>other.id!==army.id);
  if(!readOnly&&onTransferAll&&showVisitorPlaceholder){const transfer=document.createElement('button');transfer.type='button';transfer.className='army-transfer-all';transfer.textContent=destination?'Tout vers '+destination.name:'Transférer vers le héros';transfer.disabled=!destination||bulkTransferSummary(army,destination).count===0;transfer.setAttribute('aria-label',destination?'Tout transférer : '+army.name+' → '+destination.name:'Aucun héros en visite');bindPress(transfer,()=>{if(pending||!destination)return;pending=true;transfer.setAttribute('aria-busy','true');for(const item of panel.querySelectorAll('button,input'))item.disabled=true;status.textContent='Transfert en cours…';onTransferAll(army.id,destination.id);});section.append(transfer);}
  for(let slot=0;slot<7;slot++){
   const unit=army.slots?.[slot]||null,button=document.createElement('button');button.type='button';button.className='army-troop';button.dataset.army=String(army.id);button.dataset.slot=String(slot);button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',`${army.name}, emplacement ${slot+1} : ${unit?unit.name+', '+unit.count+' créatures':'libre'}`);
   const art=document.createElement('span');art.className='army-slot-art';art.innerHTML=unit?portrait(unit):'<span class="army-empty" aria-hidden="true">＋</span>';
   const name=document.createElement('span');name.className='army-slot-name';name.textContent=unit?unit.name:'Libre';
   const count=document.createElement('strong');count.className='army-slot-count';count.textContent=unit?String(unit.count):'';
   const number=document.createElement('span');number.className='army-slot-number';number.setAttribute('aria-hidden','true');number.textContent=String(slot+1);
   button.append(art,name,count,number);grid.append(button);buttons.push({button,army:army.id,slot});
   bindPress(button,()=>{
    if(pending)return;
    if(!selection||readOnly){if(unit)select({army:army.id,slot,unit});return;}
    if(selection.army===army.id&&selection.slot===slot){select(null);return;}
    const separated=split.checked?Number(amount.value):0;
    if(split.checked&&(unit||!Number.isInteger(separated)||separated<1||separated>=selection.unit.count)){onMessage(unit?'Choisis un emplacement libre pour scinder.':'Choisis une quantité entre 1 et '+(selection.unit.count-1)+'.');return;}
    pending=true;for(const item of buttons)item.button.disabled=true;split.disabled=true;amount.disabled=true;info.disabled=true;status.textContent='Déplacement en cours…';
    onMove({fromArmy:selection.army,fromSlot:selection.slot,toArmy:army.id,toSlot:slot,amount:separated});
   });
  }
 }
 if(showVisitorPlaceholder&&armies.length<2){const absent=document.createElement('section');absent.className='army-roster army-absent';const title=document.createElement('h3');title.textContent='Héros en visite';const note=document.createElement('p');note.textContent='Aucun héros en visite. Fais entrer ton héros dans ce château pour échanger les troupes.';absent.append(title,note);rosters.append(absent);}
 return panel;
}
