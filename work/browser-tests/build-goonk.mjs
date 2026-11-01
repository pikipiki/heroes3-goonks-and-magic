import {applyCreatureTiming,rebuildMotionProfiles} from './goonk-animation-profiles.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
import JSON5 from 'json5';
import {buildTown} from './build-goonk-town.mjs';
import {buildMotion} from './build-goonk-motion.mjs';
const work=path.resolve('..');
const repo=path.join(work,'vcmi-wasm');
const game=path.join(work,'game-data/homm3eng/home/web_user/.local/share/vcmi');
const mod=path.join(game,'Mods/goonk');
const out=path.resolve('../../outputs');
const assets=JSON.parse(fs.readFileSync(path.join(work,'goonk-reference/assets.json')));
const write=(relative,data)=>{const file=path.join(mod,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(data,null,2));};
const sourceSounds=path.resolve('../../mod/goonk/Content/Sounds');if(fs.existsSync(sourceSounds))fs.cpSync(sourceSounds,path.join(mod,'Content/Sounds'),{recursive:true});
const imageDir=path.join(mod,'Content/Sprites/goonk');fs.mkdirSync(imageDir,{recursive:true});
const blue=[91,85,195],pink=[200,65,154],clear={r:0,g:0,b:0,alpha:0};
const units=[
 {key:'pink',id:'paingpaing',name:'Paingpaing',evo:'Paingpaing, Bélier royal',level:1,hp:12,attack:5,defense:5,min:2,max:4,speed:5,growth:16,gold:70,kind:'nose',evoCell:0,building:'Atelier des nez',desc:'Frappe au corps à corps avec son grand nez. Évolution : deux coups de nez par attaque.'},
 {key:'lancer',id:'picpique',name:'Picpique',evo:'Picpique, Paladin des lances',level:2,hp:25,attack:8,defense:7,min:4,max:7,speed:6,growth:10,gold:140,kind:'lance',evoCell:8,building:'Forge des épées-lances',desc:'Combat avec une épée-lance. Son arme frappe aussi la case derrière la cible.'},
 {key:'archer',id:'zinzeclair',name:'Zinzéclair',evo:'Zinzéclair, Tempête explosive',level:3,hp:30,attack:9,defense:7,min:6,max:9,speed:6,growth:8,gold:220,kind:'lightning',evoCell:10,building:'Archerie des orages',desc:'Tire des flèches-éclairs, puis déclenche une explosion magique sur la cible et ses voisins. Attention aux alliés proches.'},
 {key:'fart',id:'bubu',name:'Bubu',evo:'Bubu, Grand pétomancien',level:4,hp:50,attack:10,defense:12,min:8,max:12,speed:5,growth:6,gold:330,kind:'gas',evoCell:4,building:'Jardin des pets',desc:'Attaque uniquement avec ses pets. Son nuage affaiblit la cible ; son évolution la ralentit aussi.'},
 {key:'vomit',id:'glouglou',name:'Glouglou',evo:'Glouglou, Alchimiste acide',level:5,hp:65,attack:12,defense:10,min:11,max:15,speed:6,growth:4,gold:500,kind:'slime',evoCell:12,building:'Laboratoire du vomi',desc:'Crache un jet de vomi cartoon à distance qui ronge la défense. Son évolution ajoute du poison.'},
 {key:'blue',id:'bobope',name:'Bobope',evo:'Bobope, Roi des rochers',level:6,hp:100,attack:15,defense:14,min:16,max:22,speed:6,growth:3,gold:850,kind:'rock',evoCell:2,building:'Carrière de Bobope',desc:'Lance de gros cailloux comme un Cyclope. Son évolution peut aussi tirer sur les remparts en siège.'},
 {key:'fire',id:'maillemaille',name:'La gros maille maille',evo:'La gros maille maille, Archimage du brasier',level:7,hp:180,attack:20,defense:18,min:25,max:35,speed:8,growth:2,gold:2200,kind:'fire',evoCell:6,building:'Tour des braises',desc:'Lance du feu à distance et peut lancer Boule de feu. Son évolution maîtrise aussi Inferno.'}
];
const png=async(file,pipeline)=>pipeline.png().toFile(path.join(imageDir,file));
const sheetFrames=async(key)=>{
 const input=assets[key];const m=await sharp(input).metadata();const w=Math.floor(m.width/4),h=Math.floor(m.height/2);
 const frames=[];
 for(let i=0;i<8;i++){
  const tile=await sharp(input).extract({left:(i%4)*w,top:Math.floor(i/4)*h,width:w,height:h}).png().toBuffer();
  const buf=await sharp(tile).trim().resize(88,94,{fit:'contain',background:clear}).png().toBuffer();
  const filename=`${key}-${i}.png`;await png(filename,sharp({create:{width:450,height:400,channels:4,background:clear}}).composite([{input:buf,left:158,top:164}]));frames.push('goonk/'+filename);
 }
 await png(key+'-large.png',sharp(input).extract({left:0,top:0,width:w,height:h}).resize(58,64,{fit:'contain',background:clear}));
 await png(key+'-small.png',sharp(path.join(imageDir,key+'-large.png')).resize(32,32,{fit:'contain',background:clear}));
 await png(key+'-map.png',sharp(input).extract({left:0,top:0,width:w,height:h}).resize(48,54,{fit:'contain',background:clear}).extend({top:5,bottom:5,left:8,right:8,background:clear}));
 return key==='fire'?[frames[0],frames[1],frames[2],frames[3],frames[4],frames[6],frames[7],frames[5]]:frames;
};
const sequence=(group,frames)=>({group,frames,generateShadow:1,generateOverlay:1});
const animation=(key,f)=>{
 const attack=key==='pink'?[f[0],f[3],f[3],f[4],f[0]]:[f[0],f[3],f[4],f[4],f[0]];
 const seq=[sequence(0,[f[1],f[2],f[1],f[2]]),sequence(1,[f[0],f[7],f[0]]),sequence(2,[f[0],f[0],f[7],f[0]]),sequence(3,[f[5],f[0]]),sequence(4,[f[5],f[0]]),sequence(5,[f[5],f[6],f[6]]),sequence(6,[f[5],f[6],f[6]]),sequence(7,[f[0]]),sequence(8,[f[0]])];
 for(let g=11;g<=19;g++)seq.push(sequence(g,attack));
 write('Content/Sprites/goonk/'+key+'.json',{sequences:seq});
 write('Content/Sprites/goonk/'+key+'-map.json',{sequences:[sequence(0,['goonk/'+key+'-map.png'])]});
 return seq;
};
const evolM=await sharp(assets.evolution).metadata();const ew=Math.floor(evolM.width/4),eh=Math.floor(evolM.height/4);
const evoFrame=async(cell,file)=>{
 const buf=await sharp(assets.evolution).extract({left:cell%4*ew,top:Math.floor(cell/4)*eh,width:ew,height:eh}).resize(98,98,{fit:'contain',background:clear}).png().toBuffer();
 await png(file,sharp({create:{width:450,height:400,channels:4,background:clear}}).composite([{input:buf,left:155,top:158}]));return 'goonk/'+file;
};
const after=(spell,expert=1)=>({type:'SPELL_AFTER_ATTACK',subtype:'spell.'+spell,val:100,addInfo:[expert,0]});
const creatures={};
for(const u of units){
 const frames=await sheetFrames(u.key);const seq=animation(u.key,frames);
 const ei=await evoFrame(u.evoCell,u.key+'-evo-idle.png'),ea=await evoFrame(u.evoCell+1,u.key+'-evo-attack.png');
 write('Content/Sprites/goonk/'+u.key+'-evo.json',{sequences:seq.map(s=>({...s,frames:s.group===5||s.group===6?s.frames:s.group===3||s.group===4?[ea,ei]:s.group>=11?[ei,ea,ea,ei]:[ei,ei,ei]}))});
 await png(u.key+'-evo-large.png',sharp(assets.evolution).extract({left:u.evoCell%4*ew,top:Math.floor(u.evoCell/4)*eh,width:ew,height:eh}).resize(58,64,{fit:'contain',background:clear}));
 await png(u.key+'-evo-small.png',sharp(path.join(imageDir,u.key+'-evo-large.png')).resize(32,32,{fit:'contain',background:clear}));
 for(const upgraded of [false,true]){
  const abilities={};const ranged=['lightning','gas','slime','rock','fire'].includes(u.kind);
  if(ranged)abilities.shooter={type:'SHOOTER'};
  if(u.kind==='nose'&&upgraded)abilities.doubleNose={type:'ADDITIONAL_ATTACK',val:1};
  if(u.kind==='lance')abilities.piercingLance={type:'TWO_HEX_ATTACK_BREATH'};
  if(u.kind==='lance'&&upgraded)abilities.noRetaliation={type:'BLOCKS_RETALIATION'};
  if(u.kind==='lightning'){abilities.explosiveArrow=after('fireball',upgraded?3:1);if(upgraded)abilities.stormArrow=after('lightningBolt',2);}
  if(u.kind==='gas'){abilities.stinky=after('weakness',upgraded?3:1);if(upgraded)abilities.stifling=after('slow',2);}
  if(u.kind==='slime'){abilities.acid=after('acidBreath');if(upgraded)abilities.poison=after('poison');}
  if(u.kind==='rock'&&upgraded)abilities.siege={type:'CATAPULT',subtype:'spell.cyclopsShot'};
  if(u.kind==='fire'){
   abilities.fireMagic={type:'SPELLCASTER',subtype:'spell.'+(upgraded?'inferno':'fireball'),val:upgraded?3:2};
   abilities.casts={type:'CASTS',val:upgraded?4:3};abilities.power={type:'CREATURE_SPELL_POWER',val:100};abilities.fireproof={type:'SPELL_IMMUNITY',subtype:'spell.fireball'};
  }
  const graphics={animation:'goonk/'+u.key+(upgraded?'-evo':''),map:'goonk/'+u.key+'-map',iconSmall:'goonk/'+u.key+(upgraded?'-evo':'')+'-small.png',iconLarge:'goonk/'+u.key+(upgraded?'-evo':'')+'-large.png'};
  if(ranged){
   graphics.missile={frameAngles:[90,45,0,-45,-90],offset:{upperX:20,upperY:-45,middleX:25,middleY:-35,lowerX:20,lowerY:-25},attackClimaxFrame:6};
   if(u.kind==='rock')graphics.missile.projectile='PCYCLBX.DEF';
   else if(u.kind==='lightning')graphics.missile.projectile='goonk/lightning-arrow';
   else graphics.missile.ray=[{start:u.kind==='fire'?[255,135,30,255]:[150,245,60,220],end:u.kind==='fire'?[255,30,20,190]:[60,170,35,160]}];
  }
  applyCreatureTiming({graphics},u.key,upgraded);
  const id=u.id+(upgraded?'Royal':'');
  creatures[id]={name:{singular:upgraded?u.evo:u.name,plural:upgraded?u.evo:u.name},description:u.desc,faction:'goonk',level:u.level,attack:u.attack+(upgraded?3:0),defense:u.defense+(upgraded?3:0),hitPoints:Math.round(u.hp*(upgraded?1.3:1)),speed:u.speed+(upgraded?1:0),damage:{min:Math.round(u.min*(upgraded?1.25:1)),max:Math.round(u.max*(upgraded?1.25:1))},growth:u.growth,horde:2,cost:{gold:Math.round(u.gold*(upgraded?1.4:1))},fightValue:Math.round(u.hp*u.attack*1.4*(upgraded?1.4:1)),aiValue:Math.round(u.hp*u.attack*1.4*(upgraded?1.4:1)),advMapAmount:{min:3,max:8},abilities,graphics,sound:{attack:'goonk/'+({nose:'nose',lance:'spear',lightning:'lightning',gas:'fart',slime:'vomit',rock:'boulder',fire:'fire'}[u.kind])+'.wav',defend:'PIKEDFND.wav',killed:'PIKEKILL.wav',move:'PIKEMOVE.wav',wince:'PIKEWNCE.wav',shoot:'goonk/'+({nose:'nose',lance:'spear',lightning:'lightning',gas:'fart',slime:'vomit',rock:'boulder',fire:'fire'}[u.kind])+'.wav'},...(ranged?{shots:u.kind==='gas'?12:16}:{}),...(!upgraded?{upgrades:[u.id+'Royal']}:{})};
 }
}
// A crisp code-native lightning bolt projectile; characters and town are generated raster art.
const bolt=Buffer.from('<svg width="52" height="20"><polygon points="0,11 20,4 18,9 40,1 31,9 51,9 30,19 33,12 13,17 16,11" fill="#e7faff" stroke="#9b61ff" stroke-width="1.5"/></svg>');
await png('lightning-arrow.png',sharp(bolt));write('Content/Sprites/goonk/lightning-arrow.json',{sequences:[{group:0,frames:Array(5).fill('goonk/lightning-arrow.png')}]});
await buildMotion({units,assets,imageDir,png,write});
write('Content/config/creatures.json',creatures);
rebuildMotionProfiles(imageDir);
const faction=JSON5.parse(fs.readFileSync(path.join(repo,'config/factions/castle.json'),'utf8')).castle;
delete faction.index;faction.name='Château Goonk';faction.description='Le royaume des peluches : nez, cailloux, feu et catastrophes magiques.';
const town=faction.town;town.names=['Goonkbourg','Fort Paingpaing','Roc-Bobope','Bubuville','Maille-la-Braise','La Cité des Sept Nez'];town.townBackground='goonk/town.png';town.creatures=units.map(u=>[u.id,u.id+'Royal']);town.siege.shooter='bobope';town.siege.towerIconSmall='goonk/blue-small.png';town.siege.towerIconLarge='goonk/blue-large.png';town.tavern={'core:knight':15,'core:cleric':15};town.tavernVideo='';
await png('town.png',sharp(assets.castle).resize(800,374));
for(const [name,w,h] of [['town-small.png',32,32],['town-large.png',58,64]])await png(name,sharp(assets.castle).resize(w,h));
town.icons={};for(const type of ['village','fort']){town.icons[type]={};for(const state of ['normal','built'])town.icons[type][state]={small:'goonk/town-small.png',large:'goonk/town-large.png'};}
await png('blank.png',sharp({create:{width:1,height:1,channels:4,background:clear}}));
let j=0;for(const [id,structure] of Object.entries(town.structures)){
 if(!structure)continue;
 const x=30+(j%7)*105,y=180+Math.floor(j/7)%2*80;
 const crop=`building-${j}.png`;await png(crop,sharp(path.join(imageDir,'town.png')).extract({left:x,top:y,width:95,height:65}));
 await png('area-'+j+'.png',sharp({create:{width:95,height:65,channels:4,background:{r:255,g:255,b:255,alpha:1}}}));
 write('Content/Sprites/goonk/building-'+j+'.json',{sequences:[{group:0,frames:['goonk/'+crop]}]});
 Object.assign(structure,{animation:'goonk/building-'+j,x,y,border:'goonk/blank.png',area:'goonk/area-'+j+'.png'});j++;
}
for(const [id,b] of Object.entries(town.buildings))if(b){b.name=id;b.description='Bâtiment du Château Goonk.';b.cost={gold:1000,wood:5,ore:5};}
for(const u of units){for(const [prefix,upgrade] of [['dwellingLvl',false],['dwellingUpLvl',true]]){const b=town.buildings[prefix+u.level];b.name=upgrade?u.building+' royale':u.building;b.description=u.desc;b.cost={gold:u.gold*3,wood:3+u.level,ore:3+u.level};}}
town.buildings.villageHall.cost={};town.buildings.villageHall.name='Maison des Goonks';town.buildings.townHall.name='Hôtel des nez';town.buildings.cityHall.name='Palais des peluches';town.buildings.capitol.name='Grand palais Goonk';town.buildings.tavern.name='Taverne des doudous';
await buildTown({town,faction,assets,units,png,write,imageDir,repo,out});
write('Content/config/faction.json',{goonk:faction});
write('mod.json',{name:'Château Goonk',description:'Sept peluches et leurs évolutions : Paingpaing, Bobope, Bubu, La gros maille maille et leurs amis.',author:'Création personnelle',version:'0.3.0',modType:'Town',compatibility:{min:'1.7.3'},factions:['config/faction.json'],creatures:['config/creatures.json'],heroes:['config/heroes.json'],keepDisabled:false});
write('Content/config/heroes.json',{gardienGoonk:{class:'core:knight',female:false,special:false,texts:{name:'Gardien des Goonks',biography:'Protecteur du royaume des sept nez.',specialty:{name:'Paingpaing',description:'Renforce les unités Paingpaing.',tooltip:'{Paingpaing}\nSpécialiste des coups de nez.'}},images:{large:'goonk/pink-large.png',small:'goonk/pink-small.png',specialtySmall:'goonk/pink-small.png',specialtyLarge:'goonk/pink-large.png'},army:[{creature:'paingpaing',min:20,max:20},{creature:'bobope',min:3,max:3}],skills:[{skill:'core:leadership',level:'basic'}],specialty:{creature:'paingpaing'}}});
// Small native VCMI showcase map, separate from existing campaigns and saves.
const mapdir=path.join(work,'goonk-map');fs.mkdirSync(mapdir,{recursive:true});
const header={versionMajor:3,versionMinor:0,name:'000 - Château Goonk',description:'Découvrez les sept Goonks et leurs évolutions. Entrez dans votre château, recrutez et affrontez les gardes devant la porte.',difficulty:'EASY',mapLevels:{surface:{width:36,height:36,index:0,layer:'core:surface'}},players:{red:{canPlay:'PlayerOnly',allowedFactions:{anyOf:['goonk:goonk']},mainTown:{x:9,y:9,l:0,generateHero:false},mainHero:'goonkHero'},blue:{canPlay:'AIOnly',allowedFactions:{anyOf:['core:castle']},mainTown:{x:29,y:29,l:0,generateHero:false}}},mods:[{modId:'goonk',name:'Château Goonk',version:'0.1.0'}]};
const tmpl=(animation,mask)=>({animation,mask,visitableFrom:['+++','+-+','+++']});
const buildings=['villageHall','tavern','fort','dwellingLvl1'];
const objects=[
 {type:'core:town',subtype:'goonk:goonk',instanceName:'goonkTown',x:9,y:9,l:0,template:tmpl('goonk/map-town-v2',['VVVVVV','VVBBVV','VBBBBV','VBBBAV']),options:{owner:'red',name:'Goonkbourg',buildings:{allOf:buildings.map(b=>'goonk:'+b)}}},
 {type:'core:hero',subtype:'core:knight',instanceName:'goonkHero',x:9,y:11,l:0,template:tmpl('AH00_E.DEF',['AV']),options:{owner:'red',type:'goonk:gardienGoonk',army:units.map(u=>({type:'goonk:'+u.id,amount:u.level===1?30:u.level===7?3:6}))}},
 {type:'core:town',subtype:'core:castle',instanceName:'enemyTown',x:29,y:29,l:0,template:tmpl('AVCCAST0.DEF',['VVVVVV','VVBBVV','VBBBBV','VBBBAV']),options:{owner:'blue',name:'Fort des gardes',hasFort:true,army:[{type:'core:pikeman',amount:20}]}},
 {type:'core:monster',subtype:'goonk:paingpaing',instanceName:'trainingGuard',x:13,y:11,l:0,template:tmpl('goonk/pink-map',['A']),options:{amount:12,character:'savage',neverFlees:true}},
 {type:'core:monster',subtype:'core:ogre',instanceName:'trainingOgre',x:13,y:15,l:0,template:tmpl('AVWogrX0.DEF',['A']),options:{army:[{type:'core:ogre',amount:15}],amount:15,character:5}}
];
const translations={};
for(const obj of objects){if(obj.type==='core:town'){translations[obj.options.name]=obj.options.name;}if(obj.type==='core:monster'){obj.options.character='savage';obj.options.neverFlees=true;obj.options.noGrowing=true;}}
for(const [file,value]of Object.entries({'header.json':header,'objects.json':objects,'english.json':translations,'french.json':translations,'surface_terrain.json':Array.from({length:36},()=>Array(36).fill('gr0_'))})){fs.writeFileSync(path.join(mapdir,file),JSON.stringify(value));}
const mapfile=path.join(game,'Maps/000-Goonk.vmap');
execFileSync('/usr/bin/zip',['-q','-j',mapfile,...fs.readdirSync(mapdir).map(f=>path.join(mapdir,f))]);
fs.writeFileSync(path.join(out,'goonk-units.json'),JSON.stringify(units,null,2));
console.log(JSON.stringify({mod,mapfile,units:units.length,evolutions:units.length}));
fs.mkdirSync(path.join(out,'goonk-art'),{recursive:true});
for(const [key,file]of Object.entries(assets)){const destination=path.join(out,'goonk-art',key+'.png');if(path.resolve(file)!==path.resolve(destination))fs.copyFileSync(file,destination);}
