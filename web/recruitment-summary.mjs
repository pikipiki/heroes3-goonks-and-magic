import {resourceDescriptors,resourceIconURL} from './resources.mjs';
import {getLanguage, translate} from './i18n.mjs';
const resources=(values,metadata=[],lang='fr',groupGold=false)=>resourceDescriptors(values,metadata,lang).filter(r=>r.value>0).map(r=>`${groupGold&&r.key==='gold'?new Intl.NumberFormat('fr-FR').format(r.value).replace(/[\u00a0\u202f]/g,' '):r.value} ${translate(r.name,lang).toLowerCase()}`).join(' + ');
export function recruitmentSummary(state, language = (typeof window !== 'undefined' ? getLanguage() : 'fr'),{compact=false}={}){
 const fr=language==='fr';
 const unit=state.recruitUnit;if(!unit||!Array.isArray(unit.cost)||unit.cost.length<7)return fr?'Chargement du recrutement…':'Loading recruitment…';
 const stock=Math.max(0,unit.count||0),maximum=Math.max(0,state.recruitMaximum||0),amount=Math.max(0,state.recruitAmount||0),price=resources(unit.cost,state.resourceTypes,language)||(fr?'gratuit':'free');
 const parts=compact?[]:[(fr?'Stock : ':'Available: ')+stock];
 if(!compact)parts.push((fr?'Recrutables : ':'Can recruit: ')+maximum,(fr?'Prix par unité : ':'Cost per unit: ')+price);
 if(amount>0)parts.push((fr?'Total : ':'Total: ')+(resources(unit.cost.map(value=>value*amount),state.resourceTypes,language,compact)||(fr?'gratuit':'free')));
 if(!stock)parts.push(fr?'Stock épuisé.':'Out of stock.');
 else if(!maximum){
  const missing=resources(unit.cost.map((value,i)=>Math.max(0,value-(state.resources?.[i]||0))),state.resourceTypes,language);
  parts.push(missing?(fr?`Il manque ${missing} pour une unité.`:`Missing ${missing} for one unit.`):(fr?'Recrutement indisponible pour le moment.':'Recruitment unavailable at this time.'));
 }
 return parts.join(' · ');
}

const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Share the already loaded resource artwork with the per-creature price.
export function recruitmentSummaryMarkup(state,language=getLanguage(),assets=globalThis.window?.goonkAssetURLs||[]){
 const unit=state.recruitUnit;if(!unit||!Array.isArray(unit.cost)||unit.cost.length<7)return escapeHTML(recruitmentSummary(state,language,{compact:true}));
 const amount=Math.max(0,state.recruitAmount||0),fr=language==='fr';
 const costs=resourceDescriptors(unit.cost,state.resourceTypes,language).filter(r=>r.value>0).map(r=>{
  const url=resourceIconURL(r,assets),value=r.value*amount;
  const number=r.key==='gold'?new Intl.NumberFormat('fr-FR').format(value).replace(/[\u00a0\u202f]/g,' '):String(value);
  return '<span class="creature-price" data-total-resource="'+escapeHTML(r.key)+'">'+(url?'<img src="'+escapeHTML(url)+'" alt="'+escapeHTML(r.name)+'" width="16" height="16">':'<span>'+escapeHTML(r.name)+'</span>')+'<span>'+escapeHTML(number)+'</span></span>';
 }).join('');
 const reason=recruitmentSummary({...state,recruitAmount:0},language,{compact:true});
 return '<span class="recruit-total-label">Total</span>'+ (costs||(fr?'Gratuit':'Free'))+(reason?'<span class="recruit-unavailable">'+escapeHTML(reason)+'</span>':'');
}
