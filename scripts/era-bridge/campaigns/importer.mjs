/** Read-only import of the pinned WoG campaign assets. No map or script executes. */
import fs from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import {parseJsonc} from '../artifacts/importer.mjs';
import {compileErm} from './parser.mjs';
export const sha256=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
export const pinnedCampaignFiles={
 'zc1.vcmp':'b27d91661d2e47de76c9b013a08e091bc01a6244d7a38d566aec5b7f8d8d014d',
 'zc2.vcmp':'5404bb0faf8bea89ec708263a2e3cc37b41e4f0ddc20af6e474f0a911b76f16f',
 'zc3.vcmp':'a0fe330f918ebe77b24c2016f8bfb1870f00e742f0ca51643a0e787b77937397',
 'zc4.vcmp':'1cd61109d49381a61019cb8770b943fd23e1d5b25774ab19ee5739fc558128e8',
 'Cave of Gerfrex.h3m':'3d7dbf2835db47991ee9dad4f7cdef3dde93f98086670594bf21668d2c033c50',
};
export function readZip(bytes){
 bytes=Buffer.from(bytes);
 let end=-1;
 for(let at=bytes.length-22;at>=Math.max(0,bytes.length-65557);at--)
  if(bytes.readUInt32LE(at)===0x06054b50&&at+22+bytes.readUInt16LE(at+20)===bytes.length){end=at;break;}
 if(end<0||bytes.readUInt16LE(end+4)||bytes.readUInt16LE(end+6))throw Error('Unsupported campaign ZIP directory');
 const count=bytes.readUInt16LE(end+10),size=bytes.readUInt32LE(end+12),directory=bytes.readUInt32LE(end+16);
 if(count!==bytes.readUInt16LE(end+8)||count===65535||directory+size!==end)throw Error('Invalid campaign ZIP directory range');
 const out=Object.create(null);let at=directory,total=0;
 const crc32=data=>{let crc=0xffffffff;for(const byte of data){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;};
 for(let index=0;index<count;index++){
  if(at+46>end||bytes.readUInt32LE(at)!==0x02014b50)throw Error('Invalid campaign ZIP entry');
  const flags=bytes.readUInt16LE(at+8),method=bytes.readUInt16LE(at+10),crc=bytes.readUInt32LE(at+16),packed=bytes.readUInt32LE(at+20),length=bytes.readUInt32LE(at+24);
  const nameLength=bytes.readUInt16LE(at+28),extra=bytes.readUInt16LE(at+30),comment=bytes.readUInt16LE(at+32),local=bytes.readUInt32LE(at+42);
  const next=at+46+nameLength+extra+comment;
  if(next>end||(flags&1)||bytes.readUInt16LE(at+34)||length>16*1024*1024||(total+=length)>64*1024*1024)throw Error('Unsupported or excessive campaign ZIP member');
  const name=bytes.subarray(at+46,at+46+nameLength).toString('utf8');
  if(Object.hasOwn(out,name))throw Error('Duplicate campaign ZIP member');
  if(local+30>directory||bytes.readUInt32LE(local)!==0x04034b50||bytes.readUInt16LE(local+8)!==method)throw Error('Invalid campaign ZIP local entry');
  const dataStart=local+30+bytes.readUInt16LE(local+26)+bytes.readUInt16LE(local+28);
  if(dataStart+packed>directory)throw Error('Invalid campaign ZIP data range');
  const payload=bytes.subarray(dataStart,dataStart+packed);
  const data=method===0?Buffer.from(payload):method===8?zlib.inflateRawSync(payload,{maxOutputLength:16*1024*1024}):null;
  if(!data||data.length!==length||crc32(data)!==crc)throw Error('Invalid campaign ZIP compression or checksum');
  if(!name.endsWith('/'))out[name]=data;
  at=next;
 }
 if(at!==end)throw Error('Unexpected campaign ZIP directory data');
 return out;
}
export function extractCaveScripts(bytes){
 if(sha256(bytes)!==pinnedCampaignFiles['Cave of Gerfrex.h3m'])throw Error('Changed original Cave of Gerfrex');
 const raw=zlib.gunzipSync(bytes,{maxOutputLength:16*1024*1024});if(raw.readUInt32LE(0)!==0x33)throw Error('Expected original WoG H3M version');
 const sources=[];let position=0;
 while((position=raw.indexOf(Buffer.from('ZVSE'),position))>=0){
  if(position<4)throw Error('Missing ERM source length');const length=raw.readUInt32LE(position-4);if(length<4||position+length>raw.length)throw Error('Invalid embedded ERM length');
  const source=raw.subarray(position,position+length),eventTail=position+length;
  if(eventTail+51>raw.length)throw Error('Truncated original global event metadata');
  const firstOccurrence=raw.readUInt16LE(eventTail+31);sources.push({id:'cave:'+position,offset:position,length,firstOccurrence,sha256:sha256(source),encoding:'windows-1252',bytes:Buffer.from(source)});position+=length;
 }
 if(sources.length!==22)throw Error('Changed original Cave script count');return sources.sort((a,b)=>a.firstOccurrence-b.firstOccurrence||a.offset-b.offset);
}
export function mergePrograms(sources,{source,mapSha256}={}){
 const programs=sources.map(entry=>compileErm(entry.bytes,{source:entry.id,encoding:entry.encoding||'utf-8'}));
 let previousBlocks=0;const initializers=[];for(const p of programs){for(const c of p.initializers)initializers.push({...c,visibleBlocks:previousBlocks+c.visibleBlocks});previousBlocks+=p.blocks.length;}
 const result={schemaVersion:1,contract:'source-campaign-erm-ast-v1',source,mapSha256,sources:sources.map(({id,sha256,offset,length,firstOccurrence,eventIndex})=>({id,sha256,...(offset===undefined?{}:{offset,length}),...(firstOccurrence===undefined?{}:{firstOccurrence}),...(eventIndex===undefined?{}:{eventIndex})})),initializers,blocks:programs.flatMap(p=>p.blocks)};
 result.sha256=sha256(Buffer.from(JSON.stringify(result)));return result;
}
export function compileCaveFile(file='mod/wake-of-gods/Mods/maps/content/maps/Cave of Gerfrex.h3m'){
 const bytes=fs.readFileSync(file);return mergePrograms(extractCaveScripts(bytes),{source:'Cave of Gerfrex',mapSha256:sha256(bytes)});
}
export function readOriginalCampaign(file){
 const name=file.split('/').at(-1),bytes=fs.readFileSync(file);if(!pinnedCampaignFiles[name]||sha256(bytes)!==pinnedCampaignFiles[name])throw Error('Changed/unbound original campaign '+name);
 const members=readZip(bytes),header=parseJsonc(members['header.json'].toString('utf8'));
 const maps=header.scenarios.map((scenario,index)=>{
  const mapBytes=members[scenario.map];if(!mapBytes)throw Error('Campaign scenario member missing '+scenario.map);const map=readZip(mapBytes),english=parseJsonc(map['english.json'].toString('utf8'));
  const mapHeader=parseJsonc(map['header.json'].toString('utf8'));
  const sources=(mapHeader.events||[]).flatMap((event,eventIndex)=>{const keys=event.message?.stringsTextID||[],values=keys.map(key=>[key,english[key]]).filter(([,text])=>typeof text==='string'&&text.startsWith('ZVSE'));return values.map(([key,text])=>{const bytes=Buffer.from(text);return{id:name+'!'+scenario.map+'!'+key,firstOccurrence:event.firstOccurrence,eventIndex,sha256:sha256(bytes),bytes};});}).sort((a,b)=>a.firstOccurrence-b.firstOccurrence||a.eventIndex-b.eventIndex);
  return{index,member:scenario.map,mapSha256:sha256(mapBytes),header:parseJsonc(map['header.json'].toString('utf8')),sources,map};
 });
 return{name,sha256:sha256(bytes),header,maps};
}
