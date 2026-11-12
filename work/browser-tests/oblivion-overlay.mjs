/** Private source268 fixture, installed before engine initialization. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
export async function installOblivionOverlay(page,review){
 const definitions=JSON.parse(fs.readFileSync(review+'/content/config/oblivion.candidate.json'));
 assert.deepEqual(Object.keys(definitions),['artifact268']);
 const runtime=JSON.parse(fs.readFileSync(review+'/runtime.candidate.json'));
 assert.deepEqual(runtime,{schemaVersion:1,artifact:'tum-era:artifact268'});
 const files=[];
 const walk=(folder,relative='')=>{for(const item of fs.readdirSync(folder,{withFileTypes:true})){const rel=path.posix.join(relative,item.name),file=path.join(folder,item.name);if(item.isDirectory())walk(file,rel);else files.push(['Mods/tum-era/content/'+rel,fs.readFileSync(file).toString('base64')]);}};
 for(const type of ['Data','Sprites'])walk(review+'/content/'+type,type);
 for(const [name,value] of [['reviewed-oblivion',definitions],['era-oblivion-artifact-service',runtime]])files.push(['Mods/tum-era/content/config/'+name+'.json',Buffer.from(JSON.stringify(value)).toString('base64')]);
 const injection=`{const root='/home/web_user/.local/share/vcmi/',fs=module.FS,p=root+'Mods/tum-era/mod.json';const manifest=JSON.parse(fs.readFile(p,{encoding:'utf8'}));manifest.artifacts=Array.from(new Set([...manifest.artifacts,'config/reviewed-oblivion.json']));fs.unlink(p);fs.writeFile(p,JSON.stringify(manifest));for(const [name,data] of ${JSON.stringify(files)}){const target=root+name;fs.mkdirTree(target.slice(0,target.lastIndexOf('/')));try{fs.unlink(target);}catch{}fs.writeFile(target,Uint8Array.from(atob(data),c=>c.charCodeAt(0)));}}`;
 await page.route('**/game.html?*',async route=>{const response=await route.fetch(),html=await response.text(),needle='module.callMain(["--disable-video"]);';assert(html.includes(needle));await route.fulfill({response,body:html.replace(needle,injection+needle)});});
}
