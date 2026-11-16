/** Publish only archives with complete native admission receipts. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {buildNativeCampaignRegistry} from './build-native-registry.mjs';
export function buildAdmittedCampaignCatalog(destination='mod/wake-of-gods/Mods/mapSupport/Content',registry=buildNativeCampaignRegistry()){
 const source='mod/wake-of-gods/Mods/maps/content',set=JSON.parse(fs.readFileSync(source+'/config/campaignSets.json'));
 const admitted=['zc1','zc2','zc3','zc4'].filter(id=>{const entries=registry.programs.filter(p=>p.id.startsWith(id+'-'));return entries.length>0&&entries.every(p=>p.enabled);});
 const items=set.wog.items.filter(item=>admitted.some(id=>item.file==='Maps/'+id));
 for(const id of ['zc1','zc2','zc3','zc4']){
  for(const [folder,extension]of [['maps','vcmp'],['data','png']]){
   const target=path.join(destination,folder,id+'.'+extension);
   if(admitted.includes(id)){fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(`${source}/${folder}/${id}.${extension}`,target);}else fs.rmSync(target,{force:true});
  }
 }
 fs.mkdirSync(destination+'/config',{recursive:true});
 const catalog=items.length?{wog:{...set.wog,items}}:{};
 fs.writeFileSync(destination+'/config/campaignSets.json',JSON.stringify(catalog,null,2)+'\n');
 return admitted;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log('Admitted campaigns:',buildAdmittedCampaignCatalog().join(', '));
