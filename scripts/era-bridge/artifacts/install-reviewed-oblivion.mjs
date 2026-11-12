/** Publish source268 only after the complete, pinned native review. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {validateOblivion,validateOblivionEvidence} from './oblivion.mjs';
const[review,report='outputs/wog-priorities-0.4.147']=process.argv.slice(2);if(!review)throw Error('REVIEW [REPORT_DIR] required');
const read=p=>JSON.parse(fs.readFileSync(p)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const write=(p,x)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');};
const proof=validateOblivionEvidence(read(report+'/native-oblivion.json'));
const source=read(review+'/source-review.json');
if(source.sourceId!==268||source.scriptSHA256!=='0dbb2a4498de1ab57492fd506ffd5f177abb6455af6037e42d274d0a3ea8a315'||source.archiveSHA256!=='0beb089b85dacd42d456dedd2eaf7dc0b4d35541806f857e24a08e2bad5d3893')throw Error('Pinned original Ring source required');
const definitions=read(review+'/content/config/oblivion.candidate.json'),definitionHash=sha(Buffer.from(JSON.stringify(definitions)));
if(Object.keys(definitions).join(',')!=='artifact268'||source.definitionSHA256!==definitionHash||proof.definitionSHA256!==definitionHash)throw Error('Native-tested Ring definition required');
const runtime=validateOblivion(read(review+'/runtime.candidate.json'));
const assets=['Data/tum-era/artifacts/268/icon.png','Data/tum-era/artifacts/268/scenario.png','Sprites/tum-era/artifacts/268/map.def','Sprites/tum-era/artifacts/268/map.msk'];
if(Object.keys(source.assetSHA256??{}).sort().join(',')!==[...assets].sort().join(','))throw Error('Complete original Ring asset manifest required');
for(const name of assets)if(sha(fs.readFileSync(path.join(review,'content',name)))!==source.assetSHA256[name])throw Error('Ring asset hash mismatch: '+name);
const root='mod/tum-era';
for(const name of assets){const target=path.join(root,'content',name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(review,'content',name),target);}
write(root+'/content/config/reviewed-oblivion-artifact.json',definitions);write(root+'/content/config/era-oblivion-artifact-service.json',runtime);
write(root+'/content/translation/reviewed-oblivion-artifact-french.json',{'artifact.tum-era.artifact268.name':'Anneau d’oubli','artifact.tum-era.artifact268.description':'{Anneau d’oubli}\n\nPorté par l’un des héros, empêche Résurrection, Animation des morts et Sacrifice de rétablir les troupes. Supprime les cadavres libres après les attaques et les sorts, et bloque la Nécromancie après le combat.'});
const manifest=read(root+'/mod.json');manifest.artifacts=[...new Set([...manifest.artifacts,'config/reviewed-oblivion-artifact.json'])];manifest.french??={};manifest.french.translations=[...new Set([...(manifest.french.translations||[]),'translation/reviewed-oblivion-artifact-french.json'])];write(root+'/mod.json',manifest);write(report+'/oblivion-source-review.json',source);console.log('Activated native-reviewed source268 Ring of Oblivion.');
