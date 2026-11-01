import {RESOURCE_TYPES} from './resources.mjs';
const resources=values=>values.map((value,i)=>value>0?`${value} ${RESOURCE_TYPES[i][1].toLowerCase()}`:'').filter(Boolean).join(' + ');
export function recruitmentSummary(state){
 const unit=state.recruitUnit;if(!unit||!Array.isArray(unit.cost)||unit.cost.length<7)return 'Chargement du recrutement…';
 const stock=Math.max(0,unit.count||0),maximum=Math.max(0,state.recruitMaximum||0),amount=Math.max(0,state.recruitAmount||0),price=resources(unit.cost)||'gratuit';
 const parts=[`Stock : ${stock}`,`Recrutables : ${maximum}`,`Prix par unité : ${price}`];
 if(amount>0)parts.push('Total : '+(resources(unit.cost.map(value=>value*amount))||'gratuit'));
 if(!stock)parts.push('Stock épuisé.');
 else if(!maximum){
  const missing=resources(unit.cost.map((value,i)=>Math.max(0,value-(state.resources?.[i]||0))));
  parts.push(missing?`Il manque ${missing} pour une unité.`:'Recrutement indisponible pour le moment.');
 }
 return parts.join(' · ');
}
