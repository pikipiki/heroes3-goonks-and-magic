/** Private source351/352 overlay; never included in published game data. */
import fs from'node:fs';
import{injectOwnedFiles}from'./eighth-owned-files.mjs';
export async function applyDungeonOverlay(page,options={}){
 const stage=process.env.DUNGEON_STAGE||'/tmp/goonk-dungeon-stage-151',read=n=>JSON.parse(fs.readFileSync(stage+'/'+n)),metadata=read('stage.json');
 await injectOwnedFiles(page,stage,metadata.records.flatMap(r=>r.assets));
 const payload={definitions:read('content/config/source-dungeon.json'),spells:read('content/config/source-dungeon-spells.json'),profiles:read('patches/era-bridge-experience.json'),skeleton:read('patches/era-bridge-skeleton-transformations.json'),status:read('patches/era-bridge-status-attacks.json'),options};
 await page.addInitScript(payload=>{
  const previous=Object.getOwnPropertyDescriptor(window,'Module');let current;
  Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{previous?.set?.call(window,m);current=m;const priorMain=Object.getOwnPropertyDescriptor(m,'callMain');let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;priorMain?.set?.call(m,f);},get:()=>function(...args){
   const invoke=priorMain?.get?priorMain.get.call(m):main,root='/home/web_user/.local/share/vcmi/Mods/tum-era/',read=n=>JSON.parse(m.FS.readFile(root+n,{encoding:'utf8'})),write=(n,v)=>m.FS.writeFile(root+n,JSON.stringify(v));
   const manifest=read('mod.json');manifest.creatures.push('config/dungeon-owned-test.json');manifest.spells??=[];manifest.spells.push('config/dungeon-spells-owned-test.json');
   if(payload.options.wrapFixture)payload.definitions.eraCreature352.damage={min:50,max:50};
   if(payload.options.rayFixture){payload.definitions.eraCreature351.damage={min:35,max:35};if(payload.options.rayControl)delete payload.definitions.eraCreature351.abilities.sourceSharpshooter;}
   const controls={'core:gnoll':{hitPoints:payload.options.enemyHealth||1000000,attack:0,defense:0,speed:payload.options.enemySpeed||10,damage:{min:1,max:1},abilities:{fixtureNoMorale:{type:'NO_MORALE'}}}};
   if(payload.options.enemyInactive)controls['core:gnoll'].abilities.fixtureInactive={type:'NOT_ACTIVE',subtype:'core:blind'};
   if(payload.options.commanderHealth)controls['wake-of-gods.commanders:paladin1']={hitPoints:payload.options.commanderHealth,...(payload.options.commanderSpeed!==undefined?{speed:payload.options.commanderSpeed}:{})};
   write('content/config/dungeon-owned-test.json',{...payload.definitions,...controls});write('content/config/dungeon-spells-owned-test.json',payload.spells);
   for(const[name,patch]of[['era-bridge-experience',payload.profiles],['era-bridge-skeleton-transformations',payload.skeleton]]){const data=read('content/config/'+name+'.json');Object.assign(data.creatures,patch.creatures);write('content/config/'+name+'.json',data);}
   for(const name of m.FS.readdir(root+'content/config').filter(n=>/^era-bridge-.*\.json$/.test(n))){const data=read('content/config/'+name);if(data.sourceIds){Object.assign(data.sourceIds,payload.status.sourceIds);if(name==='era-bridge-status-attacks.json')for(const actor of payload.status.creatures)if(!data.creatures.includes(actor))data.creatures.push(actor);write('content/config/'+name,data);}}
   write('mod.json',manifest);return invoke.apply(m,args);
  }});}});
 },payload);
}
