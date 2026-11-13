/** Private whole42 candidate; no release files or active feature are changed. */
import fs from 'node:fs';
export async function applyImp42Overlay(page){
 const stage=process.env.IMP42_STAGE||'work/downloads/wog-port158/imp42-stage-after43';
 const payload={creature:JSON.parse(fs.readFileSync(stage+'/content/config/source-imp42.candidate.json')),legacy:fs.readFileSync(stage+'/legacy/crexpbon-without42.candidate.txt','latin1')};
 await page.addInitScript(payload=>{
  const previous=Object.getOwnPropertyDescriptor(window,'Module');let current;
  Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{
   previous?.set?.call(window,m);current=m;const prior=Object.getOwnPropertyDescriptor(m,'callMain');let main;
   Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;prior?.set?.call(m,f);},get:()=>function(...args){
    const invoke=prior?.get?prior.get.call(m):main,root='/home/web_user/.local/share/vcmi/Mods/tum-era/';
    const manifest=JSON.parse(m.FS.readFile(root+'mod.json',{encoding:'utf8'}));
    manifest.creatures.push('config/imp42-owned-test.json');
    m.FS.writeFile(root+'content/config/imp42-owned-test.json',JSON.stringify(payload.creature));
    m.FS.writeFile('/home/web_user/.local/share/vcmi/Mods/wake-of-gods/Mods/stackExperience/Content/data/crexpbon.txt',payload.legacy);
    m.FS.writeFile(root+'mod.json',JSON.stringify(manifest));return invoke.apply(m,args);
   }});
  }});
 },payload);
}
