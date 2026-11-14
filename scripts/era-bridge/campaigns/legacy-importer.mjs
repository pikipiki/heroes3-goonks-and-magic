/** Strict, read-only importer for the four original WoG3.58f H3C archives.
 * Layout follows VCMI CampaignHandler/CampaignBonus readers for SoD version6.
 * Empty physical regions are retained before mapping active scenario indices. */
import fs from 'node:fs';import path from 'node:path';import zlib from 'node:zlib';
import {sha256} from './importer.mjs';
export const pinnedLegacyCampaigns={
 'zc1.h3c':'abae96c7a8fad03428c48b60806b999efe92bad15eea872f0e51d898e40fe385',
 'zc2.h3c':'20c53b1807dd8269f767532a2639d763d063639856457abd4a9ab8357c2c5d19',
 'zc3.h3c':'b546ef6c7ae427eec6af4b38b98912d03996558539a47ba88cdc2ae6b150b810',
 'zc4.h3c':'146573e66ab45c421fac8f673812990d6528c3865b0734c0486b9464b719189e',
};
const require=(condition,message)=>{if(!condition)throw Error(message);};
const crc32=bytes=>{let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;};
export function readGzipMembers(input){
 const bytes=Buffer.from(input),members=[];let at=0,total=0;
 require(bytes.length<=16*1024*1024,'Excessive H3C archive');
 while(at<bytes.length){
  const start=at;require(at+10<=bytes.length&&bytes[at]===31&&bytes[at+1]===139&&bytes[at+2]===8,'Invalid H3C gzip header');
  const flags=bytes[at+3];require((flags&224)===0,'Reserved gzip flags');at+=10;
  if(flags&4){require(at+2<=bytes.length,'Truncated gzip extra');const n=bytes.readUInt16LE(at);at+=2;require(at+n<=bytes.length,'Truncated gzip extra');at+=n;}
  for(const flag of [8,16])if(flags&flag){let n=0;while(at<bytes.length&&bytes[at]!==0){at++;require(++n<=4096,'Excessive gzip string');}require(at<bytes.length,'Truncated gzip string');at++;}
  if(flags&2){require(at+2<=bytes.length&&bytes.readUInt16LE(at)===(crc32(bytes.subarray(start,at))&65535),'Invalid gzip header checksum');at+=2;}
  const result=zlib.inflateRawSync(bytes.subarray(at),{info:true,maxOutputLength:16*1024*1024});
  at+=result.engine.bytesWritten;const raw=result.buffer;
  require(at+8<=bytes.length,'Truncated gzip trailer');require(bytes.readUInt32LE(at)===crc32(raw)&&bytes.readUInt32LE(at+4)===raw.length,'Invalid gzip member checksum');at+=8;
  require((total+=raw.length)<=64*1024*1024&&members.length<33,'Excessive H3C members');
  members.push({bytes:raw,sha256:sha256(raw),packedOffset:start,packedSize:at-start});
 }
 require(members.length>=2,'H3C needs a header and maps');return members;
}
class Reader{
 constructor(bytes){this.bytes=bytes;this.at=0;}
 take(n){require(Number.isInteger(n)&&n>=0&&this.at+n<=this.bytes.length,'Truncated H3C field');const b=this.bytes.subarray(this.at,this.at+n);this.at+=n;return b;}
 u8(){return this.take(1)[0];}u16(){return this.take(2).readUInt16LE();}i16(){return this.take(2).readInt16LE();}u32(){return this.take(4).readUInt32LE();}
 boolean(){const n=this.u8();require(n<=1,'Invalid H3C boolean');return n===1;}
 string(){const n=this.u32();require(n<=1024*1024,'Excessive H3C text');return new TextDecoder('windows-1252').decode(this.take(n));}
}
function parseHeader(bytes,maskBytes){
 const r=new Reader(bytes);require(r.u32()===6,'Expected SoD/WoG campaign version6');
 const region=r.u8(),name=r.string(),description=r.string(),chooseDifficulty=r.boolean(),music=r.u8(),scenarios=[];
 const scene=()=>r.boolean()?{video:r.u8(),music:r.u8(),text:r.string()}:null;
 while(r.at<bytes.length){
  require(scenarios.length<32,'Excessive physical H3C regions');const physicalIndex=scenarios.length,map=r.string(),packedMapSize=r.u32(),mask=maskBytes===1?r.u8():r.u16(),color=r.u8(),difficulty=r.u8();
  require(!map||/^[\x20-\x7e]+\.h3m$/i.test(map),'Invalid H3C map member');require(difficulty<=4&&color<=7&&packedMapSize<=16*1024*1024,'Invalid H3C region fields');
  const text=r.string(),prolog=scene(),epilog=scene(),keeps=r.u8();require(keeps<32,'Invalid hero keep mask');
  const creatures=r.take(19).toString('hex'),artifacts=r.take(18).toString('hex'),mode=r.u8();require(mode<=3,'Invalid H3C starting mode');
  const player=mode===1?r.u8():null,bonuses=[];if(mode===1)require(player<8,'Invalid bonus player');
  if(mode){const count=r.u8();require(count<=16,'Excessive H3C bonuses');for(let i=0;i<count;i++){
   if(mode===1){const type=r.u8(),sizes=[3,6,1,4,3,6,4,5];require(type<sizes.length,'Invalid H3C bonus');bonuses.push({type,bytes:r.take(sizes[type]).toString('hex')});}
   else if(mode===2)bonuses.push({player:r.u8(),scenario:r.u8()});
   else bonuses.push({player:r.u8(),hero:r.i16()});
  }}
  scenarios.push({physicalIndex,map,packedMapSize,requires:Array.from({length:maskBytes*8},(_,i)=>i).filter(i=>mask&(1<<i)),color,difficulty,text,prolog,epilog,keeps,creatures,artifacts,mode,player,bonuses});
 }
 return{version:6,region,name,description,chooseDifficulty,music,maskBytes,scenarios};
}
export function decodeLegacyCampaign(input){
 const members=readGzipMembers(input),candidates=[];
 for(const width of [1,2])try{const h=parseHeader(members[0].bytes,width);if(h.scenarios.filter(s=>s.map).length===members.length-1)candidates.push(h);}catch{}
 require(candidates.length===1,'Ambiguous or invalid H3C region table');const header=candidates[0],maps=[];
 for(const s of header.scenarios)if(s.map){const member=members[maps.length+1];require([14,21,28,51].includes(member.bytes.readUInt32LE()),'Invalid H3M version');maps.push({...s,bytes:member.bytes,sha256:member.sha256});}
 return{sha256:sha256(Buffer.from(input)),headerSha256:members[0].sha256,header,maps};
}
export function extractLegacySources(mapBytes){
 const bytes=Buffer.from(mapBytes),out=[];let at=0;
 while((at=bytes.indexOf('ZVSE',at))>=0){
  require(at>=4,'Missing legacy ERM length');const length=bytes.readUInt32LE(at-4);
  require(length>=4&&at+length+51<=bytes.length,'Truncated legacy ERM source');
  const raw=bytes.subarray(at,at+length),text=new TextDecoder('windows-1252').decode(raw);
  out.push({offset:at,length,sha256:sha256(raw),text,firstOccurrence:bytes.readUInt16LE(at+length+31)});at+=length;
 }
 return out;
}
export function readLegacyCampaign(file){
 const bytes=fs.readFileSync(file);require(pinnedLegacyCampaigns[path.basename(file).toLowerCase()]===sha256(bytes),'Changed original H3C archive');return decodeLegacyCampaign(bytes);
}
export function mapLegacyPrerequisites(legacy,convertedHeader){
 const scenarios=convertedHeader.scenarios;require(Array.isArray(scenarios)&&scenarios.length===legacy.maps.length,'Changed converted scenario count');
 const indices=new Map(),used=new Set();for(const s of legacy.maps){const name=s.map.replace(/\.h3m$/i,'.vmap').toLowerCase(),index=scenarios.findIndex(c=>c.map?.toLowerCase()===name);require(index>=0&&!indices.has(s.physicalIndex)&&!used.has(index),'Missing or repeated converted scenario');indices.set(s.physicalIndex,index);used.add(index);}
 return legacy.maps.map(s=>({physicalIndex:s.physicalIndex,index:indices.get(s.physicalIndex),map:scenarios[indices.get(s.physicalIndex)].map,requires:s.requires.map(id=>{require(indices.has(id),'Dependency on an empty or missing original region');return indices.get(id);}),originalRequires:s.requires})).sort((a,b)=>a.index-b.index);
}
