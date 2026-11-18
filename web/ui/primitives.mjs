import {getLanguage} from '../i18n.mjs';
export const uiText=(en,fr)=>getLanguage()==='fr'?fr:en;
export const escapeUI=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function buttonMarkup({label,attributes='',variant='tonal',icon='',disabled=false}){
 return `<button type="button" class="ui-button" data-ui-variant="${escapeUI(variant)}" ${attributes} ${disabled?'disabled':''}>${icon?`<span class="ui-button-icon" aria-hidden="true">${icon}</span>`:''}<span>${escapeUI(label)}</span></button>`;
}
export function iconButtonMarkup({label,attributes='',icon='✕',disabled=false}){
 return `<button type="button" class="ui-icon-button" aria-label="${escapeUI(label)}" ${attributes} ${disabled?'disabled':''}><span aria-hidden="true">${icon}</span></button>`;
}
export function screenHeaderMarkup({title,titleId='',subtitle='',closeAttributes='',closeLabel=uiText('Close','Fermer')}){
 return `<header class="ui-screen-header"><div class="ui-heading"><h2 ${titleId?`id="${escapeUI(titleId)}"`:''}>${escapeUI(title)}</h2>${subtitle?`<p>${escapeUI(subtitle)}</p>`:''}</div>${closeAttributes?iconButtonMarkup({label:closeLabel,attributes:closeAttributes}):''}</header>`;
}
export const actionDockMarkup=content=>`<footer class="ui-action-dock" data-ui-actions>${content}</footer>`;
export const noticeMarkup=({message,tone='info'})=>`<p class="ui-notice" data-ui-tone="${escapeUI(tone)}" role="${tone==='error'?'alert':'status'}">${escapeUI(message)}</p>`;
export function decorateButton(button,{icon=false,variant}={}){
 button.classList.add(icon?'ui-icon-button':'ui-button');
 if(!icon)button.dataset.uiVariant=variant||(/^(?:[←↩]\s*)?(?:Back|Retour|Cancel|Annuler)$/iu.test(button.textContent.trim())?'tonal':button.classList.contains('primary')?'filled':'tonal');
 return button;
}

export function radioChoicesMarkup({name,choices=[],className=''}){
 return `<div class="ui-radio-choices ${escapeUI(className)}" style="--ui-choice-count:${Math.max(1,choices.length)}">${choices.map(({value,label='',attributes='',disabled=false,checked=false})=>`<label><input type="radio" name="${escapeUI(name)}" value="${escapeUI(value)}" ${attributes} ${disabled?'disabled':''} ${checked?'checked':''}><span>${escapeUI(label)}</span></label>`).join('')}</div>`;
}
