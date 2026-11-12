/** Whole original artifacts with the native equipped opening-summon adapter.
 * Writes an isolated review overlay. Caller activates only after native tests.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {readEraArchive} from '../resources.mjs';
import {readArtifactTraits,identifiersByIndex,importNativeArtifacts} from './importer.mjs';
import {createProductionObjectResolvers,readJsonc} from '../objects/production-resolvers.mjs';
import {validateRuntimePolicy} from '../runtime-policy.mjs';

const [projectArg,sourceArg,outputArg]=process.argv.slice(2);
if(!outputArg)throw Error('Usage: import-opening-summons.mjs PROJECT SOURCE FRESH_OUTPUT');
const project=path.resolve(projectArg),source=path.resolve(sourceArg),output=path.resolve(outputArg);
if(output.startsWith(project+path.sep)||fs.existsSync(output))throw Error('Fresh isolated output required');
const bytes=fs.readFileSync(path.join(source,'Data/EmeraldArtifacts.pac'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
if(sha(bytes)!=='0beb089b85dacd42d456dedd2eaf7dc0b4d35541806f857e24a08e2bad5d3893')throw Error('Original Emerald artifact archive changed');
const archive=readEraArchive(bytes);
const traits=readArtifactTraits(archive.extract('artraits.txt').toString('latin1'));
const language=JSON.parse(fs.readFileSync(path.join(source,'Lang/TUM_Artifacts.json'))).era.artifacts;
const cfgs=Object.fromEntries(fs.readdirSync(path.join(source,'Data/artifacts')).filter(n=>/^\d+\.cfg$/.test(n)).map(n=>[parseInt(n),fs.readFileSync(path.join(source,'Data/artifacts',n),'utf8')]));
const spellDir=path.join(project,'work/vcmi-wasm/config/spells');
const spells=identifiersByIndex(fs.readdirSync(spellDir).filter(n=>n.endsWith('.json')).map(n=>readJsonc(path.join(spellDir,n))));
const core=identifiersByIndex([readJsonc(path.join(project,'work/vcmi-wasm/config/artifacts.json'))]);
const resolver=createProductionObjectResolvers({sourceRoot:source,projectRoot:project});
const result=importNativeArtifacts({traits,language,cfgs,archive,aiPolicy:'native-vcmi',openingSummons:{bridgeVersion:1,resolveCreature:resolver.resolveCreature},resolveSpell:id=>spells.has(id)?'core:'+spells.get(id):undefined,resolveCoreArtifact:id=>id<171&&core.has(id)?'core:'+core.get(id):undefined});
const selected=[219,231,279];
for(const id of selected)if(!result.definitions['artifact'+id])throw Error('Unclosed source artifact '+id);
const definitions=Object.fromEntries(selected.map(id=>['artifact'+id,result.definitions['artifact'+id]]));
const runtime=validateRuntimePolicy({schemaVersion:1,creatures:{},artifacts:Object.fromEntries(selected.map(id=>['tum-era:artifact'+id,result.runtimePolicy.artifacts['tum-era:artifact'+id]]))});
const write=(file,data)=>{const p=path.join(output,file);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.isBuffer(data)?data:JSON.stringify(data,null,2)+'\n');};
for(const[file,data]of result.files)if(selected.some(id=>file.includes('/'+id+'/')))write(file.replace(/^Content\//,'content/'),data);
write('content/config/opening-summon-artifacts.candidate.json',definitions);
write('runtime.candidate.json',runtime);
write('opening-summons-source.json',{artifactIds:selected,sourceArchiveSHA256:sha(bytes),cfgSHA256:Object.fromEntries(selected.map(id=>[id,sha(Buffer.from(cfgs[id]))])),sourceContract:{configuration:'Emerald3/emerald/emerald.cpp:133-147',ordering:'Emerald3/emerald/events.cpp:26-46',nativeFunction:'h3era.exe5A7390..5A7627',nativePointer:'emerald3_3.era.data10051020=005A7390',count:'SPTRAITS Visions base effect1 multiplied by encoded source power; integer truncation towards zero; zero becomes1',placement:'randomized rows0..10 from side x1/x15 inward; native wide-creature accessibility',elementalRestriction:'original left/right summon type restored after each artifact call; marker excluded by native Summon::applicable'},pending:['Browser/native equipment versus backpack, source counts, both sides, no mana use, vanish after battle, ordinary elemental exclusivity and save/load controls'],activationReady:false});
console.log('Prepared three original summoning artifacts in '+output);
