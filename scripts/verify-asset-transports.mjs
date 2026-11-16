import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {CHUNK_SIZE} from './assets.mjs';

// Verify every native file after packing/aliasing, using at most one 4 MiB
// scratch buffer and sixteen open descriptors. No browser work is added.
export function verifyAssetTransports(root,files){
 root=path.resolve(root);const descriptors=new Map(),sources=new Map(),directVerified=new Map(),buffer=Buffer.allocUnsafe(CHUNK_SIZE);let logicalBytes=0;
 const open=file=>{let fd=descriptors.get(file);if(fd!==undefined){descriptors.delete(file);descriptors.set(file,fd);return fd;}if(descriptors.size>=16){const [old,handle]=descriptors.entries().next().value;fs.closeSync(handle);descriptors.delete(old);}fd=fs.openSync(file,'r');descriptors.set(file,fd);return fd;};
 try{
  for(const file of files){
   const full=crypto.createHash('sha256');let position=0;
   for(const chunk of file.chunks){
    assert.equal(chunk.offset,position,'Non-contiguous native file: '+file.path);assert(Number.isSafeInteger(chunk.size)&&chunk.size>0&&chunk.size<=CHUNK_SIZE,'Invalid chunk: '+file.path);
    const url=chunk.url||file.url,target=path.resolve(root,decodeURIComponent(url));assert(target.startsWith(root+path.sep),'Asset escapes site root');
    const start=chunk.packOffset??(chunk.url?0:chunk.offset),expected=chunk.packSize||(chunk.url?chunk.size:file.size),fd=open(target);
    assert(Number.isSafeInteger(start)&&start>=0&&start+chunk.size<=expected,'Invalid transport offset: '+file.path);assert.equal(fs.fstatSync(fd).size,expected,'Transport size mismatch: '+url);sources.set(url,expected);
    let read=0;while(read<chunk.size){const count=fs.readSync(fd,buffer,read,chunk.size-read,start+read);assert(count>0,'Truncated asset: '+url);read+=count;}
    const part=buffer.subarray(0,read);assert.equal(crypto.createHash('sha256').update(part).digest('hex'),chunk.hash,'Native chunk changed: '+file.path);full.update(part);position+=read;
   }
   assert.equal(position,file.size,'Native file length changed: '+file.path);assert.equal(full.digest('hex'),file.hash,'Native file changed: '+file.path);logicalBytes+=position;
   const directKey=file.hash+':'+file.size;if(file.url&&directVerified.has(file.url))assert.equal(directVerified.get(file.url),directKey,'Conflicting direct asset alias: '+file.path);
   if(file.url&&file.chunks.length&&file.chunks.every(chunk=>!chunk.url))directVerified.set(file.url,directKey);
   // Browser portraits/cards use direct URLs even when native installation
   // reads a pack. Verify that alias independently as well.
   if(file.url&&!directVerified.has(file.url)){
    const target=path.resolve(root,decodeURIComponent(file.url));assert(target.startsWith(root+path.sep),'Direct asset escapes site root');const fd=open(target),hash=crypto.createHash('sha256');assert.equal(fs.fstatSync(fd).size,file.size,'Direct asset size mismatch: '+file.path);
    let at=0;while(at<file.size){const count=fs.readSync(fd,buffer,0,Math.min(buffer.length,file.size-at),at);assert(count>0,'Truncated direct asset');hash.update(buffer.subarray(0,count));at+=count;}
    assert.equal(hash.digest('hex'),file.hash,'Direct asset changed: '+file.path);directVerified.set(file.url,directKey);
   }
  }
 }finally{for(const fd of descriptors.values())fs.closeSync(fd);}
 return {files:files.length,logicalBytes,transportURLs:sources.size,transportBytes:[...sources.values()].reduce((sum,size)=>sum+size,0)};
}
