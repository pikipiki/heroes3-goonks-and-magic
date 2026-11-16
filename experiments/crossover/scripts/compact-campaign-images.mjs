// Pages display copies only: original audited campaign bitmaps remain intact
// in game data. PNG preserves every pixel while avoiding padded BMP storage.
import fs from 'node:fs';import path from 'node:path';
import {encodePng} from '../../../scripts/era-bridge/artifacts/importer.mjs';
export function compactCampaignImages(output){
 const directory=path.join(output,'web/campaign-media'),catalogue=path.join(output,'web/campaign-media-data.mjs'),renamed=[];
 if(!fs.existsSync(directory)||!fs.existsSync(catalogue))return renamed;
 let module=fs.readFileSync(catalogue,'utf8');
 for(const name of fs.readdirSync(directory).filter(name=>name.endsWith('.bmp'))){
  const filename=path.join(directory,name),bmp=fs.readFileSync(filename);
  if(bmp.length<54||bmp.toString('ascii',0,2)!=='BM'||bmp.readUInt32LE(14)<40||bmp.readUInt16LE(26)!==1||bmp.readUInt16LE(28)!==24||bmp.readUInt32LE(30)!==0)continue;
  const width=bmp.readInt32LE(18),signedHeight=bmp.readInt32LE(22),height=Math.abs(signedHeight),offset=bmp.readUInt32LE(10),stride=Math.ceil(width*3/4)*4;
  if(width<1||height<1||width>2048||height>2048||offset<54||offset+stride*height>bmp.length)throw Error('Invalid campaign bitmap '+name);
  const rgba=Buffer.alloc(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const source=offset+(signedHeight>0?height-y-1:y)*stride+x*3,target=(y*width+x)*4;
   rgba[target]=bmp[source+2];rgba[target+1]=bmp[source+1];rgba[target+2]=bmp[source];rgba[target+3]=255;
  }
  const png=encodePng({width,height,rgba});if(png.length>=bmp.length)continue;
  const fresh=name.replace(/\.bmp$/,'.png');
  if(!module.includes('campaign-media/'+name))throw Error('Unreferenced campaign image '+name);
  fs.writeFileSync(path.join(directory,fresh),png);fs.unlinkSync(filename);module=module.replaceAll('campaign-media/'+name,'campaign-media/'+fresh);
  renamed.push({from:'web/campaign-media/'+name,to:'web/campaign-media/'+fresh,saved:bmp.length-png.length});
 }
 fs.writeFileSync(catalogue,module);return renamed;
}
