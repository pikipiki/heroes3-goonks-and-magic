import fs from 'node:fs';
import {normalizeTum} from './normalize-tum.mjs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(path.resolve('work/browser-tests/package.json'));
const sharp=require('sharp'),JSON5=require('json5');
const sources=path.resolve(process.argv[2]||'..');
const era=path.join(sources,'Third-Upgrade-Mod-Full'),vcmi=path.join(sources,'third-upgrades');
const readJSON=file=>JSON5.parse(fs.readFileSync(file,'utf8'));
const writeJSON=(file,data)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');};
const commit=dir=>execFileSync('git',['-C',dir,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const target='mod/third-upgrades';
if(fs.existsSync(target))throw Error('mod/third-upgrades existe déjà ; conserver ses corrections locales avant une réimportation.');
fs.cpSync(path.join(vcmi,'third-upgrades'),target,{recursive:true});
// The separate tow-tum mod repeats the nine vanilla town upgrades. Do not stack it.
const pac=fs.readFileSync(path.join(era,'Data/AmeCre.pac')),entries=new Map();
for(let i=0;i<pac.readUInt32LE(8);i++){const p=92+i*32;entries.set(pac.subarray(p,p+16).toString().split('\0')[0].toLowerCase(),{offset:pac.readUInt32LE(p+16),size:pac.readUInt32LE(p+20),compressed:pac.readUInt32LE(p+28)});}
function extract(name){const e=entries.get(name.toLowerCase());if(!e)throw Error('Missing ERA resource '+name);const raw=pac.subarray(e.offset,e.offset+(e.compressed||e.size));const bytes=e.compressed?zlib.inflateSync(raw):raw;if(bytes.length!==e.size)throw Error('Invalid PAC entry '+name);return bytes;}
const extra='mod/tum-era';const sprites=extra+'/content/Sprites/tum-era';fs.mkdirSync(sprites,{recursive:true});
for(const name of ['cr224.def','AVWCR224.DEF','AVWCR224.msk'])fs.writeFileSync(sprites+'/'+name,extract(name));
// Read original portrait frame 224; preserve the palette and transparent index.
async function portrait(name,index,out){const d=extract(name);let p=784,offsets=[];for(let g=0;g<d.readUInt32LE(12);g++){const count=d.readUInt32LE(p+4);p+=16+13*count;for(let i=0;i<count;i++)offsets.push(d.readUInt32LE(p+i*4));p+=count*4;}const f=offsets[index];if(f===undefined)throw Error('Missing portrait '+index);const format=d.readUInt32LE(f+4),fw=d.readUInt32LE(f+8),fh=d.readUInt32LE(f+12),w=d.readUInt32LE(f+16),h=d.readUInt32LE(f+20),left=d.readInt32LE(f+24),top=d.readInt32LE(f+28),rgba=Buffer.alloc(fw*fh*4);let cursor=f+32;for(let y=0;y<h;y++){let x=0;if(format===1)cursor=f+32+d.readUInt32LE(f+32+y*4);if(format===2&&y===0)cursor=f+32+d.readUInt16LE(f+32);if(format===3)cursor=f+32+d.readUInt16LE(f+32+y*2*Math.ceil(w/32));const emit=i=>{const xx=x+++left,yy=y+top;if(xx<0||xx>=fw||yy<0||yy>=fh)return;const q=(yy*fw+xx)*4;d.copy(rgba,q,16+i*3,19+i*3);rgba[q+3]=i===0?0:i<8?Math.round(i/8*255):255;};while(x<w){if(format===0){emit(d[cursor++]);continue;}if(format>3)throw Error('Unsupported DEF format');const c=d[cursor++],code=format===1?c:c>>5,len=format===1?d[cursor++]+1:(c&31)+1;for(let i=0;i<len;i++)emit(code===(format===1?255:7)?d[cursor++]:code);}}await sharp(rgba,{raw:{width:fw,height:fh,channels:4}}).png().toFile(sprites+'/'+out);}
await portrait('cprsmall.def',224,'portrait-small.png');await portrait('twcrport.def',224,'portrait-large.png');
// CRTRAITS contains quoted multiline descriptions, so locate the named row.
const row=extract('Crtraits.txt').toString('latin1').split(/\r?\n/).find(l=>l.startsWith('Red Bones Dragon\t')).split('\t');
const creature=structuredClone(readJSON('mod/wake-of-gods/Mods/level8units/content/config/creatures/bloodDragon.json').bloodDragon);
creature.name={singular:row[0],plural:row[1]};creature.level=7;
creature.cost=Object.fromEntries(['wood','mercury','ore','sulfur','crystal','gems','gold'].map((k,i)=>[k,Number(row[i+2])]));
for(const [k,i] of Object.entries({fightValue:9,aiValue:10,growth:11,hitPoints:13,speed:14,attack:15,defense:16}))creature[k]=Number(row[i]);
creature.damage={min:Number(row[17]),max:Number(row[18])};creature.advMapAmount={min:Number(row[21]),max:Number(row[22])};
creature.abilities.regeneration={type:'HP_REGENERATION',val:50};creature.abilities.noRetaliation={type:'BLOCKS_RETALIATION'};
creature.graphics={...creature.graphics,animation:'tum-era/cr224',map:'tum-era/AVWCR224',iconSmall:'tum-era/portrait-small',iconLarge:'tum-era/portrait-large'};
// Attack sounds and native age/life-drain/fear follow the existing WoG port.
writeJSON(extra+'/mod.json',{name:'TUM ERA — Red Bones Dragon',author:'VMaiko, PerryR, Archer30; adaptation VCMI Heroes Goonk',version:'0.1.0',modType:'Creatures',compatibility:{min:'1.7.3'},depends:['third-upgrades','wake-of-gods.level8units'],creatures:['config/red-bones-dragon.json'],factions:['config/necropolis.json']});
writeJSON(extra+'/content/config/red-bones-dragon.json',{redBonesDragon:creature,'wake-of-gods.level8units:bloodDragon':{upgrades:['redBonesDragon']}});
const town=readJSON(target+'/content/config/town-screen/necropolis/factions.json')['core:necropolis'].town;
const hallSlots=structuredClone(town.hallSlots);hallSlots[4][2].push('dwellingUp3Lvl7');
writeJSON(extra+'/content/Sprites/tum-era/necropolis-hall.json',{images:Array.from({length:58},(_,frame)=>({frame,defFile:'town-screen/necropolis/ALTHALLNECR',defFrame:frame>50?50:frame}))});
const creatures=structuredClone(town.creatures);creatures[6].push('redBonesDragon');
writeJSON(extra+'/content/config/necropolis.json',{'core:necropolis':{town:{hallSlots,creatures,buildingsIcons:'tum-era/necropolis-hall',structures:{dwellingUp3Lvl7:{...town.structures.dwellingUp2Lvl7,builds:'dwellingUp3Lvl7',hidden:false}},buildings:{dwellingUp3Lvl7:{id:57,name:'Upg. Bloody Vault',description:'Allows recruitment and upgrades of Red Bones Dragons.',upgrades:'dwellingUp2Lvl7',requires:['dwellingUp2Lvl7'],cost:{wood:10,ore:10,mercury:20,gold:30000}}}}}});
writeJSON('TUM-UPSTREAM.json',{engine:'VCMI 1.7.3',sources:[{repository:'https://github.com/vcmi-mods/third-upgrades',commit:commit(vcmi),version:readJSON(target+'/mod.json').version,installed:true},{repository:'https://github.com/VMaiko1634/Third-Upgrade-Mod-Full',commit:commit(era),version:'3.5.0',installed:'Red Bones Dragon resources and VCMI adaptation only'},{repository:'https://github.com/misiokles/tow-tum',commit:commit(path.join(sources,'tow-tum')),installed:false,reason:'Standalone alternative duplicates the same nine towns. Not enabled alongside third-upgrades.'}],eraArchiveSHA256:crypto.createHash('sha256').update(pac).digest('hex'),adaptation:{stats:'AmeCre.pac/Crtraits.txt, Red Bones Dragon row',regeneration:'Data/Creatures/224.cfg: 50 HP, 100% chance',portraits:'AmeCre.pac/cprsmall.def and twcrport.def, frame 224',buildings:'Fourth Necropolis dwelling; reuses the advanced Dragon Vault art and icon. Building price is a local balance choice.',abilities:'Native WoG age, life drain, fear and morale bonuses; regeneration and no retaliation added. ERA hit effects and full ERM runtime are not ported.'},remaining:'Other ERA-only fourth upgrades, scripts and mechanisms are not implemented by this integration.'});
normalizeTum();
console.log('Imported Wrath of the Creators and the Red Bones Dragon adaptation.');
