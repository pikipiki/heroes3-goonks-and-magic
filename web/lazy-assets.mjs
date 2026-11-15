// Native VCMI uses synchronous file reads. OPFS File snapshots stay on disk;
// only small, byte-exact Blob slices enter this bounded LRU on demand.
export function readBlobBlock(blob){
 // A leading sentinel prevents XHR's BOM sniffing from re-decoding binary blocks.
 const url=URL.createObjectURL(new Blob([new Uint8Array([0]),blob]));
 try{
  const request=new XMLHttpRequest();request.open('GET',url,false);
  request.overrideMimeType('text/plain; charset=x-user-defined');request.send();
  if(request.status!==200)throw Error('Local asset read failed: '+request.status);
  const text=request.responseText,bytes=new Uint8Array(Math.max(0,text.length-1));
  for(let i=0;i<text.length;i++)bytes[i]=text.charCodeAt(i+1)&255;
  if(bytes.length!==blob.size)throw Error('Incomplete local asset read');
  return bytes;
 }finally{URL.revokeObjectURL(url);}
}
export function createAssetBlockCache({maxBytes=16*1024*1024,blockBytes=64*1024,read=readBlobBlock}={}){
 if(blockBytes<1||maxBytes<blockBytes)throw Error('Invalid asset cache budget');
 const blocks=new Map(),ids=new WeakMap(),prefetches=new WeakMap();let nextId=0,bytes=0,prefetchQueue=Promise.resolve();
 const stats={maxBytes,blockBytes,residentBytes:0,peakBytes:0,hits:0,misses:0};
 const prefix=file=>{if(!ids.has(file))ids.set(file,++nextId);return ids.get(file)+':';};
 function touch(key){const part=blocks.get(key);if(part){blocks.delete(key);blocks.set(key,part);}return part;}
 function remove(key){const part=blocks.get(key);if(part){bytes-=part.length;blocks.delete(key);}}
 function remember(key,part){
  if(part.length>maxBytes)return;
  remove(key);
  while(bytes+part.length>maxBytes&&blocks.size)remove(blocks.keys().next().value);
  blocks.set(key,part);bytes+=part.length;stats.residentBytes=bytes;stats.peakBytes=Math.max(stats.peakBytes,bytes);
 }
 function rememberWhole(file,part){
  if(part.length>maxBytes)return;
  const base=prefix(file);for(const key of blocks.keys())if(key.startsWith(base))remove(key);
  remember(base+'whole',part);
 }
 function block(file,index){
  const key=prefix(file)+index,hot=touch(key);
  if(hot){stats.hits++;return hot;}
  stats.misses++;const part=read(file.slice(index*blockBytes,Math.min(file.size,(index+1)*blockBytes)));
  remember(key,part);return part;
 }
 function prefetch(file){
  if(!file||!Number.isFinite(file.size)||file.size>maxBytes||touch(prefix(file)+'whole'))return Promise.resolve();
  if(prefetches.has(file))return prefetches.get(file);
  // Serialize prefetch buffers as well as bounding residency: parallel whole
  // audio reads must not temporarily multiply the memory budget on iPhone.
  const task=prefetchQueue.then(async()=>{
   if(touch(prefix(file)+'whole'))return;
   const buffer=await file.arrayBuffer?.();
   if(buffer&&buffer.byteLength===file.size)rememberWhole(file,new Uint8Array(buffer));
  }).catch(()=>{});
  prefetches.set(file,task);prefetchQueue=task.finally(()=>prefetches.delete(file));return task;
 }
 return {stats,prefetch,read(file,target,offset,length,position){
  const count=Math.max(0,Math.min(length,file.size-position));let copied=0;
  if(!count)return 0;
  const whole=touch(prefix(file)+'whole');
  if(whole){target.set(whole.subarray(position,position+count),offset);stats.hits++;return count;}
  if(count>blockBytes*2){
   const part=read(file.slice(position,position+count));target.set(part,offset);
   if(position===0&&count===file.size&&count<=8*1024*1024)rememberWhole(file,part);
   return count;
  }
  while(copied<count){const at=position+copied,index=Math.floor(at/blockBytes),part=block(file,index),start=at%blockBytes,n=Math.min(count-copied,part.length-start);if(n<=0)throw Error('Invalid asset block');target.set(part.subarray(start,start+n),offset+copied);copied+=n;}
  return copied;
 }};
}
export function installLazyAssets(module,files){
 // Verify browser byte handling before replacing any filesystem nodes.
 const probe=Uint8Array.from({length:256},(_,i)=>i),actual=readBlobBlock(new Blob([probe]));
 if(!probe.every((value,i)=>actual[i]===value))throw Error('Local asset reads are not byte-exact');
 const FS=module.FS,cache=createAssetBlockCache();
 const pathToBlob=new Map();
 module.goonkAssetCache=cache.stats;
 module.isLazyAsset=path=>files.has(path);
 module.installLazyAsset=(path,{blob})=>{
  pathToBlob.set(path,blob);
  installAssetFile(FS,path,blob.size,(...args)=>cache.read(blob,...args));
 };
 module.prefetchLazyAsset=async path=>{
  const blob=pathToBlob.get(path);
  if(blob)await cache.prefetch(blob);
 };
 if(typeof window!=='undefined'){
  window.goonkPrefetchLazyAsset=module.prefetchLazyAsset;
 }
}

export async function prefetchGameAssets(module,paths=[]){
 const prefix='/home/web_user/.local/share/vcmi/';
 for(const p of paths){
  const full=p.startsWith('/')?p:prefix+p;
  await module.prefetchLazyAsset?.(full).catch(()=>{});
 }
}

export function installAssetFile(FS,path,size,read){
 FS.writeFile(path,new Uint8Array(0));const node=FS.lookupPath(path).node,originalStream=node.stream_ops,originalNode=node.node_ops;
 node.usedBytes=size;
 const materialize=(copy=true)=>{
  if(!node.goonkMaterialize)return;
  const contents=new Uint8Array(copy?size:0);if(copy)read(contents,0,contents.length,0);
  node.contents=contents;node.usedBytes=contents.length;node.stream_ops=originalStream;node.node_ops=originalNode;delete node.goonkMaterialize;
 };
 node.goonkMaterialize=materialize;
 node.node_ops={...originalNode,setattr:(n,attr)=>{if(attr.size!==undefined)materialize(attr.size!==0);return originalNode.setattr(n,attr);}};
 node.stream_ops={...originalStream,
  read:(stream,buffer,offset,length,position)=>node.goonkMaterialize?read(buffer,offset,length,position):originalStream.read(stream,buffer,offset,length,position),
  write:(...args)=>{materialize();return originalStream.write(...args);},
  mmap:(...args)=>{materialize();return originalStream.mmap(...args);}
 };
}
