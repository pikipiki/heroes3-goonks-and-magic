import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

export async function buildMotion({units,assets,imageDir,png,write}){
 const clear={r:0,g:0,b:0,alpha:0},m=await sharp(assets.idle).metadata(),cw=Math.floor(m.width/6),ch=Math.floor(m.height/7);
 const frame=async(input,name,breathe=0)=>{
  const pic=await sharp(input).trim().resize(88-Math.round(breathe),94+Math.round(breathe),{fit:'contain',background:clear}).png().toBuffer();
  await png(name,sharp({create:{width:450,height:400,channels:4,background:clear}}).composite([{input:pic,left:160+Math.round(breathe/2),top:256-(94+Math.round(breathe))}]));
  return 'goonk/'+name;
 };
 // Interpolate adjacent, nearly identical idle keyframes with premultiplied alpha.
 const transition=async(a,b,t,name)=>{
  const A=await sharp(path.join(imageDir,path.basename(a))).ensureAlpha().raw().toBuffer();
  const B=await sharp(path.join(imageDir,path.basename(b))).ensureAlpha().raw().toBuffer();const C=Buffer.alloc(A.length);
  for(let p=0;p<C.length;p+=4){const aa=A[p+3]*(1-t),bb=B[p+3]*t,alpha=aa+bb;C[p+3]=Math.round(alpha);if(alpha)for(let c=0;c<3;c++)C[p+c]=Math.round((A[p+c]*aa+B[p+c]*bb)/alpha);}
  await png(name,sharp(C,{raw:{width:450,height:400,channels:4}}));return 'goonk/'+name;
 };
 for(const [row,u]of units.entries()){
  const keys=[];
  for(let c=0;c<6;c++){
   const tile=await sharp(assets.idle).extract({left:c*cw,top:row*ch,width:cw,height:ch}).png().toBuffer();
   keys.push(await frame(tile,u.key+'-idle-key-'+c+'.png'));
  }
  const cycle=u.key==='blue'?[0,1,2,4,5,0]:[0,1,2,3,4,5];
  const idle=[];
  for(let c=0;c<6;c++)for(let k=0;k<4;k++)idle.push(k===0?keys[cycle[c]]:await transition(keys[cycle[c]],keys[cycle[(c+1)%6]],k/4,u.key+'-idle-'+c+'-'+k+'.png'));
  const config=JSON.parse(fs.readFileSync(path.join(imageDir,u.key+'.json')));
  config.sequences.find(s=>s.group===2).frames=idle;
  config.sequences.find(s=>s.group===1).frames=[...keys.slice(0,4),...keys.slice(2).reverse()];
  config.sequences.push({group:20,frames:[keys[0],keys[1]],generateShadow:1,generateOverlay:1},{group:21,frames:[keys[1],keys[0]],generateShadow:1,generateOverlay:1});
  const smooth=async(sequence,prefix)=>{
   const original=sequence.frames,frames=[];
   for(let i=0;i<original.length-1;i++){
    frames.push(original[i]);
    if(original[i]!==original[i+1])for(let k=1;k<3;k++)frames.push(await transition(original[i],original[i+1],k/3,prefix+'-'+i+'-'+k+'.png'));
   }
   frames.push(original.at(-1));sequence.frames=frames;
  };
  const attack=config.sequences.find(s=>s.group===12);await smooth(attack,u.key+'-attack-tween');
  for(const s of config.sequences)if(s.group>=11&&s.group<=19)s.frames=attack.frames;
  for(const group of [0,3,4])await smooth(config.sequences.find(s=>s.group===group),u.key+'-motion-'+group);
  write('Content/Sprites/goonk/'+u.key+'.json',config);
  const evoFile=path.join(imageDir,u.key+'-evo.json'),evo=JSON.parse(fs.readFileSync(evoFile));const ei=path.join(imageDir,u.key+'-evo-idle.png');
  const breathing=[];for(let f=0;f<24;f++)breathing.push(await frame(ei,u.key+'-royal-breathe-'+f+'.png',Math.sin(f/24*2*Math.PI)*2));
  evo.sequences.find(s=>s.group===2).frames=breathing;
  evo.sequences.find(s=>s.group===1).frames=[...breathing.slice(0,8),...breathing.slice(0,8).reverse()];
  evo.sequences.push({group:20,frames:breathing.slice(0,3),generateShadow:1,generateOverlay:1},{group:21,frames:breathing.slice(0,3).reverse(),generateShadow:1,generateOverlay:1});
  const royalAttack=evo.sequences.find(s=>s.group===12);await smooth(royalAttack,u.key+'-royal-attack-tween');
  for(const s of evo.sequences)if(s.group>=11&&s.group<=19)s.frames=royalAttack.frames;
  write('Content/Sprites/goonk/'+u.key+'-evo.json',evo);
  // Portraits are composited once at their native dimensions, so every army slot has scenery.
  for(const royal of [false,true])for(const [kind,w,h]of [['large',58,64],['small',32,32]]){
   const file=u.key+(royal?'-evo':'')+'-'+kind+'.png',portrait=await sharp(path.join(imageDir,file)).trim().resize(w-4,h-4,{fit:'contain',background:clear}).png().toBuffer();
   await png(file,sharp(assets.castle).resize(w,h,{fit:'cover'}).composite([{input:portrait,gravity:'south'}]).removeAlpha());
  }
 }
}
