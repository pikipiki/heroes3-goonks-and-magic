import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

// Keep native coordinates across the whole animation: no per-pose zoom or recentering.
export function previewFocus(records){
 const focus={};
 for(const unit of records){
  if(unit.error||!unit.nativeCrops?.length)throw Error('Missing measured poses for '+unit.key);
  const key=unit.animation.toUpperCase();
  for(const pose of unit.nativeCrops){
   if(pose.length!==6||!pose.every(Number.isInteger)||pose[2]<0||pose[3]<0||pose[4]<=0||pose[5]<=0)throw Error('Invalid crop for '+unit.key);
   if(![0,2,12,15,18,20,21].includes(pose[0]))continue;
   const [, ,x,y,w,h]=pose,old=focus[key];
   if(!old)focus[key]=[x,y,w,h];
   else{const left=Math.min(old[0],x),top=Math.min(old[1],y);focus[key]=[left,top,Math.max(old[0]+old[2],x+w)-left,Math.max(old[1]+old[3],y+h)-top];}
  }
 }
 return Object.fromEntries(Object.entries(focus).sort(([a],[b])=>a.localeCompare(b)));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const [input,output]=process.argv.slice(2);if(!input||!output)throw Error('Usage: creature-preview-focus.mjs AUDIT_DIRECTORY OUTPUT_JSON');
 const files=fs.readdirSync(input).filter(n=>/^part-\d+\.json$/.test(n));
 const parts=files.map(n=>JSON.parse(fs.readFileSync(path.join(input,n),'utf8')));
 if(!parts.length||parts.some(p=>!p.complete||p.errors.length||p.issues.length))throw Error('The offline audit must be complete and pass.');
 const records=parts.flatMap(p=>p.results),catalog=JSON.parse(fs.readFileSync(path.join(input,'catalog-0.json'),'utf8')).creatures.filter(c=>c.animated);
 if(new Set(records.map(c=>c.key)).size!==catalog.length||catalog.some(c=>!records.some(r=>r.key===c.key&&r.animation===c.animation)))throw Error('The audit does not cover the full animation catalog.');
 const focus=previewFocus(records);fs.writeFileSync(output,JSON.stringify(focus,null,1)+'\n');
 console.log(JSON.stringify({creatures:records.length,animations:Object.keys(focus).length,frames:records.reduce((sum,c)=>sum+c.frames,0),output}));
}
