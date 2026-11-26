import {createMaterialElement} from './mui-runtime.mjs';
import {renderMarkup} from './render.mjs';
import {escapeUI} from './primitives.mjs';
if(typeof document!=='undefined'){
 const link=document.createElement('link');
 link.rel='stylesheet';
 link.href=new URL('./action-tile.css',import.meta.url).href;
 document.head.append(link);
}

/**
 * Reusable MUI action tile (button + optional grid cell wrapper).
 */
export function createActionTile({className='',cellClassName='',captionClassName='',iconSrc='',label='',disabled=false,withCell=false,onClick}={}){
 const button=createMaterialElement('button');
 button.type='button';
 button.className=['ui-action-tile',className].filter(Boolean).join(' ');
 button.disabled=Boolean(disabled);
 const icon=iconSrc?`<img src="${escapeUI(iconSrc)}" alt="" aria-hidden="true">`:'';
 renderMarkup(button,`${icon}<span>${escapeUI(label)}</span>`);
 if(onClick)button.addEventListener('click',onClick);
 if(!withCell)return {root:button,button};
 const cell=document.createElement('div');
 cell.className=['ui-action-tile-cell',cellClassName].filter(Boolean).join(' ');
 const caption=document.createElement('span');
 caption.className=['ui-action-tile-caption',captionClassName].filter(Boolean).join(' ');
 caption.setAttribute('aria-hidden','true');
 caption.textContent='\u00a0';
 cell.append(button,caption);
 return {root:cell,button};
}
