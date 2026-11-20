import {useBattleControls} from './battle-controls.mjs';
import {syncMaterialFields} from './mui-runtime.mjs';
import {useActionDock} from './action-dock.mjs';
import {createMaterialSelects} from '../material-select.mjs';
import {decorateButton,uiText} from './primitives.mjs';
const choiceSelector='[data-choice-value],[data-hero-slot],[data-campaign-bonus],[data-variant],[data-dialog-choice],[data-dialog-info],[data-family-select],[data-tile-value],[data-spell],[data-guild-spell],[data-progression-choice],.army-troop,.hero-army-slot,.hall-form,.market-grid button,.building-card,.lobby-choice-card,.spell-tile,.progression-offer';
const tabSelector='[data-hero-tab],[data-school],[data-building-tab],[data-guild-level]';
const tabGroups=new WeakSet(),fields=new WeakMap();
export function useChoiceTile(button){button.classList.add('ui-choice-tile');button.className=button.className;return button;}
export function useTabs(container,selector=tabSelector){
 if(container.closest('.MuiTabs-root'))return;
 const buttons=[...container.querySelectorAll(selector)];if(!buttons.length)return;
 container.classList.add('ui-tabs');const mixed=[...container.children].some(child=>child.tagName==='BUTTON'&&!child.matches(selector));container.setAttribute('role',mixed?'toolbar':'tablist');
 for(const button of buttons){button.classList.add('ui-tab');button.setAttribute('role',mixed?'button':'tab');const selected=button.getAttribute('aria-pressed')==='true';if(mixed)button.removeAttribute('aria-selected');else button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;}
 if(!buttons.some(button=>button.tabIndex===0))buttons[0].tabIndex=0;
 if(!tabGroups.has(container)){tabGroups.add(container);container.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)||!event.target.matches(selector))return;const items=[...container.querySelectorAll(selector)].filter(button=>!button.disabled),at=items.indexOf(event.target),next=event.key==='Home'?0:event.key==='End'?items.length-1:(at+(event.key==='ArrowLeft'?-1:1)+items.length)%items.length;event.preventDefault();event.stopPropagation();items[next]?.focus({preventScroll:true});items[next]?.click();});}
}
export function useQuantityStepper(stepper){stepper.classList.add('ui-quantity-stepper');for(const button of stepper.querySelectorAll('button'))decorateButton(button);return stepper;}
export function useScreenControls(root){
 syncMaterialFields(root);
 if(!fields.has(root))fields.set(root,createMaterialSelects(root));fields.get(root).update();
 for(const input of root.querySelectorAll('input,textarea')){if(input.matches('[type=hidden],[data-mui-field],[aria-hidden=true]')||input.closest('.MuiInputBase-root'))continue;if(input.matches('[type=checkbox],[type=radio]')){input.classList.add('ui-check-input');input.closest('label')?.classList.add('ui-check-field');}else if(input.type==='range')input.classList.add('ui-slider');else input.classList.add(input.closest('.hall-quantity,.market-stepper,.deployment-quantity-tools,.amount-row,.army-transfer-tools,.exchange-quantity,.mobile-recruit-amount')?'ui-compact-input':'ui-text-field');}
 for(const summary of root.querySelectorAll('summary'))summary.classList.add('ui-disclosure');
 for(const button of root.querySelectorAll('button')){
  if(button.matches('.MuiAccordionSummary-root,.MuiTab-root,.MuiStepButton-root'))continue;
  if(button.classList.contains('ui-icon-button')||button.closest('.ui-popup'))continue;
  const label=button.hasAttribute('data-hero-cancel')?uiText('Cancel','Annuler'):button.hasAttribute('data-hero-move')?uiText('Move','Déplacer'):null;if(label&&button.textContent!==label)button.textContent=label;
  if(button.matches('.army-upgrade-all')){button.classList.add('ui-action-tile');useChoiceTile(button);}
  else if(button.matches(choiceSelector))useChoiceTile(button);
  else if(!button.matches(tabSelector)&&!button.classList.contains('material-select-trigger'))decorateButton(button);
 }
 for(const parent of new Set([...root.querySelectorAll(tabSelector)].filter(button=>!button.closest('.ui-popup')).map(button=>button.parentElement)))useTabs(parent);
 for(const stepper of root.querySelectorAll('.hall-quantity,.market-stepper,.deployment-quantity-tools'))useQuantityStepper(stepper);
}

export function useNavigation(nav){
 nav.classList.add('ui-navigation');for(const button of nav.querySelectorAll(':scope>button'))decorateButton(button);
 const root=nav.closest('#mobile-app'),compact=root?.dataset.mode==='map'&&root.clientWidth>root.clientHeight&&root.clientHeight<400;
 nav.classList.toggle('ui-map-compact',compact);
 if(root?.dataset.mode==='battle'){useBattleControls(root);return;}
 if(root?.dataset.mode==='town')useActionDock(nav,{overflow:true,limit:3,keepButtons:buttons=>buttons.filter(button=>['build','back'].includes(button.dataset.ui))});
 else if(compact)useActionDock(nav,{overflow:true,limit:3,keepButtons:buttons=>buttons.filter(button=>['move','endturn'].includes(button.dataset.ui))});
 // The exchange command stays available inside the MUI menu between native
 // snapshots; moving it there must not make the next refresh unfold the dock.
 else if(root?.dataset.mode==='map'&&(nav.querySelector('[data-ui=hero-exchange]')||nav.querySelector('button[data-mithril-open]')||[...nav.children].filter(node=>node.tagName==='BUTTON'&&!node.hidden&&!node.classList.contains('ui-overflow-trigger')).length>4)){
  const mithril=nav.querySelector('button[data-mithril-open]');
  const keep=mithril?['move','endturn','towns']:['move','heroes','endturn'];
  useActionDock(nav,{overflow:true,limit:mithril?3:4,keepButtons:buttons=>buttons.filter(button=>keep.includes(button.dataset.ui))});
  if(mithril){const more=nav.querySelector(':scope>.ui-overflow-trigger');for(const ui of keep){const button=nav.querySelector(`:scope>[data-ui="${ui}"]`);if(button)nav.insertBefore(button,more);}}
 }
 else if(nav.classList.contains('ui-action-dock')){useActionDock(nav,{overflow:false});nav.classList.remove('ui-action-dock');}
}

function intersects(a,b){return a.width>0&&b.width>0&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;}
export function placeMithrilAction(root){
 const button=root.querySelector('button[data-mithril-open]');
 const tools=root.querySelector('.scene-tools');
 const nav=root.querySelector('.mobile-nav');
 const overview=root.querySelector('#mobile-overview');
 if(!button||!tools||!nav||!overview)return false;
 const toolsRect=tools.getBoundingClientRect(),overRect=overview.getBoundingClientRect();
 const buttonWidth=button.offsetWidth||69;
 const projectedRight=button.parentElement===tools?toolsRect.right:toolsRect.right+buttonWidth+6;
 const overlaps=root.dataset.mode==='map'&&!button.hidden&&!overview.hidden&&
   toolsRect.top<overRect.bottom&&toolsRect.bottom>overRect.top&&
   toolsRect.left<overRect.right&&projectedRight>overRect.left;
 if(overlaps){
  if(button.parentElement===tools)nav.append(button);
 } else {
  if(button.parentElement!==tools)tools.append(button);
 }
 return overlaps;
}

const clicks=new WeakMap();
export function setClickHandler(node,handler){if(!clicks.has(node))node.addEventListener('click',event=>{if(clicks.get(node)?.call(node,event)===false){event.preventDefault();event.stopPropagation();}});clicks.set(node,handler);return handler;}
