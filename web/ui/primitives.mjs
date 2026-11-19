import {getLanguage} from '../locale-state.mjs';
export const uiText=(en,fr)=>getLanguage()==='fr'?fr:en;
export const escapeUI=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function buttonContentMarkup({label,icon=''}){return `${icon?`<span class="ui-button-icon" aria-hidden="true">${escapeUI(icon)}</span>`:''}<span>${escapeUI(label)}</span>`;}
export function buttonMarkup({label,attributes='',variant='tonal',icon='',disabled=false}){
 return `<button type="button" class="ui-button" data-ui-variant="${escapeUI(variant)}" ${attributes} ${disabled?'disabled':''}>${buttonContentMarkup({label,icon})}</button>`;
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
 button.classList.add(icon?'ui-icon-button':'ui-button');button.className=button.className;
 if(!icon)button.dataset.uiVariant=variant||(/^(?:[←↩]\s*)?(?:Back|Retour|Cancel|Annuler)$/iu.test(button.textContent.trim())?'tonal':button.classList.contains('primary')?'filled':'tonal');
 return button;
}

export function radioChoicesMarkup({name,label='',labelledBy='',choices=[],className=''}){
 return `<div data-ui-radio-group role="radiogroup" ${labelledBy?`aria-labelledby="${escapeUI(labelledBy)}"`:`aria-label="${escapeUI(label||name)}"`} class="ui-radio-choices ${escapeUI(className)}" style="--ui-choice-count:${Math.max(1,choices.length)}">${choices.map(({value,label='',iconSrc='',attributes='',disabled=false,checked=false})=>`<label><input type="radio" name="${escapeUI(name)}" value="${escapeUI(value)}" ${attributes} ${disabled?'disabled':''} ${checked?'checked':''}><span class="ui-radio-label">${iconSrc?`<img class="ui-radio-choice-icon" src="${escapeUI(iconSrc)}" alt="" aria-hidden="true" width="60" height="24">`:''}<span>${escapeUI(label)}</span></span></label>`).join('')}</div>`;
}
