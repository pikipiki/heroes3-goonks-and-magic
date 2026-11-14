const status=document.querySelector('#hosting-status');
const retry=document.querySelector('#hosting-retry');
const retryKey='heroes-starcraft.isolation.'+location.pathname;
retry.onclick=()=>{sessionStorage.removeItem(retryKey);location.reload();};
const workerURL=new URL('./crossover-preload-worker.js',location.href).href;
const controlled=()=>navigator.serviceWorker.controller?.scriptURL===workerURL;
const launchFile=location.pathname.split('/').at(-1);
const launchPage=['play.html','start.html','launch.html'].includes(launchFile);
let timer;
try{
 if(!isSecureContext)throw Error('Ouvre le jeu en HTTPS.');
 if(!crossOriginIsolated || (launchPage && !controlled())){
  if(!('serviceWorker' in navigator))throw Error('Ce navigateur ne permet pas de préparer le jeu. Ouvre ce lien dans Safari.');
  if(Number(sessionStorage.getItem(retryKey)||0)>=2)throw Error('Le navigateur bloque le démarrage. Ferme les autres onglets du jeu puis touche Réessayer.');
  status.textContent='Préparation du jeu…';
  await Promise.race([
   (async()=>{
    const registration=await navigator.serviceWorker.register(workerURL,{scope:launchPage?'./'+launchFile:'./',updateViaCache:'none'});
    const activate=()=>registration.waiting?.postMessage({type:'crossover.activate-launch'});
    activate();
    registration.addEventListener('updatefound',()=>registration.installing?.addEventListener('statechange',activate));
    registration.installing?.addEventListener('statechange',activate);
    if(!controlled())await new Promise(resolve=>{
     const changed=()=>{if(controlled()){navigator.serviceWorker.removeEventListener('controllerchange',changed);resolve();}};
     navigator.serviceWorker.addEventListener('controllerchange',changed);changed();
    });
   })(),
   new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('La préparation prend trop de temps. Ferme les autres onglets du jeu puis touche Réessayer.')),30000);})
  ]);
  sessionStorage.setItem(retryKey,String(Number(sessionStorage.getItem(retryKey)||0)+1));
  location.reload();
 }else{
  sessionStorage.removeItem(retryKey);
  const progress=document.querySelector('#preload-progress');
  const {downloadArchives}=await import('./local-assets.js');
  status.textContent='Vérification des données installées…';
  await downloadArchives((text,loaded,total)=>{status.textContent=text;progress.max=total;progress.value=loaded;});
  status.textContent='Préparation du moteur et de la carte…';
  const files=['starcraft/index.html','starcraft/openbw.js','starcraft/net.js','starcraft/openbw.wasm?v=openbw-469d2037-crossover-2','starcraft/maps/Weave_v1.scx','native-bridge.js','battle.js','shared-field.js','adventure.js','adventure.css'];
  await Promise.all(files.map(async file=>{const response=await fetch(new URL(file,location.href));if(!response.ok)throw Error('Préchargement interrompu. Touche Réessayer.');await response.arrayBuffer();}));
  status.textContent='Données prêtes · ouverture de Heroes…';
  const game=new URL(launchPage?'./'+launchFile:'./game.html',location.href);game.search=location.search;
  if(launchPage)game.searchParams.set('play','1');
  game.searchParams.set('mobile','1');game.searchParams.set('skip-autoresume','1');
  location.replace(game);
 }
}catch(error){status.textContent=error.message;retry.hidden=false;}
finally{clearTimeout(timer);}
