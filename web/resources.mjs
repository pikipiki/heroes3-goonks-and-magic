import {getLanguage} from './i18n.mjs';
export const RESOURCE_TYPES=[['wood','Bois'],['mercury','Mercure'],['ore','Minerai'],['sulfur','Soufre'],['crystal','Cristaux'],['gems','Gemmes'],['gold','Or']];
const locale=()=>getLanguage()==='fr'?'fr-FR':'en-US';
const decimal={format:value=>new Intl.NumberFormat(locale(),{maximumFractionDigits:1}).format(value)},integer={format:value=>new Intl.NumberFormat(locale(),{maximumFractionDigits:0}).format(value)};
const amount=value=>Number.isFinite(Number(value))?Math.trunc(Number(value)):0;
export function compactResource(value){const n=amount(value);if(Math.abs(n)<1000)return String(n);const divisor=Math.abs(n)>=1e6?1e6:1e3,suffix=divisor===1e6?'M':'k';return decimal.format(Math.trunc(n/divisor*10)/10)+suffix;}
/** Snapshot arrays follow the active native resource registry, not fixed IDs.
 * Baseline artwork/French labels remain unchanged. Extra names/icons come from
 * ResourceTypeHandler metadata; no Mithril index or invented artwork is used.
 */
export function resourceDescriptors(values,metadata=[],language=getLanguage()){
 const size=Math.max(Array.isArray(values)?values.length:0,Array.isArray(metadata)?metadata.length:0);
 return Array.from({length:size},(_,index)=>{
  const native=(Array.isArray(metadata)?metadata[index]:undefined)||{},baseline=RESOURCE_TYPES[index];
  return {index,id:Number.isInteger(native.id)?native.id:index,key:baseline?.[0]||native.key||`resource-${index}`,name:(baseline?(language==='fr'?baseline[1]:['Wood','Mercury','Ore','Sulfur','Crystal','Gems','Gold'][index]):null)||native.name||`${language==='fr'?'Ressource':'Resource'} ${index+1}`,scope:native.scope||'',icon:native.icon||'',value:amount(values?.[index]),baseline:Boolean(baseline)};
 });
}
/** Uses the same manifest entries as creature portraits. Prefer the owning mod,
 * since two resource mods may both register an icon named small.png.
 */
export function resourceIconURL(resource,entries=[]){
 if(resource.baseline)return new URL('./h3-theme/resource-'+resource.key+'.png',import.meta.url).href;
 if(!resource.icon)return '';
 const key=resource.icon.replace(/\\/g,'/').replace(/^\/+/, '').toLowerCase();
 if(key.split('/').includes('..'))return '';
 const paths=['/sprites2x/','/sprites/'];
 if(resource.scope){
  const owner='/mods/'+resource.scope.toLowerCase().split('.').join('/mods/')+'/content';
  for(const sprites of paths){const match=entries.find(e=>('/'+e.path.replace(/\\/g,'/').toLowerCase()).endsWith(owner+sprites+key));if(match?.url)return match.url;}
  return '';
 }
 for(const sprites of paths){const match=entries.find(e=>('/'+e.path.replace(/\\/g,'/').toLowerCase()).endsWith(sprites+key));if(match?.url)return match.url;}
 return '';
}
export function formatResourceCost(values,metadata=[]){
 if(!Array.isArray(values))return '';
 return resourceDescriptors(values,metadata).filter(r=>r.value!==0).map(r=>`${r.value} ${r.baseline?r.name.toLocaleLowerCase('fr-FR'):r.name}`).join(' · ');
}
export function renderResources(container,values,metadata=[],{assets=globalThis.window?.goonkAssetURLs||[]}={}){
 if(!Array.isArray(values)||values.length<RESOURCE_TYPES.length){container.hidden=true;return false;}
 const rows=resourceDescriptors(values,metadata).map(r=>({...r,url:resourceIconURL(r,assets)}));
 container.hidden=false;container.setAttribute('role','list');container.setAttribute('aria-label',getLanguage()==='fr'?'Ressources du royaume':'Kingdom resources');container.style.setProperty('--resource-count',String(rows.length));
 const signature=JSON.stringify(rows.map(({id,key,name,scope,url})=>({id,key,name,scope,url})));
 if(container.dataset.resourceSignature!==signature){
  container.replaceChildren();
  for(const row of rows){
   const item=document.createElement('span');item.className='mobile-resource';item.dataset.resource=row.key;item.dataset.resourceId=String(row.id);item.setAttribute('role','listitem');
   const image=document.createElement('img');image.alt='';image.width=22;image.height=20;image.hidden=!row.url;if(row.url)image.src=row.url;
   const fallback=document.createElement('span');fallback.className='resource-name';fallback.textContent=row.name;fallback.hidden=Boolean(row.url);fallback.setAttribute('aria-hidden','true');
   image.onerror=()=>{image.hidden=true;fallback.hidden=false;};
   const number=document.createElement('span');number.className='resource-quantity';number.setAttribute('aria-hidden','true');item.append(image,fallback,number);container.append(item);
  }
  container.dataset.resourceSignature=signature;
 }
 rows.forEach((row,index)=>{const item=container.children[index],label=row.name+' : '+integer.format(row.value),text=compactResource(row.value);item.title=label;item.setAttribute('aria-label',label);if(item.lastElementChild.textContent!==text)item.lastElementChild.textContent=text;});
 return true;
}
