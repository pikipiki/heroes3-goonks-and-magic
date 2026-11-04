import {resourceDescriptors} from './resources.mjs';
import {translate} from './i18n.mjs';
const resources=(values,metadata=[])=>resourceDescriptors(values,metadata).filter(r=>r.value>0).map(r=>`${r.value} ${translate(r.name).toLowerCase()}`).join(' + ');
export function recruitmentSummary(state){
 const unit=state.recruitUnit;if(!unit||!Array.isArray(unit.cost)||unit.cost.length<7)return 'Chargement du recrutement…';
 const stock=Math.max(0,unit.count||0),maximum=Math.max(0,state.recruitMaximum||0),amount=Math.max(0,state.recruitAmount||0),price=resources(unit.cost,state.resourceTypes)||'gratuit';
 const parts=[`Stock : ${stock}`,`Recrutables : ${maximum}`,`Prix par unité : ${price}`];
 if(amount>0)parts.push('Total : '+(resources(unit.cost.map(value=>value*amount),state.resourceTypes)||'gratuit'));
 if(!stock)parts.push('Stock épuisé.');
 else if(!maximum){
  const missing=resources(unit.cost.map((value,i)=>Math.max(0,value-(state.resources?.[i]||0))),state.resourceTypes);
  parts.push(missing?`Il manque ${missing} pour une unité.`:'Recrutement indisponible pour le moment.');
 }
 return parts.join(' · ');
}
