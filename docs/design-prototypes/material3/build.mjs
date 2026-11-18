import fs from 'node:fs';
import path from 'node:path';
import portraits from '../../../web/goonk-hd-portraits-data.mjs';

const dir=path.dirname(new URL(import.meta.url).pathname);
const inventory=JSON.parse(fs.readFileSync('docs/ui-audit/inventory.json','utf8'));
const assets={};
function asset(key,file){assets[key]='data:image/'+(file.endsWith('.svg')?'svg+xml':file.endsWith('.webp')?'webp':'png')+';base64,'+fs.readFileSync(file).toString('base64');}
asset('creatures','web/h3-theme/goonks/base-v1.webp');
asset('map','web/h3-theme/adventure-map.svg');
asset('hero','web/h3-theme/hero-silhouette.svg');
asset('hall','web/h3-theme/town-hall.png');
asset('fort','web/h3-theme/town-fort.png');
for(const resource of ['wood','mercury','ore','sulfur','crystal','gems','gold'])asset(resource,'web/h3-theme/resource-'+resource+'.png');
for(const spell of [0,7,15,17,24,46])asset('spell'+spell,'web/h3-theme/spells/'+spell+'.png');
const rects=Object.entries(portraits).filter(([,r])=>r.file.endsWith('/base-v1.webp')).map(([key,r])=>({key,...r}));
const screens=inventory.screens.map(s=>({id:s.id,source:s.source,variants:s.variants}));
let html=fs.readFileSync(path.join(dir,'gallery.template.html'),'utf8').replace('__INVENTORY__',JSON.stringify(screens)).replace('__ASSETS__',JSON.stringify(assets)).replace('__RECTS__',JSON.stringify(rects));
if(Buffer.byteLength(html)>=1000000)throw new Error('Inline gallery exceeds 1 MB');
fs.writeFileSync(path.join(dir,'prototypes.html'),html);
fs.writeFileSync(path.join(dir,'coverage.json'),JSON.stringify({scope:'Prototype compositions; no native gameplay or animation validation',families:screens.length,variants:screens.reduce((n,s)=>n+s.variants.length,0),directions:['Héritage clair','Focus tactique'],viewports:[[360,640],[320,568],[640,360],[568,280]],screens},null,2)+'\n');
const output=process.env.PROTOTYPE_OUTPUT;
if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,html);}
console.log(`${screens.length} families / ${screens.reduce((n,s)=>n+s.variants.length,0)} states / ${Buffer.byteLength(html)} bytes`);
