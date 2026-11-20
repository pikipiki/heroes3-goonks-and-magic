import {useRailChrome} from './rail-chrome.mjs';
import {createMaterialElement} from './mui-runtime.mjs';
import {useScreenControls} from './controls.mjs';
import {bindPress} from '../mobile-press.mjs';
import {screenContract,screenSelector} from './contracts.mjs';
import {decorateButton,uiText} from './primitives.mjs';
import {useActionDock} from './action-dock.mjs';
import {closeDetachedMenu} from './menu.mjs';
import {usePurchaseContext} from './purchase-context.mjs';
import {useHeroSummary} from './hero-summary.mjs';
import {useHeroNavigation} from './hero-navigation.mjs';
import {useModalBoundary} from './modal-boundary.mjs';
const back=/^(?:[←↩↵↶⬅🔙]\s*)?(?:Back|Retour)$/iu;
const cross=/^[✕×✖]$/u;
const managed=new WeakMap(),returnVisibility=new WeakMap();
const sessionKey=Symbol.for('heroes-goonk.ui-components');
function find(root,selector){return selector?root.querySelector(selector):null;}
function sameAction(a,b){const attrs=[...a.attributes].filter(attr=>attr.name.startsWith('data-')&&!attr.name.startsWith('data-ui-'));return attrs.length&&attrs.every(attr=>b.getAttribute(attr.name)===attr.value);}
function ensureDock(root,contract){
 let dock=find(root,contract.dock);if(dock)return dock;
 dock=document.createElement('footer');dock.className='ui-action-dock';(root.matches('.online-login')?root.querySelector('form'):root).append(dock);return dock;
}
export function applyScreenComponents(root){
 const contract=screenContract(root);if(!contract)return;
 useModalBoundary(root,contract);
 root.classList.toggle('ui-modal-layout',['commander','message','dialog'].includes(contract.name));
 if(contract.modalContent)for(const content of root.querySelectorAll(contract.modalContent))content.classList.add('ui-modal-content');
 root.dataset.uiScreen=contract.name;root.dataset.uiApp='heroes';
 root.classList.toggle('ui-screen-layout',!!contract.body);
 if(contract.body){for(const body of root.querySelectorAll(contract.body))body.classList.add('ui-screen-content');}
 const header=find(root,contract.header);if(!header){useScreenControls(root);return;}
 if(contract.liftHeader&&header.parentElement!==root)root.prepend(header);
 if(contract.name==='hero')useHeroSummary(root,header);
 header.classList.add('ui-screen-header');header.classList.toggle('ui-rail-header',!!contract.railHeader);
 const buttons=[...header.querySelectorAll('button')];
 let close=buttons.find(button=>cross.test(button.textContent.trim())||button.dataset.uiHeaderClose==='true');
 const source=find(root,contract.close);
 if(!close&&source&&!header.contains(source)){
  close=createMaterialElement('button');close.type='button';close.textContent='✕';close.dataset.uiHeaderClose='true';bindPress(close,()=>{const current=find(root,contract.close);if(current&&!current.disabled)current.click();});header.append(close);
 }
 for(const button of buttons){
  if(back.test(button.textContent.trim())){
   if(!close){close=button;button.dataset.uiHeaderClose='true';button.textContent='✕';}
   else if(button!==close){
    const dock=ensureDock(root,contract),other=[...dock.querySelectorAll('button')].find(candidate=>sameAction(button,candidate));
    if(other)button.classList.add('ui-header-return');else dock.append(button);
   }
  }
 }
 // A synthetic header cross delegates to the native exit; retain that source
 // for its handler, but expose only one visible way to close the same panel.
 if(close&&source&&source!==close&&back.test(source.textContent.trim())&&!source.hidden)source.hidden=true;
 const redundantReturn=find(root,contract.return),closeOnly=!!root.querySelector('[data-ui-close-only]');
 if(redundantReturn&&redundantReturn!==close){
  if(closeOnly){if(!returnVisibility.has(redundantReturn))returnVisibility.set(redundantReturn,redundantReturn.hidden);if(!redundantReturn.hidden)redundantReturn.hidden=true;}
  else if(returnVisibility.has(redundantReturn)){redundantReturn.hidden=returnVisibility.get(redundantReturn);returnVisibility.delete(redundantReturn);}
 }
 if(close){close.classList.add('ui-header-close-control');if(close.textContent!=='✕')close.textContent='✕';decorateButton(close,{icon:true});close.setAttribute('aria-label',uiText('Close','Fermer'));if(close.dataset.uiHeaderClose==='true'&&source&&source!==close&&close.disabled!==source.disabled)close.disabled=source.disabled;}
 for(const selector of [contract.headerActions,contract.extraActions].filter(Boolean))for(const button of root.querySelectorAll(selector)){if(button!==close){const dock=ensureDock(root,contract),actions=dock.querySelector(':scope>.ui-action-group')||dock;if(!actions.contains(button))actions.append(button);}}
 if(root.matches('.online-lobby')&&close&&source&&source!==close&&!source.hidden)source.hidden=true;
 const dock=find(root,contract.dock)||root.querySelector(':scope>footer.ui-action-dock');
 if(dock&&contract.liftDock&&(contract.liftDock===true||dock.matches(contract.liftDock))&&dock.parentElement!==root)root.append(dock);
 if(contract.status&&dock)for(const status of root.querySelectorAll(contract.status))if(status.parentElement!==dock)dock.prepend(status);
 if(dock)useActionDock(dock,{overflow:!root.matches('#game-menu'),limit:dock.matches('.hero-army-dock-tools')?1:contract.dockLimit??3,...(dock.matches('.hero-army-dock-tools')?{keepButtons:buttons=>buttons.filter(button=>button.hasAttribute('data-hero-army-details'))}:{})});
 for(const button of root.querySelectorAll('button'))if(back.test(button.textContent.trim())){const label=uiText('Back','Retour');if(button.textContent!==label)button.textContent=label;button.classList.add('back-button');}
 useScreenControls(root);
 const tabs=root.querySelector('.hero-bag-tabs');if(tabs)useHeroNavigation(tabs);
 const app=root.closest('#mobile-app');if(app){usePurchaseContext(app);useRailChrome(app);}
 managed.set(root,{header,dock});
}
export function refreshScreenComponents(scope=document.body){
 closeDetachedMenu();if(scope.matches?.(screenSelector))applyScreenComponents(scope);
 for(const root of scope.querySelectorAll(screenSelector))applyScreenComponents(root);
}
export function installScreenComponents(scope=document.body){
 if(globalThis[sessionKey])return globalThis[sessionKey];
 let queued=false;const pending=new Set();
 const flush=()=>{queued=false;closeDetachedMenu();for(const root of pending)if(root.isConnected)applyScreenComponents(root);pending.clear();};
 const collect=node=>{const element=node.nodeType===1?node:node.parentElement;if(!element)return;const root=element.closest(screenSelector);if(root)pending.add(root);for(const child of element.querySelectorAll?.(screenSelector)||[])pending.add(child);};
 const observer=new MutationObserver(records=>{for(const record of records){collect(record.target);if(record.type==='childList')for(const node of record.addedNodes)collect(node);}if(!queued&&pending.size){queued=true;queueMicrotask(flush);}});
 refreshScreenComponents(scope);observer.observe(scope,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','disabled']});
 const onLanguage=()=>refreshScreenComponents(scope),onResize=()=>{if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;refreshScreenComponents(scope);});}};
 window.addEventListener('goonk-language',onLanguage);window.addEventListener('resize',onResize);
 const api={refresh:()=>refreshScreenComponents(scope),dispose(){observer.disconnect();pending.clear();window.removeEventListener('goonk-language',onLanguage);window.removeEventListener('resize',onResize);delete globalThis[sessionKey];}};globalThis[sessionKey]=api;return api;
}
export function useScreenComponents(root){installScreenComponents();applyScreenComponents(root);return{refresh:()=>applyScreenComponents(root)};}
