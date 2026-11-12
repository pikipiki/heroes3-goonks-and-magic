/** Private native test overlay: inject source-reviewed assets before engine main.
 * Does not mutate the preview, active repository mod or persistent player data.
 */
import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';
import{validateAdvancedArtifactPolicy}from'../../scripts/era-bridge/artifacts/advanced-runtime.mjs';
import{parseJsonc}from'../../scripts/era-bridge/artifacts/importer.mjs';
export async function installReviewedArtifactOverlay(page,{advanced,mine}){
 const read=p=>JSON.parse(fs.readFileSync(p));
 const definitions={...read(advanced+'/content/config/diplomat-lightning.candidate.json'),...read(mine+'/content/config/fixed-opening-mine.candidate.json')};
 assert.deepEqual(Object.keys(definitions).sort(),['artifact180','artifact220','artifact222']);
 const runtime=validateAdvancedArtifactPolicy(read(advanced+'/runtime.candidate.json'));
 const files=[];
 const walk=(folder,relative='')=>{for(const item of fs.readdirSync(folder,{withFileTypes:true})){const rel=path.posix.join(relative,item.name),file=path.join(folder,item.name);if(item.isDirectory())walk(file,rel);else files.push(['Mods/tum-era/content/'+rel,fs.readFileSync(file).toString('base64')]);}};
 for(const overlay of[advanced,mine])for(const type of['Data','Sprites'])walk(overlay+'/content/'+type,type);
 for(const[name,value]of[['reviewed-advanced-artifacts',definitions],['era-advanced-artifact-services',runtime]])files.push(['Mods/tum-era/content/config/'+name+'.json',Buffer.from(JSON.stringify(value)).toString('base64')]);
 const injection=`{const root='/home/web_user/.local/share/vcmi/';const fs=module.FS;const manifestPath=root+'Mods/tum-era/mod.json';const manifest=JSON.parse(fs.readFile(manifestPath,{encoding:'utf8'}));manifest.artifacts=Array.from(new Set([...manifest.artifacts,'config/reviewed-advanced-artifacts.json']));fs.unlink(manifestPath);fs.writeFile(manifestPath,JSON.stringify(manifest));for(const[file,base64]of ${JSON.stringify(files)}){const target=root+file;fs.mkdirTree(target.slice(0,target.lastIndexOf('/')));try{fs.unlink(target);}catch{}fs.writeFile(target,Uint8Array.from(atob(base64),c=>c.charCodeAt(0)));}}`;
 await page.route('**/game.html?*',async route=>{const response=await route.fetch(),html=await response.text(),needle='module.callMain(["--disable-video"]);';assert(html.includes(needle),'Native engine startup hook available');await route.fulfill({response,body:html.replace(needle,injection+needle)});});
}

export async function installReviewedAtmaOverlay(page,review){
 const read=p=>JSON.parse(fs.readFileSync(p)),definitions=read(review+'/content/config/atma.candidate.json');
 const{validateStatefulArtifactPolicy}=await import('../../scripts/era-bridge/artifacts/stateful-runtime.mjs');
 assert.deepEqual(Object.keys(definitions).sort(),['artifact264','artifact265']);const runtime=validateStatefulArtifactPolicy(read(review+'/runtime.candidate.json')),files=[];
 const walk=(folder,relative='')=>{for(const item of fs.readdirSync(folder,{withFileTypes:true})){const rel=path.posix.join(relative,item.name),file=path.join(folder,item.name);if(item.isDirectory())walk(file,rel);else files.push(['Mods/tum-era/content/'+rel,fs.readFileSync(file).toString('base64')]);}};
 for(const type of['Data','Sprites'])walk(review+'/content/'+type,type);
 for(const[name,value]of[['reviewed-atma-artifacts',definitions],['era-stateful-artifact-services',runtime]])files.push(['Mods/tum-era/content/config/'+name+'.json',Buffer.from(JSON.stringify(value)).toString('base64')]);
 const injection=`{const root='/home/web_user/.local/share/vcmi/';const fs=module.FS;const manifestPath=root+'Mods/tum-era/mod.json';const manifest=JSON.parse(fs.readFile(manifestPath,{encoding:'utf8'}));manifest.artifacts=Array.from(new Set([...manifest.artifacts,'config/reviewed-atma-artifacts.json']));fs.unlink(manifestPath);fs.writeFile(manifestPath,JSON.stringify(manifest));for(const[file,base64]of ${JSON.stringify(files)}){const target=root+file;fs.mkdirTree(target.slice(0,target.lastIndexOf('/')));try{fs.unlink(target);}catch{}fs.writeFile(target,Uint8Array.from(atob(base64),c=>c.charCodeAt(0)));}}`;
 await page.route('**/game.html?*',async route=>{const response=await route.fetch(),html=await response.text(),needle='module.callMain(["--disable-video"]);';assert(html.includes(needle));await route.fulfill({response,body:html.replace(needle,injection+needle)});});
}

