import {getLanguage} from './locale-state.mjs';
const cache=new Map(),pending=new Map();
const keyOf=key=>String(key||'').toUpperCase().replace(/\.(?:H3M|VMAP)$/,'');
const catalogueRevision='31406a7f38010799';
let catalogue;
export function warmScenarioPreviews(){
 if(!catalogue){
  const url=new URL('./scenario-previews.json',import.meta.url);url.search=new URL(import.meta.url).search;url.searchParams.set('catalogue',catalogueRevision);
  catalogue=fetch(url).then(response=>response.ok?response.json():null).then(data=>{for(const [key,images]of Object.entries(data?.previews||{}))if(!cache.has(keyOf(key)))cache.set(keyOf(key),images.map(image=>typeof image==='number'?data.images[image]:image));return !!data;}).catch(()=>false);
 }
 return catalogue;
}
if(typeof window!=='undefined'){
 window.addEventListener('goonk-map-preview',event=>{const key=keyOf(event.detail.key),images=event.detail.images||[];cache.set(key,images);pending.get(key)?.(images);pending.delete(key);});
 // Fetch encoded, precomputed thumbnails while the lobby is starting. Decoding
 // stays with each lazy image, rather than retaining hundreds of decoded Images.
 void warmScenarioPreviews();
}
export async function scenarioPreview(path,{catalogueOnly=false}={}){
 const key=keyOf(path);if(!key)return [];
 await warmScenarioPreviews();
 if(cache.has(key))return cache.get(key);
 if(catalogueOnly)return [];
 if(pending.has(key))return pending.get(key).promise;
 const m=globalThis.Module;if(!m?._vcmiMobilePreviewMap)return [];
 let resolve;const promise=new Promise(r=>resolve=r);resolve.promise=promise;pending.set(key,resolve);
 const ptr=m._malloc(m.lengthBytesUTF8(path)+1);try{m.stringToUTF8(path,ptr,m.lengthBytesUTF8(path)+1);m._vcmiMobilePreviewMap(ptr);}finally{m._free(ptr);}return promise;
}
export function showScenarioPreview(image,path,options){
 if(!image||image.dataset.previewPath===path)return;
 image.dataset.previewPath=path||'';image.classList.add('scenario-terrain-preview');image.loading='lazy';image.decoding='async';delete image.dataset.previewReady;image.src=new URL('./h3-theme/adventure-map.svg',import.meta.url).href;image.alt=getLanguage()==='fr'?'Aperçu de la carte':'Map preview';
 if(!path)return;
 void scenarioPreview(path,options).then(images=>{if(image.dataset.previewPath!==path)return;if(!images.length){const error=getLanguage()==='fr'?'Aperçu indisponible':'Preview unavailable';image.alt=image.title=error;const copy=image.closest('[data-choice-value]')?.querySelector('.lobby-choice-copy');if(copy)copy.dataset.previewError=error;return;}image.src=images[0];image.alt=getLanguage()==='fr'?'Aperçu du terrain de la carte':'Map terrain preview';image.dataset.previewReady='true';});
}
