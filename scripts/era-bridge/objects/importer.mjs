import fs from 'node:fs';
import path from 'node:path';
import {readEraArchive,readCreatureTable} from '../resources.mjs';
import {convertObjectTemplate,parseDwellingTable,compileDwelling,eraDwellingGuards,ObjectBridgeError} from './objects.mjs';
import {compileTumBank} from '../banks.mjs';
import {compileEraTroopPlacement,compileEraBankRmg} from './bank-extras.mjs';
const guardEvidence='h3era.exe SHA256451e208cb2985bca75330f0e3c52f89f9219c0c3701bc6e1f354217890c36181;0x47A9A2..0x47A9BA draws1..100 and compares roll<=upgrade;0 never upgrades; REA ev_1e22d8e4a59ce00df9320a7c287efc2d6f215628285187aa18db3af920f8cecc';
/** Compile real source dwelling/bank files and extract their original DEF+MSK assets.
 * Returns files in memory; does not enable mods or change user installation.
 * Missing creature identities/stats/layouts or unsupported upgrade behavior fail
 * the WHOLE corresponding object. Other independent definitions remain reviewable.
 */
export function prepareTumObjectImport({sourceRoot,resolveCreature,resolveStats,levelBase,resolveArtifact,resolveResource,resolveBankLayout,upgradeMode,resolveEraUpgrade,resolveNativeUpgrades,spellMode,spellCatalog,resolveSpell,emptyGuardMode,resolveNullSound,appearanceMode,rmgPolicy='none',animationNamespace='tum-era/objects/',resolveDwellingRmg,includeLegacyDwellings=false}={}){
 if(!['none','era-value-density'].includes(rmgPolicy))throw new ObjectBridgeError('INVALID_RMG_POLICY','Unknown object RMG adaptation policy');
 if(typeof animationNamespace!=='string'||!animationNamespace||animationNamespace.startsWith('/')||animationNamespace.split('/').some(p=>p==='..')||!animationNamespace.endsWith('/'))throw new ObjectBridgeError('INVALID_ASSET_NAMESPACE','A safe relative animation namespace ending in/ is required');
 const sourceAssetName=name=>name.startsWith(animationNamespace)?name.slice(animationNamespace.length):name;
 const archives=fs.readdirSync(path.join(sourceRoot,'Data')).filter(x=>x.endsWith('.pac')).sort().map(file=>({file,archive:readEraArchive(fs.readFileSync(path.join(sourceRoot,'Data',file)),{source:file})}));
 const find=name=>{
  const matches=archives.filter(({archive})=>archive.names.some(n=>n.toLowerCase()===name.toLowerCase()));
  if(!matches.length)throw new ObjectBridgeError('MISSING_ASSET','Missing source asset '+name);
  const bytes=matches[0].archive.extract(name);
  if(matches.some(m=>!m.archive.extract(name).equals(bytes)))throw new ObjectBridgeError('CONFLICTING_ASSET','Source archives disagree on '+name);
  return {bytes,archive:matches[0].file};
 };
 const json=file=>JSON.parse(fs.readFileSync(path.join(sourceRoot,'Lang',file+'.json'),'utf8'));
 const sourceBanks=json('TUM_CreatureBanks').RMG.objectGeneration['16'];
 const names=json('TUM_Objects').era;
 const dwellingLines=Object.values(json('RMG_Dwellings').RMG.resound.properties).flat();
 const files=new Map(),compiled=[],diagnostics=[],assets=[],layoutSettings={};
 const templatesFor=lines=>Object.fromEntries(lines.map((line,i)=>{
  const animation=line.trim().split(/\s+/)[0],msk=animation.replace(/\.[^.]+$/,'.msk');
  return ['base'+i,convertObjectTemplate(line,{maskBytes:find(msk).bytes,animationPrefix:animationNamespace}).template];
 }));
 const add=(kind,id,result)=>{
  const type=Object.values(Object.values(result.definition)[0].types)[0];
  const pending=[];
  for(const t of Object.values(type.templates)){
   const animation=t.animation,msk=animation.replace(/\.[^.]+$/,'.msk');
   for(const name of [animation,msk]){const resource=find(sourceAssetName(name));pending.push({name,...resource});}
  }
  for(const animation of type.eraBankAppearance?.animations||[]){const resource=find(sourceAssetName(animation));pending.push({name:animation,...resource});}
  // Validate every asset before exposing any part of this object.
  for(const item of pending){const destination='content/sprites/'+item.name;files.set(destination,item.bytes);assets.push({object:`${kind}:${id}`,path:destination,sourceArchive:item.archive});}
  const config='content/config/objects/'+kind+id+'.json';files.set(config,Buffer.from(JSON.stringify(result.definition,null,2)+'\n'));
  compiled.push({kind,id,config,provenance:result.provenance||result.source});
 };
 const error=(kind,id,cause)=>diagnostics.push({kind,id,code:cause.code||cause.name,message:cause.message,details:cause.details||null,diagnostics:cause.diagnostics||null});
 const rows=parseDwellingTable(find('DwTable.txt').bytes.toString('latin1'));
 if(resolveStats===undefined){const sourceStats=readTumObjectStats(sourceRoot,find('Crtraits.txt').bytes.toString('latin1'));resolveStats=id=>sourceStats.get(id);levelBase=0;}
 for(const row of rows){if(!includeLegacyDwellings&&((row.objectType===17&&row.objectSubtype<101)||(row.objectType===20&&row.objectSubtype<2)))continue;
  const id=`${row.objectType}_${row.objectSubtype}`;
  try{
   const lines=dwellingLines.filter(line=>{const p=line.trim().split(/\s+/);return Number(p[5])===row.objectType&&Number(p[6])===row.objectSubtype;});
   if(!lines.length)throw new ObjectBridgeError('MISSING_TEMPLATE','No TUM template for dwelling');
   const guards=eraDwellingGuards(row,{resolveStats,levelBase});
   const name=(row.objectType===17?names.dwellings1:names.dwellings4)?.[row.objectSubtype]||row.name;
   add('dwelling',id,compileDwelling(row,{objectId:'eraDwelling'+id,templates:templatesFor(lines),name,resolveCreature,guards,nativeRmg:resolveDwellingRmg?.(row)}));
  }catch(cause){error('dwelling',id,cause);}
 }
 for(const [id,bank] of Object.entries(sourceBanks)){
  try{
   const layoutPolicy=resolveBankLayout?.(Number(id),bank);
   let layout=layoutPolicy,sourceBank=bank,layoutResult;
   if(!bank.troopPlacement&&layoutPolicy&&typeof layoutPolicy==='object'&&layoutPolicy.layout){layout=layoutPolicy.layoutId;layoutResult={layoutId:layoutPolicy.layoutId,layout:structuredClone(layoutPolicy.layout)};}
   if(bank.troopPlacement&&layoutPolicy&&typeof layoutPolicy==='object'){layoutResult=compileEraTroopPlacement(bank.troopPlacement,layoutPolicy);layout=layoutResult.layoutId;sourceBank=structuredClone(bank);delete sourceBank.troopPlacement;}
   if(typeof layout!=='string'||!layout)throw new ObjectBridgeError('UNRESOLVED_LAYOUT','Explicit original-compatible bank layout resolver required');
   const result=compileTumBank(sourceBank,{source:'Lang/TUM_CreatureBanks.json',objectId:'eraBank'+id,nativeTemplates:templatesFor(bank.properties),guardsLayout:layout,resolveCreature,resolveArtifact,resolveResource,upgradeMode,resolveEraUpgrade,resolveNativeUpgrades,spellMode,spellCatalog,resolveSpell,emptyGuardMode,resolveNullSound,appearanceMode,resolveAnimation:name=>{find(name);return animationNamespace+name;},nativeRmg:rmgPolicy==='era-value-density'?compileEraBankRmg(bank):undefined,chanceMode:'era-fourth-state-remainder',disabledUpgradeEvidence:guardEvidence});
   add('bank',id,result);
   if(layoutResult)layoutSettings[layoutResult.layoutId]=layoutResult.layout;
  }catch(cause){error('bank',id,cause);}
 }
 return {files,compiled,diagnostics,assets,modPatch:Object.keys(layoutSettings).length?{settings:{combat:{layouts:layoutSettings}}}:{},activation:{enabled:false,reason:'Prepared native content; object interaction/RMG/replacement dependencies require integration validation'},source:{root:sourceRoot,animationNamespace,rmgPolicy,archives:archives.map(({file,archive})=>({file,sha256:archive.sha256}))}};
}