export async function installReviewedSilenceCapeOverlay(page,review){
 const definitions=JSON.parse(fs.readFileSync(review+'/content/config/silence-cape.candidate.json'));assert.deepEqual(Object.keys(definitions),['artifact267']);const files=[];
 const walk=(folder,relative='')=>{for(const item of fs.readdirSync(folder,{withFileTypes:true})){const rel=path.posix.join(relative,item.name),file=path.join(folder,item.name);if(item.isDirectory())walk(file,rel);else files.push(['Mods/tum-era/content/'+rel,fs.readFileSync(file).toString('base64')]);}};
 for(const type of['Data','Sprites'])walk(review+'/content/'+type,type);files.push(['Mods/tum-era/content/config/reviewed-silence-cape.json',Buffer.from(JSON.stringify(definitions)).toString('base64')]);
 const injection=`{const root='/home/web_user/.local/share/vcmi/',fs=module.FS,manifestPath=root+'Mods/tum-era/mod.json';const manifest=JSON.parse(fs.readFile(manifestPath,{encoding:'utf8'}));manifest.artifacts=Array.from(new Set([...manifest.artifacts,'config/reviewed-silence-cape.json']));fs.unlink(manifestPath);fs.writeFile(manifestPath,JSON.stringify(manifest));for(const[file,base64]of ${JSON.stringify(files)}){const target=root+file;fs.mkdirTree(target.slice(0,target.lastIndexOf('/')));try{fs.unlink(target);}catch{}fs.writeFile(target,Uint8Array.from(atob(base64),c=>c.charCodeAt(0)));}}`;
 await page.route('**/game.html?*',async route=>{const response=await route.fetch(),html=await response.text(),needle='module.callMain(["--disable-video"]);';assert(html.includes(needle));await route.fulfill({response,body:html.replace(needle,injection+needle)});});
}

export async function installReviewedInterferenceOverlay(page,review,{noCommanders=false,controls={}}={}){
 const read=p=>JSON.parse(fs.readFileSync(p)),definitions=read(review+'/content/config/interference.candidate.json');
 const{validateInterferencePolicy}=await import('../../scripts/era-bridge/artifacts/interference-runtime.mjs');
 assert.deepEqual(Object.keys(definitions).sort(),['artifact269','artifact270','artifact271']);const runtime=validateInterferencePolicy(read(review+'/runtime.candidate.json')),files=[];
 const walk=(folder,relative='')=>{for(const item of fs.readdirSync(folder,{withFileTypes:true})){const rel=path.posix.join(relative,item.name),file=path.join(folder,item.name);if(item.isDirectory())walk(file,rel);else files.push(['Mods/tum-era/content/'+rel,fs.readFileSync(file).toString('base64')]);}};
 for(const type of['Data','Sprites'])walk(review+'/content/'+type,type);
 for(const[name,value]of[['reviewed-interference-artifacts',definitions],['era-interference-artifact-services',runtime]])files.push(['Mods/tum-era/content/config/'+name+'.json',Buffer.from(JSON.stringify(value)).toString('base64')]);
 if(noCommanders){const manifest=parseJsonc(fs.readFileSync('mod/wake-of-gods/Mods/Commanders/mod.json','utf8'));manifest.settings.modules.commanders=false;files.push(['Mods/wake-of-gods/Mods/Commanders/mod.json',Buffer.from(JSON.stringify(manifest)).toString('base64')]);}
 const creatureHook=Object.keys(controls).length?"manifest.creatures=Array.from(new Set([...manifest.creatures,'config/interference-test-controls.json']));":'';
 if(Object.keys(controls).length)files.push(['Mods/tum-era/content/config/interference-test-controls.json',Buffer.from(JSON.stringify(controls)).toString('base64')]);
 const injection=`{const root='/home/web_user/.local/share/vcmi/';const fs=module.FS;const manifestPath=root+'Mods/tum-era/mod.json';const manifest=JSON.parse(fs.readFile(manifestPath,{encoding:'utf8'}));manifest.artifacts=Array.from(new Set([...manifest.artifacts,'config/reviewed-interference-artifacts.json']));${creatureHook}fs.unlink(manifestPath);fs.writeFile(manifestPath,JSON.stringify(manifest));for(const[file,base64]of ${JSON.stringify(files)}){const target=root+file;fs.mkdirTree(target.slice(0,target.lastIndexOf('/')));try{fs.unlink(target);}catch{}fs.writeFile(target,Uint8Array.from(atob(base64),c=>c.charCodeAt(0)));}}`;
 await page.route('**/game.html?*',async route=>{const response=await route.fetch(),html=await response.text(),needle='module.callMain(["--disable-video"]);';assert(html.includes(needle));await route.fulfill({response,body:html.replace(needle,injection+needle)});});
}


