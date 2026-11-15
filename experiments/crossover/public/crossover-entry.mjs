const status=document.querySelector('#hosting-status');
const retry=document.querySelector('#hosting-retry');
const retryKey='heroes-starcraft.isolation.'+location.pathname;
retry.onclick=()=>{sessionStorage.removeItem(retryKey);location.reload();};
const workerURL=new URL('./crossover-worker.js',location.href).href;
const launchFile=location.pathname.split('/').at(-1);
const launchPage=['battle.html','play.html','start.html','launch.html'].includes(launchFile);
let timer;
try{
 if(!isSecureContext)throw Error('Ouvre le jeu en HTTPS.');
 if(!('serviceWorker' in navigator))throw Error('Ce navigateur ne permet pas de préparer le jeu. Ouvre ce lien dans Safari.');
 const previous=navigator.serviceWorker.controller;
 status.textContent='Vérification de la version du jeu…';
 await Promise.race([
  (async()=>{
   const scope=launchPage?'./'+launchFile:'./';
   let registration;
   try{registration=await navigator.serviceWorker.register(workerURL,{scope,updateViaCache:'none'});}
   catch(error){registration=await navigator.serviceWorker.getRegistration(new URL(scope,location.href));if(!registration?.active)throw error;}
   // Check before entering the game, even when an older release already controls
   // the entry. An offline launch can continue with its installed release.
   try{await registration.update();}catch(error){if(!registration.active)throw error;}
   const next=registration.installing||registration.waiting||registration.active;
   if(!next)throw Error('La préparation du jeu a échoué. Réessaie.');
   if(next.state==='installing'||next.state==='parsed')await new Promise((resolve,reject)=>{
    const changed=()=>{if(next.state==='installed'||next.state==='activated'){next.removeEventListener('statechange',changed);resolve();}else if(next.state==='redundant'){next.removeEventListener('statechange',changed);reject(Error('Mise à jour interrompue. Réessaie.'));}};
    next.addEventListener('statechange',changed);changed();
   });
   if(next.state==='installed')next.postMessage({type:'crossover.activate-launch'});
   if(navigator.serviceWorker.controller!==next)await new Promise(resolve=>{
    const changed=()=>{if(navigator.serviceWorker.controller===next){navigator.serviceWorker.removeEventListener('controllerchange',changed);resolve();}};
    navigator.serviceWorker.addEventListener('controllerchange',changed);changed();
   });
   // Dedicated worker entry scripts need an isolating registration at their own
   // root URL too; the recovery document scope alone does not cover them.
   if(launchPage){
    let engineRegistration;
    try{engineRegistration=await navigator.serviceWorker.register(workerURL,{scope:'./',updateViaCache:'none'});}
    catch(error){engineRegistration=await navigator.serviceWorker.getRegistration(new URL('./',location.href));if(!engineRegistration?.active)throw error;}
    if(!engineRegistration.active){const engineWorker=engineRegistration.installing||engineRegistration.waiting;if(!engineWorker)throw Error('Le moteur ne peut pas être préparé.');await new Promise((resolve,reject)=>{const changed=()=>{if(engineWorker.state==='activated'){engineWorker.removeEventListener('statechange',changed);resolve();}else if(engineWorker.state==='redundant'){engineWorker.removeEventListener('statechange',changed);reject(Error('Préparation du moteur interrompue.'));}};engineWorker.addEventListener('statechange',changed);changed();});}
   }
  })(),
  new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('La préparation prend trop de temps. Ferme les autres onglets du jeu puis touche Réessayer.')),30000);})
 ]);
 if(!crossOriginIsolated||previous!==navigator.serviceWorker.controller){
  if(Number(sessionStorage.getItem(retryKey)||0)>=2)throw Error('Le navigateur bloque le démarrage. Ferme les autres onglets du jeu puis touche Réessayer.');
  sessionStorage.setItem(retryKey,String(Number(sessionStorage.getItem(retryKey)||0)+1));
  location.reload();
 }else{
  clearTimeout(timer);
  sessionStorage.removeItem(retryKey);
  const progress=document.querySelector('#preload-progress');
  const {downloadArchives}=await import('./local-assets.js');
  status.textContent='Vérification des données installées…';
  await downloadArchives((text,loaded,total)=>{status.textContent=text;progress.max=total;progress.value=loaded;});
  status.textContent='Préparation du moteur et de la carte…';
  const engineResponse=await fetch(new URL('starcraft/engine-build.json',location.href));if(!engineResponse.ok)throw Error('Moteur indisponible. Touche Réessayer.');
  const engine=await engineResponse.json();if(!/^[a-f0-9]{64}$/.test(engine.sha256))throw Error('Moteur non vérifié.');
  const files=['starcraft/index.html','starcraft/openbw.js','starcraft/net.js','starcraft/openbw.wasm?v=openbw-'+engine.sha256.slice(0,16),'starcraft/maps/Weave_v1.scx','native-bridge.js','battle.js','magic.js','loadout.js','sprite-scale.js','shared-field.js','adventure.js','adventure.css'];
  await Promise.all(files.map(async file=>{const response=await fetch(new URL(file,location.href));if(!response.ok)throw Error('Préchargement interrompu. Touche Réessayer.');await response.arrayBuffer();}));
  status.textContent='Données prêtes · ouverture de Heroes…';
  const game=new URL(launchPage?'./'+launchFile:'./game.html',location.href);game.search=location.search;
  if(launchPage)game.searchParams.set('play','1');
  if(!game.searchParams.has('mobile'))game.searchParams.set('mobile',matchMedia('(pointer:coarse)').matches||innerWidth<=960?'1':'0');game.searchParams.set('skip-autoresume','1');
  location.replace(game);
 }
}catch(error){status.textContent=error.message;retry.hidden=false;}
finally{clearTimeout(timer);}
