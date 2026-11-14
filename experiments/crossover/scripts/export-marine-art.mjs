// Reuse the audited OpenBW renderer and Blizzard archive for VCMI's catalogue
// icon/adventure image. The live mixed fight uses animated native sprite layers.
import {chromium} from '../../../work/browser-tests/node_modules/playwright-core/index.mjs';
import {silenceTestAudio} from '../../../work/browser-tests/silent-audio.mjs';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();await silenceTestAudio(page);
 await page.goto('http://127.0.0.1:8778/crossover/starcraft/index.html');
 await page.waitForFunction(()=>!document.querySelector('#start-game').disabled,null,{timeout:180000});
 await page.evaluate(()=>window.openbwLaunchCrossover({version:1,battleId:1,stacks:[{id:0,side:0,unit:0,count:1,health:40},{id:1,side:1,unit:37,count:1,health:35}]}));
 const png=await page.evaluate(()=>{
  const api=window.openbwCrossover,unit=api.census().units.find(u=>u.stackId===0),layer=api.layer();
  const source=document.createElement('canvas');source.width=800;source.height=500;source.getContext('2d').putImageData(new ImageData(layer.pixels,800,500),0,0);
  const c=document.createElement('canvas');c.width=c.height=96;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
  const pixels=source.getContext('2d').getImageData(0,0,800,500).data;
  let left=800,right=-1,top=500,bottom=-1;
  const ux=unit.x-layer.x,uy=unit.y-layer.y;
  for(let y=Math.max(0,uy-90);y<Math.min(500,uy+90);y++)for(let x=Math.max(0,ux-90);x<Math.min(800,ux+90);x++)if(pixels[(y*800+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  if(right<left)throw Error('Empty native Marine art');
  const width=right-left+1,height=bottom-top+1,scale=Math.min(60/width,72/height);
  ctx.drawImage(source,left,top,width,height,(96-width*scale)/2,90-height*scale,width*scale,height*scale);
  return c.toDataURL('image/png').split(',')[1];
 });
 const target=new URL('../../../mod/heroes-starcraft/content/sprites/crossover/',import.meta.url);fs.mkdirSync(target,{recursive:true});fs.writeFileSync(new URL('marine.png',target),Buffer.from(png,'base64'));
 console.log('Exported original native Marine sprite for VCMI catalogue.');
}finally{await browser.close();}
