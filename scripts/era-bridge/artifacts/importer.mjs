import {compileArtifactDefinition,SPECIALS,COMBINATIONS} from './artifacts.mjs';
import zlib from 'node:zlib';
const slots=['SPELLBOOK','MACH4','MACH3','MACH2','MACH1','MISC5','MISC4','MISC3','MISC2','MISC1','FEET','LEFT_RING','RIGHT_RING','TORSO','LEFT_HAND','RIGHT_HAND','NECK','SHOULDERS','HEAD'];
const classes={S:'SPECIAL',T:'TREASURE',N:'MINOR',J:'MAJOR',R:'RELIC'};
/** Recognize structural descriptor lines rather than unreliable quoted CSV descriptions.
 * Empty cost is meaningful for original combination artifacts and must retain its row/ID.
 */
export function readArtifactTraits(text,{source='artraits.txt',validateSentinels=true}={}) {
 const rows=[];let current=null;
 const finish=()=>{if(!current)return;let description=current.rawDescription.replace(/\n+$/,'');current.quotedDescription=description.startsWith('"')&&description.endsWith('"');if(current.quotedDescription)description=description.slice(1,-1).replace(/""/g,'"');current.description=description;delete current.rawDescription;};
 for(const [lineIndex,line] of text.split(/\r?\n/).entries()) {
  const c=line.split('\t');
  const descriptor=c.length>=23&&c[0]&&/^\d*$/.test(c[1].trim())&&/^[STNJRWB]$/.test(c[21].trim())&&c.slice(2,21).every(v=>/^(x)?$/i.test(v.trim()));
  if(!descriptor){if(current)current.rawDescription+='\n'+line;continue;}
  finish();
  const cost=Number(c[1]);if(!Number.isSafeInteger(cost)||cost<0)throw new Error(`${source}:${lineIndex+1}: invalid artifact cost`);
  current={id:rows.length,name:c[0],value:cost,class:classes[c[21].trim()]??null,rawClass:c[21].trim(),slot:c.slice(2,21).flatMap((v,i)=>v.trim().toLowerCase()==='x'?[slots[i]]:[]),source:`${source}:${lineIndex+1}`,rawDescription:c.slice(22).join('\t')};rows.push(current);
 }
 finish();
 if(!rows.length)throw new Error('No artifact descriptor rows');
 if(validateSentinels&&(rows[0]?.name!=='Spell Book'||rows[171]?.name!=='Hammer of Doom'||rows[279]?.name!=='Necronomicon'))throw new Error('Artifact ID sequence failed original TUM sentinels; refusing shifted import');
 return rows;
}
/** Only removes demonstrated legacy table delimiters, never arbitrary narrative quotes. */
export function normalizeArtifactLanguage(trait,language) {
 const text={name:language?.name??trait?.name,description:language?.description??trait?.description,event:language?.event??''},repairs=[];
 // Several original translation events include a closing TSV quote and a literal \t suffix.
 if(/"(?:\\t|\t)+$/.test(text.event)) {
  text.event=text.event.replace(/(?:\\t|\t)+$/,'');
  if(text.event.startsWith('"')&&text.event.endsWith('"'))text.event=text.event.slice(1,-1).replace(/""/g,'"');
  else text.event=text.event.slice(0,-1);
  repairs.push('Removed original event TSV closing quote/tab delimiter');
 }
 // A closing description quote is removed only if artraits independently proves
 // that the remaining text equals its fully unwrapped quoted field.
 if(trait?.quotedDescription&&(text.description===trait.description+'"'||text.description==='"'+trait.description+'"')) {
  text.description=trait.description;repairs.push('Removed translation description quote proven by original artraits wrapper');
 }
 return {text,repairs};
}

