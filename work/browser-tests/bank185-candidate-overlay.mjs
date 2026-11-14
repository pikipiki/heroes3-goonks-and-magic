/** Isolated six-bank candidate admission before callMain. Never writes production. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
export async function installBank185Candidate(page,options={}){
 const stage=process.env.BANK185_CANDIDATE||'/tmp/goonk-six-banks185',review=JSON.parse(fs.readFileSync(stage+'/six-banks-review.json'));assert.equal(review.activated,false);
 const patches=JSON.parse(fs.readFileSync(stage+'/bank-registry-patches.json'));
 const files=[];for(const f of fs.readdirSync(stage+'/content',{recursive:true})){const p=path.join(stage,'content',f);if(fs.statSync(p).isFile())files.push({path:'content/'+f,bytes:[...fs.readFileSync(p)]});}
 const admission={...JSON.parse(fs.readFileSync('tests/fixtures/tum/bank-xp6.json')),enabled:true,mode:'private-validation',nativeValidated:false,validation:{}};
 await page.addInitScript(payload=>{const previous=Object.getOwnPropertyDescriptor(window,'Module');let current;Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{previous?.set?.call(window,m);current=m;const prior=Object.getOwnPropertyDescriptor(m,'callMain');let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;prior?.set?.call(m,f);},get:()=>function(...args){
 const invoke=prior?.get?prior.get.call(m):main,root='/home/web_user/.local/share/vcmi/Mods/tum-era/',FS=m.FS,read=n=>JSON.parse(FS.readFile(root+n,{encoding:'utf8'})),write=(n,d)=>FS.writeFile(root+n,JSON.stringify(d));
 for(const f of payload.files){FS.mkdirTree((root+f.path).slice(0,(root+f.path).lastIndexOf('/')));FS.writeFile(root+f.path,new Uint8Array(f.bytes));}
 const p=payload.patches,manifest=read('mod.json');manifest.french??={};manifest.french.translations??=[];if(!manifest.french.translations.includes('config/source-bank-french.candidate.json'))manifest.french.translations.push('config/source-bank-french.candidate.json');
 for(const [field,names]of Object.entries({creatures:['config/source-bank-actors.candidate.json'],spells:['config/source-bank-spells.candidate.json'],objects:[48,51,64,65,66,67].map(id=>'config/objects/bank'+id+'.json')})){manifest[field]??=[];for(const name of names)if(!manifest[field].includes(name))manifest[field].push(name);}
 const merge=(name,field,entries)=>{const file='content/config/'+name+'.json',d=read(file);d[field]??={};Object.assign(d[field],entries);write(file,d);};
 const xp=read('content/config/era-bridge-experience.json');for(const[k,v]of Object.entries(p.experience))if(k!==payload.options.trainingActor||!xp.creatures[k])xp.creatures[k]=v;write('content/config/era-bridge-experience.json',xp);
 merge('era-bridge-skeleton-transformations','creatures',p.skeleton);merge('era-bridge-status-attacks','sourceIds',p.statusSourceIds);merge('era-bridge-fear','creatures',p.fear);
 const runtime=read('content/config/era-bridge-runtime.json');for(const[k,v]of Object.entries(p.runtime.creatures))runtime.creatures[k]={...(runtime.creatures[k]||{}),...v};write('content/config/era-bridge-runtime.json',runtime);
 write('content/config/era-bank-actors.json',read('content/config/era-bank-actors.candidate.json'));write('content/config/era-bridge-bank-xp-admission-v1.json',payload.admission);
 manifest.settings??={};manifest.settings.combat??={};manifest.settings.combat.layouts??={};Object.assign(manifest.settings.combat.layouts,p.combatLayouts);
 const o=payload.options;
 if(o.sourceId){const name='content/config/objects/bank'+o.sourceId+'.json',d=read(name),type=Object.values(d['core:creatureBank'].types)[0],reward=type.rewards.find(r=>r.mapDice===o.sourceState);if(!reward)throw Error('Original source bank state required');reward.appearChance={min:0,max:100};type.rewards=[reward];write(name,d);}
 if(o.controls){manifest.creatures.push('config/private-bank185-controls.json');write('content/config/private-bank185-controls.json',o.controls);}
 if(o.layout){const a=o.layout.attacker,d=o.layout.defender;manifest.settings.combat.layouts.default={tacticsAllowed:false,obstaclesAllowed:false,attackerCommander:137,defenderCommander:149,attackerUnits:a,defenderUnits:d,attackerUnitsLoose:Array.from({length:7},()=>a),attackerUnitsTight:Array.from({length:7},()=>a),defenderUnitsLoose:Array.from({length:7},()=>d),defenderUnitsTight:Array.from({length:7},()=>d)};}
 if(o.progression){const xp=read('content/config/era-bridge-experience.json');Object.assign(xp.creatures,o.progression);write('content/config/era-bridge-experience.json',xp);}
 write('mod.json',manifest);window.bank185Audit={privateOnly:true,sourceState:o.sourceState,sourceId:o.sourceId,sourceXpMode:'private-validation',sourceActors:payload.actors};return invoke.apply(m,args);
 }});}});},{files,patches,admission,actors:review.actors.map(a=>a.sourceId),options});
}
