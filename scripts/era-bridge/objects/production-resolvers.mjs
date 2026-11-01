import fs from 'node:fs';import path from 'node:path';
import {readEraArchive,readCreatureTable} from '../resources.mjs';
import {readTumObjectStats,prepareTumObjectImport,writePreparedTumObjects} from './importer.mjs';
/** JSONC reader preserves quoted comment markers and only removes commas outside strings. */
export function readJsonc(file){
 const s=fs.readFileSync(file,'utf8');let clean='',quoted=false,escape=false;
 for(let i=0;i<s.length;i++){const c=s[i];if(quoted){clean+=c;if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quoted=false;continue;}if(c==='"'){quoted=true;clean+=c;continue;}if(c==='/'&&s[i+1]==='/'){while(i<s.length&&s[i]!=='\n')i++;clean+='\n';continue;}if(c==='/'&&s[i+1]==='*'){i+=2;while(i<s.length&&!(s[i]==='*'&&s[i+1]==='/')){if(s[i]==='\n')clean+='\n';i++;}i++;continue;}clean+=c;}
 let out='';quoted=false;escape=false;for(let i=0;i<clean.length;i++){const c=clean[i];if(quoted){out+=c;if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quoted=false;continue;}if(c==='"')quoted=true;if(c===','){let j=i+1;while(/\s/.test(clean[j]||'')&&j<clean.length)j++;if(']}'.includes(clean[j]))continue;}out+=c;}
 return JSON.parse(out.replace(/^\uFEFF/,''));
}
const towns=['castle','rampart','tower','inferno','necropolis','dungeon','stronghold','fortress','conflux'];
const wogRoster={150:['level8units','supremeArchangel'],151:['level8units','diamondDragon'],152:['level8units','lordOfThunder'],153:['level8units','hellBaron'],154:['level8units','bloodDragon'],155:['level8units','darknessDragon'],156:['level8units','ghostBehemoth'],157:['level8units','hellHydra'],158:['level8units','sacredPhoenix'],159:['creatures','ghost'],160:['messengersandemissaries','emissaryOfWar'],161:['messengersandemissaries','emissaryOfPeace'],162:['messengersandemissaries','emissaryOfMana'],163:['messengersandemissaries','emissaryOfLore'],164:['messengersandemissaries','fireMessenger'],165:['messengersandemissaries','earthMessenger'],166:['messengersandemissaries','airMessenger'],167:['messengersandemissaries','waterMessenger'],168:['creatures','gorynych'],169:['creatures','warZealot'],170:['creatures','arcticSharpshooter'],171:['creatures','lavaSharpshooter'],172:['creatures','nightmare'],173:['creatures','santaGremlin'],192:['creatures','sylvanCentaur'],193:['creatures','wogSorceress'],194:['creatures','werewolf'],195:['creatures','hellSteed'],196:['creatures','dracolich']};
const merge=(a,b)=>{for(const[k,v]of Object.entries(b)){if(v&&typeof v==='object'&&!Array.isArray(v))a[k]=merge(a[k]&&typeof a[k]==='object'&&!Array.isArray(a[k])?a[k]:{},v);else a[k]=structuredClone(v);}return a;};
export function createProductionObjectResolvers({sourceRoot,projectRoot,engineRoot=path.join(projectRoot,'work/vcmi-wasm')}={}){
 const byNative=new Map(),byEra=new Map(),provenance=[];const candidates=new Map();
 const add=(scope,entries,file)=>{for(const[key,value]of Object.entries(entries)){const id=key.includes(':')?key:scope+':'+key;byNative.set(id,merge(byNative.get(id)||{},value));if(!key.includes(':')){const values=candidates.get(key)||new Set();values.add(id);candidates.set(key,values);}}};
 const core=path.join(engineRoot,'config/creatures');for(const name of fs.readdirSync(core).filter(x=>x.endsWith('.json'))){const file=path.join(core,name);add('core',readJsonc(file),file);}
 const vanillaUpgradeKeys=new Map();for(const[id,d]of byNative)if(id.startsWith('core:')&&Number.isInteger(d.index)&&Array.isArray(d.upgrades)&&d.upgrades.length===1)vanillaUpgradeKeys.set(d.index,d.upgrades[0]);
 const loadMod=(root,scope)=>{const mod=readJsonc(path.join(root,'mod.json'));for(const relative of mod.creatures||[]){let file=path.join(root,'content',relative);if(!path.extname(file))file+='.json';add(scope,readJsonc(file),file);}};
 for(const name of ['level8Units','creatures','messengersAndEmissaries'])loadMod(path.join(projectRoot,'mod/wake-of-gods/Mods',name),'wake-of-gods.'+name.toLowerCase());
 loadMod(path.join(projectRoot,'mod/third-upgrades'),'third-upgrades');
 const tumRoot=path.join(projectRoot,'mod/tum-era');if(fs.existsSync(path.join(tumRoot,'mod.json')))loadMod(tumRoot,'tum-era');
 const set=(id,native,evidence)=>{if(!byNative.has(native))return;const previous=byEra.get(id);if(previous&&previous!==native)throw new Error(`Conflicting ERA identity${id}: ${previous} vs${native}`);byEra.set(id,native);provenance.push({eraId:id,native,evidence});};
 for(const[id,d]of byNative)if(id.startsWith('core:')&&Number.isInteger(d.index))set(d.index,id,'Native core creature index');
 for(const[id,[scope,key]]of Object.entries(wogRoster))set(Number(id),'wake-of-gods.'+scope+':'+key,'Explicit original WoG creature roster; source CRTRAITS identity and native creature definition checked');
 const findName=name=>{if(name.includes(':'))return byNative.has(name)?name:undefined;const values=[...(candidates.get(name)||[])];return values.length===1?values[0]:undefined;};
 const erm=fs.readFileSync(path.join(sourceRoot,'Data/s/Third Upgrade Mod.erm'),'utf8');
 for(const match of erm.matchAll(/!!UN:T(\d+)\/(\d+)\/2\/(\d+);/g)){
  const town=towns[Number(match[1])],level=Number(match[2]),eraId=Number(match[3]);if(!town)continue;
  const file=path.join(projectRoot,'mod/third-upgrades/content/config/town-screen',town,'factions.json');const data=readJsonc(file),faction=Object.values(data).find(x=>x.town?.creatures);const native=findName(faction?.town.creatures[level]?.[2]||'');if(native)set(eraId,native,`Original UN:T${match[1]}/${level}/2 ↔ native${town} town.creatures[${level}][2]`);
 }
 const archive=readEraArchive(fs.readFileSync(path.join(sourceRoot,'Data/AmeCre.pac'))),tableText=archive.extract('Crtraits.txt').toString('latin1'),rows=readCreatureTable(tableText),sourceStats=readTumObjectStats(sourceRoot,tableText);
 const declaredUpgrades=new Map();
 for(const name of fs.readdirSync(path.join(sourceRoot,'Data/Creatures')).filter(x=>/^\d+\.cfg$/.test(x))){const text=fs.readFileSync(path.join(sourceRoot,'Data/Creatures',name),'utf8');const matches=[...text.matchAll(/^UpgradesTo=(-?\d+)\s*$/gm)];if(matches.length===1&&Number(matches[0][1])>=0)declaredUpgrades.set(parseInt(name),{eraId:Number(matches[0][1]),evidence:`Original Data/Creatures/${name} UpgradesTo; Amethyst tables.cpp Hill_Fort_47AA50/47AAD0_Hook uses upgtable before vanilla fallback`});}
 const upgradeStart=erm.indexOf('!?FU(tum_SetUpNewUpgrades);'),upgradeEnd=erm.indexOf('!!UN:P(WOG_OPT_4TH_UPGRADES)',upgradeStart),upgradeBody=erm.slice(upgradeStart,upgradeEnd);
 for(const match of upgradeBody.matchAll(/!!MA:U(\d+)\/(\d+);/g))declaredUpgrades.set(Number(match[1]),{eraId:Number(match[2]),evidence:`Original Third Upgrade Mod.erm tum_SetUpNewUpgrades unconditional MA:U${match[1]}/${match[2]}; last declaration wins; Amethyst upgtable hook`});
 const identitiesFile=path.join(tumRoot,'era-identities.json');
 if(fs.existsSync(identitiesFile)){const identities=readJsonc(identitiesFile);if(identities.schemaVersion!==1||!identities.creatures||Array.isArray(identities.creatures))throw new Error('Invalid TUM identity registry');for(const[id,native]of Object.entries(identities.creatures)){if(!/^\d+$/.test(id)||typeof native!=='string'||!/^tum-era:[A-Za-z0-9_]+$/.test(native))throw new Error('Invalid explicit TUM identity');set(Number(id),native,'Reviewed TUM source identity; native definition registered by current tum-era manifest');}}
 const resolveEraUpgrade=id=>{if(declaredUpgrades.has(id))return {kind:'upgrade',...declaredUpgrades.get(id)};const key=vanillaUpgradeKeys.get(id),native=key?findName(key):undefined;if(native){const target=[...byEra.entries()].find(([era,mapped])=>era<150&&mapped===native);if(target)return {kind:'upgrade',eraId:target[0],evidence:'Original H3 town upgrade fallback0x47AA50/0x47AAD0 matched to native core indexed upgrade, no TUM cfg/MA:U override'};}return undefined;};
 const resolveNativeUpgrades=id=>{const d=byNative.get(byEra.get(id));return Array.isArray(d?.upgrades)?d.upgrades.map(findName):[];};
 const resolveCreature=id=>byEra.get(id);
 const resolveStats=id=>{if(sourceStats.has(id))return sourceStats.get(id);const d=byNative.get(resolveCreature(id)),row=rows[id];if(!d||!row||!Number.isInteger(d.level)||d.level<1)return undefined;return {level:d.level,growth:row.growth,aiValue:row.aiValue};};
 // Normalize stats to one-based only at this public boundary.
 const resolveOneBasedStats=id=>sourceStats.has(id)?{...sourceStats.get(id),level:sourceStats.get(id).level+1}:resolveStats(id);
 const layouts=readJsonc(path.join(engineRoot,'config/gameConfig.json')).settings.combat.layouts;
 const resolveBankLayout=(id,bank)=>{
  if(bank.troopPlacement)return undefined;
  const patterns=[];
  for(const state of bank.states){const active=state.guardians.type.filter((id,i)=>id>=0&&state.guardians.count[i]>0);
   if(active.some(id=>!resolveCreature(id)))return 'creatureBankNarrow'; // Compiler reports unresolved identities atomically.
   const positions=active.map((id,index)=>byNative.get(resolveCreature(id))?.doubleWide?layouts.creatureBankWide.defenderUnits[index]:layouts.creatureBankNarrow.defenderUnits[index]);
   patterns.push(positions);
  }
  if(patterns.some(x=>JSON.stringify(x)!==JSON.stringify(patterns[0])))return undefined; // State-dependent footprint needs its own native policy.
  if(patterns[0].every((position,index)=>position===layouts.creatureBankNarrow.defenderUnits[index]))return 'creatureBankNarrow';
  const layout=structuredClone(layouts.creatureBankNarrow);layout.defenderUnits=layout.defenderUnits.map((position,index)=>patterns[0][index]??position);
  return {layoutId:'eraBank'+id+'MixedLayout',layout};
 };
 const resolveDwellingRmg=row=>{if(row.objectType!==20||![2,4].includes(row.objectSubtype))return undefined;const value=row.creatureIds.reduce((n,id)=>n+rows[id].aiValue,0);return {value,rarity:300,neutralAllowed:true};};
 const baseSoundArchive=process.env.TUM_BASE_SND||path.join(projectRoot,'work/game-data/homm3eng/home/web_user/.local/share/vcmi/Data/Heroes3.snd');
 return {baseSoundArchivePaths:fs.existsSync(baseSoundArchive)?[baseSoundArchive]:[],resolveCreature,resolveStats:resolveOneBasedStats,resolveDwellingRmg,levelBase:1,resolveBankLayout,upgradeMode:'era-first-occupied-slot',resolveEraUpgrade,resolveNativeUpgrades,emptyGuardMode:'era-sentinel',rmgPolicy:'era-value-density',byEra,byNative,provenance,dependencies:['wake-of-gods.level8units','wake-of-gods.creatures','wake-of-gods.messengersandemissaries','third-upgrades']};
}

