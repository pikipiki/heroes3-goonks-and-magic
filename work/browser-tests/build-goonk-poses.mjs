import {applyMotionProfile,rebuildMotionProfiles} from './goonk-animation-profiles.mjs';
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import sharp from 'sharp';
import {cleanLegacyCreatureFrames} from './clean-goonk-legacy-frames.mjs';
import {isolatedBuilding} from './goonk-building-art.mjs';import {buildCreatureIcons} from './build-creature-icons.mjs';
const keys=['pink','lancer','archer','fart','vomit','blue','fire'],clear={r:0,g:0,b:0,alpha:0};
export async function buildGoonkPoses({imageDir,artDir,grades=['base','royal','exalted']}){
 const pose=async(input,file,breathe=0,smooth=false)=>{
  const clean=await isolatedBuilding(input);const scale=smooth?4:1,w=Math.round((88-breathe)*scale),h=Math.round((94+breathe)*scale);
  const sprite=await sharp(clean).resize(w,h,{fit:'contain',background:clear}).png().toBuffer();
  const rendered=await sharp({create:{width:450*scale,height:400*scale,channels:4,background:clear}}).composite([{input:sprite,left:160*scale+Math.round(breathe/2*scale),top:256*scale-h}]).png().toBuffer();
  await sharp(rendered).resize(450,400).png().toFile(path.join(imageDir,file));return 'goonk/'+file;
 };
 const readGrid=async(file,count)=>{
  const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true}),occupancy=[];
  for(let y=0;y<info.height;y++){let n=0;for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>100)n++;occupancy.push(n);}
  const bounds=[0];for(let i=1;i<7;i++){let score=Infinity,cut=0;for(let y=Math.round(info.height*i/7)-55;y<Math.round(info.height*i/7)+40;y++){let n=0;for(let k=-2;k<=2;k++)n+=occupancy[y+k]||0;if(n<score){score=n;cut=y;}}bounds.push(cut);}bounds.push(info.height);
  const columns=[];for(let row=0;row<7;row++){const cols=[0];for(let col=1;col<count;col++){let best=Infinity,cut=0;for(let x=Math.round(info.width*col/count)-22;x<=Math.round(info.width*col/count)+22;x++){let n=0;for(let y=bounds[row];y<bounds[row+1];y++)if(data[(y*info.width+x)*4+3]>100)n++;if(n<best){best=n;cut=x;}}cols.push(cut);}cols.push(info.width);columns.push(cols);}
  return {file,...info,bounds,columns};
 };
 const tileAt=async(sheet,row,col)=>sharp(sheet.file).extract({left:sheet.columns[row][col],top:sheet.bounds[row],width:sheet.columns[row][col+1]-sheet.columns[row][col],height:sheet.bounds[row+1]-sheet.bounds[row]}).png().toBuffer();
 // Focused anatomical corrections override the legacy DioupDioup storyboard only.
 const bobopeTile=async(kind,index=0)=>{
  const file=path.join(artDir,'bobope-base-'+kind+'-v5.png');
  const {width,height}=await sharp(file).metadata();
  const columns=kind==='injury'?2:4,rows=kind==='injury'?1:3;
  const left=Math.round(width*(index%columns)/columns),top=Math.round(height*Math.floor(index/columns)/rows);
  return sharp(file).extract({left,top,width:Math.round(width*((index%columns)+1)/columns)-left,height:Math.round(height*(Math.floor(index/columns)+1)/rows)-top}).png().toBuffer();
 };
 const injuryFile=path.join(artDir,'all-grades-hurt-death-v4.png'),injury=fs.existsSync(injuryFile)?await readGrid(injuryFile,6):null;
 for(const grade of grades){
  const royal=grade!=='base';
  if(!fs.existsSync(path.join(artDir,grade+'-walk-v3.png')))continue;
  const sheets={};for(const kind of ['walk','attack'])sheets[kind]=await readGrid(path.join(artDir,grade+'-'+kind+'-v3.png'),12);
  for(let row=0;row<keys.length;row++){
   const key=keys[row],stem=key+(grade==='exalted'?'-exalted':royal?'-evo':''),configPath=path.join(imageDir,stem+'.json');
   if(!fs.existsSync(configPath))continue;
   const config=JSON.parse(fs.readFileSync(configPath));
   const frames={};for(const kind of ['walk','attack']){
    const sheet=sheets[kind],cw=Math.floor(sheet.width/12),ch=Math.floor(sheet.height/7);frames[kind]=[];
    for(let col=0;col<12;col++){
     // Projectile-only storyboard cells are not creature poses. The engine draws missiles separately.
     const source=kind==='attack'&&((grade!=='exalted'&&row===5&&[6,7].includes(col))||(!royal&&row===6&&[6,7].includes(col)))?(col===6?5:8):col;
     const tile=await sharp(sheet.file).extract({left:sheet.columns[row][source],top:sheet.bounds[row],width:sheet.columns[row][source+1]-sheet.columns[row][source],height:sheet.bounds[row+1]-sheet.bounds[row]}).png().toBuffer();
     frames[kind].push(await pose(grade==='base'&&key==='blue'?await bobopeTile(kind,col):tile,stem+'-v3-'+kind+'-'+col+'.png'));
    }
   }
   const base=await fs.promises.readFile(path.join(imageDir,path.basename(frames.walk[0]))),idle=[];
   for(let i=0;i<32;i++)idle.push(await pose(base,stem+'-v3-idle-'+i+'.png',Math.sin(i/32*Math.PI*2)*2,true));
   {
    // Every grade uses a single canonical body. Never blend legacy limb poses.
    const column=['base','royal','exalted'].indexOf(grade)*2;
    const hurt=await pose(grade==='base'&&key==='blue'?await bobopeTile('injury',0):injury?await tileAt(injury,row,column):base,stem+'-hurt.png',injury?0:-2,true);
    const fallen=grade==='base'&&key==='blue'?await bobopeTile('injury',1):injury?await tileAt(injury,row,column+1):await sharp(await isolatedBuilding(base)).rotate(80,{background:clear}).png().toBuffer();
    const death=await pose(fallen,stem+'-fallen.png');
    for(const sequence of config.sequences){if(sequence.group===3||sequence.group===4)sequence.frames=[frames.walk[0],hurt,frames.walk[0]];if(sequence.group===5||sequence.group===6)sequence.frames=[hurt,death,death];}
    const map=await sharp(await isolatedBuilding(base)).resize(56,56,{fit:'contain',background:clear}).extend({top:4,bottom:4,left:4,right:4,background:clear}).png().toBuffer();
    await sharp(map).png().toFile(path.join(imageDir,stem+'-map.png'));
    fs.writeFileSync(path.join(imageDir,stem+'-map.json'),JSON.stringify({sequences:[{group:0,frames:['goonk/'+stem+'-map.png'],generateShadow:1,generateOverlay:1}]}));
   }
   // Canonical cutout inputs for rebuilding native iconSmall/iconLarge.
   await fs.promises.copyFile(path.join(imageDir,path.basename(frames.walk[0])),path.join(imageDir,royal?stem+'-idle.png':key+'-0.png'));
   for(const s of config.sequences){if(s.group===0)s.frames=frames.walk;if(s.group===2)s.frames=idle;if(s.group===1)s.frames=[...frames.walk.slice(0,6),...frames.walk.slice(0,6).reverse()];if(s.group>=11&&s.group<=19)s.frames=frames.attack;if(s.group===20)s.frames=frames.walk.slice(0,3);if(s.group===21)s.frames=frames.walk.slice(0,3).reverse();}
   fs.writeFileSync(configPath,JSON.stringify(applyMotionProfile(config,stem,key,royal),null,2)+'\n');
  }
 }
 await cleanLegacyCreatureFrames(imageDir);
 await buildCreatureIcons(imageDir,keys,fs.existsSync(path.join(imageDir,'pink-exalted.json'))?['','-evo','-exalted']:['','-evo']);
 if(fs.existsSync(path.resolve(imageDir,'../../config/creatures.json')))rebuildMotionProfiles(imageDir);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=path.resolve('../..');await buildGoonkPoses({imageDir:path.join(root,'mod/goonk/Content/Sprites/goonk'),artDir:path.join(root,'outputs/goonk-art')});console.log('Goonk pose animations rebuilt');
}
