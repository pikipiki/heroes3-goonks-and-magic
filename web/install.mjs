import {opfsList,opfsWrite,opfsFlush,opfsUnlink} from '/opfs-worker.js';
import {syncAssets,ROOT} from './asset-cache.mjs';
const status=text=>{const el=document.querySelector('#status');if(el)el.textContent=text;};
async function importOriginals(){
 const existing=await opfsList(ROOT);if(Object.keys(existing).some(p=>/\/Data\/[^/]+\.lod$/i.test(p)))return;
 status('Choisis les données de ton installation Heroes III. Elles restent sur cet appareil.');
 const input=document.createElement('input');input.type='file';input.multiple=true;input.setAttribute('webkitdirectory','');input.setAttribute('aria-label','Importer les données Heroes III');document.querySelector('.spinner-content').append(input);
 await new Promise((resolve,reject)=>input.addEventListener('change',async()=>{try{let count=0;for(const file of input.files){const parts=file.webkitRelativePath.split('/');const start=parts.findIndex(p=>/^(data|mp3)$/i.test(p));if(start<0)continue;const group=parts[start].toLowerCase()==='data'?'Data':'Mp3';const relative=group+'/'+parts.slice(start+1).join('/');if(!relative||relative.includes('..'))continue;for(let offset=0;offset<file.size;offset+=4*1024*1024)await opfsWrite(ROOT,relative,offset,new Uint8Array(await file.slice(offset,offset+4*1024*1024).arrayBuffer()),file.size);count++;status(count+' fichiers importés');}await opfsFlush(ROOT);if(!count)throw Error('Aucun dossier Data ou Mp3 trouvé dans cette sélection.');input.remove();resolve();}catch(e){status(e.message);reject(e);}}));
}
const prepare=async()=>{
 const response=await fetch('/asset-manifest.json',{cache:'no-store'});if(!response.ok)throw Error('Le catalogue des données est indisponible');const manifest=await response.json();
 if(manifest.requiresImport)await importOriginals();
 const result=await syncAssets({manifest,opfs:{list:opfsList,write:opfsWrite,flush:opfsFlush,unlink:opfsUnlink},storage:localStorage,onProgress:p=>status('Préparation : '+p.file+' · '+Math.round(p.downloaded/1048576)+' Mo téléchargés')});
 window.goonkCacheStats=result;status(result.downloaded?'Données mises à jour':'Données déjà présentes sur cet appareil');return result;
};
window.goonkAssetsReady=(navigator.locks?navigator.locks.request('heroes-goonk-install',prepare):prepare()).catch(error=>{status(error.message+' — Recharge la page pour réessayer.');throw error;});
