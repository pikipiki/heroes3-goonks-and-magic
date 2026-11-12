/** Install original351/352 only after the whole native review succeeds. */
import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';
const[stage,nativeEvidence]=process.argv.slice(2);if(!stage||!nativeEvidence)throw Error('Usage: install-reviewed-dungeon.mjs STAGE NATIVE_REPORT');
const read=p=>JSON.parse(fs.readFileSync(p)),write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');},sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const metadata=read(stage+'/stage.json'),proof=read(nativeEvidence),root='mod/tum-era';
const required=['dungeonStats','dungeonWrap32','dungeonChain','dungeonSlow351','dungeonSlowFloor','dungeonSlow352','dungeonFriend','dungeonChainRecanter','dungeonRay351','dungeonPortrait','dungeonUpgrades'];
if(metadata.activation!==false||JSON.stringify(metadata.sourceIds)!=='[351,352]'||metadata.records.length!==2||metadata.records.some(r=>r.obligations.length))throw Error('Whole original Dungeon source contract required');
if(proof.passed!==true||required.some(key=>!proof.report?.[key]))throw Error('All Dungeon native controls required: '+required.filter(key=>!proof.report?.[key]).join(','));
for(const record of metadata.records)for(const a of record.assets)if(sha(fs.readFileSync(stage+'/'+a.path))!==a.sha256)throw Error('Reviewed source asset changed: '+a.path);
const definitions=read(stage+'/content/config/source-dungeon.json'),spells=read(stage+'/content/config/source-dungeon-spells.json');
if(!definitions.eraCreature351?.graphics?.missile?.ray||!definitions.eraCreature352||!spells.sourceSpiderChainShot)throw Error('Dungeon definitions and native chain visual required');
const patches=Object.fromEntries(['era-bridge-experience','era-bridge-skeleton-transformations','era-bridge-status-attacks'].map(n=>[n,read(stage+'/patches/'+n+'.json')]));
for(const record of metadata.records)for(const a of record.assets){const target=root+'/'+a.path;fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(stage+'/'+a.path,target);}
write(root+'/content/config/reviewed-dungeon-eighth.json',definitions);write(root+'/content/config/source-dungeon-spells.json',spells);
for(const[name,patch]of Object.entries(patches)){const file=root+'/content/config/'+name+'.json',current=read(file);if(Array.isArray(current.creatures)){for(const key of patch.creatures)if(!current.creatures.includes(key))current.creatures.push(key);}else Object.assign(current.creatures,patch.creatures);if(patch.sourceIds)Object.assign(current.sourceIds,patch.sourceIds);write(file,current);}
const identities=read(root+'/era-identities.json');for(const id of[351,352])identities.creatures[id]='tum-era:eraCreature'+id;write(root+'/era-identities.json',identities);
for(const name of fs.readdirSync(root+'/content/config').filter(n=>/^era-bridge-.*\.json$/.test(n))){const file=root+'/content/config/'+name,current=read(file);if(current.sourceIds){for(const id of[351,352])current.sourceIds['tum-era:eraCreature'+id]=id;write(file,current);}}
const manifest=read(root+'/mod.json');manifest.creatures=[...new Set([...manifest.creatures,'config/reviewed-dungeon-eighth.json'])];manifest.spells=[...new Set([...(manifest.spells||[]),'config/source-dungeon-spells.json'])];write(root+'/mod.json',manifest);
write('outputs/wog-priorities-0.4.147/dungeon-eighth-source.json',{active:true,sourcePins:metadata.sourcePins,records:metadata.records,nativeEvidence,undefinedSourceException:metadata.undefinedSourceException,eighthTownRecruitmentStillGated:true});
console.log('Installed source351/352 after complete native Dungeon validation.');
