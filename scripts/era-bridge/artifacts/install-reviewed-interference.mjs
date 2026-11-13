/** Enable source269..271 only alongside the validated cached-power engine. */
import fs from'node:fs';import path from'node:path';import{validateInterferencePolicy}from'./interference-runtime.mjs';
const[review,report='outputs/wog-priorities-0.4.147']=process.argv.slice(2);if(!review)throw Error('REVIEW [REPORT_DIR] required');
const read=p=>JSON.parse(fs.readFileSync(p)),write=(p,x)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');},root='mod/tum-era';
if(read(report+'/native-interference.json').passed!==true)throw Error('Complete matching native Interference proof required before activation');
const definitions=read(review+'/content/config/interference.candidate.json');if(Object.keys(definitions).sort().join(',')!=='artifact269,artifact270,artifact271')throw Error('Incorrect source Interference definitions');
const runtime=validateInterferencePolicy(read(review+'/runtime.candidate.json'));
for(const folder of['Data','Sprites'])fs.cpSync(path.join(review,'content',folder),path.join(root,'content',folder),{recursive:true});
write(root+'/content/config/reviewed-interference-artifacts.json',definitions);write(root+'/content/config/era-interference-artifact-services.json',runtime);
const translations={};for(const[id,name,percent]of[[269,'Charme de l’éclipse',10],[270,'Sceau du couchant',10],[271,'Armure de la lumière mourante',25]]){
 translations['artifact.tum-era.artifact'+id+'.name']=name;translations['artifact.tum-era.artifact'+id+'.description']='{'+name+'}\n\nContre un héros, réduit sa Puissance de '+percent+'% pendant le combat, avec un minimum de1. Les pourcentages des trois objets d’Interférence se cumulent ; les copies du même objet ne se cumulent pas.';
}
write(root+'/content/translation/reviewed-interference-artifacts-french.json',translations);
const manifest=read(root+'/mod.json');manifest.artifacts=[...new Set([...manifest.artifacts,'config/reviewed-interference-artifacts.json'])];manifest.french??={};manifest.french.translations=[...new Set([...(manifest.french.translations||[]),'translation/reviewed-interference-artifacts-french.json'])];write(root+'/mod.json',manifest);
write(report+'/interference-source-review.json',read(review+'/source-review.json'));console.log('Installed source269..271 validated cached battle power.');
