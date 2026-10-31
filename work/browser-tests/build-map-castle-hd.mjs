import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
// VCMI resolves Sprites2x at the original sprite's logical size. Keep its
// transparent padding and anchor exactly aligned, including the 4px inset.
export async function buildMapCastleHD(source,destination){
 const clear={r:0,g:0,b:0,alpha:0};
 const sprite=await sharp(source).trim().resize(368,290,{fit:'contain',background:clear}).png().toBuffer();
 await fs.mkdir(destination,{recursive:true});
 await sharp({create:{width:384,height:320,channels:4,background:clear}})
  .composite([{input:sprite,left:8,top:0}]).png().toFile(path.join(destination,'map-town-v2.png'));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
 await buildMapCastleHD(new URL('../../outputs/goonk-art/mapCastle.png',import.meta.url).pathname,new URL('../../mod/goonk/Content/Sprites2x/goonk/',import.meta.url).pathname);
