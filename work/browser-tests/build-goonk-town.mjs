import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import JSON5 from 'json5';

// Discard isolated fragments from neighboring atlas cells before making game assets.
async function isolatedBuilding(tile){
 const {data,info}=await sharp(tile).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {width:w,height:h}=info,seen=new Uint8Array(w*h);let largest=[];
 for(let p=0;p<w*h;p++){
  if(seen[p]||data[p*4+3]<64)continue;
  const component=[p];seen[p]=1;
  for(let i=0;i<component.length;i++){
   const q=component[i],x=q%w,y=Math.floor(q/w);
   for(const [xx,yy]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){if(xx<0||xx>=w||yy<0||yy>=h)continue;const n=yy*w+xx;if(!seen[n]&&data[n*4+3]>=64){seen[n]=1;component.push(n);}}
  }
  if(component.length>largest.length)largest=component;
 }
 const keep=new Uint8Array(w*h);
 for(const q of largest){const x=q%w,y=Math.floor(q/w);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<w&&yy>=0&&yy<h)keep[yy*w+xx]=1;}}
 for(let p=0;p<keep.length;p++)if(!keep[p])data[p*4+3]=0;
 return sharp(data,{raw:{width:w,height:h,channels:4}}).trim().png().toBuffer();
}

// The same isolated building image supplies the town, construction card and hit mask.
export async function buildTown({town,faction,assets,units,png,write,imageDir,repo,out}){
 const clear={r:0,g:0,b:0,alpha:0};
 await png('town-v2.png',sharp(assets.emptyTown).resize(800,374));
 town.townBackground='goonk/town-v2.png';
 for(const [name,w,h] of [['town-small-v2.png',48,32],['town-large-v2.png',58,64]])
  await png(name,sharp(assets.castle).resize(w,h,{fit:'cover'}).removeAlpha());
 for(const t of ['village','fort'])for(const s of ['normal','built'])town.icons[t][s]={small:'goonk/town-small-v2.png',large:'goonk/town-large-v2.png'};
 // Native preview rectangles are 100/120/130 px; backgrounds must fill those exact sizes.
 for(const n of [120,130])await png('creature-bg-'+n+'.png',sharp(assets.castle).resize(n,130,{fit:'cover'}).removeAlpha());
 faction.creatureBackground={'120px':'goonk/creature-bg-120.png','130px':'goonk/creature-bg-130.png'};
 const meta=await sharp(assets.buildings).metadata(),cw=Math.floor(meta.width/4),ch=Math.floor(meta.height/4);
 const cells=[];
 for(let c=0;c<16;c++){const tile=await sharp(assets.buildings).extract({left:c%4*cw,top:Math.floor(c/4)*ch,width:cw,height:ch}).png().toBuffer();cells.push(await isolatedBuilding(tile));}
 const layouts={
  villageHall:[0,112,215,125,106],townHall:[0,112,215,125,106],cityHall:[1,112,190,125,131],capitol:[1,112,190,125,131],
  fort:[2,430,74,155,132],citadel:[2,420,62,175,144],castle:[2,410,48,195,158],
  tavern:[3,12,172,94,85],special3:[3,12,172,94,85],marketplace:[4,250,263,112,83],resourceSilo:[15,367,290,58,62],
  mageGuild1:[5,145,73,87,120],mageGuild2:[5,145,68,87,125],mageGuild3:[5,145,63,87,130],mageGuild4:[5,145,58,87,135],
  shipyard:[6,665,263,127,100],ship:[6,665,263,127,100],blacksmith:[7,335,178,84,80],special1:[15,708,210,55,60],special2:[9,235,214,75,70],grail:[15,550,208,65,88],
  dwellingLvl1:[8,12,272,95,90],dwellingLvl2:[9,245,125,100,85],dwellingLvl3:[10,30,86,106,80],dwellingLvl4:[11,567,237,98,113],dwellingLvl5:[12,435,274,106,84],dwellingLvl6:[13,645,126,143,100],dwellingLvl7:[14,295,39,105,135]
 };
 for(let l=1;l<=7;l++)layouts['dwellingUpLvl'+l]=layouts['dwellingLvl'+l];
 layouts.horde1=layouts.dwellingLvl3;layouts.horde1Upgr=layouts.dwellingLvl3;
 const library=JSON5.parse(fs.readFileSync(path.join(repo,'config/buildingsLibrary.json'),'utf8'));
 town.structures={};const iconFrames=Array(44).fill('goonk/card-villageHall.png');
 const placement={};
 for(const [id,b]of Object.entries(town.buildings)){
  if(!b||!layouts[id])continue;
  const [cell,x,y,w,h]=layouts[id];const sprite=await sharp(cells[cell]).resize(w-6,h-6,{fit:'contain',background:clear}).png().toBuffer();
  const normal=await sharp({create:{width:w,height:h,channels:4,background:clear}}).composite([{input:sprite,gravity:'south'}]).png().toBuffer();
  await png('structure-'+id+'.png',sharp(normal));
  const {data}=await sharp(normal).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const mask=Buffer.alloc(w*h*4),border=Buffer.alloc(w*h*4);
  const inside=(xx,yy)=>xx>=0&&xx<w&&yy>=0&&yy<h&&data[(yy*w+xx)*4+3]>=128;
  for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){
   const i=(yy*w+xx)*4;
   if(inside(xx,yy)){mask[i]=255;mask[i+1]=255;mask[i+2]=255;mask[i+3]=255;}
   else{let edge=false;for(let dy=-2;dy<=2&&!edge;dy++)for(let dx=-2;dx<=2;dx++)if(inside(xx+dx,yy+dy)){edge=true;break;}
    if(edge){border[i]=255;border[i+1]=235;border[i+2]=65;border[i+3]=255;}}
  }
  await png('hit-'+id+'.png',sharp(mask,{raw:{width:w,height:h,channels:4}}));
  await png('outline-'+id+'.png',sharp(border,{raw:{width:w,height:h,channels:4}}));
  write('Content/Sprites/goonk/structure-'+id+'.json',{sequences:[{group:0,frames:['goonk/structure-'+id+'.png']}]});
  town.structures[id]={animation:'goonk/structure-'+id,x,y,z:y+h,border:'goonk/outline-'+id+'.png',area:'goonk/hit-'+id+'.png',campaignBonus:'goonk/card-'+id+'.png',...(/^horde/.test(id)?{hidden:true}:{})};
  const cardBuilding=await sharp(cells[cell]).resize(140,66,{fit:'contain',background:clear}).png().toBuffer();
  await png('card-'+id+'.png',sharp(assets.emptyTown).resize(150,70,{fit:'cover'}).composite([{input:cardBuilding,gravity:'south'}]));
  const numeric=library[id]?.id;if(Number.isInteger(numeric)&&numeric<44)iconFrames[numeric]='goonk/card-'+id+'.png';
  placement[id]={x,y,w,h,cell};
 }
 town.buildingsIcons='goonk/building-cards-v2';
 write('Content/Sprites/goonk/building-cards-v2.json',{sequences:[{group:0,frames:iconFrames}]});
 const names={fort:'Remparts Goonks',citadel:'Citadelle des nez',castle:'Château des sept Goonks',marketplace:'Marché des peluches',resourceSilo:'Réserve des doudous',blacksmith:'Forge Goonk',shipyard:'Chantier des petits bateaux',special1:'Phare des peluches',special2:'Écurie des nez',special3:'Grande taverne des Goonks',horde1:'Cibles des orages',horde1Upgr:'Cibles royales',grail:'Grand nez sacré',ship:'Bateau Goonk'};
 for(let n=1;n<=4;n++)names['mageGuild'+n]='Guilde des sortilèges '+n;
 for(const [id,name]of Object.entries(names))if(town.buildings[id])town.buildings[id].name=name;
 // A readable linear creature progression replaces the inherited Castle/angel prerequisites.
 for(const u of units){town.buildings['dwellingLvl'+u.level].requires=u.level===1?['fort']:['dwellingLvl'+(u.level-1)];}
 // Custom adventure-map animation, anchored like native 6x4 town templates.
 const mapSprite=await sharp(assets.mapCastle).trim().resize(184,145,{fit:'contain',background:clear}).png().toBuffer();
 await png('map-town-v2.png',sharp({create:{width:192,height:160,channels:4,background:clear}}).composite([{input:mapSprite,left:4,top:0}]));
 write('Content/Sprites/goonk/map-town-v2.json',{sequences:[{group:0,frames:['goonk/map-town-v2.png']}]});
 for(const template of Object.values(town.mapObject.templates))template.animation='goonk/map-town-v2';
 fs.writeFileSync(path.join(out,'goonk-building-layout-v2.json'),JSON.stringify(placement,null,2));
}
