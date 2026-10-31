import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {isolatedBuilding} from './goonk-building-art.mjs';
// The logical geometry stays unchanged. Each 2x texture is rasterized from
// the original atlas, not from the low-resolution in-game building.
export async function buildTownHD({source,background,placement,destination}){
 const clear={r:0,g:0,b:0,alpha:0},meta=await sharp(source).metadata(),cw=Math.floor(meta.width/4),ch=Math.floor(meta.height/4),cells=[];
 await fs.mkdir(destination,{recursive:true});
 for(let c=0;c<16;c++)cells.push(await isolatedBuilding(await sharp(source).extract({left:c%4*cw,top:Math.floor(c/4)*ch,width:cw,height:ch}).png().toBuffer()));
 await sharp(background).resize(1600,748).png().toFile(path.join(destination,'town-v2.png'));
 for(const [id,{w,h,cell}]of Object.entries(placement)){
  const width=w*2,height=h*2,sprite=await sharp(cells[cell]).resize((w-6)*2,(h-6)*2,{fit:'contain',background:clear}).png().toBuffer();
  const normal=await sharp({create:{width,height,channels:4,background:clear}}).composite([{input:sprite,gravity:'south'}]).png().toBuffer();
  await fs.writeFile(path.join(destination,'structure-'+id+'.png'),normal);
  const {data}=await sharp(normal).ensureAlpha().raw().toBuffer({resolveWithObject:true}),border=Buffer.alloc(width*height*4);
  const inside=(x,y)=>x>=0&&x<width&&y>=0&&y<height&&data[(y*width+x)*4+3]>=128;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(!inside(x,y)){
   let edge=false;for(let dy=-4;dy<=4&&!edge;dy++)for(let dx=-4;dx<=4;dx++)if(inside(x+dx,y+dy)){edge=true;break;}
   if(edge){const i=(y*width+x)*4;border[i]=255;border[i+1]=235;border[i+2]=65;border[i+3]=255;}
  }
  await sharp(border,{raw:{width,height,channels:4}}).png().toFile(path.join(destination,'outline-'+id+'.png'));
  const cardBuilding=await sharp(cells[cell]).resize(280,132,{fit:'contain',background:clear}).png().toBuffer();
  await sharp(background).resize(300,140,{fit:'cover'}).composite([{input:cardBuilding,gravity:'south'}]).png().toFile(path.join(destination,'card-'+id+'.png'));
 }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=new URL('../../',import.meta.url);
 await buildTownHD({source:fileURLToPath(new URL('outputs/goonk-art/buildings.png',root)),background:fileURLToPath(new URL('outputs/goonk-art/emptyTown.png',root)),placement:JSON.parse(await fs.readFile(new URL('outputs/goonk-building-layout-v2.json',root),'utf8')),destination:fileURLToPath(new URL('mod/goonk/Content/Sprites2x/goonk/',root))});
}
