import {getLanguage} from './i18n.mjs';
const screens='dialog,[role="dialog"],.creature-presentation,.dialog-presentation,.town-service,.hero-equipment-page,.hero-exchange-page';
const exactBack=/^(?:[←↩↵↶⬅🔙↩️]\s*)?(?:Back|Retour)$/iu;
const isExit=b=>exactBack.test(b.textContent.trim())||/^[✕×✖]$/u.test(b.textContent.trim());
const actionKey=b=>['data-ui','data-menu','data-picker-close','data-castle-close','data-choice-close','data-service-back','data-exchange-close'].find(a=>b.hasAttribute(a));
// Keep one control per return action. A navigation Back can remain in a footer
// when the header cross closes the whole menu; identical exits cannot duplicate.
export function normalizeReturnControls(scope=document.body){
 for(const b of scope.querySelectorAll('button'))if(exactBack.test(b.textContent.trim())){const label=getLanguage()==='fr'?'Retour':'Back';if(b.textContent!==label)b.textContent=label;b.classList.add('back-button');}
 const shells=[...(scope.matches?.(screens)?[scope]:[]),...scope.querySelectorAll(screens)];
 for(const shell of shells){
  const buttons=[...shell.querySelectorAll('button')].filter(b=>b.closest(screens)===shell);
  for(const b of buttons)b.classList.remove('redundant-return');
  const exits=buttons.filter(b=>!b.hidden&&isExit(b)),header=shell.querySelector(':scope > header'),top=exits.filter(b=>header?.contains(b)),cross=top.find(b=>/^[✕×✖]$/u.test(b.textContent.trim())),back=top.find(b=>exactBack.test(b.textContent.trim()));
  if(cross&&back){const nestedBuild=shell.classList.contains('mobile-sheet')&&shell.closest('#mobile-app')?.dataset.sheet==='build';(nestedBuild?cross:back).classList.add('redundant-return');}
  const actions=new Map();
  for(const b of exits.filter(b=>!b.classList.contains('redundant-return')).sort((a,b)=>Number(!!header?.contains(b))-Number(!!header?.contains(a)))){
   const attr=actionKey(b);if(!attr)continue;const key=attr+':'+b.getAttribute(attr);
   if(actions.has(key))b.classList.add('redundant-return');else actions.set(key,b);
  }
 }
}
export function standardizeBackButtons(scope=document.body){
 let pending=false,disposed=false;
 const apply=()=>{pending=false;if(!disposed)normalizeReturnControls(scope);};apply();
 const observer=new MutationObserver(()=>{if(!pending){pending=true;queueMicrotask(apply);}});
 observer.observe(scope,{childList:true,subtree:true,characterData:true});
 return()=>{disposed=true;observer.disconnect();};
}
