/** Private whole355/356 source overlay. No active release data is modified. */
import fs from'node:fs';import{injectOwnedFiles}from'./eighth-owned-files.mjs';
export async function applyConfluxOverlay(page,options={}){
 const stage=process.env.CONFLUX_STAGE||'work/downloads/wog-port157/conflux-stage',read=n=>JSON.parse(fs.readFileSync(stage+'/'+n)),meta=read('stage.json');
 await injectOwnedFiles(page,stage,meta.records.flatMap(r=>r.assets));
 await page.addInitScript(payload=>{
  const previous=Object.getOwnPropertyDescriptor(window,'Module');let current;
  Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{previous?.set?.call(window,m);current=m;const priorMain=Object.getOwnPropertyDescriptor(m,'callMain');let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;priorMain?.set?.call(m,f);},get:()=>function(...args){
   const invoke=priorMain?.get?priorMain.get.call(m):main,root='/home/web_user/.local/share/vcmi/Mods/tum-era/',read=n=>JSON.parse(m.FS.readFile(root+n,{encoding:'utf8'})),write=(n,v)=>m.FS.writeFile(root+n,JSON.stringify(v));
   const manifest=read('mod.json');manifest.creatures.push('config/conflux-owned-test.json');manifest.spells??=[];manifest.spells.push('config/conflux-spells-owned-test.json');write('content/config/conflux-spells-owned-test.json',payload.spells);
   write('content/config/conflux-owned-test.json',payload.definitions);write('content/config/era-bridge-conflux.json',payload.feature);
   for(const[name,patch]of Object.entries(payload.patches)){const data=read('content/config/'+name+'.json');Object.assign(data.creatures,patch.creatures);write('content/config/'+name+'.json',data);}
   for(const name of m.FS.readdir(root+'content/config').filter(n=>/^era-bridge-.*\.json$/.test(n))){const data=read('content/config/'+name);if(data.sourceIds){for(const id of[355,356])data.sourceIds['tum-era:eraCreature'+id]=id;write('content/config/'+name,data);}}
   write('mod.json',manifest);return invoke.apply(m,args);
  }});}});
 },{definitions:read('content/config/source-conflux.json'),spells:read('content/config/source-conflux-spells.json'),feature:read('content/config/era-bridge-conflux.json'),patches:Object.fromEntries(['era-bridge-experience','era-bridge-skeleton-transformations','era-bridge-runtime'].map(n=>[n,read('patches/'+n+'.json')])),options});
}
