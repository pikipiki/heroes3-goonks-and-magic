import {renderMarkup,createMaterialElement} from './mui-runtime.mjs';
import {escapeUI,uiText} from './primitives.mjs';
const records=new WeakMap(),sources=new WeakMap(),strips=new WeakMap();
// A single non-interactive resource strip, composed from the preloaded kingdom
// artwork. Purchase screens never require opening a resources popup.
export function usePurchaseContext(root){
 const source=root.querySelector(':scope>.mobile-top>.mobile-resources'),mode=root.dataset.mode;
 // Kingdom quantities also change while an otherwise unchanged sheet is open.
 // Watch only the native strip, never our mirrored output.
 const watched=sources.get(root);
 if(watched?.source!==source){
  watched?.observer.disconnect();
  if(source){const observer=new MutationObserver(()=>usePurchaseContext(root));observer.observe(source,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','aria-label']});sources.set(root,{source,observer});}
 }
 const purchase=!!source&&!source.hidden&&(!!root.dataset.sheet||!['map','battle','menu','lobby','campaign'].includes(mode));
 if(root.dataset.uiPurchase!==String(purchase))root.dataset.uiPurchase=String(purchase);
 let record=records.get(root);
 const candidates=purchase?[...root.querySelectorAll('.mobile-sheet:not([hidden])>.sheet-head,.progression-page:not([hidden])>header')]:[];
 const header=candidates.filter(node=>{
  const dialog=node.closest('.MuiDialog-root'),hidden=node.closest('[aria-hidden="true"]');
  // A Select/Menu may temporarily hide the entire app from accessibility.
  // Keep its owning purchase layout stable; only a hidden Dialog in this
  // app's own stack makes a purchase header inactive.
  return !node.closest('[hidden],[inert]')&&(!hidden||dialog&&!dialog.contains(hidden))&&getComputedStyle(node).visibility!=='hidden'&&node.getBoundingClientRect().height>0;
 }).at(-1);
 if(!header){if(record?.host.isConnected)record.host.remove();record?.header?.classList.remove('ui-purchase-header');records.delete(root);return purchase;}
 if(!record){const host=createMaterialElement('div');host.classList.add('ui-purchase-resources');host.setAttribute('role','list');record={host,header:null,markup:null};records.set(root,record);}
 if(record.header!==header){record.header?.classList.remove('ui-purchase-header');record.header=header;}
 if(!header.classList.contains('ui-purchase-header'))header.classList.add('ui-purchase-header');
 if(record.host.parentElement!==header)header.append(record.host);
 record.host.setAttribute('aria-label',uiText('Available resources','Ressources disponibles'));
 renderAvailableResources(record.host,source);
 return purchase;
}

// Shared artwork and native amounts for purchase headers and modal rail chrome.
export function renderAvailableResources(host,source){
 host.setAttribute('role','list');host.setAttribute('aria-label',uiText('Available resources','Ressources disponibles'));
 const markup=[...source.children].map(item=>{const image=item.querySelector('img'),value=item.querySelector('.resource-quantity');return `<span class="mobile-resource" role="listitem" data-resource="${escapeUI(item.dataset.resource)}" aria-label="${escapeUI(item.getAttribute('aria-label'))}">${image&&!image.hidden?`<img src="${escapeUI(image.src)}" alt="" width="12" height="12">`:''}<span class="resource-quantity">${escapeUI(value?.textContent||'0')}</span></span>`;}).join('');
 if(strips.get(host)!==markup||!host.childElementCount){strips.set(host,markup);renderMarkup(host,markup);}
}
