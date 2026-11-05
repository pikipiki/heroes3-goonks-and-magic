export const ROOT='/home/web_user/.local/share/vcmi';
export async function syncAssets({manifest,opfs,storage,fetcher=fetch,onProgress=()=>{},concurrency=8,now=()=>performance.now(),digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('')}){
 const key='heroes-goonk.asset-index.v1';let previous={};try{previous=JSON.parse(storage.getItem(key)||'{}');}catch{}
 // Validate the complete catalogue before starting any concurrent writes.
 for(const file of manifest.files)if(!/^(Data|Maps|Mp3|Mods)\//.test(file.path)||file.path.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('Chemin de données incorrect');
 const manifestPaths=new Set(manifest.files.map(file=>file.path));
 const existing=await opfs.list(ROOT),next={...previous},pending=[],active=new Map(),samples=[];
 let downloaded=0,received=0,reused=0,completed=0,completedBytes=0,cursor=0,sinceFlush=0,failure,checkpoint=Promise.resolve();
 const total=manifest.files.length,totalBytes=manifest.files.reduce((sum,f)=>sum+f.size,0);
 const speed=(history,time)=>{while(history.length>2&&history[1][0]<time-1500)history.shift();const first=history[0];return first?(history.at(-1)[1]-first[1])/Math.max(.1,(time-first[0])/1000):0;};
 samples.push([now(),0]);
 const emit=(phase='download')=>{const time=now();samples.push([time,received]);const current=[...active.values()].map(f=>{f.samples.push([time,f.loaded]);return{file:f.file,size:f.size,loaded:f.loaded,speed:speed(f.samples,time),state:f.state};});const loaded=completedBytes+current.reduce((s,f)=>s+Math.min(f.size,f.loaded),0);onProgress({file:current[0]?.file,downloaded,received,reused,total,completed,remaining:total-completed,totalBytes,loaded,percent:phase==='ready'?100:Math.min(99.9,totalBytes?loaded/totalBytes*100:0),speed:speed(samples,time),active:current,phase});};
 for(const file of manifest.files){const local=existing[ROOT+'/'+file.path];if(previous[file.path]?.hash===file.hash&&local?.length===file.size){reused++;completed++;completedBytes+=file.size;}else pending.push(file);}
 const obsolete=opfs.unlink?Object.keys(previous).filter(path=>!manifestPaths.has(path)&&/^(Mods|Maps)\//.test(path)):[];
 if(!pending.length&&!obsolete.length){emit('ready');return {downloaded,reused,files:total};}
 let io=Promise.resolve();const disk=fn=>{const task=io.then(fn);io=task.catch(()=>{});return task;};
 const save=()=>{sinceFlush=0;const snapshot=JSON.stringify(next);checkpoint=checkpoint.then(async()=>{await disk(()=>opfs.flush(ROOT));try{storage.setItem(key,snapshot);}catch{}});return checkpoint;};
 const read=async(response,size,item)=>{
  const bytes=new Uint8Array(size);let offset=0;
  const accept=part=>{if(offset+part.length>size)throw Error('Données incomplètes ou altérées : '+item.file);bytes.set(part,offset);offset+=part.length;received+=part.length;item.loaded+=part.length;emit();};
  if(response.body?.getReader){const reader=response.body.getReader();try{for(;;){const {done,value}=await reader.read();if(done)break;accept(value);}}finally{reader.releaseLock();}}
  else accept(new Uint8Array(await response.arrayBuffer()));
  if(offset!==size)throw Error('Données incomplètes ou altérées : '+item.file);return bytes;
 };
 const packs=new Map(),uses=new Map();
 for(const f of pending)for(const chunk of f.chunks)if(chunk.packSize)uses.set(chunk.url,(uses.get(chunk.url)||0)+1);
 const packed=async(chunk,item)=>{
  if(chunk.packOffset<0||chunk.packOffset+chunk.size>chunk.packSize||chunk.packSize>2*1048576)throw Error('Archive de données incorrecte');
  let pack=packs.get(chunk.url);
  if(!pack){
   pack={loaded:0,listeners:new Set()};packs.set(chunk.url,pack);
   pack.promise=(async()=>{const response=await fetcher(chunk.url,{headers:{}});if(!response.ok)throw Error('Téléchargement impossible : '+item.file+' ('+response.status+')');const bytes=new Uint8Array(chunk.packSize);const accept=part=>{if(pack.loaded+part.length>bytes.length)throw Error('Archive de données incorrecte');bytes.set(part,pack.loaded);pack.loaded+=part.length;received+=part.length;for(const update of pack.listeners)update();emit();};if(response.body?.getReader){const reader=response.body.getReader();try{for(;;){const {done,value}=await reader.read();if(done)break;accept(value);}}finally{reader.releaseLock();}}else accept(new Uint8Array(await response.arrayBuffer()));if(pack.loaded!==bytes.length)throw Error('Archive de données incomplète');return bytes;})();
  }
  const base=item.loaded,update=()=>{item.loaded=base+Math.max(0,Math.min(chunk.size,pack.loaded-chunk.packOffset));};pack.listeners.add(update);if(pack.loaded>=chunk.packOffset+chunk.size)item.state='unpack';update();emit();
  try{const bytes=await pack.promise;return bytes.slice(chunk.packOffset,chunk.packOffset+chunk.size);}finally{pack.listeners.delete(update);const remaining=uses.get(chunk.url)-1;uses.set(chunk.url,remaining);if(!remaining)packs.delete(chunk.url);}
 };
 const install=async file=>{
  const item={file:file.path,size:file.size,loaded:0,state:'download',samples:[[now(),0]]};active.set(file.path,item);emit();let fullDownload;
  if(!file.size)await disk(()=>opfs.write(ROOT,file.path,0,new Uint8Array(),0));
  for(const chunk of file.chunks){
   if(failure)return;
   const split=!!chunk.url;const response=chunk.packSize||(!split&&fullDownload)?null:await fetcher(chunk.url||file.url,{headers:!split&&file.chunks.length>1?{Range:`bytes=${chunk.offset}-${chunk.offset+chunk.size-1}`}:{}});
   if(response&&!response.ok)throw Error('Téléchargement impossible : '+file.path+' ('+response.status+')');
   const fallback=!split&&response?.status===200&&file.chunks.length>1;
   const full=chunk.packSize?await packed(chunk,item):(!split&&fullDownload)||await read(response,fallback?file.size:chunk.size,item);
   if(fallback)fullDownload=full;
   const bytes=!split&&file.chunks.length>1&&fullDownload?full.slice(chunk.offset,chunk.offset+chunk.size):full;
   item.state='verify';emit();if(bytes.length!==chunk.size||await digest(bytes)!==chunk.hash)throw Error('Données incomplètes ou altérées : '+file.path);
   const length=bytes.length;item.state='write';emit();await disk(()=>opfs.write(ROOT,file.path,chunk.offset,bytes,file.size));downloaded+=length;item.state='download';emit();
  }
  next[file.path]={hash:file.hash,size:file.size};completed++;completedBytes+=file.size;active.delete(file.path);sinceFlush++;emit();
  if(sinceFlush>=64||file.size>=4*1024*1024)await save();
 };
 emit();const timer=setInterval(()=>emit(),250);
 try{
  const worker=async()=>{while(!failure&&cursor<pending.length){const file=pending[cursor++];try{await install(file);}catch(error){failure||=error;}}};
  await Promise.all(Array.from({length:Math.min(pending.length,Math.max(1,Math.min(8,Math.floor(concurrency)||1)))},worker));
  // Settle in-flight writes before recording any verified files, even on failure.
  await save();if(failure)throw failure;
  for(const old of obsolete){await disk(()=>opfs.unlink(ROOT,old));delete next[old];}
  emit('save');await save();emit('ready');return {downloaded,reused,files:total};
 }finally{clearInterval(timer);}
}
