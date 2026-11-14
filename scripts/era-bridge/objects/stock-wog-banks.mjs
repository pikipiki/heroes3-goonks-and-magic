import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {prepareTumObjectImport} from './importer.mjs';
import {createProductionObjectResolvers,readJsonc} from './production-resolvers.mjs';
import {readEraArchive} from '../resources.mjs';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
export const STOCK_WOG_BANK_IDS=[21,24,25,26,27,28,29,30,31];
export const STOCK_WOG_BANK_SOURCE={commit:'3785413e4dceb07b17ff2b52b264e960b7ce51b3',file:'Mods/WoG/lang/wog_CreatureBanks.json',sha256:'9f8059891a58db28bcaefad73e780daffb4565af9d980f38f75328826ec50f0d'};
export function prepareStockWogBanks({projectRoot,sourceRoot,archivePath,soundPath,h3SoundPath}){
 const sourceBytes=fs.readFileSync(new URL('./original-wog-creaturebanks.json',import.meta.url));
 if(sha(sourceBytes)!==STOCK_WOG_BANK_SOURCE.sha256)throw Error('Pinned original WoG bank document required');
 const all=JSON.parse(sourceBytes).RMG.objectGeneration['16'];
 const r=createProductionObjectResolvers({projectRoot,sourceRoot});
 const layouts=readJsonc(path.join(projectRoot,'work/vcmi-wasm/config/gameConfig.json')).settings.combat.layouts;
 const overrides=new Map();
 const banks=Object.fromEntries(STOCK_WOG_BANK_IDS.map(id=>{
  const value=structuredClone(all[id]);
  if(value.troopPlacement){
   if(value.troopPlacement.isBank===false){delete value.troopPlacement;overrides.set(id,'default');}
   else{
    const source=value.troopPlacement;
    const effective={isBank:true,attackers:[57,61,90,93,96,125,129],defenders:[15,185,172,2,100,87,8]};
    for(const side of ['attackers','defenders'])for(let i=0;i<7;i++){
     const n=Number(source[side]?.[i]);if(Number.isInteger(n)&&n>=1&&n<=186&&n%17!==0&&n%17!==16)effective[side][i]=n;
    }
    value.troopPlacement=effective;
    overrides.set(id,{layoutId:'eraBank'+id+'OriginalStockLayout',baseLayout:structuredClone(layouts.creatureBankNarrow)});
   }
  }
  return[id,value];
 }));
 const bankSourceOverride={source:STOCK_WOG_BANK_SOURCE.file,sha256:sha(sourceBytes),banks};
 const coreArtifacts=new Map(Object.entries(readJsonc(path.join(projectRoot,'work/vcmi-wasm/config/artifacts.json'))).filter(([,d])=>Number.isInteger(d.index)).map(([key,d])=>[d.index,'core:'+key]));
 const original=readEraArchive(fs.readFileSync(archivePath));
 if(original.sha256!=='67746b49f9fd31d94e010139972d85b20709ff5e64979bd06b30d06e343de9d9')throw Error('Pinned original WoG bank graphics required');
 return prepareTumObjectImport({sourceRoot,...r,bankSourceOverride,additionalArchivePaths:[archivePath],
  baseSoundArchivePaths:[soundPath,...(h3SoundPath?[h3SoundPath]:[])],scriptedBankIds:STOCK_WOG_BANK_IDS,
  resolveArtifact:id=>coreArtifacts.get(id),resolveResource:id=>id===7?'wake-of-gods.mithril:mithril':undefined,
  rmgPolicy:'none',resolveBankLayout:(id,bank)=>overrides.get(id)??r.resolveBankLayout(id,bank),appearanceMode:'native-state-hook',guardSlotsMode:'native-original-slots',extraRewardsMode:'era-original'});
}
