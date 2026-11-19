import {renderMarkup,createUIElement,buttonMarkup,useActionDock} from './ui/material-components.mjs';
import {getLanguage} from './locale-state.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
// Batch confirmation/results share the same MUI roster and action composition.
// A tap submits one native transaction; snapshots only acknowledge it.
export function createRecruitmentBatch({root,body,getState,openSheet,command,portrait}){
 let pending=null,timer=null,settleTimer=null,actionDock=null;
 const clearActions=()=>{actionDock?.remove();actionDock=null;};
 const text=(en,fr)=>getLanguage()==='fr'?fr:en;
 const rows=state=>(state.fortFamilies||[]).map(f=>({level:f.level,count:f.count,unit:f.variants.filter(u=>u.built).at(-1)})).filter(row=>row.unit).map(row=>({...row,unit:{id:row.unit.id,key:row.unit.key,name:row.unit.name,icon:row.unit.icon}}));
 const roster=(items,result=false)=>'<div class="recruit-all-roster">'+items.map(row=>'<article>'+portrait(row.unit)+'<div class="recruit-batch-facts"><h3>'+esc(row.unit.name)+'</h3><p>'+(result?row.recruited+' '+text('recruited',row.recruited===1?'recrutée':'recrutées')+' · ':'')+row.count+' '+text('available',row.count===1?'disponible':'disponibles')+'</p></div></article>').join('')+'</div>';
 const finish=()=>{
  clearTimeout(timer);timer=null;const current=getState();if(!pending||current.mode!=='fort')return;
  const old=pending;pending=null;clearTimeout(settleTimer);settleTimer=null;
  if(root.dataset.sheet!=='recruit-all')return;
  const result=old.map(row=>{const count=(current.fortFamilies||[]).find(f=>f.level===row.level)?.count??row.count;return {...row,count,recruited:Math.max(0,row.count-count)};});
  clearActions();openSheet('recruitment-summary',text('Recruited creatures','Créatures recrutées'));
  renderMarkup(body,'<section class="recruit-batch-content">'+roster(result,true)+'<p class="recruit-batch-note" role="status">'+text('Review the recruited creatures and remaining stock above.','Consulte les créatures recrutées et le stock restant ci-dessus.')+'</p></section>');
 };
 root.addEventListener('goonk-recruit-all',()=>{
  const state=getState();if(!state.turn||pending)return;
  clearActions();openSheet('recruit-all',text('Recruit all creatures','Recruter toutes les créatures'));
  renderMarkup(body,'<section class="recruit-batch-content">'+roster(rows(state))+'<p class="recruit-batch-note">'+text('Recruit the highest available evolutions you can afford? They join the garrison. Available army slots and resource costs still apply.','Recruter les meilleures évolutions disponibles que tes ressources permettent ? Elles rejoindront la garnison, dans la limite des emplacements libres.')+'</p></section>');
  // This is an imperative MUI host owned by the sheet. Do not move a React
  // child out of the body root: its next refresh must be able to unmount safely.
  actionDock=createUIElement('footer');actionDock.classList.add('recruit-batch-actions');
  renderMarkup(actionDock,buttonMarkup({label:text('Recruit all','Tout recruter'),attributes:'data-ui="confirm-recruit-all"',variant:'filled'})+buttonMarkup({label:text('Cancel','Annuler'),attributes:'data-ui="close-sheet"'}));
  const sheet=body.closest('.mobile-sheet');sheet.insertBefore(actionDock,sheet.querySelector(':scope>footer'));useActionDock(actionDock,{overflow:false});
 });
 return {
  close:clearActions,
  confirm(){const state=getState();if(!state.turn||pending||root.dataset.sheet!=='recruit-all')return;pending=rows(state);const button=actionDock?.querySelector('[data-ui=confirm-recruit-all]');if(button){button.disabled=true;button.setAttribute('aria-busy','true');button.textContent=text('Recruiting…','Recrutement…');}timer=setTimeout(finish,2200);command(53);},
  update(state){if(!pending)return;if(['menu','lobby','load'].includes(state.mode)){pending=null;clearTimeout(timer);clearTimeout(settleTimer);return;}if(state.mode!=='fort')return;if(!timer)timer=setTimeout(finish,2200);const signature=JSON.stringify((state.fortFamilies||[]).map(f=>[f.level,f.count]));if(signature!==pending.signature){pending.signature=signature;clearTimeout(settleTimer);if(pending.some(row=>(state.fortFamilies||[]).find(f=>f.level===row.level)?.count!==row.count))settleTimer=setTimeout(finish,350);}},
 };
}
