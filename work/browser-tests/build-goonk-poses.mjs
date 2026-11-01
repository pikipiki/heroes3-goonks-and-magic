import {applyMotionProfile,rebuildMotionProfiles} from './goonk-animation-profiles.mjs';
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import sharp from 'sharp';
import {cleanLegacyCreatureFrames} from './clean-goonk-legacy-frames.mjs';
import {isolatedBuilding} from './goonk-building-art.mjs';import {buildCreatureIcons} from './build-creature-icons.mjs';
const keys=['pink','lancer','archer','fart','vomit','blue','fire'],clear={r:0,g:0,b:0,alpha:0};
export async function buildGoonkPoses({imageDir,artDir}){
 const pose=async(input,file,breathe=0,smooth=false)=>{
  const clean=await isolatedBuilding(input);const scale=smooth?4:1,w=Math.round((88-breathe)*scale),h=Math.round((94+breathe)*scale);
  const sprite=await sharp(clean).resize(w,h,{fit:'contain',background:clear}).png().toBuffer();
  const rendered=await sharp({create:{width:450*scale,height:400*scale,channels:4,background:clear}}).composite([{input:sprite,left:160*scale+Math.round(breathe/2*scale),top:256*scale-h}]).png().toBuffer();
  await sharp(rendered).resize(450,400).png().toFile(path.join(imageDir,file));return 'goonk/'+file;
 };
 for(const royal of [false,true]){
  const sheets={};for(const kind of ['walk','attack']){const file=path.join(artDir,(royal?'royal':'base')+'-'+kind+'-v3.png');const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});const occupancy=[];
   for(let y=0;y<info.height;y++){let count=0;for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>100)count++;occupancy.push(count);}
   const bounds=[0];for(let i=1;i<7;i++){let score=Infinity,cut=0;for(let y=Math.round(info.height*i/7)-55;y<Math.round(info.height*i/7)+40;y++){let value=0;for(let k=-2;k<=2;k++)value+=occupancy[y+k]||0;if(value<score){score=value;cut=y;}}bounds.push(cut);}bounds.push(info.height);
   const columns=[];for(let row=0;row<7;row++){const cols=[0];for(let col=1;col<12;col++){let best=Infinity,cut=0;for(let x=Math.round(info.width*col/12)-22;x<=Math.round(info.width*col/12)+22;x++){let count=0;for(let y=bounds[row];y<bounds[row+1];y++)if(data[(y*info.width+x)*4+3]>100)count++;if(count<best){best=count;cut=x;}}cols.push(cut);}cols.push(info.width);columns.push(cols);}
   sheets[kind]={file,...info,bounds,columns};}
  for(let row=0;row<keys.length;row++){
   const key=keys[row],stem=key+(royal?'-evo':''),configPath=path.join(imageDir,stem+'.json'),config=JSON.parse(fs.readFileSync(configPath));
   // Existing hurt/death poses still work, but must not contain adjacent atlas cells.
   const old=new Set(config.sequences.filter(s=>s.group>=3&&s.group<=8).flatMap(s=>s.frames));for(const frame of old){const file=path.join(imageDir,path.basename(frame));await pose(await fs.promises.readFile(file),path.basename(frame));}
   const frames={};for(const kind of ['walk','attack']){
    const sheet=sheets[kind],cw=Math.floor(sheet.width/12),ch=Math.floor(sheet.height/7);frames[kind]=[];
    for(let col=0;col<12;col++){
     // Projectile-only storyboard cells are not creature poses. The engine draws missiles separately.
     const source=kind==='attack'&&((row===5&&[6,7].includes(col))||(!royal&&row===6&&[6,7].includes(col)))?(col===6?5:8):col;
     const tile=await sharp(sheet.file).extract({left:sheet.columns[row][source],top:sheet.bounds[row],width:sheet.columns[row][source+1]-sheet.columns[row][source],height:sheet.bounds[row+1]-sheet.bounds[row]}).png().toBuffer();
     frames[kind].push(await pose(tile,stem+'-v3-'+kind+'-'+col+'.png'));
    }
   }
   const base=await fs.promises.readFile(path.join(imageDir,path.basename(frames.walk[0]))),idle=[];
   for(let i=0;i<32;i++)idle.push(await pose(base,stem+'-v3-idle-'+i+'.png',Math.sin(i/32*Math.PI*2)*2,true));
   // Canonical cutout inputs for rebuilding native iconSmall/iconLarge.
   await fs.promises.copyFile(path.join(imageDir,path.basename(frames.walk[0])),path.join(imageDir,royal?stem+'-idle.png':key+'-0.png'));
   for(const s of config.sequences){if(s.group===0)s.frames=frames.walk;if(s.group===2)s.frames=idle;if(s.group===1)s.frames=[...frames.walk.slice(0,6),...frames.walk.slice(0,6).reverse()];if(s.group>=11&&s.group<=19)s.frames=frames.attack;if(s.group===20)s.frames=frames.walk.slice(0,3);if(s.group===21)s.frames=frames.walk.slice(0,3).reverse();}
   fs.writeFileSync(configPath,JSON.stringify(applyMotionProfile(config,stem,key,royal),null,2)+'\n');
  }
 }
 await cleanLegacyCreatureFrames(imageDir);
 await buildCreatureIcons(imageDir,keys);
 if(fs.existsSync(path.resolve(imageDir,'../../config/creatures.json')))rebuildMotionProfiles(imageDir);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=path.resolve('../..');await buildGoonkPoses({imageDir:path.join(root,'mod/goonk/Content/Sprites/goonk'),artDir:path.join(root,'outputs/goonk-art')});console.log('Goonk pose animations rebuilt');
}
