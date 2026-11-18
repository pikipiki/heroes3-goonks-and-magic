import {renderMaterialSelect,disposeMaterialRoot} from './ui/mui-runtime.mjs';
const sharedRecords=new WeakMap();
const labelFor=select=>{const label=select.labels?.[0]?.cloneNode(true);label?.querySelectorAll('select,button,.MuiInputBase-root,.material-select-host').forEach(node=>node.remove());return select.getAttribute('aria-label')||label?.textContent.trim()||select.name||'';};
// The native field remains the command bridge; MUI owns the visible Select,
// MenuItems, focus handling and keyboard interaction through the shared theme.
export function createMaterialSelects(root){
 const records=new Map();
 return{update(){
  for(const[select,record]of records)if(!root.contains(select)){if(!select.isConnected){disposeMaterialRoot(record.host);record.host.remove();sharedRecords.delete(select);}records.delete(select);}
  for(const select of root.querySelectorAll('select:not([multiple])')){
   if(select.size>1)continue;
   let record=records.get(select)||sharedRecords.get(select);
   if(!record){const host=document.createElement('span');host.className='material-select-host';select.classList.add('material-select-source');select.tabIndex=-1;select.setAttribute('aria-hidden','true');select.after(host);
    record={host,key:null,sync(){const options=[...select.options].filter(option=>!option.hidden).map(option=>({value:option.value,label:option.textContent,disabled:option.disabled||!!option.closest('optgroup')?.disabled})),label=labelFor(select),key=JSON.stringify([label,select.value,select.disabled,options]);if(record.key===key)return;record.key=key;renderMaterialSelect(host,{select,label,options,value:select.value,disabled:select.disabled,onChange:value=>{if(select.value===value)return;select.value=value;record.sync();select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));}});}};
    sharedRecords.set(select,record);select.addEventListener('change',record.sync);
   }
   records.set(select,record);record.sync();
  }
 },close(){for(const record of records.values())record.host.querySelector('[role=combobox]')?.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));}};
}
