import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

// One body-size reference per animation; only its measured center follows the pose.
export function previewFocus(records){
 const grouped=new Map();
 for(const unit of records){
  if(unit.error||!unit.nativeCrops?.length)throw Error('Missing measured poses for '+unit.key);
  const key=unit.animation.toUpperCase(),poses=grouped.get(key)||new Map();
  for(const pose of unit.nativeCrops){
   if(pose.length!==8||!pose.every(Number.isInteger)||pose[4]<=0||pose[5]<=0)throw Error('Invalid crop for '+unit.key);
   if([0,2,12,15,18,20,21].includes(pose[0]))poses.set(pose[0]+':'+pose[1],pose);
  }
  grouped.set(key,poses);
 }
 const focus={};
 for(const [key,map]of [...grouped].sort(([a],[b])=>a.localeCompare(b))){
  const poses=[...map.values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const idle=poses.filter(p=>p[0]===2),basis=idle.length?idle:poses.filter(p=>p[0]===0);
  if(!basis.length)throw Error('Missing reference pose for '+key);
  const first=basis[0],w=first[4],h=first[5];
  const reference=first.slice(2,6),centers={};
  for(const [g,f,,,,,cx,cy]of poses){const group=centers[g]||(centers[g]=[]);while(group.length<=f)group.push(null);group[f]=[cx,cy];}
  focus[key]={reference,origin:first.slice(6,8),centers};
 }
 return focus;
}
export function referenceScale(entry,width=100,height=130){return Math.min(width*.95/entry.reference[2],height*.8/entry.reference[3]);}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const [input,output]=process.argv.slice(2);if(!input||!output)throw Error('Usage: creature-preview-focus.mjs AUDIT_DIRECTORY OUTPUT_JSON');
 const files=fs.readdirSync(input).filter(n=>/^part-\d+\.json$/.test(n));
 const parts=files.map(n=>JSON.parse(fs.readFileSync(path.join(input,n),'utf8')));
 if(!parts.length||parts.some(p=>!p.complete||p.errors.length||p.issues.length))throw Error('The offline audit must be complete and pass.');
 const records=parts.flatMap(p=>p.results),catalog=JSON.parse(fs.readFileSync(path.join(input,'catalog-0.json'),'utf8')).creatures.filter(c=>c.animated);
 if(new Set(records.map(c=>c.key)).size!==catalog.length||catalog.some(c=>!records.some(r=>r.key===c.key&&r.animation===c.animation)))throw Error('The audit does not cover the full animation catalog.');
 const focus=previewFocus(records);fs.writeFileSync(output,'{\n'+Object.entries(focus).map(([k,v])=>JSON.stringify(k)+':'+JSON.stringify(v)).join(',\n')+'\n}\n');
 console.log(JSON.stringify({creatures:records.length,animations:Object.keys(focus).length,frames:records.reduce((sum,c)=>sum+c.frames,0),output}));
}
