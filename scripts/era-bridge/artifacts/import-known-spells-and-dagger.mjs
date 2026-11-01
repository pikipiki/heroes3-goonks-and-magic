/** Source-complete review overlay for four spell catalogues and the Ritual Dagger. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {readEraArchive} from '../resources.mjs';
import {readArtifactTraits,parseJsonc,identifiersByIndex,importNativeArtifacts} from './importer.mjs';
import {readSpellCatalogue} from './spell-catalogue.mjs';
const args=process.argv.slice(2);
if(args.length!==4)throw Error('Usage: import-known-spells-and-dagger.mjs PROJECT TUM ORIGINAL_BITMAP_LOD REVIEW_OUTPUT');
const [project,tum,bitmap,out]=args.map(x=>path.resolve(x));
if(out===project||out.startsWith(project+path.sep))throw Error('Review output must be outside project');
const read=p=>JSON.parse(fs.readFileSync(path.join(project,p),'utf8'));
const archive=readEraArchive(fs.readFileSync(path.join(tum,'Data/EmeraldArtifacts.pac'))),base=readEraArchive(fs.readFileSync(bitmap)),sptraits=base.extract('sptraits.txt'),catalogue=readSpellCatalogue(sptraits.toString('latin1'));
const spellConfigs=fs.readdirSync(path.join(project,'work/vcmi-wasm/config/spells')).filter(n=>n.endsWith('.json')).map(n=>parseJsonc(fs.readFileSync(path.join(project,'work/vcmi-wasm/config/spells',n),'utf8'))),spells=identifiersByIndex(spellConfigs),native=Object.assign({},...spellConfigs);
for(const row of catalogue)if(!spells.has(row.id)||(native[spells.get(row.id)].level!==undefined&&native[spells.get(row.id)].level!==row.level))throw Error('Native/source spell catalogue differs at '+row.id);
const ids=[192,193,194,195,223],expected={192:'GivesSpellSet=9',193:'GivesSpellSet=10',194:'GivesSpellSet=11',195:'GivesSpellSet=12',223:'UpgradeFrom=8\nUpgradeTo=64\nUpgradeFrom2=9\nUpgradeTo2=64\nUpgradeFrom3=34\nUpgradeTo3=64\nUpgradeFrom4=35\nUpgradeTo4=64\nUpgradeFrom5=257\nUpgradeTo5=222'};
const cfgs=Object.fromEntries(ids.map(id=>{const text=fs.readFileSync(path.join(tum,'Data/artifacts',id+'.cfg'),'utf8');if(text.replace(/\r/g,'').trim()!==expected[id])throw Error('Changed artifact cfg '+id+' requires a new source audit');return[id,text];}));
const byEra=new Map(Object.entries(read('mod/tum-era/content/config/era-bridge-status-attacks.json').sourceIds).map(([key,id])=>[id,key]));
const result=importNativeArtifacts({traits:readArtifactTraits(archive.extract('artraits.txt').toString('latin1')),language:JSON.parse(fs.readFileSync(path.join(tum,'Lang/TUM_Artifacts.json'),'utf8')).era.artifacts,cfgs,archive,spellCatalogue:catalogue,aiPolicy:'native-vcmi',resolveSpell:id=>spells.has(id)?'core:'+spells.get(id):null,dailyConversions:{bridgeVersion:2,resolveCreature:id=>byEra.get(id)}});
if(result.report.length!==5||result.report.some(r=>!r.included))throw Error(JSON.stringify(result.report));
for(const [name,bytes]of result.files){const dest=path.join(out,name.replace(/^Content\//,'content/'));fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);}
const write=(name,data)=>{const dest=path.join(out,name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify(data,null,2)+'\n')};
write('content/config/known-spells-and-dagger.candidate.json',result.definitions);
write('runtime.candidate.json',result.runtimePolicy);
write('source-import-report.json',{registered:false,activationReady:false,sourceArchiveSha256:archive.sha256,sourceSpellTableSha256:crypto.createHash('sha256').update(sptraits).digest('hex'),spellCatalogue:catalogue,report:result.report,pending:['Native spellbook checks for four level sets','Native daily equipped-only five-pair conversion preserving XP/count']});
console.log(JSON.stringify({out,artifacts:result.report.length,files:result.files.size}));
