// Native DEF draw-code x counts from the right edge. Preserve all four frames.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath}from'node:url';
import {readDefFrame}from'../def-frame.mjs';import {encodePng}from'../artifacts/importer.mjs';import {sha256}from'./importer.mjs';
export const fireDef='mod/wake-of-gods/Mods/mapDecorations/content/sprites/objects/zzzz.def';
export const fireArt='mod/wake-of-gods/Mods/mapSupport/Content/Sprites/era-campaign/fire';
export function fireTile(bytes,phase,index){
 if(!Number.isInteger(phase)||phase<0||phase>5||!Number.isInteger(index)||index<0||index>3)throw Error('Invalid original fire tile');
 const frame=readDefFrame(bytes,index);if(frame.width!==192||frame.height!==32)throw Error('Changed original fire strip');
 const left=(5-(phase===5?0:phase))*32,rgba=Buffer.alloc(32*32*4);
 for(let y=0;y<32;y++)frame.rgba.copy(rgba,y*128,(y*192+left)*4,(y*192+left+32)*4);
 return{width:32,height:32,rgba};
}
export function generateFireArt(){
 const bytes=fs.readFileSync(fireDef);if(sha256(bytes)!=='1af69c69087ef2f5723088c71515f6501cda120fe03f103b9acef5ae6dee4b2c')throw Error('Changed original animation');
 fs.mkdirSync(fireArt,{recursive:true});
 for(let phase=0;phase<6;phase++){
  const frames=[];for(let i=0;i<4;i++){const name=`phase${phase}-${i}.png`;fs.writeFileSync(fireArt+'/'+name,encodePng(fireTile(bytes,phase,i)));frames.push(name);}
  fs.writeFileSync(fireArt+`/phase${phase}.json`,JSON.stringify({basepath:'era-campaign/fire/',sequences:[{group:0,frames}]},null,2)+'\n');
 }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))generateFireArt();
