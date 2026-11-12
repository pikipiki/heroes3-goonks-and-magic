/** Explicit phase4 staging only after matching native service compilation. */
import fs from'node:fs';import path from'node:path';
import{validateAdvancedArtifactPolicy}from'./advanced-runtime.mjs';
const [advanced,mine,report='outputs/wog-priorities-0.4.149']=process.argv.slice(2);
if(!advanced||!mine)throw Error('ADVANCED_REVIEW MINE_REVIEW [REPORT_DIR] required');
const read=p=>JSON.parse(fs.readFileSync(p)),root='mod/tum-era',write=(p,x)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');};
const defs={...read(advanced+'/content/config/diplomat-lightning.candidate.json'),...read(mine+'/content/config/fixed-opening-mine.candidate.json')};
if(JSON.stringify(Object.keys(defs).sort())!==JSON.stringify(['artifact180','artifact220','artifact222']))throw Error('Wrong advanced artifact review');
const runtime=validateAdvancedArtifactPolicy(read(advanced+'/runtime.candidate.json'));
for(const source of [advanced,mine])for(const dir of ['Data','Sprites'])fs.cpSync(path.join(source,'content',dir),path.join(root,'content',dir),{recursive:true});
write(root+'/content/config/reviewed-advanced-artifacts.json',defs);write(root+'/content/config/era-advanced-artifact-services.json',runtime);
const labels={180:['Cape du diplomate','Triple la puissance apparente de l’armée pour les créatures neutres et la guilde des voleurs. Conserve les effets de ses composants.'],220:['Paratonnerre','Protège vos troupes de votre chaîne de foudre. Les éclairs traversent les résistances naturelles, sauf les immunités du pendentif de négativité et de l’armure ionisée. Votre chaîne inflige aussi un éclair supplémentaire à chaque cible ennemie.'],222:['Mine naine','Pose huit mines au début du combat. Chaque mine inflige 600 points de dégâts avant les protections applicables.']},translations={};
for(const[id,[name,description]]of Object.entries(labels)){translations['artifact.tum-era.artifact'+id+'.name']=name;translations['artifact.tum-era.artifact'+id+'.description']='{'+name+'}\n\n'+description;}
write(root+'/content/translation/reviewed-advanced-artifacts-french.json',translations);
const manifest=read(root+'/mod.json');manifest.artifacts=[...new Set([...manifest.artifacts,'config/reviewed-advanced-artifacts.json'])];manifest.french??={};manifest.french.translations=[...new Set([...(manifest.french.translations||[]),'translation/reviewed-advanced-artifacts-french.json'])];write(root+'/mod.json',manifest);
write(report+'/diplomat-lightning-source.json',read(advanced+'/source-review.json'));write(report+'/opening-mine-source.json',read(mine+'/source-import-report.json'));
console.log('Staged180/220/222 for matching native phase4 validation.');
