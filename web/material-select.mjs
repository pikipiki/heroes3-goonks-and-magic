import {bindPress} from './mobile-press.mjs';

// A small DOM select with Material-style outlined fields and anchored menus.
// The original select keeps its value and change handlers; opening never waits
// for an OS picker, an image decode, a timer, or a game-state acknowledgement.
let serial=0,active=null,popup,list,shieldUntil=0;
const labelFor=select=>{
 const label=select.labels?.[0]?.cloneNode(true);
 label?.querySelectorAll('select,button').forEach(node=>node.remove());
 return select.getAttribute('aria-label')||label?.textContent.trim()||select.name||'';
};
function close(restore=true){
 if(!active)return;
 const previous=active;active=null;shieldUntil=performance.now()+900;
 previous.button.setAttribute('aria-expanded','false');
 if(popup.hidePopover&&popup.matches(':popover-open'))popup.hidePopover();
 delete popup.dataset.open;
 popup.remove();
 if(restore&&previous.button.isConnected)previous.button.focus({preventScroll:true});
}
function position(){
 if(!active)return;
 const view=window.visualViewport,r=active.button.getBoundingClientRect();
 const x=view?.offsetLeft||0,y=view?.offsetTop||0,w=view?.width||innerWidth,h=view?.height||innerHeight;
 const width=Math.min(Math.max(r.width,160),w-16),below=y+h-r.bottom-8,above=r.top-y-8;
 const down=below>=Math.min(200,list.scrollHeight)||below>=above;
 const height=Math.min(320,Math.max(44,down?below:above),h-16);
 Object.assign(list.style,{width:width+'px',maxHeight:height+'px',left:Math.max(x+8,Math.min(r.left,x+w-width-8))+'px',top:(down?r.bottom+4:Math.max(y+8,r.top-Math.min(height,list.scrollHeight)-4))+'px'});
}
function focusOption(index){
 const items=[...list.querySelectorAll('[role=option]:not([aria-disabled=true])')];
 if(!items.length)return;
 const item=items[Math.max(0,Math.min(index,items.length-1))];
 item.focus({preventScroll:true});
 const top=item.offsetTop,bottom=top+item.offsetHeight;
 if(top<list.scrollTop)list.scrollTop=top;
 else if(bottom>list.scrollTop+list.clientHeight)list.scrollTop=bottom-list.clientHeight;
}
function ensurePopup(){
 if(popup)return;
 // A touch can emit a delayed click on the newly opened menu or the page
 // uncovered when it closes. Only a fresh gesture may activate that target.
 document.addEventListener('pointerdown',()=>{shieldUntil=0;},true);
 document.addEventListener('keydown',()=>{shieldUntil=0;},true);
 document.addEventListener('click',event=>{if(event.isTrusted&&performance.now()<shieldUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
 popup=document.createElement('div');popup.className='material-select-popup';popup.popover='manual';
 list=document.createElement('div');list.className='material-select-list';list.id='material-select-options';list.setAttribute('role','listbox');popup.append(list);
 popup.addEventListener('pointerdown',event=>{if(event.target===popup){event.preventDefault();event.stopPropagation();close();}});
 popup.addEventListener('click',event=>{if(event.target===popup){event.preventDefault();event.stopPropagation();close();}});
 popup.addEventListener('keydown',event=>{
  if(!active)return;
  const items=[...list.querySelectorAll('[role=option]:not([aria-disabled=true])')],index=items.indexOf(document.activeElement);
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}
  else if(event.key==='Tab'){const button=active.button;close(false);button.focus({preventScroll:true});}
  else if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
   event.preventDefault();event.stopPropagation();focusOption(event.key==='Home'?0:event.key==='End'?items.length-1:index+(event.key==='ArrowDown'?1:-1));
  }else if(event.key.length===1&&!event.altKey&&!event.ctrlKey&&!event.metaKey&&event.key!==' '){
   const key=event.key.toLocaleLowerCase(),ordered=[...items.slice(index+1),...items.slice(0,index+1)];
   const item=ordered.find(node=>node.textContent.toLocaleLowerCase().startsWith(key));if(item){event.preventDefault();focusOption(items.indexOf(item));}
  }
 });
 window.addEventListener('resize',()=>close());
 window.visualViewport?.addEventListener('resize',()=>close());
 document.addEventListener('scroll',event=>{if(!active||event.target===list||list.contains(event.target))return;const r=active.button.getBoundingClientRect();if(Math.abs(r.x-active.rect.x)>1||Math.abs(r.y-active.rect.y)>1)close();},true);
}
function open(record,last=false){
 if(record.select.disabled)return;
 if(active===record){close();return;}
 close(false);ensurePopup();active=record;
 const {select,button}=record;list.setAttribute('aria-label',labelFor(select));list.replaceChildren();
 for(const option of select.options){
  if(option.hidden)continue;
  const item=document.createElement('button');item.type='button';item.tabIndex=-1;item.setAttribute('role','option');item.setAttribute('aria-selected',String(option.selected));item.textContent=option.textContent;
  item.disabled=option.disabled||!!option.closest('optgroup')?.disabled;item.setAttribute('aria-disabled',String(item.disabled));
  bindPress(item,()=>{if(!active||item.disabled)return;const changed=select.value!==option.value;select.value=option.value;close();record.sync();if(changed){select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));}});
  list.append(item);
 }
 (button.closest('dialog')||document.body).append(popup);button.setAttribute('aria-expanded','true');button.setAttribute('aria-controls',list.id);
 shieldUntil=performance.now()+900;if(popup.showPopover)popup.showPopover();else popup.dataset.open='true';position();record.rect=button.getBoundingClientRect();
 const items=[...list.querySelectorAll('[role=option]:not([aria-disabled=true])')],selected=items.findIndex(item=>item.getAttribute('aria-selected')==='true');
 const focus=last?items.length-1:Math.max(0,selected);focusOption(focus);
 // Some touch browsers restore the dialog's focus after pointerup completes.
 // The menu is already visible; restore only its focus on the next paint.
 requestAnimationFrame(()=>{if(active===record&&!popup.contains(document.activeElement))focusOption(focus);});
}
export function createMaterialSelects(root){
 const records=new Map();
 const owner=root.closest('dialog');
 owner?.addEventListener('close',()=>{if(active&&root.contains(active.select))close(false);});
 owner?.addEventListener('cancel',event=>{if(active&&root.contains(active.select)){event.preventDefault();close();}});
 return {update(){
  for(const [select,record]of records)if(!root.contains(select)){if(active===record)close(false);record.button.remove();records.delete(select);}
  for(const select of root.querySelectorAll('select:not([multiple])')){
   if(select.size>1)continue;
   let record=records.get(select);
   if(!record){
    const button=document.createElement('button');button.type='button';button.className='material-select-trigger';button.id='material-select-'+(++serial);button.setAttribute('role','combobox');button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
    const value=document.createElement('span');value.className='material-select-value';button.append(value);
    record={select,button,sync(){const name=labelFor(select),text=select.selectedOptions[0]?.textContent||'',key=JSON.stringify([select.value,[...select.options].map(option=>[option.value,option.textContent,option.disabled])]);if(active===record&&(select.disabled||record.key!==key))close();record.key=key;if(value.textContent!==text)value.textContent=text;const label=name+': '+text;if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);button.disabled=select.disabled;}};
    select.classList.add('material-select-source');select.tabIndex=-1;select.setAttribute('aria-hidden','true');select.after(button);records.set(select,record);
    bindPress(button,()=>open(record));
    button.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();open(record,event.key==='End');}});
    select.addEventListener('change',record.sync);
   }
   record.sync();
  }
 },close(){if(active&&root.contains(active.select))close(false);}};
}
