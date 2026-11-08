import {resourceDescriptors} from './resources.mjs';
import {getLanguage, translate} from './i18n.mjs';
const resources=(values,metadata=[],lang='fr')=>resourceDescriptors(values,metadata).filter(r=>r.value>0).map(r=>`${r.value} ${translate(r.name,lang).toLowerCase()}`).join(' + ');
export function recruitmentSummary(state, language = (typeof window !== 'undefined' ? getLanguage() : 'fr')){
 const fr=language==='fr';
 const unit=state.recruitUnit;if(!unit||!Array.isArray(unit.cost)||unit.cost.length<7)return fr?'Chargement du recrutement…':'Loading recruitment…';
 const stock=Math.max(0,unit.count||0),maximum=Math.max(0,state.recruitMaximum||0),amount=Math.max(0,state.recruitAmount||0),price=resources(unit.cost,state.resourceTypes,language)||(fr?'gratuit':'free');
 const parts=[(fr?'Stock : ':'Available: ')+stock,(fr?'Recrutables : ':'Can recruit: ')+maximum,(fr?'Prix par unité : ':'Cost per unit: ')+price];
 if(amount>0)parts.push((fr?'Total : ':'Total: ')+(resources(unit.cost.map(value=>value*amount),state.resourceTypes,language)||(fr?'gratuit':'free')));
 if(!stock)parts.push(fr?'Stock épuisé.':'Out of stock.');
 else if(!maximum){
  const missing=resources(unit.cost.map((value,i)=>Math.max(0,value-(state.resources?.[i]||0))),state.resourceTypes,language);
  parts.push(missing?(fr?`Il manque ${missing} pour une unité.`:`Missing ${missing} for one unit.`):(fr?'Recrutement indisponible pour le moment.':'Recruitment unavailable at this time.'));
 }
 return parts.join(' · ');
}
