import {bindPress} from './mobile-press.mjs';
import {createPopupMenu} from './ui/menu.mjs';
const labelFor=select=>{
 const label=select.labels?.[0]?.cloneNode(true);label?.querySelectorAll('select,button,.ui-popup').forEach(node=>node.remove());
 return select.getAttribute('aria-label')||label?.textContent.trim()||select.name||'';
};
// All select fields and action overflow menus use the same popup component.
// The native select still owns its value and change handlers.
export function createMaterialSelects(root){
 const records=new Map();
 return{update(){
  for(const [select,record]of records)if(!root.contains(select)){record.popup.dispose();record.button.remove();records.delete(select);}
  for(const select of root.querySelectorAll('select:not([multiple])')){
   if(select.size>1)continue;
   let record=records.get(select);
   if(!record){
    const button=document.createElement('button');button.type='button';button.className='material-select-trigger';button.setAttribute('role','combobox');
    const value=document.createElement('span');value.className='material-select-value';button.append(value);
    select.classList.add('material-select-source');select.tabIndex=-1;select.setAttribute('aria-hidden','true');select.after(button);
    const popup=createPopupMenu({anchor:button,container:button.parentElement,role:'listbox',className:'material-select-popup',label:()=>labelFor(select),bindAnchor:false});popup.list.classList.add('material-select-list');
    record={select,button,popup,sync(){const text=select.selectedOptions[0]?.textContent||'',key=JSON.stringify([select.value,[...select.options].map(option=>[option.value,option.textContent,option.disabled])]);if(popup.open&&(select.disabled||record.key!==key))popup.close();record.key=key;if(value.textContent!==text)value.textContent=text;const label=labelFor(select)+': '+text;if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);button.disabled=select.disabled;}};
    records.set(select,record);
    const open=()=>{
     if(select.disabled)return;if(popup.open){popup.close();return;}
     const items=[];for(const option of select.options){
      if(option.hidden)continue;
      const item=document.createElement('button');item.type='button';item.tabIndex=-1;item.setAttribute('role','option');item.setAttribute('aria-selected',String(option.selected));item.textContent=option.textContent;item.disabled=option.disabled||!!option.closest('optgroup')?.disabled;item.setAttribute('aria-disabled',String(item.disabled));
      bindPress(item,()=>{if(item.disabled)return;const changed=select.value!==option.value;select.value=option.value;popup.close();record.sync();if(changed){select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));}});items.push(item);
     }
     popup.setItems(items);popup.show();
    };
    bindPress(button,open);button.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();open();}});select.addEventListener('change',record.sync);
   }
   record.sync();
  }
 },close(){for(const record of records.values())record.popup.close(false);}};
}
