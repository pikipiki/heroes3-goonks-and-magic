import {createMaterialElement} from './mui-runtime.mjs';
import {decorateButton,uiText} from './primitives.mjs';
const records=new WeakMap();
// A single exit beside the kingdom resources. The original native handler is
// retained on its screen, so rebuilding a panel never leaves a stale callback.
export function useRailChrome(app){
 const chrome=app.querySelector(':scope>.mobile-top');if(!chrome)return;
 const landscape=app.clientWidth>app.clientHeight,visible=node=>node&&!node.closest('[hidden]')&&node.getBoundingClientRect().height>0;
 const header=landscape&&visible(chrome)&&!app.dataset.sheet&&!["map","battle"].includes(app.dataset.mode)?[...app.querySelectorAll('.ui-rail-header,.hero-card-head')].find(visible):null;
 const source=header?.querySelector('[data-ui-header-close],button.ui-icon-button,[data-hero-close]');
 let record=records.get(app);
 if(!record){const close=createMaterialElement('button');close.type='button';close.textContent='✕';close.dataset.uiRailClose='';close.hidden=true;decorateButton(close,{icon:true});chrome.append(close);record={close,source:null,header:null};records.set(app,record);close.addEventListener('click',()=>{if(record.source?.isConnected&&!record.source.disabled)record.source.click();});}
 if(record.source!==source){record.source?.removeAttribute('data-ui-rail-exit');record.source=source||null;}
 if(record.header!==header){record.header?.classList.remove('ui-rail-title');record.header=header||null;}
 const active=!!source;app.dataset.uiRailChrome=String(active);if(record.close.hidden===active)record.close.hidden=!active;
 if(active){source.setAttribute('data-ui-rail-exit','');header.classList.add('ui-rail-title');record.close.disabled=source.disabled;record.close.setAttribute('aria-label',uiText('Close','Fermer'));}
}