/** Write only a fresh explicit destination. No implicit overwrite/activation. */
export function writePreparedTumObjects(result,destination){
 if(fs.existsSync(destination))throw new ObjectBridgeError('DESTINATION_EXISTS','Use a fresh staging directory');
 fs.mkdirSync(destination,{recursive:true});
 for(const [relative,bytes] of result.files){const file=path.join(destination,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);}
 const report={...result,files:[...result.files.keys()]};
 fs.writeFileSync(path.join(destination,'import-report.json'),JSON.stringify(report,null,2)+'\n');
 return report;
}

/** Exact source guard statistics: weekly growth from archived CRTRAITS rows and
 * zero-based Level from each creature's original Amethyst cfg. Absent levels
 * stay unresolved instead of guessing the base game's faction order.
 */
export function readTumObjectStats(sourceRoot,creatureTableText){
 const rows=readCreatureTable(creatureTableText,{source:'AmeCre.pac/Crtraits.txt'}),result=new Map();
 for(const row of rows){const file=path.join(sourceRoot,'Data/Creatures',row.eraId+'.cfg');if(!fs.existsSync(file))continue;
  const text=fs.readFileSync(file,'utf8');const levels=[...text.matchAll(/^Level\s*=\s*(\d+)\s*$/gm)];
  if(levels.length!==1)continue;const level=Number(levels[0][1]);if(level>7||row.invalidRange)continue;
  // No growth override is accepted without implementing its source semantics.
  if(/^(?:Growth|Cre_growth|growth)\s*=/m.test(text))continue;
  result.set(row.eraId,{level,growth:row.growth,aiValue:row.aiValue,source:{level:file,growth:row.source}});
 }
 return result;
}
