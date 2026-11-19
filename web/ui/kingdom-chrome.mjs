import {useRailChrome} from './rail-chrome.mjs';
import {usePurchaseContext} from './purchase-context.mjs';
import {useHeroSummary} from './hero-summary.mjs';
import {createMaterialElement} from './mui-runtime.mjs';
import {createPopupMenu} from './menu.mjs';
import {decorateButton,uiText} from './primitives.mjs';
const records=new WeakMap();
// Purchase context remains visible. Only ordinary map browsing may collapse it.
export function useKingdomChrome(root){
 let record=records.get(root);
 if(!record){const header=root.querySelector('.mobile-top');if(!header)return;
  const button=createMaterialElement('button');button.type='button';button.className='ui-kingdom-trigger';decorateButton(button);button.hidden=true;header.append(button);
  const popup=createPopupMenu({anchor:button,container:header,role:'region',className:'ui-kingdom-popup',label:()=>uiText('Kingdom resources and calendar','Ressources et calendrier du royaume')});
  record={header,button,popup,compact:false};records.set(root,record);
  const observer=new ResizeObserver(()=>useKingdomChrome(root));observer.observe(root);
 }
 const purchase=usePurchaseContext(root);
 const {header,button,popup}=record,compact=false;
 button.textContent=uiText('Resources','Ressources');button.setAttribute('aria-label',uiText('Resources and calendar','Ressources et calendrier'));
 header.classList.toggle('ui-compact-chrome',compact);button.hidden=!compact;
 if(compact!==record.compact){popup.close(false);record.compact=compact;}
 useRailChrome(root);
 const hero=root.querySelector('.hero-equipment-page:not([hidden])');if(hero)useHeroSummary(hero,hero.querySelector('.hero-card-head'));
 const chromeHeight=Math.ceil(header.getBoundingClientRect().height);if(chromeHeight&&root.style.getPropertyValue('--ui-kingdom-chrome-height')!==chromeHeight+'px')root.style.setProperty('--ui-kingdom-chrome-height',chromeHeight+'px');
 for(const node of [...header.querySelectorAll('.mobile-resources,.mobile-calendar')]){const parent=compact?popup.list:header;if(node.parentElement!==parent)parent.append(node);}
 const mapRail=root.dataset.mode==='map'&&root.clientWidth>root.clientHeight&&root.clientHeight<400;
 root.dataset.uiMapRail=String(mapRail);
 const calendar=root.querySelector('.mobile-calendar'),calendarParent=mapRail?root:header;
 if(calendar&&calendar.parentElement!==calendarParent)calendarParent.append(calendar);
}
