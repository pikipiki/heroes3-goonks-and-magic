import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';
import{parseJsonc}from'../../scripts/era-bridge/artifacts/importer.mjs';
export async function installReviewedWayfarer260Overlay(page,review,{noCommanders=false,controls={}}={}){
 const read=p=>JSON.parse(fs.readFileSync(p)),definitions=read(review+'/content/config/wayfarer260.candidate.json');
 const{validateWayfarer260}=await import('../../scripts/era-bridge/artifacts/wayfarer260.mjs');
 assert.deepEqual(Object.keys(definitions).sort(),['artifact260']);const runtime=validateWayfarer260(read(review+'/runtime.candidate.json')),files=[];
 const walk=(folder,relative='')=>{for(const item of fs.readdirSync(folder,{withFileTypes:true})){const rel=path.posix.join(relative,item.name),file=path.join(folder,item.name);if(item.isDirectory())walk(file,rel);else files.push(['Mods/tum-era/content/'+rel,fs.readFileSync(file).toString('base64')]);}};
 for(const type of['Data','Sprites'])walk(review+'/content/'+type,type);
 for(const[name,value]of[['reviewed-wayfarer260-artifact',definitions],['era-wayfarer-artifact',runtime]])files.push(['Mods/tum-era/content/config/'+name+'.json',Buffer.from(JSON.stringify(value)).toString('base64')]);
 if(noCommanders){const manifest=parseJsonc(fs.readFileSync('mod/wake-of-gods/Mods/Commanders/mod.json','utf8'));manifest.settings.modules.commanders=false;files.push(['Mods/wake-of-gods/Mods/Commanders/mod.json',Buffer.from(JSON.stringify(manifest)).toString('base64')]);}
 const creatureHook=Object.keys(controls).length?"manifest.creatures=Array.from(new Set([...manifest.creatures,'config/wayfarer260-test-controls.json']));":'';
 if(Object.keys(controls).length)files.push(['Mods/tum-era/content/config/wayfarer260-test-controls.json',Buffer.from(JSON.stringify(controls)).toString('base64')]);
 const injection=`{const root='/home/web_user/.local/share/vcmi/';const fs=module.FS;const manifestPath=root+'Mods/tum-era/mod.json';const manifest=JSON.parse(fs.readFile(manifestPath,{encoding:'utf8'}));manifest.artifacts=Array.from(new Set([...manifest.artifacts,'config/reviewed-wayfarer260-artifact.json']));${creatureHook}fs.unlink(manifestPath);fs.writeFile(manifestPath,JSON.stringify(manifest));for(const[file,base64]of ${JSON.stringify(files)}){const target=root+file;fs.mkdirTree(target.slice(0,target.lastIndexOf('/')));try{fs.unlink(target);}catch{}fs.writeFile(target,Uint8Array.from(atob(base64),c=>c.charCodeAt(0)));}}`;
 await page.route('**/game.html?*',async route=>{const response=await route.fetch(),html=await response.text(),needle='module.callMain(["--disable-video"]);';assert(html.includes(needle));await route.fulfill({response,body:html.replace(needle,injection+needle)});});
}
