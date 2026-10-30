export const ROOT='/home/web_user/.local/share/vcmi';
export async function syncAssets({manifest,opfs,storage,fetcher=fetch,onProgress=()=>{},digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('')}){
 const key='heroes-goonk.asset-index.v1';let previous={};try{previous=JSON.parse(storage.getItem(key)||'{}');}catch{}
 const existing=await opfs.list(ROOT),next={...previous};let downloaded=0,reused=0;
 for(const file of manifest.files){
  if(!/^(Data|Maps|Mp3|Mods)\//.test(file.path)||file.path.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('Chemin de données incorrect');
  const local=existing[ROOT+'/'+file.path];
  if(previous[file.path]?.hash===file.hash&&local?.length===file.size){reused++;continue;}
  onProgress({file:file.path,downloaded,reused,total:manifest.files.length});
  let fullDownload;
  if(!file.size)await opfs.write(ROOT,file.path,0,new Uint8Array(),0);
  for(const chunk of file.chunks){
   const response=fullDownload?null:await fetcher(file.url,{headers:file.chunks.length>1?{Range:`bytes=${chunk.offset}-${chunk.offset+chunk.size-1}`}:{}});
   if(response&&!response.ok)throw Error('Téléchargement impossible : '+file.path);
   // A host without byte ranges may return the whole file. Slice it only in that fallback.
   const full=fullDownload||new Uint8Array(await response.arrayBuffer());
   if(response?.status===200&&file.chunks.length>1)fullDownload=full;
   const bytes=file.chunks.length>1&&fullDownload?full.slice(chunk.offset,chunk.offset+chunk.size):full;
   if(bytes.length!==chunk.size||await digest(bytes)!==chunk.hash)throw Error('Données incomplètes ou altérées : '+file.path);
   await opfs.write(ROOT,file.path,chunk.offset,bytes,file.size);downloaded+=bytes.length;
  }
  await opfs.flush(ROOT);next[file.path]={hash:file.hash,size:file.size};
  // A failed download never validates a partial file; completed files survive a retry.
  try{storage.setItem(key,JSON.stringify(next));}catch{}
 }
 // Remove only obsolete files previously owned by the manifest; never touch saves or imports.
 if(opfs.unlink){const current=new Set(manifest.files.map(f=>f.path));for(const old of Object.keys(previous))if(!current.has(old)&&/^(Mods|Maps)\//.test(old)){await opfs.unlink(ROOT,old);delete next[old];}await opfs.flush(ROOT);}
 try{storage.setItem(key,JSON.stringify(next));}catch{}
 return {downloaded,reused,files:manifest.files.length};
}
