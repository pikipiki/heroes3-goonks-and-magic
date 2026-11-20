import {resourceDescriptors,resourceIconURL} from '../resources.mjs';
import {escapeUI,uiText} from './primitives.mjs';
export function resourceCostMarkup({values,resourceTypes=[],assets=globalThis.window?.goonkAssetURLs||[]}){
 return resourceDescriptors(values,resourceTypes).filter(resource=>resource.value>0).map(resource=>{const url=resourceIconURL(resource,assets),amount=resource.key==='gold'?new Intl.NumberFormat('fr-FR').format(resource.value).replace(/[\u00a0\u202f]/g,' '):String(resource.value);return `<span class="creature-price ui-resource-cost">${url?`<img src="${escapeUI(url)}" alt="${escapeUI(resource.name)}">`:escapeUI(resource.name)} <strong>${escapeUI(amount)}</strong></span>`;}).join('');
}
export function statGridMarkup(stats,{label=uiText('Characteristics','Caractéristiques')}={}){
 return `<dl class="ui-stat-grid" aria-label="${escapeUI(label)}">${stats.map(({name,value,icon=''})=>`<div><dt>${icon?`<span aria-hidden="true">${icon}</span> `:''}${escapeUI(name)}</dt><dd>${escapeUI(value)}</dd></div>`).join('')}</dl>`;
}

// Read-only ranks and concise statuses share the real MUI theme everywhere.
export function ratingMarkup({value,max=5,label=''}){
 return `<span data-ui-rating data-value="${escapeUI(value)}" data-max="${escapeUI(max)}" aria-label="${escapeUI(label||`${value}/${max}`)}"></span>`;
}
export function chipMarkup({label}){return `<span data-ui-chip>${escapeUI(label)}</span>`;}

const compactStatLabel=(label,short)=>`<span class="ui-stat-full">${escapeUI(label)}</span><abbr class="ui-stat-short" title="${escapeUI(label)}">${escapeUI(short)}</abbr>`;
// Native creature attributes, with one common label/value layout and no icons.
export function creatureStatsMarkup(unit,{fields=null,compact=false,className=''}={}){
 const rows=[
  ['attack',uiText('Attack','Attaque'),uiText('ATK','ATQ'),unit.attack??0],
  ['defense',uiText('Defense','Défense'),uiText('DEF','DÉF'),unit.defense??0],
  ['damage',uiText('Damage','Dégâts'),uiText('DMG','DGT'),`${unit.damageMin??0}–${unit.damageMax??0}`],
  ['health',uiText('Health','Points de vie'),uiText('HP','PV'),unit.health??0],
  ['speed',uiText('Speed','Vitesse'),uiText('SPD','VIT'),unit.speed??0]
 ];
 if(Number.isInteger(unit.experienceRank))rows.push(['experienceRank',uiText('Rank','Rang'),null,unit.experienceRank]);
 if(unit.inCombat){
  rows.push(['currentHealth',uiText('Current HP','PV actuels'),uiText('HP now','PV act.'),`${unit.currentHealth??unit.health}/${unit.health}`]);
  if(unit.shooter)rows.push(['remainingShots',uiText('Shots left','Tirs restants'),uiText('Shots','TIRS'),unit.remainingShots??0]);
  rows.push(['remainingRetaliations',uiText('Retaliations','Ripostes'),uiText('RET','RIP'),unit.remainingRetaliations??0]);
 }
 return `<dl class="creature-stats ${escapeUI(className)}" data-ui-creature-stats ${compact?'data-compact="true"':''}>${rows.filter(([key])=>!fields||fields.includes(key)).map(([,name,short,value])=>`<div><dt>${short?compactStatLabel(name,short):escapeUI(name)}</dt><dd>${escapeUI(value)}</dd></div>`).join('')}</dl>`;
}
