/** Install source261/262/263 only after the corresponding native build is ready.
 * Publication requires the native controls recorded in each source overlay.
 */
import fs from 'node:fs';import path from 'node:path';
import {mergeRuntimePolicies} from '../runtime-policy.mjs';
const [cloak,mass,reportArg]=process.argv.slice(2);if(!cloak||!mass)throw Error('CLOAK_OVERLAY MASS_OVERLAY [REPORT_DIR] required');
const root='mod/tum-era',report=reportArg||'outputs/wog-priorities-0.4.147';
const read=p=>JSON.parse(fs.readFileSync(p)),write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const definitions={...read(path.join(cloak,'content/config/exchange-cloak.candidate.json')),...read(path.join(mass,'content/config/mass-spell-artifacts.candidate.json'))};
if(JSON.stringify(Object.keys(definitions).sort())!==JSON.stringify(['artifact261','artifact262','artifact263']))throw Error('Unreviewed battle artifact set');
const runtime=mergeRuntimePolicies([read(root+'/content/config/era-bridge-runtime.json'),read(path.join(cloak,'runtime.candidate.json')),read(path.join(mass,'runtime.candidate.json'))]);
for(const overlay of [cloak,mass])for(const dir of ['Data','Sprites'])fs.cpSync(path.join(overlay,'content',dir),path.join(root,'content',dir),{recursive:true});
write(root+'/content/config/reviewed-battle-artifacts.json',definitions);write(root+'/content/config/era-bridge-runtime.json',runtime);
const translations={};const labels={261:['Cape d’échange','Au début d’un combat entre héros, échange leurs réserves de mana et leurs contributions d’Attaque et de Défense aux troupes. S’active si un seul héros porte cette cape. Les machines de guerre sont exclues.'],262:['Amulette du retour de Samsara','Étend Résurrection et Animation des morts aux autres troupes alliées encore vivantes, avec 30 % de la Puissance du héros. Transforme aussi chaque jour les quatre familles de morts-vivants prévues par l’objet d’origine. Doit être équipée.'],263:['Bracelet d’amplification d’implosion','Étend Implosion aux autres troupes ennemies vivantes, avec 30 % de la Puissance du héros. Doit être équipé.']};
for(const[id,[name,description]]of Object.entries(labels)){translations['artifact.tum-era.artifact'+id+'.name']=name;translations['artifact.tum-era.artifact'+id+'.description']='{'+name+'}\n\n'+description;}
write(root+'/content/translation/reviewed-battle-artifacts-french.json',translations);
const manifest=read(root+'/mod.json');manifest.artifacts=[...new Set([...manifest.artifacts,'config/reviewed-battle-artifacts.json'])];manifest.french??={};manifest.french.translations=[...new Set([...(manifest.french.translations||[]),'translation/reviewed-battle-artifacts-french.json'])];write(root+'/mod.json',manifest);
for(const[overlay,file]of[[cloak,'exchange-cloak-source.json'],[mass,'mass-spells-source.json']])write(path.join(report,file),read(path.join(overlay,file)));
console.log('Installed three complete source battle artifacts for native controls.');
