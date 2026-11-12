import fs from 'node:fs';
/** Compose fixture-only files with other Module hooks, independent of init order. */
export async function injectOwnedFiles(page,root,entries){
 const files=entries.map(entry=>({path:entry.path,bytes:[...fs.readFileSync(root+'/'+entry.path)]}));
 await page.addInitScript(files=>{const previous=Object.getOwnPropertyDescriptor(window,'Module');let current;Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{previous?.set?.call(window,m);current=m;const priorMain=Object.getOwnPropertyDescriptor(m,'callMain');let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;priorMain?.set?.call(m,f);},get:()=>function(...args){for(const file of files){const p='/home/web_user/.local/share/vcmi/Mods/tum-era/'+file.path;m.FS.mkdirTree(p.slice(0,p.lastIndexOf('/')));m.FS.writeFile(p,new Uint8Array(file.bytes));}const invoke=priorMain?.get?priorMain.get.call(m):main;return invoke.apply(m,args);}});}});},files);
}