export function parseJsonc(text) {
 let out='',string=false,escaped=false;
 for(let i=0;i<text.length;i++) {
  const c=text[i];if(string){out+=c;if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')string=false;continue;}
  if(c==='"'){string=true;out+=c;continue;}
  if(c==='/'&&text[i+1]==='/'){while(i<text.length&&text[i]!=='\n')i++;out+='\n';continue;}
  if(c==='/'&&text[i+1]==='*'){i+=2;while(i<text.length&&!(text[i]==='*'&&text[i+1]==='/'))i++;if(i>=text.length)throw new Error('Unclosed JSON comment');i++;out+=' ';continue;}
  if(c===','){let next=i+1;while(/\s/.test(text[next]??'')&&next<text.length)next++;if(text[next]==='}'||text[next]===']')continue;}
  out+=c;
 }
 return JSON.parse(out);
}
export function identifiersByIndex(configs){const ids=new Map();for(const config of configs)for(const [key,v] of Object.entries(config))if(Number.isSafeInteger(v.index)){if(ids.has(v.index))throw new Error(`Duplicate entity index ${v.index}`);ids.set(v.index,key);}return ids;}
/** Bounded original DEF decoder. Interface icons with reserved shadow/player
 * palette colors use VCMI's documented shadow/selection RGBA interpretation.
 */
export function decodeArtifactIcon(bytes,index) {
 const u32=p=>{if(p<0||p+4>bytes.length)throw new Error('Truncated DEF');return bytes.readUInt32LE(p);};
 const u16=p=>{if(p<0||p+2>bytes.length)throw new Error('Truncated DEF');return bytes.readUInt16LE(p);};
 const byte=p=>{if(p<0||p>=bytes.length)throw new Error('Truncated DEF');return bytes[p];};
 const countGroups=u32(12);if(countGroups>256)throw new Error('Invalid DEF group count');
 let p=784;const frames=[];
 for(let g=0;g<countGroups;g++){const count=u32(p+4);if(count>100000)throw new Error('Invalid DEF frame count');p+=16;const names=p;p+=13*count;for(let i=0;i<count;i++)frames.push({offset:u32(p+i*4),name:bytes.subarray(names+i*13,names+i*13+13).toString('latin1').split('\0')[0]});p+=count*4;}
 if(!frames[index])throw new Error(`Missing artifact DEF frame ${index}`);
 const f=frames[index].offset,format=u32(f+4),fullWidth=u32(f+8),fullHeight=u32(f+12),width=u32(f+16),height=u32(f+20),left=bytes.readInt32LE(f+24),top=bytes.readInt32LE(f+28),base=f+32;
 if(fullWidth!==44||fullHeight!==44||width>44||height>44||left<0||top<0||left+width>44||top+height>44||format>3)throw new Error('Unexpected artifact icon DEF layout');
 const indices=Buffer.alloc(fullWidth*fullHeight);let cursor=base;
 for(let y=0;y<height;y++) {
  if(format===1)cursor=base+u32(base+y*4);
  if(format===2&&y===0)cursor=base+u16(base);
  let x=0;
  while(x<width) {
   if(format===3&&x%32===0)cursor=base+u16(base+2*(y*Math.ceil(width/32)+Math.floor(x/32)));
   if(format===0){indices[(y+top)*fullWidth+x+left]=byte(cursor++);x++;continue;}
   const token=byte(cursor++),code=format===1?token:token>>5,length=format===1?byte(cursor++)+1:(token&31)+1;
   if(x+length>width||(format===3&&Math.floor(x/32)!==Math.floor((x+length-1)/32)))throw new Error('DEF run exceeds icon row/chunk');
   for(let n=0;n<length;n++)indices[(y+top)*fullWidth+(x++)+left]=code===(format===1?255:7)?byte(cursor++):code;
  }
 }
 const specialSource=[[0,255,255],[255,150,255],[255,100,255],[255,50,255],[255,0,255],[255,255,0],[180,0,255],[0,255,0]];
 const specialAlpha=[0,64,64,128,128,0,128,64];
 const rgba=Buffer.alloc(fullWidth*fullHeight*4);
 for(let i=0;i<indices.length;i++){const c=indices[i];if(!c)continue;const rgb=[...bytes.subarray(16+c*3,19+c*3)];const special=c<8&&rgb.every((v,n)=>Math.abs(v-specialSource[c][n])<8);if(special)rgba[i*4+3]=specialAlpha[c];else {bytes.copy(rgba,i*4,16+c*3,19+c*3);rgba[i*4+3]=255;}}
 return {width:fullWidth,height:fullHeight,rgba,name:frames[index].name};
}
function crc32(bytes){let c=0xffffffff;for(const v of bytes){c^=v;for(let n=0;n<8;n++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function chunk(type,data){const name=Buffer.from(type),len=Buffer.alloc(4),crc=Buffer.alloc(4);len.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([name,data])));return Buffer.concat([len,name,data,crc]);}
export function encodePng({width,height,rgba}){if(rgba.length!==width*height*4)throw new Error('Invalid RGBA length');const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=6;const scan=Buffer.alloc((width*4+1)*height);for(let y=0;y<height;y++)rgba.copy(scan,y*(width*4+1)+1,y*width*4,(y+1)*width*4);return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(scan)),chunk('IEND',Buffer.alloc(0))]);}
export function scenarioIcon(icon){const width=58,height=64,rgba=Buffer.alloc(width*height*4),left=7,top=10;for(let y=0;y<44;y++)icon.rgba.copy(rgba,((y+top)*width+left)*4,y*44*4,(y+1)*44*4);return {width,height,rgba};}
/** Outputs only whole artifacts whose cfg and independent metadata audit close.
 * Asset loader is caller supplied; files Map holds exact source DEF/MSK and generated PNG.
 * Caller chooses deployment destination and supplies the real native entity resolvers.
 */
