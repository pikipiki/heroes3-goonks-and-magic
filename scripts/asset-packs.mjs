import crypto from 'node:crypto';
import path from 'node:path';
const contentKey=file=>file.hash?file.hash+':'+file.size+':'+path.extname(file.path).toLowerCase():null;
// Keep every native path, but publish identical bytes only once per file type.
export function deduplicateAssetURLs(files){
 const seen=new Map();let filesShared=0,bytesShared=0;
 for(const file of files){const key=contentKey(file);if(!key||!file.url)continue;const first=seen.get(key);if(first){file.url=first.url;filesShared++;bytesShared+=file.size;}else seen.set(key,file);}
 return {filesShared,bytesShared};
}
// Keep direct URLs for portraits/cards, but install tiny mod files in batches.
export function packSmallAssets(files,readFile,writePack,{limit=65536,maxSize=2*1048576,include=file=>file.path.startsWith('Mods/')}={}){
 let group=[],size=0,packs=0;
 const flush=()=>{
  if(!group.length)return;
  const seen=new Map(),members=[],parts=[];let offset=0;
  for(const file of group){
   const key=contentKey(file),first=key&&seen.get(key);
   if(first){members.push([file,first.offset]);continue;}
   if(key)seen.set(key,{offset});parts.push(readFile(file));members.push([file,offset]);offset+=file.size;
  }
  const bytes=Buffer.concat(parts),hash=crypto.createHash('sha256').update(bytes).digest('hex'),url='./assets/packs/'+hash+'.bin';writePack(url,bytes);
  for(const [file,packOffset] of members)file.chunks=[{...file.chunks[0],offset:0,size:file.size,url,packOffset,packSize:bytes.length}];
  group=[];size=0;packs++;
 };
 // Keep the original groups of neighbours for temporary-mode locality. Only
 // remove duplicate bytes inside a group, rather than moving distant files.
 for(const file of files){if(!include(file)||!file.size||file.size>limit||file.chunks.length!==1)continue;if(size+file.size>maxSize)flush();group.push(file);size+=file.size;}
 flush();return packs;
}
