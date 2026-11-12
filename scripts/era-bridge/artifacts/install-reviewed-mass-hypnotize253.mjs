/** Activate original253 only after matching native mass/HP/duration controls. */
import fs from'node:fs';import path from'node:path';import{validateMassHypnotize253}from'./mass-hypnotize253.mjs';
const[review,report='outputs/wog-priorities-0.4.147']=process.argv.slice(2);if(!review)throw Error('REVIEW [REPORT_DIR] required');
const read=p=>JSON.parse(fs.readFileSync(p)),write=(p,x)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');},root='mod/tum-era';
const proof=read(report+'/native-mass-hypnotize253.json');
if(proof.passed!==true||Object.keys(proof.controls??{}).length!==22||proof.pendingNativeControls?.length!==0||!/^([0-9a-f]{64})$/.test(proof.engineSHA256??''))throw Error('Matching complete22-control native253 proof required');
const definitions=read(review+'/content/config/mass-hypnotize253.candidate.json');if(Object.keys(definitions).join(',')!=='artifact253'||JSON.stringify(definitions.artifact253.bonuses)!==JSON.stringify({Autospell:{type:'OPENING_BATTLE_SPELL',val:50,subtype:'core:hypnotize',addInfo:[3,0]}}))throw Error('Changed source253 opening definition');
const runtime=validateMassHypnotize253(read(review+'/runtime.candidate.json'));
for(const folder of['Data','Sprites'])fs.cpSync(path.join(review,'content',folder),path.join(root,'content',folder),{recursive:true});
write(root+'/content/config/reviewed-mass-hypnotize253-artifact.json',definitions);write(root+'/content/config/era-mass-hypnotize-artifact.json',runtime);
write(root+'/content/translation/reviewed-mass-hypnotize253-artifact-french.json',{'artifact.tum-era.artifact253.name':'Anneau du regard du serpent','artifact.tum-era.artifact253.description':'{Anneau du regard du serpent}\n\nAu début du combat, hypnotise pendant 50 tours les troupes ennemies suffisamment faibles pour le héros. Le seuil dépend de sa Puissance et de sa maîtrise réelle de l’Air ; les immunités et résistances continuent de s’appliquer.'});
const manifest=read(root+'/mod.json');manifest.artifacts=[...new Set([...manifest.artifacts,'config/reviewed-mass-hypnotize253-artifact.json'])];manifest.french??={};manifest.french.translations=[...new Set([...(manifest.french.translations||[]),'translation/reviewed-mass-hypnotize253-artifact-french.json'])];write(root+'/mod.json',manifest);
write(report+'/mass-hypnotize253-review.json',read(review+'/source-import-report.json'));console.log('Activated exact mass-Hypnotize253 opening contract.');
