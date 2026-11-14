/** Standalone private union admission before callMain. Production files are untouched. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
export async function installDwelling185Candidate(page,options={}){
 const stage=process.env.DWELLING185_UNION||'/tmp/goonk-replacement185-union-complete',review=JSON.parse(fs.readFileSync(stage+'/union-review.json'));assert.equal(review.privateOnly,true);assert.equal(review.activated,false);assert.equal(review.source.missing.length,0);
 const patches=JSON.parse(fs.readFileSync(stage+'/registry-patches.json')),files=[];
 for(const file of fs.readdirSync(stage+'/content',{recursive:true})){const full=path.join(stage,'content',file);if(fs.statSync(full).isFile())files.push({path:'content/'+file,base64:fs.readFileSync(full).toString('base64')});}
 const gate=file=>({...JSON.parse(fs.readFileSync(file)),enabled:true,mode:'private-validation',nativeValidated:false,validation:{}});
 const admission=gate('tests/fixtures/tum/dwelling-xp17.json'),bankAdmission=gate('tests/fixtures/tum/bank-xp6.json');
 await page.addInitScript(payload=>{const previous=Object.getOwnPropertyDescriptor(window,'Module');let current;Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{previous?.set?.call(window,m);current=m;const prior=Object.getOwnPropertyDescriptor(m,'callMain');let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;prior?.set?.call(m,f);},get:()=>function(...args){
 const invoke=prior?.get?prior.get.call(m):main,root='/home/web_user/.local/share/vcmi/Mods/tum-era/',FS=m.FS,read=n=>JSON.parse(FS.readFile(root+n,{encoding:'utf8'})),write=(n,data)=>FS.writeFile(root+n,JSON.stringify(data));
 for(const file of payload.files){FS.mkdirTree((root+file.path).slice(0,(root+file.path).lastIndexOf('/')));FS.writeFile(root+file.path,Uint8Array.from(atob(file.base64),c=>c.charCodeAt(0)));}
 const manifest=read('mod.json'),p=payload.patches,o=payload.options;
 const append=(field,names)=>{manifest[field]??=[];for(const name of names)if(!manifest[field].includes(name))manifest[field].push(name);};
 append('creatures',['config/source-bank-actors.candidate.json','config/source-dwelling-actors.candidate.json']);
 append('creatures',payload.additionalCreatureConfigs);
 append('spells',['config/source-bank-spells.candidate.json','config/source-dwelling-spells.candidate.json']);append('objects',payload.objects);
 const merge=(name,field,entries)=>{const file='content/config/'+name+'.json',data=read(file);data[field]??={};Object.assign(data[field],entries??{});write(file,data);};
 for(const patch of[p.bank,p.dwelling]){
  const xp=read('content/config/era-bridge-experience.json');for(const[key,value]of Object.entries(patch.experience))if(key!==o.trainingActor||!xp.creatures[key])xp.creatures[key]=value;write('content/config/era-bridge-experience.json',xp);
  merge('era-bridge-skeleton-transformations','creatures',patch.skeleton);merge('era-bridge-status-attacks','sourceIds',patch.statusSourceIds);merge('era-bridge-fear','creatures',patch.fear);
  const runtime=read('content/config/era-bridge-runtime.json');for(const[key,value]of Object.entries(patch.runtime.creatures))runtime.creatures[key]={...(runtime.creatures[key]||{}),...value};write('content/config/era-bridge-runtime.json',runtime);
 }
 write('content/config/era-bank-actors.json',read('content/config/era-bank-actors.candidate.json'));
 const service=read('content/config/era-dwelling-services-v1.candidate.json');service.enabled=true;if(o.disableIntrinsicSourceIds){if(!Array.isArray(o.disableIntrinsicSourceIds)||!o.disableIntrinsicSourceIds.every(Number.isInteger))throw Error('Private intrinsic source IDs must be integer IDs');service.sourceIds=service.sourceIds.filter(id=>!o.disableIntrinsicSourceIds.includes(id));}write('content/config/era-dwelling-services-v1.json',service);
 write('content/config/era-bridge-dwelling-xp-admission-v1.json',payload.admission);write('content/config/era-bridge-bank-xp-admission-v1.json',payload.bankAdmission);
 const replacement=read('content/config/era-object-replacements-v1.json');replacement.enabled=o.replacements===true;write('content/config/era-object-replacements-v1.json',replacement);
 manifest.settings??={};manifest.settings.combat??={};manifest.settings.combat.layouts??={};Object.assign(manifest.settings.combat.layouts,p.bank.combatLayouts,p.stock?.settings?.combat?.layouts);
 if(o.controls){append('creatures',['config/private-dwelling185-controls.json']);write('content/config/private-dwelling185-controls.json',o.controls);}
 if(o.progression){const xp=read('content/config/era-bridge-experience.json');Object.assign(xp.creatures,o.progression);write('content/config/era-bridge-experience.json',xp);}
 if(o.layout){const a=o.layout.attacker,d=o.layout.defender;manifest.settings.combat.layouts.default={tacticsAllowed:false,obstaclesAllowed:false,attackerCommander:137,defenderCommander:149,attackerUnits:a,defenderUnits:d,attackerUnitsLoose:Array.from({length:7},()=>a),attackerUnitsTight:Array.from({length:7},()=>a),defenderUnitsLoose:Array.from({length:7},()=>d),defenderUnitsTight:Array.from({length:7},()=>d)};}
 const settingsFile='/home/web_user/.config/vcmi/settings.json';let settings={};try{settings=JSON.parse(FS.readFile(settingsFile,{encoding:'utf8'}));}catch{}settings.server={...settings.server,seed:o.seed??185102};FS.mkdirTree('/home/web_user/.config/vcmi');FS.writeFile(settingsFile,JSON.stringify(settings));
 write('mod.json',manifest);window.dwelling185Audit={privateOnly:true,sourcePrograms:102,replacements:o.replacements===true,seed:o.seed??185102,sourceXpMode:'private-validation'};return invoke.apply(m,args);
 }});}});},{files,patches,admission,bankAdmission,objects:review.objects,additionalCreatureConfigs:review.additionalCreatureConfigs??[],options});
}
