import {createMaterialElement} from './mui-runtime.mjs';
import {decorateButton,uiText} from './primitives.mjs';
import {createPopupMenu} from './menu.mjs';
import {bindPress} from '../mobile-press.mjs';
const records=new WeakMap();
const setHidden=(node,value)=>{if(node&&node.hidden!==value)node.hidden=value;};
// Responsive composition of existing MUI nodes. Header actions delegate to
// the current native controls, keeping their handlers and data authoritative.
export function useHeroSummary(root,header){
 const stats=root.querySelector('.hero-primary');if(!header||!stats)return;
 const viewport=root.closest('#mobile-viewport')||root,app=root.closest('#mobile-app'),chrome=app?.querySelector('.mobile-top');
 const portrait=viewport.clientHeight>=viewport.clientWidth;
 header.classList.toggle('ui-hero-summary',portrait);
 if(portrait){if(stats.parentElement!==header)header.append(stats);}
 else if(stats.parentElement!==root)root.insertBefore(stats,header.nextSibling);
 const source=header.querySelector('[data-hero-close]');if(!source||!chrome)return;
 const nav=root.querySelector('.hero-bag-tabs'),resources=chrome.querySelector('.ui-kingdom-trigger');
 const active=!portrait&&app.dataset.mode==='hero'&&!root.hidden&&chrome.classList.contains('ui-compact-chrome');
 let record=records.get(root);
 if(!record&&active){
  const close=createMaterialElement('button');close.type='button';close.textContent='✕';close.dataset.uiHeroClose='';decorateButton(close,{icon:true});bindPress(close,()=>root.querySelector('[data-hero-close]')?.click());chrome.append(close);
  const tabs=createMaterialElement('button');tabs.type='button';tabs.dataset.uiHeroTabs='';decorateButton(tabs);chrome.append(tabs);
  const menu=createPopupMenu({anchor:tabs,container:chrome,label:()=>uiText('Hero sheet','Fiche du héros')});
  const commander=createMaterialElement('button');commander.type='button';commander.dataset.uiHeroCommander='';decorateButton(commander,{icon:true});bindPress(commander,()=>root.querySelector('[data-hero-commander]')?.click());
  record={close,tabs,menu,commander,signature:''};records.set(root,record);
 }
 root.classList.toggle('ui-hero-rail',active);setHidden(source,active);setHidden(nav,active);
 if(!record)return;
 for(const node of [record.close,record.tabs,record.commander])setHidden(node,!active);
 if(record.close.disabled!==source.disabled)record.close.disabled=source.disabled;
 record.close.setAttribute('aria-label',uiText('Close','Fermer'));
 if(!active){record.menu.close(false);return;}
 setHidden(resources,true);
 const tabs=[...nav.querySelectorAll('[data-hero-tab],[data-hero-classic],[data-hero-source-rebalance]')];
 const selected=tabs.find(button=>button.getAttribute('aria-pressed')==='true'),label=(selected?.textContent.trim()||uiText('Inventory','Inventaire'))+' ▾';
 if(record.tabs.textContent!==label)record.tabs.textContent=label;
 const signature=JSON.stringify(tabs.map(button=>[button.textContent,button.disabled,button.getAttribute('aria-pressed')]));
 if(signature!==record.signature){
  record.signature=signature;
  record.menu.setItems(tabs.map(button=>{
   const item=createMaterialElement('button');item.type='button';item.textContent=button.textContent;decorateButton(item);item.disabled=button.disabled;
   const selector=button.hasAttribute('data-hero-tab')?'[data-hero-tab="'+button.dataset.heroTab+'"]':button.hasAttribute('data-hero-classic')?'[data-hero-classic]':'[data-hero-source-rebalance]';
   if(button.hasAttribute('data-hero-tab'))item.dataset.uiHeroTab=button.dataset.heroTab;
   item.setAttribute('role','menuitem');bindPress(item,()=>{record.menu.close(false);root.querySelector(selector)?.click();});return item;
  }));
 }
 const commander=nav.querySelector('[data-hero-commander]');setHidden(record.commander,!commander);
 if(commander){
  if(record.commander.parentElement!==header)header.append(record.commander);
  record.commander.setAttribute('aria-label',uiText('Commander','Commandant'));
  if(record.commander.disabled!==commander.disabled)record.commander.disabled=commander.disabled;
  const icon=commander.querySelector('canvas');if(icon&&!record.commander.querySelector('canvas'))record.commander.append(icon.cloneNode(true));
  const target=record.commander.querySelector('canvas');if(icon&&target)target.getContext('2d')?.drawImage(icon,0,0,target.width,target.height);
 }
}
