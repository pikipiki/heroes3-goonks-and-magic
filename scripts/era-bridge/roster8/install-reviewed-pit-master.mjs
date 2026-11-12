/** Promote source217 only after real canonical and Demonology native controls. */
import fs from'node:fs';import path from'node:path';
const[review,canonicalEvidence,demonEvidence]=process.argv.slice(2);if(!demonEvidence)throw Error('Usage: install-reviewed-pit-master.mjs REVIEW CANONICAL_NATIVE_REPORT DEMONOLOGY_NATIVE_REPORT');
const read=p=>JSON.parse(fs.readFileSync(p)),write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const metadata=read(review+'/review.json'),canonical='third-upgrades:tumPitMaster',a=read(canonicalEvidence),b=read(demonEvidence);if(metadata.canonical!==canonical||metadata.replacesExistingAlias!==true||a.passed!==true||!a.report?.pitMaster||b.passed!==true||!b.report?.demonology)throw Error('Complete canonical217 and mode2 native evidence required');
const root='mod/tum-era',patch=read(review+'/content/config/complete-pit-master.candidate.json');if(Object.keys(patch).length!==1||!patch[canonical])throw Error('Existing canonical alias only');
for(const asset of metadata.uiAssets?.files||[]){const target=root+'/'+asset.path;fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(review+'/'+asset.path,target);}
write(root+'/content/config/complete-pit-master.json',patch);write(root+'/content/config/source-demonology-spells.json',read(review+'/content/config/source-demonology-spells.candidate.json'));
const runtime=read(root+'/content/config/era-bridge-runtime.json');runtime.creatures[canonical]={...runtime.creatures[canonical],...read(review+'/runtime.candidate.json')};write(root+'/content/config/era-bridge-runtime.json',runtime);
const manifest=read(root+'/mod.json');manifest.creatures=[...new Set([...manifest.creatures,'config/complete-pit-master.json'])];manifest.spells=[...new Set([...(manifest.spells||[]),'config/source-demonology-spells.json'])];write(root+'/mod.json',manifest);
write('outputs/wog-priorities-0.4.147/pit-master-source.json',{...metadata,active:true,nativeEvidence:[canonicalEvidence,demonEvidence],canonicalIdRetained:true,duplicateActorCreated:false});console.log('Installed full source217 on its existing canonical alias.');
