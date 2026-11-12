/** Source262/263 complete metadata/CFG and named native mass-spell services.
 * Isolated overlay: activation requires real native gameplay controls.
 */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {readEraArchive} from '../resources.mjs';
import {readArtifactTraits,normalizeArtifactLanguage,identifiersByIndex,decodeArtifactIcon,encodePng,scenarioIcon} from './importer.mjs';
import {compileArtifactDefinition} from './artifacts.mjs';
import {createProductionObjectResolvers,readJsonc} from '../objects/production-resolvers.mjs';
import {validateRuntimePolicy} from '../runtime-policy.mjs';
const [project,source,output]=process.argv.slice(2).map(p=>path.resolve(p));
if(!output||output.startsWith(project+path.sep)||fs.existsSync(output))throw Error('Usage: import-mass-spells.mjs PROJECT SOURCE FRESH_OUTPUT');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const script=fs.readFileSync(path.join(source,'Data/s/Third Upgrade Mod.erm'));
if(sha(script)!=='0dbb2a4498de1ab57492fd506ffd5f177abb6455af6037e42d274d0a3ea8a315')throw Error('Original mass spell program changed');
const archive=readEraArchive(fs.readFileSync(path.join(source,'Data/EmeraldArtifacts.pac')));
if(archive.sha256!=='0beb089b85dacd42d456dedd2eaf7dc0b4d35541806f857e24a08e2bad5d3893')throw Error('Original artifact archive changed');
const traits=readArtifactTraits(archive.extract('artraits.txt').toString('latin1'));
const language=readJsonc(path.join(source,'Lang/TUM_Artifacts.json')).era.artifacts;
const r=createProductionObjectResolvers({projectRoot:project,sourceRoot:source});
const spellDir=path.join(project,'work/vcmi-wasm/config/spells');
const spells=identifiersByIndex(fs.readdirSync(spellDir).filter(f=>f.endsWith('.json')).map(f=>readJsonc(path.join(spellDir,f))));
const definitions={},runtime={schemaVersion:1,creatures:{},artifacts:{}};
const write=(name,data)=>{const target=path.join(output,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,Buffer.isBuffer(data)?data:JSON.stringify(data,null,2)+'\n');};
for(const id of [262,263]){
 const file=path.join(source,'Data/artifacts',id+'.cfg'),cfg=fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';
 const trait=traits[id],asset='tum-era/artifacts/'+id,icon=decodeArtifactIcon(archive.extract('artifact.def'),id);
 if(!new RegExp('^HrArt0*'+id+'\\.','i').test(icon.name))throw Error('Source mass artifact icon identity mismatch');
 const result=compileArtifactDefinition({id,text:cfg,duplicates:'emerald-first',aiPolicy:'native-vcmi',
  authorizeAdapters:['artifactDailyConversions','massResurrection','massImplosion'],resolveCreature:r.resolveCreature,
  resolveSpell:id=>spells.has(id)?'core:'+spells.get(id):undefined,
  baseArtifact:{type:['HERO'],class:trait.class,value:trait.value,slot:trait.slot,text:normalizeArtifactLanguage(trait,language[id]).text},
  resolveAssets:()=>({image:asset+'/icon.png',map:asset+'/map.def',scenarioBonus:asset+'/scenario.png'})});
 if(!result.ok)throw Error(JSON.stringify(result.diagnostics));
 definitions['artifact'+id]=result.definition;
 const operations={massSpells:{spells:id===262?['core:resurrection','core:animateDead']:['core:implosion'],powerPercent:30}};
 const conversions=result.adapters.find(a=>a.kind==='artifactDailyConversions');
 if(conversions)operations.dailyConversions=conversions.upgrades.map(({from,to})=>({from,to}));
 runtime.artifacts['tum-era:artifact'+id]=operations;
 write('content/Sprites/'+asset+'/map.def',archive.extract('ava'+String(id).padStart(4,'0')+'.def'));
 write('content/Sprites/'+asset+'/map.msk',archive.extract('ava'+String(id).padStart(4,'0')+'.msk'));
 write('content/Data/'+asset+'/icon.png',encodePng(icon));write('content/Data/'+asset+'/scenario.png',encodePng(scenarioIcon(icon)));
}
write('content/config/mass-spell-artifacts.candidate.json',definitions);write('runtime.candidate.json',validateRuntimePolicy(runtime));
write('mass-spells-source.json',{ids:[262,263],archiveSHA256:archive.sha256,scriptSHA256:sha(script),sourceFunction:'tum_CastMassiveSpell',
 sourceEligibilityFunction:'tum_Battle_CanStackReceiveSpell wraps original5A3F90 with castingSide and eligibility flags1/1',
 semantics:{powerPercent:30,powerRounding:'truncate then clamp1..255',mastery:'actual hero spell mastery',originalSlotsPerSide:21,skipPrimaryTarget:true,skipFullyDeadStacks:true,skipArrowTowers:true,noAdditionalMana:true,noAdditionalHeroCast:true},
 sourceActionMapping:'Native HERO_SPELL event. Source CANCEL branch is a workaround for H3 occasionally misclassifying completed hero casts; native actions identify them explicitly.',
 pending:['Native Resurrection/AnimateDead on living partial armies','Implosion secondary30percent power and primary skip','Backpack, mana and once-per-round controls','All four source262 daily conversions','Save/load controls'],activationReady:false});
console.log('Prepared two original mass spell artifacts; native controls required.');
