import {assertRuntimeManifest} from './runtime-manifest.mjs';
import {opfsList,opfsWrite,opfsFlush,opfsUnlink} from '../opfs-worker.js';
import {holdGameStorage} from './game-storage.mjs';
import {syncAssets} from './asset-cache.mjs';
import {downloadFetch} from './download-fetch.mjs';
import {createLoadingView} from './loading.mjs';
const status=text=>{const el=document.querySelector('#status');if(el)el.textContent=text;};
// Netlify already supplies isolation headers, so direct visits also install the worker.
if ('serviceWorker' in navigator && window.crossOriginIsolated) {
 navigator.serviceWorker.register(new URL('../coi-serviceworker.js',import.meta.url),{updateViaCache:'none'})
  .catch(error=>console.warn('Offline cache unavailable:',error.message));
}
const gameStorageHeld=holdGameStorage();
const prepare=async()=>{
 await gameStorageHeld;
 const manifestURL=new URL('../asset-manifest.json',import.meta.url);const response=await fetch(manifestURL,{cache:'no-store'});if(!response.ok)throw Error('Le catalogue des données est indisponible');const manifest=await response.json();assertRuntimeManifest(manifest,window.VCMI_WASM_URL,location.href);for(const file of manifest.files){if(file.url)file.url=new URL(file.url,manifestURL).href;for(const chunk of file.chunks||[])if(chunk.url)chunk.url=new URL(chunk.url,manifestURL).href;}window.goonkAssetURLs=manifest.files;
 navigator.storage?.persist?.().catch(()=>{});
 const progress=createLoadingView(document.querySelector('#status'));
 const result=await syncAssets({manifest,opfs:{list:opfsList,write:opfsWrite,flush:opfsFlush,unlink:opfsUnlink},storage:localStorage,fetcher:downloadFetch,onProgress:progress});
 window.goonkCacheStats=result;return result;
};
window.goonkAssetsReady=(navigator.locks?navigator.locks.request('heroes-goonk-install',prepare):prepare()).catch(error=>{status(error.message+' — Recharge la page pour réessayer.');throw error;});
