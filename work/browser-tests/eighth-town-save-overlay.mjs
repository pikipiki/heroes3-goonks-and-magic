/** Private old7/new8 configuration switch. The binary save is never edited. */
import fs from 'node:fs';import assert from 'node:assert/strict';
import {applyEighthTownsOverlay} from './eighth-town-overlay.mjs';
export async function applyEighthTownSaveOverlay(page,{eighth=false}={}){
 const stage=process.env.EIGHTH_TOWN_STAGE;assert(stage,'Complete independently validated EIGHTH_TOWN_STAGE required');
 const meta=JSON.parse(fs.readFileSync(stage+'/eighth-town-source.json'));assert(meta.enabled&&meta.all18ActorContractsComplete&&!meta.missingActorIds.length);
 if(eighth)await applyEighthTownsOverlay(page);
 const patch=Object.fromEntries(Object.entries(meta.baselineTowns).map(([key,town])=>{assert.equal(town.creatures.length,7);return [key,{town}];}));
 const marker=JSON.parse(fs.readFileSync('work/downloads/wog-port161/eighth-save-compatibility/content/config/era-bridge-eighth-town-save-compatibility.json'));
 await page.addInitScript(({eighth,patch,marker})=>{
  const previous=Object.getOwnPropertyDescriptor(window,'Module');let current;
  Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{previous?.set?.call(window,m);current=m;const prior=Object.getOwnPropertyDescriptor(m,'callMain');let main;
   Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;prior?.set?.call(m,f);},get:()=>function(...args){
    const invoke=prior?.get?prior.get.call(m):main,root='/home/web_user/.local/share/vcmi/Mods/tum-era/',file=root+'content/config/era-bridge-eighth-town-save-compatibility.json';
    const settingsFile='/home/web_user/.config/vcmi/settings.json';let settings={};try{settings=JSON.parse(m.FS.readFile(settingsFile,{encoding:'utf8'}));}catch{}settings.general={...settings.general,playerName:'Old save Player1',multiPlayerNames:['Old save Player2']};m.FS.mkdirTree('/home/web_user/.config/vcmi');m.FS.writeFile(settingsFile,JSON.stringify(settings));
    if(eighth)m.FS.writeFile(file,JSON.stringify(marker));
    else{
     try{m.FS.unlink(file);}catch{}
     const manifest=JSON.parse(m.FS.readFile(root+'mod.json',{encoding:'utf8'}));manifest.factions.push('config/seven-tier-save-owned-test.json');m.FS.writeFile(root+'content/config/seven-tier-save-owned-test.json',JSON.stringify(patch));m.FS.writeFile(root+'mod.json',JSON.stringify(manifest));
    }
    return invoke.apply(m,args);
   }});
  }});
 },{eighth,patch,marker});
}
