import {opfsList,opfsWrite,opfsFlush,opfsUnlink} from '/opfs-worker.js';
import {syncAssets,ROOT} from './asset-cache.mjs';
const status=text=>{const el=document.querySelector('#status');if(el)el.textContent=text;};
const hasOriginals=entries=>['h3bitmap.lod','h3sprite.lod'].every(name=>Object.keys(entries).some(p=>p.toLowerCase().endsWith('/data/'+name)));
async function importOriginals(){
 if(hasOriginals(await opfsList(ROOT)))return;
 status('Importe les données de ton Heroes III une seule fois. Elles restent sur cet appareil.');
 const choices=document.createElement('div');choices.style.cssText='display:grid;gap:12px;max-width:350px;text-align:left';
 choices.innerHTML='<label style="padding:14px;border:1px solid #765584;border-radius:12px">Choisir les fichiers (téléphone)<input type="file" multiple accept=".lod,.snd,.mp3,.ogg,.h3m,.h3c" aria-label="Importer les fichiers Heroes III" style="display:block;max-width:100%;margin-top:10px"></label><label style="padding:14px;border:1px solid #765584;border-radius:12px">Ou choisir le dossier du jeu<input type="file" webkitdirectory multiple aria-label="Importer le dossier Heroes III" style="display:block;max-width:100%;margin-top:10px"></label><small>Choisis notamment H3bitmap.lod et H3sprite.lod, ainsi que les autres fichiers LOD et SND de ton dossier Data. Les musiques et cartes peuvent être importées avec le dossier complet.</small>';
 document.querySelector('.spinner-content').append(choices);
 await new Promise(resolve=>{for(const input of choices.querySelectorAll('input'))input.addEventListener('change',async()=>{
  for(const field of choices.querySelectorAll('input'))field.disabled=true;
  try{let count=0;for(const file of input.files){
   const parts=(file.webkitRelativePath||file.name).split('/');let start=parts.findIndex(p=>/^(data|mp3|maps)$/i.test(p));let relative;
   if(start>=0){const group={data:'Data',mp3:'Mp3',maps:'Maps'}[parts[start].toLowerCase()];relative=group+'/'+parts.slice(start+1).join('/');}
   else if(/\.(lod|snd)$/i.test(file.name))relative='Data/'+file.name;else if(/\.(mp3|ogg)$/i.test(file.name))relative='Mp3/'+file.name;else if(/\.(h3m|h3c)$/i.test(file.name))relative='Maps/'+file.name;else continue;
   if(relative.split('/').some(p=>!p||p==='..'||p==='.'))continue;
   for(let offset=0;offset<file.size;offset+=4*1024*1024)await opfsWrite(ROOT,relative,offset,new Uint8Array(await file.slice(offset,offset+4*1024*1024).arrayBuffer()),file.size);
   count++;status(count+' fichiers importés');
  }
  await opfsFlush(ROOT);if(!hasOriginals(await opfsList(ROOT)))throw Error('Sélectionne aussi H3bitmap.lod et H3sprite.lod dans le dossier Data.');choices.remove();resolve();
  }catch(error){status(error.message);for(const field of choices.querySelectorAll('input'))field.disabled=false;}
 });});
}
const prepare=async()=>{
 const response=await fetch('/asset-manifest.json',{cache:'no-store'});if(!response.ok)throw Error('Le catalogue des données est indisponible');const manifest=await response.json();window.goonkAssetURLs=manifest.files;
 navigator.storage?.persist?.().catch(()=>{});
 if(manifest.requiresImport)await importOriginals();
 const result=await syncAssets({manifest,opfs:{list:opfsList,write:opfsWrite,flush:opfsFlush,unlink:opfsUnlink},storage:localStorage,onProgress:p=>status('Préparation : '+p.file+' · '+Math.round(p.downloaded/1048576)+' Mo téléchargés')});
 window.goonkCacheStats=result;status(result.downloaded?'Données mises à jour':'Données déjà présentes sur cet appareil');return result;
};
window.goonkAssetsReady=(navigator.locks?navigator.locks.request('heroes-goonk-install',prepare):prepare()).catch(error=>{status(error.message+' — Recharge la page pour réessayer.');throw error;});
