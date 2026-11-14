const status=document.querySelector('#hosting-status');
const retry=document.querySelector('#hosting-retry');
const retryKey='heroes-starcraft.isolation.'+location.pathname;
retry.onclick=()=>{sessionStorage.removeItem(retryKey);location.reload();};
let timer;
try{
 if(!isSecureContext)throw Error('Ouvre le jeu en HTTPS.');
 if(!crossOriginIsolated){
  if(!('serviceWorker' in navigator))throw Error('Ce navigateur ne permet pas de préparer le jeu. Ouvre ce lien dans Safari.');
  if(Number(sessionStorage.getItem(retryKey)||0)>=2)throw Error('Le navigateur bloque le démarrage. Ferme les autres onglets du jeu puis touche Réessayer.');
  status.textContent='Préparation du jeu…';
  const workerURL=new URL('./crossover-serviceworker.js',location.href).href;
  const controlled=()=>navigator.serviceWorker.controller?.scriptURL===workerURL;
  await Promise.race([
   (async()=>{
    const registration=await navigator.serviceWorker.register(workerURL,{scope:'./',updateViaCache:'none'});
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
  const game=new URL('./game.html',location.href);game.search=location.search;
  game.searchParams.set('mobile','1');game.searchParams.set('skip-autoresume','1');
  location.replace(game);
 }
}catch(error){status.textContent=error.message;retry.hidden=false;}
finally{clearTimeout(timer);}
