import {opfsList,opfsWrite,opfsFlush,opfsUnlink} from '../opfs-worker.js';
import {syncAssets} from './asset-cache.mjs';
const status=text=>{const el=document.querySelector('#status');if(el)el.textContent=text;};
const prepare=async()=>{
 const manifestURL=new URL('../asset-manifest.json',import.meta.url);const response=await fetch(manifestURL,{cache:'no-store'});if(!response.ok)throw Error('Le catalogue des données est indisponible');const manifest=await response.json();for(const file of manifest.files){if(file.url)file.url=new URL(file.url,manifestURL).href;for(const chunk of file.chunks||[])if(chunk.url)chunk.url=new URL(chunk.url,manifestURL).href;}window.goonkAssetURLs=manifest.files;
 navigator.storage?.persist?.().catch(()=>{});
 const result=await syncAssets({manifest,opfs:{list:opfsList,write:opfsWrite,flush:opfsFlush,unlink:opfsUnlink},storage:localStorage,onProgress:p=>status('Chargement du jeu : '+Math.round(p.downloaded/1048576)+' Mo reçus · les fichiers déjà présents sont conservés')});
 window.goonkCacheStats=result;status(result.downloaded?'Données mises à jour':'Données déjà présentes sur cet appareil');return result;
};
window.goonkAssetsReady=(navigator.locks?navigator.locks.request('heroes-goonk-install',prepare):prepare()).catch(error=>{status(error.message+' — Recharge la page pour réessayer.');throw error;});
