/** Private intrinsic controls. This never modifies installed source files. */
import fs from 'node:fs';
import {injectOwnedFiles} from './eighth-owned-files.mjs';

export async function applyPrimordialR0Overlay(page,options={}) {
 const stage='work/downloads/wog-port166/primordial-r0-stage';
 const read=name=>JSON.parse(fs.readFileSync(stage+'/'+name));
 const metadata=read('stage.json');
 if(metadata.activation!==false||metadata.nativeValidated!==false)throw Error('Private R0 stage required');
 await injectOwnedFiles(page,stage,metadata.records.flatMap(record=>record.assets));
 await page.addInitScript(payload=>{
  const previous=Object.getOwnPropertyDescriptor(window,'Module');let current;
  Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{
   previous?.set?.call(window,m);current=m;
   const prior=Object.getOwnPropertyDescriptor(m,'callMain');let main;
   Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;prior?.set?.call(m,f);},get:()=>function(...args){
    const invoke=prior?.get?prior.get.call(m):main;
    const root='/home/web_user/.local/share/vcmi/Mods/tum-era/';
    const read=n=>JSON.parse(m.FS.readFile(root+n,{encoding:'utf8'}));
    const write=(n,value)=>m.FS.writeFile(root+n,JSON.stringify(value));
    const manifest=read('mod.json');
    manifest.creatures.push('config/private-primordial-r0.json');
    write('content/config/private-primordial-r0.json',payload.definitions);
    write('content/config/era-bridge-primordial.json',payload.feature);
    for(const [name,patch] of Object.entries(payload.patches)) {
     const target=read('content/config/'+name+'.json');
     for(const [field,entries]of Object.entries(patch))Object.assign(target[field],entries);
     write('content/config/'+name+'.json',target);
    }
    if(Object.keys(payload.fixtures).length){
     manifest.creatures.push('config/private-primordial-controls.json');
     write('content/config/private-primordial-controls.json',payload.fixtures);
    }
    if(payload.layout){
     const {attacker,defender}=payload.layout;
     manifest.settings??={};manifest.settings.combat??={};manifest.settings.combat.layouts??={};
     manifest.settings.combat.layouts.default={tacticsAllowed:false,obstaclesAllowed:false,
      attackerCommander:137,defenderCommander:149,attackerUnits:attacker,defenderUnits:defender,
      attackerUnitsLoose:Array.from({length:7},()=>attacker),attackerUnitsTight:Array.from({length:7},()=>attacker),
      defenderUnitsLoose:Array.from({length:7},()=>defender),defenderUnitsTight:Array.from({length:7},()=>defender)};
    }
    write('mod.json',manifest);return invoke.apply(m,args);
   }});
  }});
 },{definitions:read('content/config/private-primordial-r0.json'),feature:read('content/config/era-bridge-primordial.json'),
  patches:Object.fromEntries(['era-bridge-runtime','era-bridge-status-attacks','era-bridge-fear'].map(name=>[name,read('patches/'+name+'.json')])),
  fixtures:options.fixtures||{},layout:options.layout||null});
}
