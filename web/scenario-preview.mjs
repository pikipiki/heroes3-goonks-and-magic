const cache=new Map(),pending=new Map();
const keyOf=key=>String(key||'').toUpperCase().replace(/\.(?:H3M|VMAP)$/,'');
if(typeof window!=='undefined')window.addEventListener('goonk-map-preview',event=>{const key=keyOf(event.detail.key),images=event.detail.images||[];cache.set(key,images);pending.get(key)?.(images);pending.delete(key);});
export function scenarioPreview(path){
 const key=keyOf(path);if(!key)return Promise.resolve([]);if(cache.has(key))return Promise.resolve(cache.get(key));
 if(pending.has(key))return pending.get(key).promise;
 const m=globalThis.Module;if(!m?._vcmiMobilePreviewMap)return Promise.resolve([]);
 let resolve;const promise=new Promise(r=>resolve=r);resolve.promise=promise;pending.set(key,resolve);
 const ptr=m._malloc(m.lengthBytesUTF8(path)+1);try{m.stringToUTF8(path,ptr,m.lengthBytesUTF8(path)+1);m._vcmiMobilePreviewMap(ptr);}finally{m._free(ptr);}return promise;
}
export function showScenarioPreview(image,path){
 if(!image||image.dataset.previewPath===path)return;
 image.dataset.previewPath=path||'';image.classList.add('scenario-terrain-preview');delete image.dataset.previewReady;image.src=new URL('./h3-theme/adventure-map.svg',import.meta.url).href;image.alt='Map preview';
 if(!path)return;
 void scenarioPreview(path).then(images=>{if(image.dataset.previewPath!==path||!images.length)return;image.src=images[0];image.alt='Discovered map terrain';image.dataset.previewReady='true';});
}
