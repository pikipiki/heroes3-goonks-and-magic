// Serialize/coalesce VFS persistence without holding an engine mutex or making
// save-sized copies for the optional cloud service on ordinary local games.
export function createSaveScheduler({sync,schedule=fn=>setTimeout(fn,0),onError=console.error}) {
  let running=false,scheduled=false;
  const pending=new Map();
  function kick(){
    if(running||scheduled||!pending.size)return;
    scheduled=true;schedule(async()=>{
      scheduled=false;running=true;
      const batch=[...pending.values()];pending.clear();
      try{await sync();for(const item of batch)item.resolve();}
      catch(error){onError(error);for(const item of batch)item.reject(error);}
      finally{running=false;kick();}
    });
  }
  return path=>new Promise((resolve,reject)=>{
    const previous=pending.get(path);
    pending.set(path,{resolve:()=>{previous?.resolve();resolve();},reject:error=>{previous?.reject(error);reject(error);}});
    kick();
  });
}
export function installRuntimeScheduling(module){
  const stats=window.goonkRuntimeStats={saves:[],errors:[]};
  const persist=createSaveScheduler({
    sync:()=>new Promise((resolve,reject)=>{
      const start=performance.now();
      module.FS.syncfs(false,error=>{
        stats.saves.push({at:Date.now(),durationMs:Math.round(performance.now()-start),ok:!error});
        if(stats.saves.length>40)stats.saves.shift();
        error?reject(error):resolve();
      });
    }),
    onError:error=>stats.errors.push(String(error))
  });
  module.persistLocalSave=path=>{
    const toast=document.querySelector('#save-toast');let failed=false;toast?.classList.remove('hidden','opacity-0');toast?.querySelector('.save-toast__subtitle')?.replaceChildren('Enregistrement sur cet appareil…');
    return persist(path).then(async()=>{
      window.dispatchEvent(new CustomEvent('goonk-save-persisted',{detail:{path,ok:true}}));
      let key;try{key=localStorage.getItem('mp.v8key');}catch{}
      if(typeof key!=='string'||key.length!==5||!module.fsUpdate)return;
      // Preserve optional upstream cloud sync. Ordinary local saves allocate
      // neither of these copies, and never wait on a network request.
      const bytes=module.FS.readFile(path),encoded=new TextEncoder().encode(path+'\0');
      const namePtr=module._malloc(encoded.length),dataPtr=module._malloc(bytes.length);
      module.HEAPU8.set(encoded,namePtr);module.HEAPU8.set(bytes,dataPtr);
      await module.fsUpdate(namePtr,dataPtr,bytes.length);
    }).catch(error=>{
      failed=true;window.dispatchEvent(new CustomEvent('goonk-save-persisted',{detail:{path,ok:false,error:String(error)}}));console.error('Save persistence failed',error);
      toast?.querySelector('.save-toast__subtitle')?.replaceChildren('Sauvegarde locale non enregistrée. Réessaie avant de fermer le jeu.');
    }).finally(()=>{if(!failed){toast?.classList.add('opacity-0');setTimeout(()=>toast?.classList.add('hidden'),180);}});
  };
}
