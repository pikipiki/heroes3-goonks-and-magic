import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {CHUNK_SIZE,describeFile} from './assets.mjs';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const validPath=name=>/^(Data|Maps|Mp3)\//.test(name)&&name.split('/').every(p=>p&&p!=='.'&&p!=='..');
export function packBaseGame(source,destination,{chunkSize=CHUNK_SIZE}={}){
 fs.mkdirSync(destination+'/chunks',{recursive:true});const files=[],used=new Set();
 function walk(relative){if(!fs.existsSync(path.join(source,relative)))return;for(const item of fs.readdirSync(path.join(source,relative),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
  if(item.name.startsWith('.'))continue;const name=relative+'/'+item.name;
  if(item.isDirectory()){walk(name);continue;}if(!item.isFile()||name==='Maps/000-Goonk.vmap')continue;
  const full=path.join(source,name),size=fs.statSync(full).size,fd=fs.openSync(full,'r'),digest=crypto.createHash('sha256'),chunks=[];
  try{for(let offset=0;offset<size;offset+=chunkSize){const bytes=Buffer.alloc(Math.min(chunkSize,size-offset));fs.readSync(fd,bytes,0,bytes.length,offset);digest.update(bytes);const sha=hash(bytes);used.add(sha);fs.writeFileSync(destination+'/chunks/'+sha+'.bin',bytes);chunks.push({offset,size:bytes.length,hash:sha});}}finally{fs.closeSync(fd);}
  files.push({path:name,size,hash:digest.digest('hex'),chunks});
 }}
 for(const dir of ['Data','Maps','Mp3'])walk(dir);
 if(!files.some(f=>f.path.toLowerCase()==='data/h3bitmap.lod')||!files.some(f=>f.path.toLowerCase()==='data/h3sprite.lod'))throw Error('Données Heroes III manquantes');
 for(const file of fs.readdirSync(destination+'/chunks'))if(file.endsWith('.bin')&&!used.has(file.slice(0,-4)))fs.unlinkSync(destination+'/chunks/'+file);
 const manifest={version:1,chunkSize,files};fs.writeFileSync(destination+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');return manifest;
}
export function readBaseGame(directory){
 const manifest=JSON.parse(fs.readFileSync(directory+'/manifest.json','utf8'));
 for(const file of manifest.files){if(!validPath(file.path)||!Number.isSafeInteger(file.size)||file.size<0)throw Error('Chemin ou taille incorrect dans les données intégrées');let offset=0;for(const chunk of file.chunks){if(!/^[a-f0-9]{64}$/.test(chunk.hash)||chunk.offset!==offset||chunk.size<=0||chunk.size>CHUNK_SIZE)throw Error('Morceau incorrect');offset+=chunk.size;}if(offset!==file.size)throw Error('Données intégrées incomplètes');}
 return manifest;
}
export function visitBaseGame(directory,consume){
 const manifest=readBaseGame(directory);
 for(const file of manifest.files){const digest=crypto.createHash('sha256');for(const chunk of file.chunks){const bytes=fs.readFileSync(directory+'/chunks/'+chunk.hash+'.bin');if(bytes.length!==chunk.size||hash(bytes)!==chunk.hash)throw Error('Morceau altéré : '+file.path);digest.update(bytes);consume(file,chunk,bytes);}if(digest.digest('hex')!==file.hash)throw Error('Fichier altéré : '+file.path);}
 return manifest;
}
export function unpackBaseGame(directory,destination){
 const manifest=readBaseGame(directory);
 for(const file of manifest.files){const target=path.join(destination,file.path);if(fs.existsSync(target)&&describeFile(target).hash===file.hash)continue;fs.mkdirSync(path.dirname(target),{recursive:true});const fd=fs.openSync(target,'w'),digest=crypto.createHash('sha256');try{for(const chunk of file.chunks){const bytes=fs.readFileSync(directory+'/chunks/'+chunk.hash+'.bin');if(bytes.length!==chunk.size||hash(bytes)!==chunk.hash)throw Error('Morceau altéré : '+file.path);digest.update(bytes);fs.writeSync(fd,bytes,0,bytes.length,chunk.offset);}}finally{fs.closeSync(fd);}if(digest.digest('hex')!==file.hash)throw Error('Fichier altéré : '+file.path);}
}
