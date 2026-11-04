/** Compose existing reviewed importers. Candidate only, outside shared project. */
import os from 'node:os';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';import {execFileSync} from 'node:child_process';
const [projectArg,tumArg,outArg,gemImporterArg]=process.argv.slice(2);if(!projectArg||!tumArg||!outArg)throw Error('Usage: node compose-necross-gem.mjs PROJECT TUM OUTPUT [GEM_IMPORTER]');
const project=path.resolve(projectArg),tum=path.resolve(tumArg),out=path.resolve(outArg),gemImporter=path.resolve(gemImporterArg||path.join(project,'scripts/era-bridge/creatures/import-gem-dragon.mjs')),here=path.dirname(fileURLToPath(import.meta.url));
if(out===project||out.startsWith(project+path.sep))throw Error('Output must be outside project');
execFileSync(process.execPath,[path.join(project,'scripts/era-bridge/creatures/import-necross.mjs'),project,tum,out],{stdio:'inherit'});
const gemOut=fs.mkdtempSync(path.join(os.tmpdir(),'tum-gem-source-'));execFileSync(process.execPath,[gemImporter,project,tum,gemOut],{stdio:'inherit'});
const {parseJsonc}=await import(pathToFileURL(project+'/scripts/era-bridge/artifacts/importer.mjs')),{validateSchema}=await import(pathToFileURL(project+'/scripts/era-bridge/artifacts/validate-native.mjs'));
const read=file=>parseJsonc(fs.readFileSync(file,'utf8')),write=(rel,value)=>{const file=path.join(out,rel);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');};
// Reuse the extracted assets; no third-port or obsolete town-screen module is enabled.
for(const folder of ['content/Sprites','content/Sounds'])fs.cpSync(path.join(gemOut,folder),path.join(out,folder),{recursive:true});
const creature=read(gemOut+'/content/config/gem-dragon.candidate.json');creature['wake-of-gods.level8units:diamondDragon'].upgrades=['tum-era:gemDragon'];write('content/config/gem-dragon.json',creature);
const faction=read(gemOut+'/content/config/rampart.candidate.json');faction['core:rampart'].town.creatures[6]=faction['core:rampart'].town.creatures[6].map(x=>x==='gemDragon'?'tum-era:gemDragon':x);write('content/config/rampart.json',faction);
for(const name of ['era-bridge-runtime','era-bridge-experience']){const current=read(out+'/content/config/'+name+'.json'),added=read(gemOut+'/content/config/'+name+'.candidate.json');Object.assign(current.creatures,added.creatures);write('content/config/'+name+'.json',current);}
const status=read(out+'/content/config/era-bridge-status-attacks.json');status.creatures=[...new Set([...status.creatures,'tum-era:gemDragon'])];status.sourceIds['tum-era:gemDragon']=207;write('content/config/era-bridge-status-attacks.json',status);
const transformations=read(out+'/content/config/era-bridge-skeleton-transformations.json');transformations.creatures['tum-era:gemDragon']={target:'core:boneDragon',living:true};write('content/config/era-bridge-skeleton-transformations.json',transformations);
const identities=read(out+'/era-identities.candidate.json');identities.creatures['207']='tum-era:gemDragon';write('era-identities.candidate.json',identities);
const manifest=read(out+'/mod.candidate.json');manifest.creatures=[...new Set([...manifest.creatures,'config/gem-dragon.json'])];manifest.factions=[...new Set([...(manifest.factions??[]),'config/rampart.json'])];write('mod.candidate.json',manifest);
const cache=new Map(),load=file=>{if(!cache.has(file))cache.set(file,read(file));return cache.get(file);};
const errors=[];const creatureSchema=project+'/work/vcmi-wasm/config/schemas/creature.json';errors.push(...validateSchema(creature.gemDragon,load(creatureSchema),{load,base:creatureSchema}));
// Faction is a partial native override. Validate every emitted field against
// its native type/range rules without fabricating inherited legacy names/art.
const optionalRequired=schema=>{if(Array.isArray(schema))return schema.map(optionalRequired);if(schema&&typeof schema==='object')return Object.fromEntries(Object.entries(schema).filter(([key])=>key!=='required').map(([key,value])=>[key,optionalRequired(value)]));return schema;};
const factionSchema=project+'/work/vcmi-wasm/config/schemas/faction.json',partialLoad=file=>optionalRequired(load(file));errors.push(...validateSchema(faction['core:rampart'],partialLoad(factionSchema),{load:partialLoad,base:factionSchema}));
const building=faction['core:rampart'].town.buildings.dwellingUp3Lvl7;if(building.id!==57||!building.name||!building.description||JSON.stringify(building.requires)!=='["dwellingUp2Lvl7"]')throw Error('Incomplete source fourth dwelling');

if(errors.length)throw Error(errors.join('\n'));
const report=read(gemOut+'/gem-dragon-import-report.json');report.activationReady=false;report.registered=false;report.composition={necrossDefinition:'content/config/necross-dragon.json',hate254ResolvedInCandidate:true,intrinsicBlind:'shared exact primary status selector admitted207; native build/gameplay validation required',originalArmySpellCost:'era-bridge-runtime.armySpellCost; no alive-only parity claim',deflection:'modifier200 signed-byte inert arithmetic retained for source RNG consumption',nativeDefinitionValidated:true,factionPartialFieldsValidated:true,requiredInheritedFields:'native core:rampart and third-upgrades; actual native load still required'};report.blockers=[{property:'Combined native gameplay validation',required:'Necross254 status scenarios and Gem207 all-spell-immunity/resource-cost/clone/XP interactions; no activation before these pass'}];write('gem-dragon-import-report.json',report);
write('combined-import-report.json',{registered:false,activationReady:false,creatures:['tum-era:necrossDragon','tum-era:gemDragon'],experienceProfiles:Object.keys(read(out+'/content/config/era-bridge-experience.json').creatures).length,sourceIdentities:Object.keys(status.sourceIds).length,schemaErrors:errors,sourceReused:{necross:path.basename(path.join(project,'scripts/era-bridge/creatures/import-necross.mjs')),gem:path.basename(gemImporter)},remaining:'Native build and gameplay tests; candidate manifests are not installed'});
console.log(JSON.stringify(read(out+'/combined-import-report.json')));

fs.rmSync(gemOut,{recursive:true,force:true});
