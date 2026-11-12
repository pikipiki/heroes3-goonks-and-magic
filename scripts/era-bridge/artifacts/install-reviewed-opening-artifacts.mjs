/** Install only source-closed overlays for final native testing/publication.
 * Native validation remains required; no unsupported artifact is enrolled.
 */
import fs from 'node:fs';
import path from 'node:path';
import {mergeRuntimePolicies} from '../runtime-policy.mjs';
const [opening,opponents,reportArg]=process.argv.slice(2);
if(!opening||!opponents)throw Error('Usage: install-reviewed-opening-artifacts.mjs OPENING_OVERLAY OPPONENT_OVERLAY [REPORT_DIR]');
const root='mod/tum-era',report=reportArg||'outputs/wog-priorities-0.4.147';
const read=p=>JSON.parse(fs.readFileSync(p));
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const summons=read(path.join(opening,'content/config/opening-summon-artifacts.candidate.json'));
const penalties=read(path.join(opponents,'content/config/opponent-artifacts.candidate.json'));
if(JSON.stringify(Object.keys(summons).sort())!==JSON.stringify(['artifact219','artifact231','artifact279']))throw Error('Unexpected opening artifact set');
if(JSON.stringify(Object.keys(penalties).sort())!==JSON.stringify([183,184,185,186,187,188,249,250,252].map(id=>'artifact'+id)))throw Error('Unexpected opponent artifact set');
const runtime=mergeRuntimePolicies([read(root+'/content/config/era-bridge-runtime.json'),read(path.join(opening,'runtime.candidate.json'))]);
for(const overlay of [opening,opponents])for(const dir of ['Data','Sprites'])fs.cpSync(path.join(overlay,'content',dir),path.join(root,'content',dir),{recursive:true});
write(root+'/content/config/reviewed-opening-summons.json',summons);
write(root+'/content/config/reviewed-opponent-artifacts.json',penalties);
write(root+'/content/config/era-bridge-runtime.json',runtime);
const translated={};
const labels={183:['Pendentif de la déchéance','Réduit de 2 le moral de l’armée adverse.'],184:['Poupée du chaman','Réduit de 2 la chance de l’armée adverse.'],185:['Fer à cheval du démon','Réduit de 1 la chance de l’armée adverse.'],186:['Masque hideux','Réduit de 1 le moral de l’armée adverse.'],187:['Runes de mauvais augure','Réduit de 1 la chance de l’armée adverse.'],188:['Anneau de répression','Réduit de 1 le moral de l’armée adverse.'],249:['Anneau de malchance','Réduit de 3 la chance de l’armée adverse.'],250:['Tête de dragon','Réduit de 2 le moral de l’armée adverse.'],252:['Pendentif du désespoir','Réduit de 3 le moral et la chance de l’armée adverse.'],219:['Compendium de magie','Donne accès aux sorts du catalogue d’origine. Invoque les quatre élémentaires de troisième évolution au début du combat, selon la Puissance du héros. Doit être équipé.'],231:['Épée de l’éclat noir','+5 aux quatre caractéristiques principales. Invoque des Archanges au début du combat et lance Joie sur les alliés. Doit être équipée.'],279:['Nécronomicon','Donne accès à Onde mortelle et Animation des morts. Invoque des Anges squelettes au début du combat, selon la Puissance du héros. Réduit de 3 le moral de votre armée. Doit être équipé.']};
for(const[id,[name,description]]of Object.entries(labels)){
 translated['artifact.tum-era.artifact'+id+'.name']=name;
 translated['artifact.tum-era.artifact'+id+'.description']='{'+name+'}\n\n'+description;
}
write(root+'/content/translation/reviewed-opening-artifacts-french.json',translated);
const manifest=read(root+'/mod.json');manifest.artifacts=[...new Set([...manifest.artifacts,'config/reviewed-opening-summons.json','config/reviewed-opponent-artifacts.json'])];
manifest.french??={};manifest.french.translations=[...new Set([...(manifest.french.translations||[]),'translation/reviewed-opening-artifacts-french.json'])];write(root+'/mod.json',manifest);
for(const[overlay,file]of[[opening,'opening-summons-source.json'],[opponents,'opponent-artifacts-source.json']])write(path.join(report,file),read(path.join(overlay,file)));
console.log('Installed twelve source-complete artifacts for native validation.');
