import {createMaterialElement} from './mui-runtime.mjs';
import {createPopupMenu} from './menu.mjs';
import {decorateButton,uiText} from './primitives.mjs';
const records=new WeakMap();
// In short landscape the recruitment command rail needs its height for the
// selected creature and transaction. Kingdom information remains one tap away.
export function useKingdomChrome(root){
 let record=records.get(root);
 if(!record){const header=root.querySelector('.mobile-top');if(!header)return;
  const button=createMaterialElement('button');button.type='button';button.className='ui-kingdom-trigger';decorateButton(button);button.hidden=true;header.append(button);
  const popup=createPopupMenu({anchor:button,container:header,role:'region',className:'ui-kingdom-popup',label:()=>uiText('Kingdom resources and calendar','Ressources et calendrier du royaume')});
  record={header,button,popup,compact:false};records.set(root,record);
  const observer=new ResizeObserver(()=>useKingdomChrome(root));observer.observe(root);
 }
 const {header,button,popup}=record,compact=!!root.querySelector('.mobile-resources:not([hidden])')&&root.dataset.mode!=='battle'&&root.clientWidth>root.clientHeight&&(root.clientHeight<400||root.dataset.mode==='fort');
 button.textContent=uiText('Resources','Ressources');button.setAttribute('aria-label',uiText('Resources and calendar','Ressources et calendrier'));
 header.classList.toggle('ui-compact-chrome',compact);button.hidden=!compact;
 if(compact!==record.compact){popup.close(false);record.compact=compact;}
 for(const node of [...header.querySelectorAll('.mobile-resources,.mobile-calendar')]){const parent=compact?popup.list:header;if(node.parentElement!==parent)parent.append(node);}
}
