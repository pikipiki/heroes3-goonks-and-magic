import fs from 'node:fs';import zlib from 'node:zlib';import crypto from 'node:crypto';
export class BridgeError extends Error{constructor(code,message,location){super((location?location+': ':'')+message);this.name='BridgeError';this.code=code;this.location=location;}}
const fail=(code,msg,loc)=>{throw new BridgeError(code,msg,loc);};
export function readEraArchive(bytes,{source='<PAC>',maxEntryBytes=64*1048576}={}){
 if(!Buffer.isBuffer(bytes)||bytes.length<92||bytes.subarray(0,4).toString()!=='LOD\0')fail('INVALID_ARCHIVE','Expected a Heroes III LOD/PAC archive',source);
 const count=bytes.readUInt32LE(8),end=92+count*32;if(end>bytes.length)fail('INVALID_DIRECTORY','Archive directory exceeds its size',source);
 const entries=new Map();for(let i=0;i<count;i++){const p=92+i*32,name=bytes.subarray(p,p+16).toString('latin1').split('\0')[0],key=name.toLowerCase(),offset=bytes.readUInt32LE(p+16),size=bytes.readUInt32LE(p+20),compressed=bytes.readUInt32LE(p+28);
 if(!name||/[\\/]/.test(name)||entries.has(key))fail('INVALID_ENTRY','Empty, duplicate or unsafe entry '+name,source);
 if(offset<end||offset+(compressed||size)>bytes.length||size>maxEntryBytes)fail('INVALID_BOUNDS','Invalid bounds for '+name,source);
 entries.set(key,{name,offset,size,compressed});}
 return Object.freeze({source,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),names:Object.freeze([...entries.values()].map(e=>e.name)),extract(name){const e=entries.get(name.toLowerCase());if(!e)fail('MISSING_RESOURCE','No resource '+name,source);let out=bytes.subarray(e.offset,e.offset+(e.compressed||e.size));try{out=e.compressed?zlib.inflateSync(out,{maxOutputLength:maxEntryBytes}):Buffer.from(out);}catch{fail('INVALID_COMPRESSION','Invalid compressed resource '+name,source);}if(out.length!==e.size)fail('INVALID_LENGTH','Resource length differs from directory: '+name,source);return out;}});
}
export function readCreatureTable(text,{source='Crtraits.txt'}={}){
 // Some ERA CRTRAITS descriptions have unmatched quotes and embedded newlines.
 // Identity comes from the sequence of rows with 21 numeric statistic columns.
 const rows=[];for(const [index,line] of text.split(/\r?\n/).entries()){const c=line.split('\t');if(c.length<23||!c.slice(2,23).every(x=>/^-?\d+$/.test(x.trim())))continue;const n=c.slice(2,23).map(Number);if(n.some(v=>!Number.isSafeInteger(v)))fail('INVALID_STAT','Integer exceeds exact range',source+':'+(index+1));
 const [wood,mercury,ore,sulfur,crystal,gems,gold,fightValue,aiValue,growth,,hitPoints,speed,attack,defense,min,max,shots,spells,low,high]=n;
 const invalidRange=[wood,mercury,ore,sulfur,crystal,gems,gold,growth,hitPoints,speed,attack,defense,min,max,shots,spells,low,high].some(v=>v<0)||min>max||low>high;
 rows.push(Object.freeze({eraId:rows.length,invalidRange,name:Object.freeze({singular:c[0],plural:c[1]}),cost:Object.freeze({wood,mercury,ore,sulfur,crystal,gems,gold}),fightValue,aiValue,growth,hitPoints,speed,attack,defense,damage:Object.freeze({min,max}),shots,spells,advMapAmount:Object.freeze({min:low,max:high}),source:source+':'+(index+1)}));}
 if(!rows.length)fail('EMPTY_CREATURE_TABLE','No creature statistic rows',source);return Object.freeze(rows);
}
export function creatureStats(row){if(!row||!Number.isInteger(row.eraId))fail('UNRESOLVED_CREATURE','Missing ERA creature row');if(row.invalidRange)fail('INVALID_STAT','Invalid creature statistic range',row.source);const result={};for(const k of ['name','cost','fightValue','aiValue','growth','hitPoints','speed','attack','defense','damage','advMapAmount'])result[k]=structuredClone(row[k]);return result;}
export function sourceFingerprint(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
