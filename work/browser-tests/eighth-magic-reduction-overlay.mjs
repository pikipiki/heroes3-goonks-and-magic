/** Private source g migration and owned equipment control; never published. */
import fs from 'node:fs';
export async function applyMagicReductionOverlay(page,options={}){
 const stage=process.env.SOURCE_G_STAGE||'work/downloads/wog-port157/source-g-review';
 const payload={creatures:JSON.parse(fs.readFileSync(stage+'/content/config/source-experience-magic-reduction.candidate.json')),legacy:fs.readFileSync(stage+'/legacy/crexpbon.candidate.txt','latin1'),artifactAny:options.artifactAny||0};
 await page.addInitScript(payload=>{
  const previous=Object.getOwnPropertyDescriptor(window,'Module');let current;
  Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{
   previous?.set?.call(window,m);current=m;const descriptor=Object.getOwnPropertyDescriptor(m,'callMain');let main;
   Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;descriptor?.set?.call(m,f);},get:()=>function(...args){
    const invoke=descriptor?.get?descriptor.get.call(m):main,root='/home/web_user/.local/share/vcmi/Mods/tum-era/';
    const manifest=JSON.parse(m.FS.readFile(root+'mod.json',{encoding:'utf8'}));
    manifest.creatures.push('config/source-g-owned-test.json');
    m.FS.writeFile(root+'content/config/source-g-owned-test.json',JSON.stringify(payload.creatures));
    m.FS.writeFile('/home/web_user/.local/share/vcmi/Mods/wake-of-gods/Mods/stackExperience/Content/data/crexpbon.txt',payload.legacy);
    if(payload.artifactAny){
     manifest.artifacts.push('config/source-g-equipment-owned-test.json');
     m.FS.writeFile(root+'content/config/source-g-equipment-owned-test.json',JSON.stringify({'core:centaurAxe':{bonuses:{fixtureAny:{type:'SPELL_DAMAGE_REDUCTION',subtype:'spellSchool.any',val:payload.artifactAny}}}}));
    }
    m.FS.writeFile(root+'mod.json',JSON.stringify(manifest));return invoke.apply(m,args);
   }});
  }});
 },payload);
}
