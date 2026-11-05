import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {isolatedBuilding} from './goonk-building-art.mjs';

// Native iconSmall/iconLarge are silhouettes; creatureBackground belongs only to CCreaturePic.
export async function buildCreatureIcons(imageDir, keys, grades=['','-evo']) {
 const transparent = {r:0,g:0,b:0,alpha:0};
 for (const key of keys) for (const suffix of grades) {
  const royal=!!suffix;
  const stem=key+suffix;
  // Use the transparent source pose, never a previously composited portrait.
  // Remove disconnected atlas fragments to exclude neighboring creatures.
  const pose=await isolatedBuilding(await sharp(path.join(imageDir,royal?stem+'-idle.png':key+'-0.png')).png().toBuffer());
  for (const [kind,width,height] of [['small',32,32],['large',58,64]]) {
   const sprite=await sharp(pose).resize(width-4,height-4,{fit:'contain',background:transparent}).png().toBuffer();
   await sharp({create:{width,height,channels:4,background:transparent}})
    .composite([{input:sprite,gravity:'centre'}]).png().toFile(path.join(imageDir,stem+'-'+kind+'.png'));
  }
 }
}
if (process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)) {
 const imageDir=path.resolve(process.argv[2]||'../../mod/goonk/Content/Sprites/goonk');
 const creatures=JSON.parse(fs.readFileSync(path.resolve(imageDir,'../../config/creatures.json')));
 const keys=[...new Set(Object.values(creatures).filter(c=>c.graphics.animation!=='goonk/fire-solar').map(c=>path.basename(c.graphics.animation).replace(/-(evo|exalted)$/,'')))];
 const grades=Object.values(creatures).some(c=>c.graphics.animation.endsWith('-exalted'))?['','-evo','-exalted']:['','-evo'];
 await buildCreatureIcons(imageDir,keys,grades);
 console.log('Transparent native creature icons rebuilt:',keys.length*grades.length*2);
}
