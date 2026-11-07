import fs from'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';import{buildGoonkPoses}from'./build-goonk-poses.mjs';import{applyCreatureTiming}from'./goonk-animation-profiles.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),dir=path.join(root,'mod/goonk'),read=p=>JSON.parse(fs.readFileSync(path.join(dir,p),'utf8')),write=(p,v)=>fs.writeFileSync(path.join(dir,p),JSON.stringify(v,null,2)+'\n');
const families=[['paingpaing','pink','Paingpaing, Nose Emperor','Paingpaing, Empereur des nez'],['picpique','lancer','Picpique, Crystal Lancer','Picpique, Lancier de cristal'],['zinzeclair','archer','Sonic, Storm Sovereign','Sonic, Souverain des orages'],['bubu','fart','Bubu, Supreme Fartomancer','Bubu, Pétomancien suprême'],['glouglou','vomit','Bobope, Grand Alchemist','Bobope, Grand alchimiste'],['bobope','blue','DioupDioup, Crystal Rock Emperor','DioupDioup, Empereur des rochers de cristal'],['maillemaille','fire','Big Maille Maille, Phoenix Archmage','La grosse maille maille, Archimage du phénix']];
const descriptions=[
 ['Imperial plush armour and three nose strikes per attack.','Armure impériale de peluche et trois coups de nez par attaque.'],
 ['A crystal spear also strikes the unit behind the target. Enemies cannot retaliate.','La lance de cristal frappe aussi la troupe derrière la cible. Les ennemis ne peuvent pas riposter.'],
 ['Lightning arrows trigger explosive magic and a lightning strike. Keep allies clear of the blast.','Les flèches-éclairs déclenchent une explosion magique et un éclair. Éloigne les alliés du souffle.'],
 ['Toxic gas clouds weaken and slow the target. Reinforced emerald armour protects this supreme fartomancer.','Les nuages de pets affaiblissent et ralentissent la cible. Une armure d’émeraude protège ce pétomancien suprême.'],
 ['Acid vomit erodes defence and poisons the target. A glowing alchemy tank feeds the grand alchemist.','Le vomi acide ronge la défense et empoisonne la cible. Un réservoir lumineux alimente le grand alchimiste.'],
 ['Hurls crystal boulders and can bombard fortress walls during a siege.','Lance des blocs de cristal et peut bombarder les remparts pendant un siège.'],
 ['Ranged flames and six casts of mastered Inferno, protected by radiant archmage armour.','Flammes à distance et six utilisations d’Inferno maîtrisé, sous une armure rayonnante d’archimage.']
];
const creatures=read('Content/config/creatures.json'),faction=read('Content/config/faction.json'),town=faction.goonk.town,fr=read('Content/translation/french.json'),imageDir=path.join(dir,'Content/Sprites/goonk');
for(const[row,[base,key,name,french]]of families.entries()){
 const id=base+'Exalted',royal=creatures[base+'Royal'],unit=structuredClone(royal);delete unit.upgrades;royal.upgrades=[id];
 unit.name={singular:name,plural:name};unit.description=descriptions[row][0];
 unit.attack+=3;unit.defense+=3;unit.hitPoints=Math.round(unit.hitPoints*1.35);unit.speed+=1;unit.damage={min:Math.round(unit.damage.min*1.3),max:Math.round(unit.damage.max*1.3)};unit.cost={gold:Math.round(royal.cost.gold*1.55)};if(row>=5)unit.cost.crystal=1;unit.aiValue=Math.round(royal.aiValue*1.6);unit.fightValue=Math.round(royal.fightValue*1.6);
 if(base==='paingpaing')unit.abilities.doubleNose.val=2;
 if(base==='maillemaille'){unit.abilities.casts.val=6;unit.abilities.fireMagic.val=3;}
 const stem=key+'-exalted';unit.graphics.animation='goonk/'+stem;unit.graphics.map='goonk/'+stem+'-map';unit.graphics.iconSmall='goonk/'+stem+'-small.png';unit.graphics.iconLarge='goonk/'+stem+'-large.png';if(key==='vomit')applyCreatureTiming(unit,key,true);creatures[id]=unit;
 fr['creatures.goonk.'+id+'.name.singular']=french;fr['creatures.goonk.'+id+'.name.plural']=french;fr['creatures.goonk.'+id+'.description']=descriptions[row][1];
 town.creatures[row]=[base,base+'Royal',id,...town.creatures[row].slice(3)];
 if(town.creatures[row][3])unit.upgrades=[town.creatures[row][3]];const bkey='dwellingUp2Lvl'+(row+1),prior='dwellingUpLvl'+(row+1),b=structuredClone(town.buildings[prior]);
 b.id=44+row;b.upgrades=prior;b.requires=['castle'];b.name=name+' Sanctuary';b.description='Allows recruitment and paid upgrades to '+name+'.';b.cost={gold:Math.round(unit.cost.gold*4),wood:6+row,ore:6+row};if(row>=4)b.cost.crystal=3+row;
 town.buildings[bkey]=b;town.structures[bkey]=structuredClone(town.structures[prior]);
 for(const line of town.hallSlots)for(const slot of line)if(slot.includes(prior)&&!slot.includes(bkey))slot.push(bkey);
 fr['building.goonk.goonk.'+bkey+'.name']='Sanctuaire de '+french;fr['building.goonk.goonk.'+bkey+'.description']='Permet de recruter '+french+' et de faire évoluer ses troupes contre paiement.';
 const config=path.join(imageDir,stem+'.json');if(!fs.existsSync(config))fs.copyFileSync(path.join(imageDir,key+'-evo.json'),config);
}
const cards=read('Content/Sprites/goonk/building-cards-v2.json');for(let row=0;row<7;row++)cards.sequences[0].frames[44+row]=cards.sequences[0].frames[37+row];write('Content/Sprites/goonk/building-cards-v2.json',cards);
write('Content/config/creatures.json',creatures);write('Content/config/faction.json',faction);write('Content/translation/french.json',fr);const manifest=read('mod.json');if(!creatures.maillemailleSolar){manifest.version='0.4.1';manifest.description='Seven plush creature families, each with three forms, native recruitment and paid upgrades.';}write('mod.json',manifest);
if(process.env.GOONK_SKIP_SPRITES!=='1')await buildGoonkPoses({imageDir,artDir:path.join(root,'outputs/goonk-art'),grades:['exalted']});
if(!creatures.maillemailleSolar)write('anatomy.json',{version:2,maxArms:2,maxFeet:2,scope:'All 21 forms, including original base and royal forms',states:['walk','idle','fidget','attack','shoot','hit','defend','death','map','small icon','large icon'],grades:['base','royal','exalted'],families:families.map(([id,key])=>({id,key})),notes:'One isolated full-body sprite per frame; no crossfaded bodies. Projectile-only storyboard cells are replaced with complete follow-through poses.'});
console.log('Built seven complete third-upgrade chains and three grades of isolated Goonk poses');