export function importNativeArtifacts({traits,language,cfgs,archive,resolveSpell,resolveCoreArtifact,dailyConversions,aiPolicy='require-era-equivalence',namespace='tum-era',prefix='tum-era/artifacts'}={}) {
 if(!Array.isArray(traits)||!language||typeof language!=='object'||!cfgs||typeof cfgs!=='object'||typeof archive?.extract!=='function')throw new TypeError('Complete source traits, language, cfgs and archive are required');
 const runtimePolicy={schemaVersion:1,creatures:{},artifacts:{}};
 if(dailyConversions&&(dailyConversions.bridgeVersion!==2||typeof dailyConversions.resolveCreature!=='function'))throw new TypeError('Daily conversion binding requires native bridge v2 and an explicit creature resolver');
 const runtimeOptions=dailyConversions?{resolveCreature:dailyConversions.resolveCreature,authorizeAdapters:['artifactDailyConversions']}:{};
 const definitions={},files=new Map(),report=[];const icons=archive.extract('artifact.def');
 if(!Buffer.isBuffer(icons))throw new TypeError('Source artifact.def is unavailable');
 const manualExclusions={157:'Native WoG retaliate-against-no-retaliation behavior not in cfg',267:'Language promises both-side level 1-2 cast block; cfg only grants owner spell immunities, cannot claim complete parity'};
 const eligible=new Set();
 const proposedArtifact=n=>n<171?resolveCoreArtifact?.(n):Object.hasOwn(cfgs,n)?`${namespace}:artifact${n}`:null;
 for(const [idString,text] of Object.entries(cfgs)) {
  const id=Number(idString),r=compileArtifactDefinition({id,text,...runtimeOptions,resolveSpell,resolveArtifact:proposedArtifact,aiPolicy,baseArtifact:{type:['HERO'],class:traits[id]?.class,value:traits[id]?.value,slot:traits[id]?.slot,text:normalizeArtifactLanguage(traits[id],language[id]).text},resolveAssets:()=>({image:'pending',map:'pending',scenarioBonus:'pending'}),duplicates:'emerald-first'});
  if(r.ok&&!manualExclusions[id]&&!(SPECIALS[id]?.length))eligible.add(id);
 }
 for(const [idString,text] of Object.entries(cfgs)) {
  const id=Number(idString);
  if(COMBINATIONS[id]?.some(n=>n>=171&&!eligible.has(n)))eligible.delete(id);
  const reason=manualExclusions[id]??(eligible.has(id)?null:'Unresolved runtime policy, original spell catalogue, combination, or base metadata');
  if(reason){report.push({id,included:false,reason});continue;}
  const key=`artifact${id}`,asset=`${prefix}/${id}`,resolveArtifact=n=>n<171?resolveCoreArtifact?.(n):eligible.has(n)?`${namespace}:artifact${n}`:null;
  try {
   const icon=decodeArtifactIcon(icons,id);if(!new RegExp(`^HrArt0*${id}\\.`, 'i').test(icon.name))throw new Error(`Source icon identity mismatch ${icon.name}`);
   const mapName=`ava${String(id).padStart(4,'0')}.def`,maskName=mapName.replace(/\.def$/,'.msk');
   // Extract before publishing anything: missing DEF/MSK causes artifact exclusion.
   const map=archive.extract(mapName),mask=archive.extract(maskName);
   const c=compileArtifactDefinition({id,text,...runtimeOptions,resolveSpell,resolveArtifact,aiPolicy,baseArtifact:{type:['HERO'],class:traits[id].class,value:traits[id].value,slot:traits[id].slot,text:normalizeArtifactLanguage(traits[id],language[id]).text},resolveAssets:()=>({image:`${asset}/icon.png`,map:`${asset}/map.def`,scenarioBonus:`${asset}/scenario.png`}),duplicates:'emerald-first'});
   if(!c.ok)throw new Error(JSON.stringify(c.diagnostics));
   definitions[key]=c.definition;
   const conversion=c.adapters.find(a=>a.kind==='artifactDailyConversions');
   if(conversion)runtimePolicy.artifacts[`${namespace}:${key}`]={dailyConversions:conversion.upgrades.map(({from,to})=>({from,to}))};
   files.set(`Content/Sprites/${asset}/map.def`,map);files.set(`Content/Sprites/${asset}/map.msk`,mask);
   files.set(`Content/Data/${asset}/icon.png`,encodePng(icon));files.set(`Content/Data/${asset}/scenario.png`,encodePng(scenarioIcon(icon)));
   report.push({id,included:true,key:`${namespace}:${key}`,sourceTraits:traits[id].source,aiDecisions:c.aiDecisions,warnings:c.diagnostics,textRepairs:normalizeArtifactLanguage(traits[id],language[id]).repairs,eventTextAvailable:typeof language[id]?.event==='string'});
  }catch(e){report.push({id,included:false,reason:e.message});}
 }
 return {definitions,files,report,runtimePolicy};
}
