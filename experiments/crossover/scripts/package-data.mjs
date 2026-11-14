// Publish only the three explicitly selected MPQs, never installers or local saves.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validateArchive} from '../public/local-assets.js';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const input=process.env.STARCRAFT_DATA_DIR;
if(!input)throw Error('Set STARCRAFT_DATA_DIR to the scanned replacement MPQ directory');
const provenance=JSON.parse(fs.readFileSync(path.join(input,'provenance.json'),'utf8'));
const output=path.join(root,'game-data/starcraft');
const names=['stardat.mpq','broodat.mpq','patch_rt.mpq'];
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const archives=names.map(name=>{
  const bytes=fs.readFileSync(path.join(input,name));validateArchive(bytes);
  const source=provenance.archives.find(row=>row.name===name);
  if(!source||source.sha256!==hash(bytes)||!(source.source.startsWith('https://archive.org/')||source.source==='http://download.blizzard.com/pub/starcraft/StarEdit/StarEdit.zip'))throw Error('Missing verified provenance for '+name);
  const chunks=[];
  for(let start=0;start<bytes.length;start+=4*1024*1024){
    const part=bytes.subarray(start,start+4*1024*1024),sha256=hash(part);
    chunks.push({url:'chunks/'+sha256+'.bin',size:part.length,sha256,bytes:part});
  }
  return {name,size:bytes.length,sha256:hash(bytes),source:source.source,chunks};
});
fs.rmSync(output,{recursive:true,force:true});fs.mkdirSync(output+'/chunks',{recursive:true});
for(const archive of archives)for(const chunk of archive.chunks){fs.writeFileSync(path.join(output,chunk.url),chunk.bytes);delete chunk.bytes;}
fs.writeFileSync(output+'/manifest.json',JSON.stringify({version:1,archives},null,2)+'\n');
fs.writeFileSync(output+'/AUDIT.json',JSON.stringify(provenance,null,2)+'\n');
console.log('Packaged three verified archives in 4 MiB chunks.');
