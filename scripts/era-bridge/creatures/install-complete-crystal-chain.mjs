/** Install the source Ruby/Emerald/Sapphire definitions with exact reviewed XP services.
 * Run only after compiling the source-crystal-experience-v1 native adapters.
 * Emits evidence; real native controls still own activation validation.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {readEraArchive,readCreatureTable,creatureStats,readCreatureAnimationTable} from '../resources.mjs';
import {readDefFrame} from '../def-frame.mjs';
import {compileCreatureProperties} from './creature-properties.mjs';
import {parseCreatureExperience,compileCreatureExperience} from './crexpbon.mjs';
import {adaptSourceOwnHealthExperience} from './source-experience-defaults.mjs';
import {createProductionObjectResolvers,readJsonc} from '../objects/production-resolvers.mjs';
import {compileDailyResourceService,validateRuntimePolicy} from '../runtime-policy.mjs';
const [reviewArg,sourceArg='../Third-Upgrade-Mod-Full']=process.argv.slice(2);
if(!reviewArg)throw Error('Usage: install-complete-crystal-chain.mjs REVIEW_OVERLAY [TUM_SOURCE]');
const root='mod/tum-era',source=path.resolve(sourceArg),review=path.resolve(reviewArg),read=p=>JSON.parse(fs.readFileSync(p));
const write=(p,data)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(data,null,2)+'\n');};
const report=read(review+'/native-closed-import-review.json'),ids=[267,268];
if(ids.some(id=>!report.candidateIds.includes(id)))throw Error('Crystal source contracts incomplete');
const definitions=read(review+'/content/config/native-closed-creatures.candidate.json'),selected={};
for(const id of ids){const record=report.records.find(r=>r.eraId===id);if(record.obligations.length)throw Error('Unclosed crystal source actor');selected['eraCreature'+id]=definitions['eraCreature'+id];for(const asset of record.assets){const dest=root+'/'+asset.path;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(review+'/'+asset.path,dest);}}
const archive=readEraArchive(fs.readFileSync(source+'/Data/AmeCre.pac'));
if(archive.sha256!=='452c833214b4c6df2a5e430bf4dd526ccd71792ede166ac2d77646516322731c')throw Error('Original archive changed');
const traits=readCreatureTable(archive.extract('Crtraits.txt').toString('latin1')),animations=readCreatureAnimationTable(archive.extract('cranim.txt').toString('latin1'));
const rows=parseCreatureExperience(archive.extract('crexpbon.txt').toString('latin1')),installedRows=parseCreatureExperience(fs.readFileSync('mod/wake-of-gods/Mods/stackExperience/Content/data/crexpbon.txt','latin1'));
const resolver=createProductionObjectResolvers({projectRoot:process.cwd(),sourceRoot:source});
const cfg=fs.readFileSync(source+'/Data/Creatures/133.cfg','utf8');
if(JSON.stringify(Object.fromEntries(cfg.trim().split(/\r?\n/).map(l=>{const[k,v]=l.split('=');return[k,Number(v)];})))!==JSON.stringify({ResGen_Type:4,ResGen_Amount:1,Flags:-2147483503,Level:6,'Resistance effect':1,Sktransformer:68}))throw Error('Ruby CFG changed');
const properties=compileCreatureProperties(cfg,{freshDefinition:true,analyseOnly:true,nativeBiologyContract:'source-biological-flags-v1',resolveCreature:id=>resolver.resolveCreature(id)});
if(properties.policies.some(p=>p.kind!=='era-daily-resource-generation'))throw Error('Unclosed Ruby property');
// Replace the complete inherited stackExperience array. Original base creatures
// already receive tier defaults; retain that source tier7 carrier here explicitly
// while changing its H% to the source rounding adapter used by the new stages.
const own=compileCreatureExperience(rows,{creatureId:133,installedRows,nativeExperienceProfile:true,rankZero:'intrinsic',experienceDefenseReduction:'source-experience-defense-v1',throwOnError:true});
const defaults=rows.filter(r=>r.creature===-8||r.creature===-7);
if(defaults.length!==5||new Set(defaults.map(r=>r.code)).size!==5)throw Error('Ruby source tier defaults changed');
const compiledDefaults=compileCreatureExperience([...rows.filter(r=>r.creature<0),...defaults.map(r=>({...r,creature:133}))],{creatureId:133,installedRows,nativeExperienceProfile:true,rankZero:'intrinsic',throwOnError:true});
const health=adaptSourceOwnHealthExperience(compiledDefaults.definition.stackExperience,defaults,'source-health-xp-rounding-v1');
const ruby={...creatureStats(traits[133]),level:7,abilities:{dragon:null,dragonSkeleton:null,crystals:null,magicResistance:null,KING_1:null,...properties.definition.abilities,...own.definition.abilities},stackExperience:[...health.stackExperience,...own.definition.stackExperience],upgrades:['tum-era:eraCreature267'],graphics:animations[133].graphics};
const require=createRequire(path.resolve('work/browser-tests/package.json')),sharp=require('sharp'),prefix='tum-era/creatures/133';
for(const[field,file,bank]of[['iconSmall','small.png','CPRSMALL.def'],['iconLarge','large.png','TWCRPORT.def']]){const frame=readDefFrame(archive.extract(bank),135),dest=root+'/content/Sprites/'+prefix+'/'+file;fs.mkdirSync(path.dirname(dest),{recursive:true});await sharp(frame.rgba,{raw:{width:frame.width,height:frame.height,channels:4}}).png().toFile(dest);ruby.graphics[field]=prefix+'/'+file;}
selected['core:crystalDragon']=ruby;
write(root+'/content/config/complete-crystal-chain.json',selected);
const blockSource='mod/wake-of-gods/Mods/heroes3DataPatch/content/sprites/zmgc01.def',blockTarget=root+'/content/Sprites/tum-era/crystal-block/block.def';fs.mkdirSync(path.dirname(blockTarget),{recursive:true});fs.copyFileSync(blockSource,blockTarget);write(root+'/content/config/battles_graphics.json',{ac_mapping:[{id:85,defnames:['tum-era/crystal-block/block.def']}]});
for(const file of ['era-bridge-experience','era-bridge-skeleton-transformations']){const p=root+'/content/config/'+file+'.json',current=read(p),candidate=read(review+'/content/config/'+file+'.candidate.json');for(const id of ids){const key='tum-era:eraCreature'+id;current.creatures[key]=candidate.creatures[key];}write(p,current);}
const runtimePath=root+'/content/config/era-bridge-runtime.json',runtime=read(runtimePath),candidateRuntime=read(review+'/content/config/era-bridge-runtime.candidate.json');for(const id of ids)runtime.creatures['tum-era:eraCreature'+id]=candidateRuntime.creatures['tum-era:eraCreature'+id];
validateRuntimePolicy(runtime);write(runtimePath,runtime);
const identityPath=root+'/era-identities.json',identities=read(identityPath);for(const id of ids)identities.creatures[id]='tum-era:eraCreature'+id;write(identityPath,identities);
for(const file of fs.readdirSync(root+'/content/config').filter(f=>/^era-bridge-.*\.json$/.test(f))){const p=root+'/content/config/'+file,data=read(p);if(!data.sourceIds)continue;for(const id of ids)data.sourceIds['tum-era:eraCreature'+id]=id;write(p,data);}
const manifest=read(root+'/mod.json');manifest.creatures=[...new Set([...manifest.creatures,'config/complete-crystal-chain.json'])];write(root+'/mod.json',manifest);
for(const[lang,text]of[['english','The Stack managed to block the next attack'],['french','La troupe a bloqué l’attaque.']]){const p=root+'/content/translation/tum-era-ui-'+lang+'.json',data=read(p);data['tum-era.deflection.fullBlock']=text;write(p,data);}
write('outputs/complete-crystal-chain/source.json',{ids:[265,266,133,267,268],contract:'source-crystal-experience-v1',sourcePins:report.sourcePins,records:report.records.filter(r=>ids.includes(r.eraId)),ruby:{sourceStats:traits[133],sourceCfgSha256:crypto.createHash('sha256').update(cfg).digest('hex'),ownXP:own.mapped,defaultXP:compiledDefaults.mapped,sourceGraphics:'Unmodified original Crystal Dragon battle/map art; source portrait frame135'},nativeControlsRequired:true,fullEraCompatibility:false});
console.log('Installed five-stage source crystal chain; native gameplay controls required.');
