import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export const CHUNK_SIZE=4*1024*1024;
const cache=new Map();
export function describeFile(file){
 const stat=fs.statSync(file),key=file+':'+stat.size+':'+stat.mtimeMs;
 if(cache.has(key))return cache.get(key);
 const fd=fs.openSync(file,'r'),hash=crypto.createHash('sha256'),chunks=[];
 try{for(let offset=0;offset<stat.size;offset+=CHUNK_SIZE){const buffer=Buffer.alloc(Math.min(CHUNK_SIZE,stat.size-offset));fs.readSync(fd,buffer,0,buffer.length,offset);hash.update(buffer);chunks.push({offset,size:buffer.length,hash:crypto.createHash('sha256').update(buffer).digest('hex')});}}finally{fs.closeSync(fd);}
 const result={size:stat.size,hash:hash.digest('hex'),chunks};cache.set(key,result);return result;
}
export function makeManifest(data,{includeBase=true}={}){
 const files=[];
 const walk=dir=>{if(!fs.existsSync(path.join(data,dir)))return;for(const entry of fs.readdirSync(path.join(data,dir),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){if(entry.name.startsWith('.'))continue;const relative=dir+'/'+entry.name;if(entry.isDirectory())walk(relative);else if(entry.isFile()){const meta=describeFile(path.join(data,relative));files.push({path:relative,...meta,url:'/assets/data/'+meta.hash+'/'+relative.split('/').map(encodeURIComponent).join('/')});}}};
 for(const dir of includeBase?['Data','Maps','Mp3','Mods']:['Maps','Mods'])walk(dir);
 return {version:1,requiresImport:false,files};
}
