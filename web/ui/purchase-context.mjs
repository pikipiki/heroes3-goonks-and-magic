import {renderMarkup,createMaterialElement} from './mui-runtime.mjs';
import {escapeUI,uiText} from './primitives.mjs';
const records=new WeakMap(),sources=new WeakMap(),strips=new WeakMap();
let titleMeasure;
// Short landscape titles share the same compact resource header. Measure the
// actual theme font rather than guessing from a language-specific string length.
function compactPurchaseTitle(root,header){
 if(root.clientWidth<=root.clientHeight||header.clientWidth<240)return false;
 const title=header.querySelector(':scope>h2,:scope>.ui-heading h2');if(!title)return false;
 if(header.querySelector(':scope>.ui-heading p')?.textContent.trim())return false;
 titleMeasure??=document.createElement('canvas').getContext('2d');
 titleMeasure.font=getComputedStyle(title).font;
 return titleMeasure.measureText(title.textContent.trim()).width<=header.clientWidth-64;
}
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
 if(!header){if(record?.host.isConnected)record.host.remove();record?.calendarHost?.remove();record?.header?.classList.remove('ui-purchase-header');records.delete(root);return purchase;}
 if(!record){const host=createMaterialElement('div');host.classList.add('ui-purchase-resources');host.setAttribute('role','list');const calendarHost=createMaterialElement('div');calendarHost.classList.add('ui-header-calendar');record={host,calendarHost,header:null,markup:null};records.set(root,record);}
 if(record.header!==header){record.header?.classList.remove('ui-purchase-header');record.header=header;}
 if(!header.classList.contains('ui-purchase-header'))header.classList.add('ui-purchase-header');
 if(record.host.parentElement!==header)header.append(record.host);
 record.host.setAttribute('aria-label',uiText('Available resources','Ressources disponibles'));
 renderAvailableResources(record.host,source);
 const provider=header.parentElement.querySelector('[data-ui-header-calendar]'),calendar=root.querySelector('.mobile-calendar');
 const days=Number(provider?.dataset.days??calendar?.dataset.recruitDays),valid=Number.isInteger(days)&&days>0;
 if(record.calendarHost.hidden===valid)record.calendarHost.hidden=!valid;
 record.calendarHost.dataset.compactTitle=String(!!provider?.hasAttribute('data-compact-title')||compactPurchaseTitle(root,header));
 renderRecruitCalendar(record.calendarHost,days);
 if(record.calendarHost.parentElement!==header)header.append(record.calendarHost);

 return purchase;
}

// Shared artwork and native amounts for purchase headers and modal rail chrome.
export function renderAvailableResources(host,source){
 host.setAttribute('role','list');host.setAttribute('aria-label',uiText('Available resources','Ressources disponibles'));
 const markup=[...source.children].map(item=>{const image=item.querySelector('img'),value=item.querySelector('.resource-quantity');return `<span class="mobile-resource" role="listitem" data-resource="${escapeUI(item.dataset.resource)}" aria-label="${escapeUI(item.getAttribute('aria-label'))}">${image&&!image.hidden?`<img src="${escapeUI(image.src)}" alt="" width="12" height="12">`:''}<span class="resource-quantity">${escapeUI(value?.textContent||'0')}</span></span>`;}).join('');
 if(strips.get(host)!==markup||!host.childElementCount){strips.set(host,markup);renderMarkup(host,markup);}
}

// Both sheet headers and dialog rails share the same two-line weekly cue.
export function renderRecruitCalendar(host,days){
 const hidden=!(Number.isInteger(days)&&days>0);if(host.hidden!==hidden)host.hidden=hidden;
 if(host.hidden)return;
 const markup=`<span class="ui-header-recruits">${uiText('Recruits','Recrues')}</span><span class="ui-header-days">${days}${uiText('d',' j')}</span>`;
 if(host._calendarMarkup!==markup){host._calendarMarkup=markup;renderMarkup(host,markup);}
}