export async function installReviewedOriginal157Overlay(page,review,{controls={},noCommanders=true}={}){
 const definitions=JSON.parse(fs.readFileSync(review+'/definition.candidate.json')),runtime=JSON.parse(fs.readFileSync(review+'/runtime.candidate.json'));assert.deepEqual(Object.keys(definitions),['crimsonShieldOfRetribution']);
 const{validateOriginalRetaliationShield}=await import('../../scripts/era-bridge/artifacts/original-retaliation157.mjs');validateOriginalRetaliationShield(runtime);
 const files=[['Mods/wake-of-gods/Mods/artifacts/content/config/artifacts/crimsonShieldOfRetribution.json',Buffer.from(JSON.stringify(definitions)).toString('base64')],['Mods/tum-era/content/config/era-original-retaliation-shield.json',Buffer.from(JSON.stringify(runtime)).toString('base64')]];
 if(noCommanders){const manifest=parseJsonc(fs.readFileSync('mod/wake-of-gods/Mods/Commanders/mod.json','utf8'));manifest.settings.modules.commanders=false;files.push(['Mods/wake-of-gods/Mods/Commanders/mod.json',Buffer.from(JSON.stringify(manifest)).toString('base64')]);}
 if(Object.keys(controls).length)files.push(['Mods/tum-era/content/config/original157-test-controls.json',Buffer.from(JSON.stringify(controls)).toString('base64')]);
 const hook=Object.keys(controls).length?"const p=root+'Mods/tum-era/mod.json',v=JSON.parse(fs.readFile(p,{encoding:'utf8'}));v.creatures=Array.from(new Set([...v.creatures,'config/original157-test-controls.json']));fs.unlink(p);fs.writeFile(p,JSON.stringify(v));":'';
 const injection=`{const root='/home/web_user/.local/share/vcmi/',fs=module.FS;for(const[file,base64]of ${JSON.stringify(files)}){const target=root+file;fs.mkdirTree(target.slice(0,target.lastIndexOf('/')));try{fs.unlink(target);}catch{}fs.writeFile(target,Uint8Array.from(atob(base64),c=>c.charCodeAt(0)));}${hook}}`;
 await page.route('**/game.html?*',async route=>{const response=await route.fetch(),html=await response.text(),needle='module.callMain(["--disable-video"]);';assert(html.includes(needle));await route.fulfill({response,body:html.replace(needle,injection+needle)});});
}

export async function installReviewedMassHypnotize253Overlay(page,review,{noCommanders=false,controls={}}={}){
 const read=p=>JSON.parse(fs.readFileSync(p)),definitions=read(review+'/content/config/mass-hypnotize253.candidate.json');
 const{validateMassHypnotize253}=await import('../../scripts/era-bridge/artifacts/mass-hypnotize253.mjs');
 assert.deepEqual(Object.keys(definitions).sort(),['artifact253']);const runtime=validateMassHypnotize253(read(review+'/runtime.candidate.json')),files=[];
 const walk=(folder,relative='')=>{for(const item of fs.readdirSync(folder,{withFileTypes:true})){const rel=path.posix.join(relative,item.name),file=path.join(folder,item.name);if(item.isDirectory())walk(file,rel);else files.push(['Mods/tum-era/content/'+rel,fs.readFileSync(file).toString('base64')]);}};
 for(const type of['Data','Sprites'])walk(review+'/content/'+type,type);
 for(const[name,value]of[['reviewed-mass-hypnotize253-artifact',definitions],['era-mass-hypnotize-artifact',runtime]])files.push(['Mods/tum-era/content/config/'+name+'.json',Buffer.from(JSON.stringify(value)).toString('base64')]);
 if(noCommanders){const manifest=parseJsonc(fs.readFileSync('mod/wake-of-gods/Mods/Commanders/mod.json','utf8'));manifest.settings.modules.commanders=false;files.push(['Mods/wake-of-gods/Mods/Commanders/mod.json',Buffer.from(JSON.stringify(manifest)).toString('base64')]);}
 const creatureHook=Object.keys(controls).length?"manifest.creatures=Array.from(new Set([...manifest.creatures,'config/mass-hypnotize253-test-controls.json']));":'';
 if(Object.keys(controls).length)files.push(['Mods/tum-era/content/config/mass-hypnotize253-test-controls.json',Buffer.from(JSON.stringify(controls)).toString('base64')]);
 const injection=`{const root='/home/web_user/.local/share/vcmi/';const fs=module.FS;const manifestPath=root+'Mods/tum-era/mod.json';const manifest=JSON.parse(fs.readFile(manifestPath,{encoding:'utf8'}));manifest.artifacts=Array.from(new Set([...manifest.artifacts,'config/reviewed-mass-hypnotize253-artifact.json']));${creatureHook}fs.unlink(manifestPath);fs.writeFile(manifestPath,JSON.stringify(manifest));for(const[file,base64]of ${JSON.stringify(files)}){const target=root+file;fs.mkdirTree(target.slice(0,target.lastIndexOf('/')));try{fs.unlink(target);}catch{}fs.writeFile(target,Uint8Array.from(atob(base64),c=>c.charCodeAt(0)));}}`;
 await page.route('**/game.html?*',async route=>{const response=await route.fetch(),html=await response.text(),needle='module.callMain(["--disable-video"]);';assert(html.includes(needle));await route.fulfill({response,body:html.replace(needle,injection+needle)});});
}
