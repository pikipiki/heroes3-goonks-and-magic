import fs from 'node:fs';import path from 'node:path';import {sha256} from './era-bridge/campaigns/importer.mjs';
import {mediaRoot,mediaManifest} from './era-bridge/campaigns/import-media.mjs';
export function publishCampaignMedia(dist){
 const manifest=JSON.parse(fs.readFileSync(mediaManifest,'utf8'));
 if(manifest.schemaVersion!==1||manifest.contract!=='source-campaign-media-v1')throw Error('Invalid campaign media manifest');
 for(const record of manifest.images){
  if(!/^data\/(?:zvs\/cmp\.res\/)?[a-z0-9_]+\.bmp$/.test(record.path)||record.url!=='campaign-media/'+record.sha256+'.bmp')throw Error('Invalid campaign image path');
  const bytes=fs.readFileSync(path.join(mediaRoot,record.path));if(bytes.length!==record.size||sha256(bytes)!==record.sha256)throw Error('Changed original campaign image');
  const target=path.join(dist,'web',record.url);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
 }
}
