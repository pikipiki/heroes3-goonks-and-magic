import crypto from 'node:crypto';
// Keep individual URLs for portraits/cards, but install tiny mod files in batches.
export function packSmallAssets(files,readFile,writePack,{limit=65536,maxSize=2*1048576,include=file=>file.path.startsWith('Mods/')}={}){
 let group=[],size=0,packs=0;
 const flush=()=>{if(!group.length)return;const bytes=Buffer.concat(group.map(f=>readFile(f))),hash=crypto.createHash('sha256').update(bytes).digest('hex'),url='./assets/packs/'+hash+'.bin';writePack(url,bytes);let offset=0;for(const file of group){file.chunks=[{...file.chunks[0],offset:0,size:file.size,url,packOffset:offset,packSize:bytes.length}];offset+=file.size;}group=[];size=0;packs++;};
 for(const file of files){if(!include(file)||!file.size||file.size>limit||file.chunks.length!==1)continue;if(size+file.size>maxSize)flush();group.push(file);size+=file.size;}flush();return packs;
}
