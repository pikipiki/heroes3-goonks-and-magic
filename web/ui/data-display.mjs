import {resourceDescriptors,resourceIconURL} from '../resources.mjs';
import {escapeUI,uiText} from './primitives.mjs';
export function resourceCostMarkup({values,resourceTypes=[],assets=globalThis.window?.goonkAssetURLs||[]}){
 return resourceDescriptors(values,resourceTypes).filter(resource=>resource.value>0).map(resource=>{const url=resourceIconURL(resource,assets),amount=resource.key==='gold'?new Intl.NumberFormat('fr-FR').format(resource.value).replace(/[\u00a0\u202f]/g,' '):String(resource.value);return `<span class="creature-price ui-resource-cost">${url?`<img src="${escapeUI(url)}" alt="${escapeUI(resource.name)}">`:escapeUI(resource.name)} <strong>${escapeUI(amount)}</strong></span>`;}).join('');
}
export function statGridMarkup(stats,{label=uiText('Characteristics','Caractéristiques')}={}){
 return `<dl class="ui-stat-grid" aria-label="${escapeUI(label)}">${stats.map(({name,value,icon=''})=>`<div><dt>${icon?`<span aria-hidden="true">${icon}</span> `:''}${escapeUI(name)}</dt><dd>${escapeUI(value)}</dd></div>`).join('')}</dl>`;
}
