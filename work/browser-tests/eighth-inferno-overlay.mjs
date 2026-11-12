/** Private native validation overlay: never copied into published Mods. */
import fs from 'node:fs';
export async function applyInfernoOverlay(page,options={}){
 const review=process.env.INFERNO_REVIEW||'/tmp/goonk-inferno-source-review-147-ui',assets=process.env.INFERNO_ASSETS||'/tmp/goonk-inferno-resistance-review-147',read=p=>JSON.parse(fs.readFileSync(p)),report=read(review+'/native-closed-import-review.json'),all=read(review+'/content/config/native-closed-creatures.candidate.json'),definitions=Object.fromEntries([337,338].map(id=>['eraCreature'+id,all['eraCreature'+id]]));
 const files=report.records.filter(r=>[337,338].includes(r.eraId)).flatMap(r=>r.assets).map(a=>({path:a.path,bytes:[...fs.readFileSync(review+'/'+a.path)]}));
 for(const name of ['content/Sprites/tum-era/inferno-resistance/shotres.def','content/Sounds/tum-era/inferno-resistance/shotres.wav'])files.push({path:name,bytes:[...fs.readFileSync(assets+'/'+name)]});
 const profiles=Object.fromEntries(['era-bridge-experience','era-bridge-runtime','era-bridge-skeleton-transformations'].map(n=>[n,read(review+'/content/config/'+n+'.candidate.json')]));
 await page.addInitScript(({definitions,files,profiles,spells,options})=>{
  const previous=Object.getOwnPropertyDescriptor(window,'Module');let current;
  Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{previous?.set?.call(window,m);current=m;const priorMain=Object.getOwnPropertyDescriptor(m,'callMain');let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;priorMain?.set?.call(m,f);},get:()=>function(...args){
   const invoke=priorMain?.get?priorMain.get.call(m):main,root='/home/web_user/.local/share/vcmi/Mods/tum-era/',read=n=>JSON.parse(m.FS.readFile(root+n,{encoding:'utf8'})),write=(n,v)=>m.FS.writeFile(root+n,JSON.stringify(v)),manifest=read('mod.json');
   for(const file of files){m.FS.mkdirTree((root+file.path).split('/').slice(0,-1).join('/'));m.FS.writeFile(root+file.path,new Uint8Array(file.bytes));}
   manifest.creatures.push('config/inferno-owned-test.json');manifest.spells??=[];manifest.spells.push('config/inferno-owned-spells-test.json');
   const controls={'core:archer':{hitPoints:10000,speed:1,attack:30,defense:0,damage:{min:10,max:10},abilities:{noMorale:{type:'NO_MORALE'},noRange:{type:'NO_DISTANCE_PENALTY'}}},'core:gnoll':{hitPoints:1000,attack:0,defense:0,speed:1,abilities:{fixtureInactive:{type:'NOT_ACTIVE',subtype:'core:blind'}}}};
   write('content/config/inferno-owned-test.json',{...definitions,...controls});write('content/config/inferno-owned-spells-test.json',spells);
   for(const[name,candidate]of Object.entries(profiles)){const d=read('content/config/'+name+'.json');for(const id of[337,338])d.creatures['tum-era:eraCreature'+id]=candidate.creatures['tum-era:eraCreature'+id];if(name==='era-bridge-runtime'&&options.control)delete d.creatures['tum-era:eraCreature337'].sourceRangedResistance30;write('content/config/'+name+'.json',d);}
   for(const name of m.FS.readdir(root+'content/config').filter(n=>/^era-bridge-.*\.json$/.test(n))){const d=read('content/config/'+name);if(d.sourceIds){for(const id of[337,338])d.sourceIds['tum-era:eraCreature'+id]=id;write('content/config/'+name,d);}}
   const graphics=read('content/config/battles_graphics.json');graphics.ac_mapping=graphics.ac_mapping.filter(e=>e.id!==89).concat([{id:89,defnames:['tum-era/inferno-resistance/shotres.def']}]);write('content/config/battles_graphics.json',graphics);write('mod.json',manifest);
   if(options.noCommanders){const settingsPath='/home/web_user/.config/vcmi/modSettings.json',s=JSON.parse(m.FS.readFile(settingsPath,{encoding:'utf8'}));const preset=s.presets[s.activePreset||'default'];preset.settings??={};preset.settings['wake-of-gods']??={};preset.settings['wake-of-gods'].commanders=false;m.FS.writeFile(settingsPath,JSON.stringify(s));}
   return invoke.apply(m,args);
  }});}});
 },{definitions,files,profiles,spells:read(review+'/content/config/source-inferno-spells.candidate.json'),options});
}
