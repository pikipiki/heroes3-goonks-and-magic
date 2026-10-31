import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
import {isolatedBuilding} from './goonk-building-art.mjs';
// Frame paths used before the v3 animation replacement (release 0.4.14).
// Keep compatibility images clean too; do not touch town backgrounds or portraits.
export async function cleanLegacyCreatureFrames(imageDir){
 const frames=JSON.parse(await fs.readFile(new URL('./goonk-legacy-animation-frames.json',import.meta.url),'utf8'));
 let changed=0;
 for(const frame of frames){
  const file=path.join(imageDir,path.basename(frame));
  const before=await fs.readFile(file),after=await isolatedBuilding(before,{trim:false});
  if(!(await sharp(before).ensureAlpha().raw().toBuffer()).equals(await sharp(after).ensureAlpha().raw().toBuffer())){await fs.writeFile(file,after);changed++;}
 }
 return changed;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const changed=await cleanLegacyCreatureFrames(path.resolve(process.argv[2]||'../../mod/goonk/Content/Sprites/goonk'));
 console.log('Legacy animation images cleaned:',changed);
}
