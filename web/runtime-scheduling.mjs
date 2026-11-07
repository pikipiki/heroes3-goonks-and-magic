// Serialize/coalesce VFS persistence without holding an engine mutex or making
// save-sized copies for the optional cloud service on ordinary local games.
export function createSaveScheduler({sync,schedule=fn=>setTimeout(fn,0),onError=console.error}) {
  let running=false,scheduled=false;
  const pending=new Map();
  function kick(){
    if(running||scheduled||!pending.size)return;
    scheduled=true;schedule(async()=>{
      scheduled=false;running=true;
      const batch=[...pending];pending.clear();
      try{await sync(batch.map(([path])=>path));for(const [,item] of batch)item.resolve();}
      catch(error){onError(error);for(const [,item] of batch)item.reject(error);}
      finally{running=false;kick();}
    });
  }
  return path=>new Promise((resolve,reject)=>{
    const previous=pending.get(path);
    pending.set(path,{resolve:()=>{previous?.resolve();resolve();},reject:error=>{previous?.reject(error);reject(error);}});
    kick();
  });
}
const saveRoot='/home/web_user/.local/share/vcmi';
const opfsCall=run=>new Promise((resolve,reject)=>run((error,value)=>error?reject(error):resolve(value)));

export async function persistSaveFiles(module,paths){
  if(module.goonkTemporaryStorage)return;
  const {FS,OPFS}=module;
  const canWriteDirectly=OPFS?.loadLocalEntry&&OPFS.storeRemoteEntry&&OPFS.callWorker
    && paths.every(path=>['goonk-auto','goonk-online-auto'].some(name=>path.toLowerCase()===saveRoot+'/saves/'+name+'.vsgm1'));
  if(!canWriteDirectly)return opfsCall(done=>FS.syncfs(false,done));
  const mount=FS.lookupPath(saveRoot).node.mount;
  if(mount?.opts?.root!==saveRoot||mount.opts.folder)return opfsCall(done=>FS.syncfs(false,done));

  // The engine has already closed these saves. Reuse the mounted OPFS worker
  // so autosave touches only the files it changed and flushes the same metadata.
  for(const path of paths){
    const entry=await opfsCall(done=>OPFS.loadLocalEntry(path,done));
    await opfsCall(done=>OPFS.storeRemoteEntry(mount,path,entry,done));
  }
  await opfsCall(done=>OPFS.callWorker('flush',{root:saveRoot},done));
}

// The load screen can delete only the solo autosave. Touch its OPFS entry
// directly so a stale tab cannot replace unrelated saves during a full sync.
export async function deleteSoloAutosave(module){
  const {FS,OPFS}=module;
  const dir=saveRoot+'/Saves';
  const file=FS.readdir(dir).find(name=>name.toLowerCase()==='goonk-auto.vsgm1');
  if(!file)return;
  if(module.goonkTemporaryStorage){FS.unlink(dir+'/'+file);return;}
  const mount=FS.lookupPath(saveRoot).node.mount;
  if(mount?.opts?.root!==saveRoot||mount.opts.folder)throw new Error('Autosave storage is unavailable');
  await opfsCall(done=>OPFS.removeRemoteEntry(mount,dir+'/'+file,done));
  await opfsCall(done=>OPFS.callWorker('flush',{root:saveRoot},done));
}

export function installRuntimeScheduling(module){
  const stats=window.goonkRuntimeStats={saves:[],errors:[]};
  const persist=createSaveScheduler({
    sync:async paths=>{
      const start=performance.now();
      let ok=false;
      try{await persistSaveFiles(module,paths);ok=true;}
      finally{
        stats.saves.push({at:Date.now(),durationMs:Math.round(performance.now()-start),ok});
        if(stats.saves.length>40)stats.saves.shift();
      }
    },
    onError:error=>{stats.errors.push(String(error));if(stats.errors.length>20)stats.errors.shift();}
  });
  module.persistLocalSave=path=>{
    const toast=document.querySelector('#save-toast');let failed=false;clearTimeout(module._goonkToastTimer);module._goonkToastTimer=setTimeout(()=>toast?.classList.add('hidden','opacity-0'),250);toast?.classList.remove('hidden','opacity-0');toast?.querySelector('.save-toast__subtitle')?.replaceChildren('Enregistrement sur cet appareil…');
    if(module.goonkTemporaryStorage)toast?.querySelector('.save-toast__subtitle')?.replaceChildren('Sauvegarde temporaire dans cet onglet…');
    return persist(path).then(async()=>{
      window.dispatchEvent(new CustomEvent('goonk-save-persisted',{detail:{path,ok:true}}));
      let key;try{key=localStorage.getItem('mp.v8key');}catch{}
      if(module.goonkTemporaryStorage||typeof key!=='string'||key.length!==5||!module.fsUpdate)return;
      // Preserve optional upstream cloud sync. Ordinary local saves allocate
      // neither of these copies, and never wait on a network request.
      const bytes=module.FS.readFile(path),encoded=new TextEncoder().encode(path+'\0');
      const namePtr=module._malloc(encoded.length),dataPtr=module._malloc(bytes.length);
      module.HEAPU8.set(encoded,namePtr);module.HEAPU8.set(bytes,dataPtr);
      await module.fsUpdate(namePtr,dataPtr,bytes.length);
    }).catch(error=>{
      failed=true;clearTimeout(module._goonkToastTimer);toast?.classList.remove('hidden','opacity-0');window.dispatchEvent(new CustomEvent('goonk-save-persisted',{detail:{path,ok:false,error:String(error)}}));console.error('Save persistence failed',error);
      toast?.querySelector('.save-toast__subtitle')?.replaceChildren('Sauvegarde locale non enregistrée. Réessaie avant de fermer le jeu.');
    }).finally(()=>{if(!failed){toast?.classList.add('opacity-0');setTimeout(()=>toast?.classList.add('hidden'),180);}});
  };
}
