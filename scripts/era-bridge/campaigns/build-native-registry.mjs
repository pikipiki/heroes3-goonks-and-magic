import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {compileCaveFile,extractCaveScripts,readOriginalCampaign} from './importer.mjs';
import {compileNativeCampaign} from './native-compiler.mjs';

export function buildNativeCampaignRegistry(destination='mod/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns'){
 const original=fs.readFileSync('mod/wake-of-gods/Mods/maps/content/maps/Cave of Gerfrex.h3m');
 const program=compileCaveFile();
 program.originalMessages=extractCaveScripts(original).map(source=>new TextDecoder(source.encoding).decode(source.bytes));
 fs.mkdirSync(destination,{recursive:true});
 fs.writeFileSync(path.join(destination,'cave-gerfrex.json'),JSON.stringify(program)+'\n');
 const registry={schemaVersion:1,programs:[{id:'cave-gerfrex',enabled:false,
  resource:'config/era-campaigns/cave-gerfrex',programSha256:program.sha256,
  reason:'Native quest host is under validation; the original maps remain disabled.'}]};
 for(const id of ['zc1','zc2','zc3','zc4']){
  const file=`mod/wake-of-gods/Mods/maps/content/maps/${id}.vcmp`,campaign=readOriginalCampaign(file),compiled=compileNativeCampaign(file);
  for(const [index,scenario] of compiled.scenarios.entries()){
   const key=id+'-'+index,program=scenario.program;
   program.originalMessages=campaign.maps[index].sources.map(source=>source.bytes.toString('utf8'));
   fs.writeFileSync(path.join(destination,key+'.json'),JSON.stringify(program)+'\n');
   registry.programs.push({id:key,enabled:false,resource:'config/era-campaigns/'+key,programSha256:program.sha256,sourceArchiveSha256:campaign.sha256,scenarioMember:scenario.member,reason:'Original quests, combat, victory and campaign transfer require native validation.'});
  }
 }
 fs.writeFileSync(path.join(destination,'registry.json'),JSON.stringify(registry,null,2)+'\n');
 return registry;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))buildNativeCampaignRegistry(process.argv[2]);
