// Keep screenshots outside the published game and outside Git. Only the
// reusable review renderer and its deterministic builder are versioned.
import fs from 'node:fs';import path from 'node:path';import {build} from 'esbuild';
const before=process.env.UI_REVIEW_BEFORE||'/tmp/heroes-reference-final',after=process.env.UI_REVIEW_AFTER||'/tmp/heroes-native-verified',out=process.env.HEROES_KIT_OUTPUT||'/tmp/heroes-design-system';
const old=JSON.parse(fs.readFileSync(path.join(before,'manifest.json'))),next=JSON.parse(fs.readFileSync(path.join(after,'manifest.json'))),assets=path.join(out,'ui-regression');fs.mkdirSync(assets,{recursive:true});
const reference='7e7633ea31754d40959fa16eceb2ac69b747164f',samples=[];
for(const n of next.samples.filter(s=>s.design==='current')){
 const b=old.samples.find(s=>s.design==='current'&&s.screen===n.screen&&s.width===n.width&&s.height===n.height);if(!b)throw Error('Missing reference '+n.screen);
 if(n.visualGeometry.length<b.visualGeometry.length)throw Error('Missing character surface '+n.screen+' '+n.width);
 const shrunkenSubjects=[];for(let i=0;i<b.visualGeometry.length;i++){const a=b.visualGeometry[i],z=a.subject!=null?n.visualGeometry.find(s=>s.subject===a.subject):n.visualGeometry[i];if(!z)throw Error('Missing creature '+a.subject+' '+n.screen);if(z.width<a.width-2||z.height<a.height-2)shrunkenSubjects.push({index:i,before:a,after:z});}
 const files={};for(const [key,dir,s]of [['before',before,b],['after',after,n]]){const name=key+'-'+s.file;fs.copyFileSync(path.join(dir,s.file),path.join(assets,name));files[key]=name;}
 samples.push({screen:n.screen,label:n.label,width:n.width,height:n.height,...files,shrunkenSubjects,beforeGeometry:b.visualGeometry,afterGeometry:n.visualGeometry});
}
if(samples.length!==48)throw Error('Expected 12 native screens × 4 formats.');
const manifest={reference,scope:'Actual native captures, presentation only; no saved games or user sessions.',screens:[...new Map(samples.map(s=>[s.screen,{id:s.screen,label:s.label}])).values()],sizes:[...new Set(samples.map(s=>s.width+'x'+s.height))],samples};
fs.writeFileSync(path.join(assets,'manifest.json'),JSON.stringify(manifest,null,2));
await build({entryPoints:['docs/design-prototypes/material3/refactor-review.jsx'],outfile:path.join(out,'refactor-review.js'),bundle:true,format:'esm',target:['safari16.4','chrome100'],external:['/web/*'],minify:true,define:{'process.env.NODE_ENV':'"production"'}});
fs.writeFileSync(path.join(out,'refactor-review.html'),'<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Heroes · comparaison avant/après</title><link rel="stylesheet" href="./refactor-review.css"><style>body{margin:0}</style><div id="review"></div><script type="module" src="./refactor-review.js"></script></html>');
const failures=samples.filter(s=>s.shrunkenSubjects.length);console.log(samples.length+' comparisons; '+failures.length+' subject-size regressions');if(failures.length)process.exitCode=1;
