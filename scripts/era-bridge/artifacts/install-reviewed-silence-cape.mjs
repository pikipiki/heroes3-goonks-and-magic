/** Exact source267 CFG, activated only after native positive/negative controls. */
import fs from'node:fs';import path from'node:path';
import{SILENCE_CAPE_SOURCE_IDS}from'./silence-cape.mjs';
const[review,output='outputs/wog-priorities-0.4.147']=process.argv.slice(2);
if(!review)throw Error('REVIEW [REPORT_DIR] required');
const read=p=>JSON.parse(fs.readFileSync(p)),root='mod/tum-era',write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const definitions=read(review+'/content/config/silence-cape.candidate.json');
if(Object.keys(definitions).join(',')!=='artifact267'||Object.keys(definitions.artifact267.bonuses).length!==22)throw Error('Incorrect source267 definition');
for(const source of new Set(SILENCE_CAPE_SOURCE_IDS))if(definitions.artifact267.bonuses['immunity'+source]?.type!=='SPELL_IMMUNITY')throw Error('Missing source267 immunity');
for(const dir of['Data','Sprites'])fs.cpSync(path.join(review,'content',dir),path.join(root,'content',dir),{recursive:true});
write(root+'/content/config/reviewed-silence-cape.json',definitions);
const name='Cape du silence',description='Immunise l’armée du porteur contre Éclair de glace, Éclair, Implosion, Onde de mort, Mur de feu, Bouclier, Protection contre le feu ou l’eau, Miroir magique, Soin, Bénédiction, Malédiction, Soif de sang, Faiblesse, Peau de pierre, Rayon destructeur, Fortune, Hâte, Lenteur et Cécité. Empêche aussi les sorts bénéfiques de cette liste.';
write(root+'/content/translation/reviewed-silence-cape-french.json',{'artifact.tum-era.artifact267.name':name,'artifact.tum-era.artifact267.description':'{'+name+'}\n\n'+description});
const manifest=read(root+'/mod.json');manifest.artifacts=[...new Set([...manifest.artifacts,'config/reviewed-silence-cape.json'])];manifest.french??={};manifest.french.translations=[...new Set([...(manifest.french.translations||[]),'translation/reviewed-silence-cape-french.json'])];write(root+'/mod.json',manifest);
write(output+'/silence-cape-source-review.json',read(review+'/source-review.json'));console.log('Installed source267 exact wearer-army immunities.');
