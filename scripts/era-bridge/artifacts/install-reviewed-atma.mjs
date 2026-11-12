/** Install only after matching native stateful engine and source controls pass. */
import fs from'node:fs';import path from'node:path';
import{validateStatefulArtifactPolicy}from'./stateful-runtime.mjs';
const[review,output='outputs/wog-priorities-0.4.147']=process.argv.slice(2);
if(!review)throw Error('REVIEW [REPORT_DIR] required');
const read=p=>JSON.parse(fs.readFileSync(p)),root='mod/tum-era',write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const definitions=read(review+'/content/config/atma.candidate.json');
if(Object.keys(definitions).sort().join(',')!=='artifact264,artifact265')throw Error('Incorrect source Atma definitions');
const services=validateStatefulArtifactPolicy(read(review+'/runtime.candidate.json'));
for(const dir of['Data','Sprites'])fs.cpSync(path.join(review,'content',dir),path.join(root,'content',dir),{recursive:true});
write(root+'/content/config/reviewed-atma-artifacts.json',definitions);write(root+'/content/config/era-stateful-artifact-services.json',services);
const translations={};for(const[id,name,pair]of[[264,'Épée Atma','Attaque et Défense'],[265,'Robe Atma','Puissance et Connaissance']]){
 translations['artifact.tum-era.artifact'+id+'.name']=name;
 translations['artifact.tum-era.artifact'+id+'.description']='{'+name+'}\n\nÀ l’équipement, augmente la plus faible de vos caractéristiques '+pair+' jusqu’à la plus élevée. Le retrait annule uniquement cet ajustement. Utilisez « Rééquilibrer » après un changement de caractéristiques.';
}
write(root+'/content/translation/reviewed-atma-artifacts-french.json',translations);
const manifest=read(root+'/mod.json');manifest.artifacts=[...new Set([...manifest.artifacts,'config/reviewed-atma-artifacts.json'])];manifest.french??={};manifest.french.translations=[...new Set([...(manifest.french.translations||[]),'translation/reviewed-atma-artifacts-french.json'])];write(root+'/mod.json',manifest);
write(output+'/atma-source-review.json',read(review+'/source-review.json'));console.log('Installed source264/265 for matching validated native stateful engine.');
