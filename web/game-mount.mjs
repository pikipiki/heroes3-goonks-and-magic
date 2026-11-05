import {ROOT} from './asset-cache.mjs';

// The OPFS reconciler still builds its normal directory tree. Batch the immutable
// game assets and reuse handles from its listing for this startup mount only.
export function batchGameMount(opfs, assets){
 const getRemoteSet=opfs.getRemoteSet,loadRemoteEntry=opfs.loadRemoteEntry;
 const assetSizes=new Map(assets.map(file=>[ROOT+'/'+file.path,file.size]));
 let queue=[],listed=false;
 opfs.getRemoteSet=(mount,callback)=>{
  if(mount.opts.root!==ROOT||mount.mountpoint!==ROOT||mount.opts.folder)return getRemoteSet(mount,callback);
  opfs.callWorker('list',{root:ROOT,retainFileHandles:true},(error,entries)=>{
   if(error)return getRemoteSet(mount,callback);
   listed=true;
   for(const [path,entry] of Object.entries(entries))entry.path=path;
   callback(null,{type:'remote',entries});
  });
 };
 opfs.loadRemoteEntry=(mount,path,callback)=>{
  if(!listed||mount.opts.root!==ROOT||!assetSizes.has(path))return loadRemoteEntry(mount,path,callback);
  queue.push({mount,path,callback});
  if(queue.length!==1)return;
  queueMicrotask(()=>{
   const batch=queue;queue=[];
   const files=batch.map(item=>({path:item.path.slice(ROOT.length),lazy:assetSizes.get(item.path)>4096}));
   opfs.callWorker('mount-files',{root:ROOT,files},(error,entries)=>{
    batch.forEach(({mount,path,callback},i)=>{
     if(!error&&entries?.[i])callback(null,entries[i]);
     else loadRemoteEntry(mount,path,callback);
    });
   });
  });
 };
 return ()=>{
  opfs.getRemoteSet=getRemoteSet;
  opfs.loadRemoteEntry=loadRemoteEntry;
  if(listed)opfs.callWorker('release-mount',{root:ROOT},()=>{});
 };
}
