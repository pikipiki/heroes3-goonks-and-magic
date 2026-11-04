import {ROOT} from './asset-cache.mjs';
export const GAME_NAME='HEROES GOONK';
export const STORAGE_LOCK='heroes-goonk-running';
export const ASSET_INDEX='heroes-goonk.asset-index.v1';
export function formatStorage(bytes){if(!Number.isFinite(bytes))return 'Indisponible';if(bytes<1048576)return new Intl.NumberFormat('fr-FR',{maximumFractionDigits:1}).format(bytes/1024)+' Ko';return new Intl.NumberFormat('fr-FR',{maximumFractionDigits:1}).format(bytes/1048576)+' Mo';}
export function isGameData(path){const relative=path.startsWith(ROOT+'/')?path.slice(ROOT.length+1):path;return /^(Data|Maps|Mp3|Mods)\//.test(relative)&&relative.split('/').every(part=>part&&part!=='.'&&part!=='..');}
export function storageSummary(entries){const summary={gameBytes:0,saveBytes:0,otherBytes:0,gameFiles:0,saveFiles:0};for(const [path,file]of Object.entries(entries)){if(file.isDir)continue;const bytes=Math.max(0,Number(file.length)||0),relative=path.startsWith(ROOT+'/')?path.slice(ROOT.length+1):path;if(isGameData(path)){summary.gameBytes+=bytes;summary.gameFiles++;}else if(/^Saves\//i.test(relative)){summary.saveBytes+=bytes;summary.saveFiles++;}else summary.otherBytes+=bytes;}return summary;}
export async function removeGameData({opfs,storage,onProgress=()=>{}}){const entries=await opfs.list(ROOT),files=Object.entries(entries).filter(([path,file])=>!file.isDir&&path.startsWith(ROOT+'/')&&isGameData(path));let removedBytes=0,count=0;try{for(const [path,file]of files){await opfs.unlink(ROOT,path.slice(ROOT.length+1));removedBytes+=Math.max(0,Number(file.length)||0);onProgress({removedBytes,count:++count,total:files.length});}}finally{await opfs.flush(ROOT);storage.removeItem(ASSET_INDEX);}return{removedBytes,count};}
// A manager can acquire an exclusive lock only after all game tabs have closed.
export function holdGameStorage({locks=navigator.locks,target=window}={}){
 if(!locks)return Promise.resolve(false);
 let release=null,held=false,hiddenIndex;
 const index=()=>{try{return target.localStorage?.getItem(ASSET_INDEX);}catch{return undefined;}};
 const acquire=restored=>new Promise(resolve=>{
  locks.request(STORAGE_LOCK,{mode:'shared'},()=>new Promise(done=>{
   release=done;held=true;
   // Only a real storage cleanup/update while this page was cached invalidates its VFS.
   // Ordinary app switching or browser Back keeps the existing engine and game alive.
   if(restored&&hiddenIndex!==undefined&&index()!==hiddenIndex){target.location.reload();done();}
   resolve(true);
  })).catch(()=>resolve(false));
 });
 target.addEventListener('pagehide',()=>{hiddenIndex=index();if(held){held=false;release?.();release=null;}});
 target.addEventListener('pageshow',event=>{if(event.persisted&&!held)void acquire(true);});
 return acquire(false);
}
export async function withStorageMaintenance(locks,action){if(!locks)throw Error('La suppression intégrée n’est pas disponible ici. Utilise les réglages du navigateur indiqués ci-dessous.');return locks.request(STORAGE_LOCK,{mode:'exclusive',ifAvailable:true},lock=>{if(!lock)throw Error('Ferme les autres onglets Heroes Goonk, puis réessaie.');return action();});}
export function storageGuide(hostname){return `<section class="storage-identity"><strong>${GAME_NAME}</strong><p>Stocké sur cet appareil dans ton navigateur</p><code class="storage-site">${escape(hostname)}</code></section><p>Recherche cette adresse dans les données des sites du navigateur. Le jeu n’est pas enregistré dans un dossier Téléchargements.</p><button data-menu="storage-help">Où le supprimer dans les réglages ?</button>`;}
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export const storageHelp=()=>`<section class="storage-help"><p><strong>iPhone / iPad · Safari</strong><br>Réglages → Apps → Safari → Avancé → Données de sites. Recherche l’adresse ci-dessus, puis supprime son entrée.</p><p><strong>Android · Chrome</strong><br>Chrome → Paramètres → Paramètres des sites → Tous les sites. Recherche l’adresse ci-dessus, puis efface ses données.</p><p><strong>PC · Chrome / Edge</strong><br>Ouvre les informations du site à gauche de son adresse → Paramètres du site → Supprimer les données.</p><p><strong>Mac · Safari</strong><br>Safari → Réglages → Confidentialité → Gérer les données de sites web. Recherche l’adresse ci-dessus, puis supprime-la.</p><p>Effacer toutes les données du site dans le navigateur efface aussi les sauvegardes locales. Pour les garder, utilise la suppression des fichiers du jeu proposée ici.</p><p>Netlify et GitHub Pages ont chacun leur stockage. Si tu as joué sur les deux adresses, leurs fichiers se suppriment séparément. Sur GitHub Pages, plusieurs projets du même domaine peuvent partager cette entrée.</p><p><a href="https://support.apple.com/en-gb/105082" target="_blank" rel="noopener">Aide Apple iPhone</a> · <a href="https://support.google.com/chrome/answer/95647?hl=fr" target="_blank" rel="noopener">Aide Chrome</a></p></section>`;
