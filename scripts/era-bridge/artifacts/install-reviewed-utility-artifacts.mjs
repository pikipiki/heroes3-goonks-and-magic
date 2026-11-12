/** Stage179/181/197 only with the matching native phase3 engine. */
import fs from 'node:fs';import path from 'node:path';
import {mergeRuntimePolicies} from '../runtime-policy.mjs';
const [overlay,reportArg]=process.argv.slice(2);if(!overlay)throw Error('GOOSE_REFLECTION_RING_OVERLAY [REPORT_DIR] required');
const root='mod/tum-era',report=reportArg||'outputs/wog-priorities-0.4.147';
const read=p=>JSON.parse(fs.readFileSync(p)),write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const definitions=read(path.join(overlay,'content/config/goose-reflection.candidate.json'));
if(JSON.stringify(Object.keys(definitions).sort())!==JSON.stringify(['artifact179','artifact181','artifact197']))throw Error('Unreviewed utility artifact set');
const runtime=mergeRuntimePolicies([read(root+'/content/config/era-bridge-runtime.json'),read(path.join(overlay,'runtime.candidate.json'))]);
for(const dir of ['Data','Sprites'])fs.cpSync(path.join(overlay,'content',dir),path.join(root,'content',dir),{recursive:true});
write(root+'/content/config/reviewed-utility-artifacts.json',definitions);write(root+'/content/config/era-bridge-runtime.json',runtime);
const translations={};const labels={179:['Oie d’or','Rapporte au total 7 000 pièces d’or par jour lorsqu’elle est équipée.'],181:['Pendentif de réflexion','Augmente de 20 points la résistance aux sorts hostiles, en plus des résistances de ses composants.'],197:['Anneau des éléments','Donne accès aux quatre sorts d’invocation élémentaire et permet d’invoquer plusieurs types d’élémentaires au cours d’un même combat. Doit être équipé.']};
for(const[id,[name,description]]of Object.entries(labels)){translations['artifact.tum-era.artifact'+id+'.name']=name;translations['artifact.tum-era.artifact'+id+'.description']='{'+name+'}\n\n'+description;}
write(root+'/content/translation/reviewed-utility-artifacts-french.json',translations);
const manifest=read(root+'/mod.json');manifest.artifacts=[...new Set([...manifest.artifacts,'config/reviewed-utility-artifacts.json'])];manifest.french??={};manifest.french.translations=[...new Set([...(manifest.french.translations||[]),'translation/reviewed-utility-artifacts-french.json'])];write(root+'/mod.json',manifest);
write(path.join(report,'goose-reflection-ring-source.json'),read(path.join(overlay,'goose-reflection-source.json')));
console.log('Installed original179/181/197 for matching native phase3 controls.');
