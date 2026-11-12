/** Activate complete source202/273/274/277 with the existing native daily hook.
 * Every pair must resolve; removing unimplemented pairs is forbidden.
 */
import fs from 'node:fs';import path from 'node:path';
import {readEraArchive} from '../resources.mjs';
import {readArtifactTraits,identifiersByIndex,importNativeArtifacts} from './importer.mjs';
import {createProductionObjectResolvers,readJsonc} from '../objects/production-resolvers.mjs';
import {mergeRuntimePolicies} from '../runtime-policy.mjs';
const source=path.resolve(process.argv[2]||'../Third-Upgrade-Mod-Full'),report=process.argv[3]||'outputs/wog-priorities-0.4.147';
const ids=[202,273,274,277],cfgs=Object.fromEntries(ids.map(id=>[id,fs.readFileSync(path.join(source,'Data/artifacts',id+'.cfg'),'utf8')]));
const archive=readEraArchive(fs.readFileSync(path.join(source,'Data/EmeraldArtifacts.pac')));
if(archive.sha256!=='0beb089b85dacd42d456dedd2eaf7dc0b4d35541806f857e24a08e2bad5d3893')throw Error('Changed source artifact archive');
const spells=identifiersByIndex(fs.readdirSync('work/vcmi-wasm/config/spells').filter(f=>f.endsWith('.json')).map(f=>readJsonc('work/vcmi-wasm/config/spells/'+f)));
const core=identifiersByIndex([readJsonc('work/vcmi-wasm/config/artifacts.json')]);
const r=createProductionObjectResolvers({projectRoot:process.cwd(),sourceRoot:source});
const result=importNativeArtifacts({traits:readArtifactTraits(archive.extract('artraits.txt').toString('latin1')),language:readJsonc(path.join(source,'Lang/TUM_Artifacts.json')).era.artifacts,cfgs,archive,aiPolicy:'native-vcmi',dailyConversions:{bridgeVersion:2,resolveCreature:r.resolveCreature},resolveSpell:id=>spells.has(id)?'core:'+spells.get(id):undefined,resolveCoreArtifact:id=>id<171&&core.has(id)?'core:'+core.get(id):undefined});
if(result.report.length!==4||result.report.some(a=>!a.included))throw Error(JSON.stringify(result.report));
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.isBuffer(v)?v:JSON.stringify(v,null,2)+'\n');};
for(const[file,bytes]of result.files)write('mod/tum-era/'+file.replace(/^Content\//,'content/'),bytes);
write('mod/tum-era/content/config/reviewed-conversion-artifacts.json',result.definitions);
const runtime='mod/tum-era/content/config/era-bridge-runtime.json';write(runtime,mergeRuntimePolicies([readJsonc(runtime),result.runtimePolicy]));
const translations={};const labels={202:['Arbalète','+10 tirs. Au début de chaque journée, transforme les Archers et Arbalétriers en Arbalétriers de troisième évolution, et les Cavaliers en Cavaliers archers. Doit être équipé. Conserve les effectifs et l’expérience.'],273:['Œil du dragon vert','+1 au minimum de dégâts. Transforme chaque jour les Dragonneaux verts et les Dragons squelettiques ou spectraux en Dragons verts. Doit être équipé. Conserve les effectifs et l’expérience.'],274:['Œil du dragon rouge','+1 au maximum de dégâts. Transforme chaque jour les Dragonneaux rouges et les Dragons squelettiques ou spectraux en Dragons rouges. Doit être équipé. Conserve les effectifs et l’expérience.'],277:['Œil du dragon azur','+2 aux dégâts minimum et maximum. Transforme chaque jour les Dragonneaux azur et les Dracoliches en Dragons azur. Doit être équipé. Conserve les effectifs et l’expérience.']};
for(const[id,[name,description]]of Object.entries(labels)){translations['artifact.tum-era.artifact'+id+'.name']=name;translations['artifact.tum-era.artifact'+id+'.description']='{'+name+'}\n\n'+description;}
write('mod/tum-era/content/translation/reviewed-conversion-artifacts-french.json',translations);
const manifest=readJsonc('mod/tum-era/mod.json');manifest.artifacts=[...new Set([...manifest.artifacts,'config/reviewed-conversion-artifacts.json'])];manifest.french??={};manifest.french.translations=[...new Set([...(manifest.french.translations||[]),'translation/reviewed-conversion-artifacts-french.json'])];write('mod/tum-era/mod.json',manifest);
write(report+'/conversion-artifacts-source.json',{ids,archiveSHA256:archive.sha256,artifacts:result.report,policies:result.runtimePolicy.artifacts,source:'Emerald3/emerald/events.cpp303..308',nativeService:'Existing dailyConversions bridgev2; source pair order, equipment slot order and seven independent stack updates',nativeValidationRequired:true});
console.log('Installed four whole original daily-conversion artifacts for native validation.');
