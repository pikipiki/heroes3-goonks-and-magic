import {getLanguage} from './i18n.mjs';
// Give dynamically opened pages the same unambiguous return control.
export function standardizeBackButtons(scope=document.body){
 const apply=node=>{if(node.nodeType===3)node=node.parentElement;if(!node?.querySelectorAll)return;const buttons=[...(node.matches?.('button')?[node]:[]),...node.querySelectorAll('button')];for(const button of buttons){if(/^(?:[←↩↵↶⬅🔙↩️]\s*)?(?:Back|Retour)$/iu.test(button.textContent.trim())){const label=getLanguage()==='fr'?'Retour':'Back';if(button.textContent!==label)button.textContent=label;button.classList.add('back-button');}}};
 apply(scope);const observer=new MutationObserver(records=>{for(const r of records){apply(r.target.closest?.('button')||r.target);for(const node of r.addedNodes)apply(node);}});observer.observe(scope,{childList:true,subtree:true,characterData:true});return()=>observer.disconnect();
}
