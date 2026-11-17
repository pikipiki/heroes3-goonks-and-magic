import {getLanguage} from './i18n.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function canInspectBattle(state){return state.mode==='battle'&&state.manualControl!==false&&!state.autoCombat&&!!(state.canAct||state.canEndTactics);}
export function inspectionUnits(state){return(state.battleUnits||[]).filter(u=>Number.isInteger(u.stackId)&&u.stackId>=0&&u.count>0);}
export function battleInspectionMarkup(state,portrait=()=> ''){
 const fr=getLanguage()==='fr',units=inspectionUnits(state),ready=canInspectBattle(state);
 return `<p class="battle-inspection-help">${ready?(fr?'Choisis une créature pour ouvrir sa fiche. Cette action ne déplace aucune troupe et ne lance ni attaque ni sort.':'Choose a creature to open its details. Inspection does not move a unit, attack or cast a spell.'):(fr?'Les fiches seront disponibles lorsque tu pourras jouer.':'Details are available when you can act.')}</p>`+[false,true].map(enemy=>`<section class="battle-inspection-group"><h3>${enemy?(fr?'Ennemis':'Enemies'):(fr?'Alliés':'Allies')}</h3><div class="battle-inspection-roster">${units.filter(u=>!!u.enemy===enemy).map(u=>`<button type="button" data-inspect-stack="${u.stackId}" ${ready?'':'disabled'}>${portrait(u)}<strong>${esc(u.name)}</strong><span>× ${u.count} · ${u.currentHealth??u.health??0}/${u.maximumHealth??u.health??0} ${fr?'PV':'HP'}</span><small>${fr?'Voir la fiche':'View details'}</small></button>`).join('')}</div></section>`).join('');
}