if(process.argv[1]===new URL(import.meta.url).pathname){const sourceRoot=process.argv[2],projectRoot=process.argv[3],destination=process.argv[4];if(!sourceRoot||!projectRoot||!destination)throw new Error('Usage: production-resolvers.mjs TUM_ROOT PROJECT_ROOT FRESH_DESTINATION');const r=createProductionObjectResolvers({sourceRoot,projectRoot});const result=prepareTumObjectImport({sourceRoot,...r});result.identityProvenance=r.provenance;result.dependencies=r.dependencies;const report=writePreparedTumObjects(result,destination);const usedScopes=new Set();for(const item of report.compiled){const json=JSON.parse(result.files.get(item.config));for(const m of JSON.stringify(json).matchAll(/"([A-Za-z0-9_.-]+):[A-Za-z0-9_-]+"/g))if(m[1]!=='core')usedScopes.add(m[1]);}const manifest={name:'TUM ERA verified object imports',description:'Original TUM object appearances, bank rewards and external recruitment compiled through verified source mappings. Random-map replacements and unsupported objects are excluded.',version:'0.1.0',author:'TUM/WoG/Wrath of the Creators contributors',modType:'Mechanics',keepDisabled:true,compatibility:{min:'1.7.0'},depends:[...usedScopes].sort(),objects:report.compiled.map(x=>x.config.replace(/^content\//,'')),...result.modPatch};fs.writeFileSync(path.join(destination,'mod.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({compiled:report.compiled.map(x=>({kind:x.kind,id:x.id})),diagnostics:report.diagnostics.length,mappedCreatures:r.byEra.size,files:report.files.length}));}
