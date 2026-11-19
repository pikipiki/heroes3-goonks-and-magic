import {renderMarkup,createMaterialElement} from './mui-runtime.mjs';
import {escapeUI,uiText} from './primitives.mjs';
const records=new WeakMap();
// A single non-interactive resource strip, composed from the preloaded kingdom
// artwork. Purchase screens never require opening a resources popup.
export function usePurchaseContext(root){
 const source=root.querySelector('.mobile-resources'),mode=root.dataset.mode;
 const purchase=!!source&&!source.hidden&&(!!root.dataset.sheet||!['map','battle','menu','lobby','campaign'].includes(mode));
 if(root.dataset.uiPurchase!==String(purchase))root.dataset.uiPurchase=String(purchase);
 let record=records.get(root);
 const header=purchase&&root.querySelector('.mobile-sheet:not([hidden])>.sheet-head,.progression-page:not([hidden])>header');
 if(!header){if(record?.host.isConnected)record.host.remove();if(record?.header)record.header.classList.remove('ui-purchase-header');return purchase;}
 if(!record){const host=createMaterialElement('div');host.classList.add('ui-purchase-resources');host.setAttribute('role','list');record={host,header:null,markup:null};records.set(root,record);}
 if(record.header!==header){record.header?.classList.remove('ui-purchase-header');record.header=header;header.classList.add('ui-purchase-header');}
 if(record.host.parentElement!==header)header.append(record.host);
 record.host.setAttribute('aria-label',uiText('Available resources','Ressources disponibles'));
 const markup=[...source.children].map(item=>{const image=item.querySelector('img'),value=item.querySelector('.resource-quantity');return `<span class="mobile-resource" role="listitem" data-resource="${escapeUI(item.dataset.resource)}" aria-label="${escapeUI(item.getAttribute('aria-label'))}">${image&&!image.hidden?`<img src="${escapeUI(image.src)}" alt="" width="12" height="12">`:''}<span class="resource-quantity">${escapeUI(value?.textContent||'0')}</span></span>`;}).join('');
 if(record.markup!==markup){record.markup=markup;renderMarkup(record.host,markup);}
 return purchase;
}
