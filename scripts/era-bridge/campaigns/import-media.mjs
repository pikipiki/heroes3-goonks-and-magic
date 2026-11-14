/** Import unchanged original WoG artwork. Call on the statically extracted
 * main4.wog directories, never by running the original Windows installer. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {sha256} from './importer.mjs';
export const mediaRoot='mod/wake-of-gods/Mods/mapSupport/Content';
export const mediaManifest=mediaRoot+'/config/era-campaigns/media.json';
export const mediaCohortSha256='6e340f61c3dd61772e34e99901256a36798ce5a74cda591b222f67193787a9f9';
export function collectCampaignMedia(cmpRoot,portraitRoot){
 const images=[],movies=[],files=[];
 const append=(source,key,destination)=>{
  const bytes=fs.readFileSync(source),hash=sha256(bytes),ext=path.extname(source).toLowerCase();
  if(!/^[a-z0-9_.\/-]+$/.test(key)||!['.bmp','.avi'].includes(ext))throw Error('Unexpected original campaign media');
  const record={key,path:destination,sha256:hash,size:bytes.length};
  if(ext==='.bmp'){
   if(bytes.length<54||bytes.subarray(0,2).toString()!=='BM')throw Error('Invalid original bitmap');
   record.width=bytes.readInt32LE(18);record.height=Math.abs(bytes.readInt32LE(22));
   if(record.width<1||record.height<1||record.width>2048||record.height>2048)throw Error('Excessive original bitmap');
   record.url='campaign-media/'+hash+'.bmp';images.push(record);
  }else movies.push(record);
  files.push({destination,bytes});
 };
 for(const name of fs.readdirSync(cmpRoot).sort())if(/\.(bmp|avi)$/i.test(name))append(path.join(cmpRoot,name),'cmp.res/'+name.toLowerCase(),'data/zvs/cmp.res/'+name.toLowerCase());
 for(const name of fs.readdirSync(portraitRoot).sort())if(/^(z11p_[1-4][ls]|b21p_b[ls])\.bmp$/i.test(name))append(path.join(portraitRoot,name),'portraits/'+name.toLowerCase(),'data/'+name.toLowerCase());
 if(images.length!==78||movies.length!==4)throw Error('Changed original campaign media cohort');
 images.sort((a,b)=>a.key<b.key?-1:1);movies.sort((a,b)=>a.key<b.key?-1:1);
 const rows=[...images,...movies].map(({key,sha256,size})=>({key,sha256,size})).sort((a,b)=>a.key<b.key?-1:1);
 if(sha256(Buffer.from(JSON.stringify(rows)))!==mediaCohortSha256)throw Error('Changed original campaign media bytes');
 const manifest={schemaVersion:1,contract:'source-campaign-media-v1',source:{packageUrl:'https://www.vault.acidcave.net/download.php?id=22',packageSha256:'8f210d789c8c3f799549bc67a5d48ee346036ded726c298ddfb95301e3cfc41a',member:'main4.wog',cohortSha256:mediaCohortSha256},images,movies};
 return{manifest,files};
}
export function importCampaignMedia(cmpRoot,portraitRoot){
 const {manifest,files}=collectCampaignMedia(cmpRoot,portraitRoot);
 for(const {destination,bytes}of files){const target=path.join(mediaRoot,destination);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);}
 fs.mkdirSync(path.dirname(mediaManifest),{recursive:true});fs.writeFileSync(mediaManifest,JSON.stringify(manifest,null,2)+'\n');
 const records=Object.fromEntries(manifest.images.map(({key,url,width,height})=>[key,{url,width,height}]));
 fs.writeFileSync('web/campaign-media-data.mjs','// Generated from unchanged original WoG artwork.\nexport const campaignMedia='+JSON.stringify(records,null,2)+';\n');return manifest;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==4)throw Error('Usage: import-media.mjs <Cmp.res directory> <story portraits directory>');
 importCampaignMedia(process.argv[2],process.argv[3]);
}
