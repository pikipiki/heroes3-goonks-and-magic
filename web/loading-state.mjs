import {createUIElement,renderMarkup} from './ui/material-components.mjs';
import {getLanguage} from './i18n.mjs';
// Keep the engine's real loading artwork and cover only its non-interactive
// status area. Generic fallback actions must never be shown over a loader.
export function createLoadingState(root){
 let waiting=false;
 const status=createUIElement('section');status.classList.add('mobile-loading-status');status.hidden=true;status.setAttribute('role','status');status.setAttribute('aria-live','polite');root.append(status);
 return {update(state,{starting=false}={}){
  if(starting||state.sessionState===5)waiting=true;
  const ready=['map','town','battle'].includes(state.mode)||(state.mode==='dialog'&&!!state.dialogPresentation);
  if(ready||!starting&&state.mode==='lobby'&&state.sessionState!==5)waiting=false;
  // GAMEPLAY can precede the first interactive window. Keep hiding fallback
  // commands through that gap; a real info/turn dialog is interactive again.
  const active=state.sessionState===5||['loading','campaign-loading'].includes(state.mode)||(waiting&&['menu','dialog'].includes(state.mode)&&!state.dialogKind);
  root.dataset.uiLoading=String(active);status.hidden=!active;
  if(!active)return;
  const fr=getLanguage()==='fr',message=fr?'Chargement de l’aventure…':'Loading adventure…';
  if(status.dataset.language!==(fr?'fr':'en')){status.dataset.language=fr?'fr':'en';renderMarkup(status,`<p>${message}</p><progress aria-label="${message}"></progress>`);}
 }};
}
