import {renderAvailableResources,renderRecruitCalendar} from './purchase-context.mjs';
import {createMaterialElement} from './mui-runtime.mjs';
import {decorateButton,uiText} from './primitives.mjs';
const records=new WeakMap();
function createRailClose(record){
 const close=createMaterialElement('button');close.type='button';close.textContent='✕';close.dataset.uiRailClose='';close.hidden=true;decorateButton(close,{icon:true});
 close.addEventListener('click',()=>{if(record.source?.isConnected&&!record.source.disabled)record.source.click();});return close;
}
// A single exit beside the kingdom resources. The original native handler is
// retained on its screen, so rebuilding a panel never leaves a stale callback.
export function useRailChrome(app){
 const chrome=app.querySelector(':scope>.mobile-top');if(!chrome)return;
 const landscape=app.clientWidth>app.clientHeight,visible=node=>node&&!node.closest('[hidden]')&&!node.closest('.MuiDialog-root[aria-hidden="true"]')&&node.getBoundingClientRect().height>0;
 const portraitHeader=null;
 const header=portraitHeader|| (landscape&&visible(chrome)&&!app.dataset.sheet&&!["map","battle"].includes(app.dataset.mode)?[...app.querySelectorAll('.ui-rail-header,.hero-card-head')].filter(visible).at(-1):null);
 const source=header?.querySelector('.ui-header-close-control,[data-ui-header-close],[data-hero-close]');
 let record=records.get(app);
 if(!record){record={source:null,header:null};record.close=createRailClose(record);chrome.append(record.close);records.set(app,record);}
 if(record.source!==source){
  if(record.source){record.source.removeAttribute('data-ui-rail-exit');if(record.sourceTabIndex===null)record.source.removeAttribute('tabindex');else record.source.setAttribute('tabindex',record.sourceTabIndex);}
  record.source=source||null;record.sourceTabIndex=source?.getAttribute('tabindex')??null;
 }
 if(record.header!==header){record.header?.classList.remove('ui-rail-title');record.header=header||null;}
 const paper=header?.closest('.MuiDialog-paper');
 if(paper){
  if(!record.modalChrome?.isConnected||!record.modalChrome.contains(record.resources)){
   record.resourceObserver?.disconnect();
   if(!record.close.isConnected)record.close=createRailClose(record);
   const bar=createMaterialElement('div');bar.classList.add('ui-modal-rail-chrome');
   const menu=createMaterialElement('button');menu.type='button';menu.textContent='≡';menu.dataset.uiModalMenu='';decorateButton(menu,{icon:true});menu.setAttribute('aria-label',uiText('Menu','Menu'));menu.addEventListener('click',()=>chrome.querySelector('#game-menu-toggle')?.click());
   const resources=createMaterialElement('div');resources.classList.add('ui-purchase-resources');
   const calendar=createMaterialElement('div');calendar.classList.add('ui-header-calendar');calendar.dataset.uiRailCalendar='';record.calendar=calendar;bar.append(menu,resources,calendar,record.close);record.modalChrome=bar;record.resources=resources;
   const nativeResources=chrome.querySelector('.mobile-resources');
   if(nativeResources){record.resourceObserver=new MutationObserver(()=>renderAvailableResources(resources,nativeResources));record.resourceObserver.observe(nativeResources,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','aria-label']});}
  }
  record.modalChrome.dataset.uiPortrait=String(!!portraitHeader);
  if(record.modalChrome.parentElement!==paper)paper.append(record.modalChrome);
  if(record.close.parentElement!==record.modalChrome)record.modalChrome.append(record.close);
  if(record.modalChrome.hidden)record.modalChrome.hidden=false;
  const nativeResources=chrome.querySelector('.mobile-resources');if(nativeResources)renderAvailableResources(record.resources,nativeResources);renderRecruitCalendar(record.calendar,landscape&&source?NaN:Number(chrome.querySelector('.mobile-calendar')?.dataset.recruitDays));
 }else{
  if(record.modalChrome&&!record.modalChrome.hidden)record.modalChrome.hidden=true;
  if(record.close.parentElement!==chrome)chrome.append(record.close);
 }
 const active=landscape&&!!source;app.dataset.uiRailChrome=String(active);if(record.close.hidden===active)record.close.hidden=!active;
 if(active){source.setAttribute('data-ui-rail-exit','');source.tabIndex=-1;header.classList.add('ui-rail-title');if(record.close.disabled!==source.disabled)record.close.disabled=source.disabled;record.close.setAttribute('aria-label',uiText('Close','Fermer'));}
}
