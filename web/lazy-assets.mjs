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
 const blocks=new Map(),ids=new WeakMap();let nextId=0,bytes=0;
 const stats={maxBytes,blockBytes,residentBytes:0,peakBytes:0,hits:0,misses:0};
 function block(file,index){
  if(!ids.has(file))ids.set(file,++nextId);const key=ids.get(file)+':'+index;
  if(blocks.has(key)){const value=blocks.get(key);blocks.delete(key);blocks.set(key,value);stats.hits++;return value;}
  stats.misses++;const value=read(file.slice(index*blockBytes,Math.min(file.size,(index+1)*blockBytes)));
  while(bytes+value.length>maxBytes&&blocks.size){const oldest=blocks.keys().next().value;bytes-=blocks.get(oldest).length;blocks.delete(oldest);}
  blocks.set(key,value);bytes+=value.length;stats.residentBytes=bytes;stats.peakBytes=Math.max(stats.peakBytes,bytes);return value;
 }
 return {stats,read(file,target,offset,length,position){
  const count=Math.max(0,Math.min(length,file.size-position));let copied=0;
  while(copied<count){const at=position+copied,index=Math.floor(at/blockBytes),part=block(file,index),start=at%blockBytes,n=Math.min(count-copied,part.length-start);if(n<=0)throw Error('Invalid asset block');target.set(part.subarray(start,start+n),offset+copied);copied+=n;}
  return copied;
 }};
}
export function installLazyAssets(module,files){
 // Verify browser byte handling before replacing any filesystem nodes.
 const probe=Uint8Array.from({length:256},(_,i)=>i),actual=readBlobBlock(new Blob([probe]));
 if(!probe.every((value,i)=>actual[i]===value))throw Error('Local asset reads are not byte-exact');
 const FS=module.FS,cache=createAssetBlockCache();
 module.goonkAssetCache=cache.stats;
 module.isLazyAsset=path=>files.has(path);
 module.installLazyAsset=(path,entry)=>{
  FS.writeFile(path,new Uint8Array(0));const node=FS.lookupPath(path).node,originalStream=node.stream_ops,originalNode=node.node_ops;
  const file=entry.blob;node.usedBytes=file.size;
  const materialize=(copy=true)=>{
   if(!node.goonkMaterialize)return;
   const contents=new Uint8Array(copy?file.size:0);if(copy)cache.read(file,contents,0,contents.length,0);
   node.contents=contents;node.usedBytes=contents.length;node.stream_ops=originalStream;node.node_ops=originalNode;delete node.goonkMaterialize;
  };
  node.goonkMaterialize=materialize;
  node.node_ops={...originalNode,setattr:(n,attr)=>{if(attr.size!==undefined)materialize(attr.size!==0);return originalNode.setattr(n,attr);}};
  node.stream_ops={...originalStream,
   read:(stream,buffer,offset,length,position)=>node.goonkMaterialize?cache.read(file,buffer,offset,length,position):originalStream.read(stream,buffer,offset,length,position),
   write:(...args)=>{materialize();return originalStream.write(...args);},
   mmap:(...args)=>{materialize();return originalStream.mmap(...args);}
  };
 };
}
