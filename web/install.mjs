import {assertRuntimeManifest} from './runtime-manifest.mjs';
import {opfsList,opfsWrite,opfsFlush,opfsUnlink} from '../opfs-worker.js';
import {holdGameStorage,isStorageUnavailable,missingManifestBytes,hasStorageQuota,removeGameData,isStorageFailed,markStorageFailed} from './game-storage.mjs';
import {syncAssets} from './asset-cache.mjs';
import {downloadFetch} from './download-fetch.mjs';
import {createLoadingView} from './loading.mjs';
import {createTemporaryBoot} from './boot-screen.mjs';
import {refreshOfflineRelease} from './offline-release.mjs';
const status=text=>{const el=document.querySelector('#status');if(el)el.textContent=text;};
// The OPFS worker forwards the browser's message without its DOMException name.
class GameStorageUnavailable extends Error {}
const useGameStorage=operation=>async(...args)=>{
 try{return await operation(...args);}
 catch(error){
  if(isStorageUnavailable(error)){
   throw new GameStorageUnavailable(error.message,{cause:error});
  }
  throw error;
 }
};
const prepare=async()=>{
 const manifestURL=new URL('../asset-manifest.json',import.meta.url);const response=await fetch(manifestURL,{cache:'no-store'});if(!response.ok)throw Error('Le catalogue des données est indisponible');const manifest=await response.json();assertRuntimeManifest(manifest,window.VCMI_WASM_URL,location.href);for(const file of manifest.files){if(file.url)file.url=new URL(file.url,manifestURL).href;for(const chunk of file.chunks||[])if(chunk.url)chunk.url=new URL(chunk.url,manifestURL).href;}window.goonkAssetURLs=manifest.files;
 const temporary=()=>{
  window.goonkTemporaryBoot=createTemporaryBoot(document.querySelector('#status'));
  return {temporary:true};
 };
 if(isStorageFailed(localStorage,sessionStorage)||!navigator.storage?.getDirectory)return temporary();
 await navigator.storage?.persist?.().catch(()=>{});
 const neededBytes=missingManifestBytes(manifest,localStorage);
 if(neededBytes>0){
  const estimate=await navigator.storage?.estimate?.().catch(()=>null);
  if(!hasStorageQuota(estimate,neededBytes)){
   markStorageFailed(localStorage,sessionStorage);
   await removeGameData({opfs:{list:opfsList,unlink:opfsUnlink,flush:opfsFlush},storage:localStorage}).catch(()=>{});
   return temporary();
  }
 }
 const progress=createLoadingView(document.querySelector('#status'));
 let result;
 try{result=await syncAssets({manifest,opfs:{list:useGameStorage(opfsList),write:useGameStorage(opfsWrite),flush:useGameStorage(opfsFlush),unlink:useGameStorage(opfsUnlink)},storage:localStorage,fetcher:downloadFetch,onProgress:progress});}
 catch(error){
  if(!(error instanceof GameStorageUnavailable)&&!isStorageUnavailable(error))throw error;
  markStorageFailed(localStorage,sessionStorage);
  await removeGameData({opfs:{list:opfsList,unlink:opfsUnlink,flush:opfsFlush},storage:localStorage}).catch(()=>{});
  return temporary();
 }
 window.goonkCacheStats=result;return result;
};
window.goonkAssetsReady=(async()=>{
 if(await refreshOfflineRelease(status))return new Promise(()=>{});
 await holdGameStorage();
 return navigator.locks?navigator.locks.request('heroes-goonk-install',prepare):prepare();
})().catch(error=>{status(error.message+' — Recharge la page pour réessayer.');throw error;});
