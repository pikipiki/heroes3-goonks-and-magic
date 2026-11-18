import {decorateButton,uiText} from './primitives.mjs';
import {createPopupMenu} from './menu.mjs';
const records=new WeakMap();
const exits=/^(?:[←↩⬅]\s*)?(?:Back|Retour|Cancel|Annuler)$/iu;
export function useActionDock(dock,{overflow=true,limit=3,keepButtons,moreLabel}={}){
 if(!dock)return;
 dock.classList.add('ui-action-dock');dock.dataset.uiActions='';
 for(const group of dock.querySelectorAll(':scope>.ui-action-group'))useActionDock(group,{overflow});
 let record=records.get(dock);
 if(!record){record={buttons:[],more:null,menu:null};records.set(dock,record);}
 const found=[...dock.children].filter(node=>node.tagName==='BUTTON'&&!node.classList.contains('ui-overflow-trigger'));
 for(const button of found)if(!record.buttons.includes(button))record.buttons.push(button);
 record.buttons=record.buttons.filter(button=>dock.contains(button));
 for(const button of record.buttons)decorateButton(button);
 const shown=record.buttons.filter(button=>!button.hidden),primary=shown.find(button=>button.classList.contains('primary')||button.dataset.uiVariant==='filled'),exit=shown.find(button=>exits.test(button.textContent.trim()));
 const collapse=overflow&&shown.length>limit;
 if(!collapse){
  if(record.menu?.open)record.menu.close(false);
  for(const button of record.buttons)if(button.parentElement!==dock)dock.insertBefore(button,record.more);
  if(record.more&&!record.more.hidden)record.more.hidden=true;
  return;
 }
 if(!record.more){record.more=document.createElement('button');record.more.type='button';record.more.className='ui-overflow-trigger';decorateButton(record.more);dock.append(record.more);record.menu=createPopupMenu({anchor:record.more,container:dock,label:()=>uiText('More actions','Autres actions')});}
 const label=moreLabel||uiText('More','Plus');if(record.more.textContent!==label)record.more.textContent=label;record.more.setAttribute('aria-label',uiText('More actions','Autres actions'));if(record.more.hidden)record.more.hidden=false;
 const keep=new Set(keepButtons?keepButtons(shown):[primary||shown[0],exit].filter(Boolean));
 for(const button of record.buttons){const destination=keep.has(button)||button.hidden?dock:record.menu.list;if(button.parentElement!==destination){if(destination===dock)dock.insertBefore(button,record.more);else destination.append(button);}if(destination===record.menu.list)button.setAttribute('role','menuitem');else if(button.getAttribute('role')==='menuitem')button.removeAttribute('role');}
}
