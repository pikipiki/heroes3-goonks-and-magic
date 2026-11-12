/** Source261 overlay only; activate after native BF/mana/both-hero controls. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {readEraArchive} from '../resources.mjs';
import {readArtifactTraits,normalizeArtifactLanguage,decodeArtifactIcon,encodePng,scenarioIcon} from './importer.mjs';
import {compileArtifactDefinition} from './artifacts.mjs';
import {validateRuntimePolicy} from '../runtime-policy.mjs';
const [project,source,output]=process.argv.slice(2).map(p=>path.resolve(p));
if(!output||output.startsWith(project+path.sep)||fs.existsSync(output))throw Error('Usage: import-exchange-cloak.mjs PROJECT SOURCE FRESH_OUTPUT');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const script=fs.readFileSync(path.join(source,'Data/s/Third Upgrade Mod.erm'));
if(sha(script)!=='0dbb2a4498de1ab57492fd506ffd5f177abb6455af6037e42d274d0a3ea8a315')throw Error('Original cloak script changed');
if(fs.existsSync(path.join(source,'Data/artifacts/261.cfg')))throw Error('Additional source CFG obligations need review');
const archive=readEraArchive(fs.readFileSync(path.join(source,'Data/EmeraldArtifacts.pac')));
if(archive.sha256!=='0beb089b85dacd42d456dedd2eaf7dc0b4d35541806f857e24a08e2bad5d3893')throw Error('Original artifact archive changed');
const id=261,trait=readArtifactTraits(archive.extract('artraits.txt').toString('latin1'))[id];
const language=JSON.parse(fs.readFileSync(path.join(source,'Lang/TUM_Artifacts.json'))).era.artifacts;
const asset='tum-era/artifacts/261',icon=decodeArtifactIcon(archive.extract('artifact.def'),id);
if(!/^HrArt0*261\./i.test(icon.name))throw Error('Source cloak portrait mismatch');
const result=compileArtifactDefinition({id,text:'',authorizeAdapters:['exchangeCloak'],
 baseArtifact:{type:['HERO'],class:trait.class,value:trait.value,slot:trait.slot,text:normalizeArtifactLanguage(trait,language[id]).text},
 resolveAssets:()=>({image:asset+'/icon.png',map:asset+'/map.def',scenarioBonus:asset+'/scenario.png'})});
if(!result.ok)throw Error(JSON.stringify(result.diagnostics));
const policy=validateRuntimePolicy({schemaVersion:1,creatures:{},artifacts:{'tum-era:artifact261':{exchangeCloak:{}}}});
const write=(name,data)=>{const target=path.join(output,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,Buffer.isBuffer(data)?data:JSON.stringify(data,null,2)+'\n');};
write('content/Sprites/'+asset+'/map.def',archive.extract('ava0261.def'));write('content/Sprites/'+asset+'/map.msk',archive.extract('ava0261.msk'));
write('content/Data/'+asset+'/icon.png',encodePng(icon));write('content/Data/'+asset+'/scenario.png',encodePng(scenarioIcon(icon)));
write('content/config/exchange-cloak.candidate.json',{artifact261:result.definition});write('runtime.candidate.json',policy);
write('exchange-cloak-source.json',{sourceId:id,archiveSHA256:archive.sha256,scriptSHA256:sha(script),
 source:'Third Upgrade Mod.erm BF&1000 Exchange Cloak and KO_cape/KO_cape2 functions',
 semantics:{humanBattle:true,bothHeroesRequired:true,exactlyOneEquipped:true,swapPersistentMana:true,attackDefense:'Existing original nonmachine battle stacks receive oppositeHeroPrimary minus ownHeroPrimary',excludedSourceCreatures:[145,146,147,148,149],summons:'Subsequent summons retain their normal hero bonuses',rebornBranch:'Source reborn integration is not installed; default branch swaps mana.'},
 timingEvidence:['https://www.h3wog.com/erm_help/other/trigger_right.htm','https://www.h3wog.com/erm_help/other/variable_right.htm','Emerald opening hook464FBA occurs at side first-activation artifact pass'],
 pending:['Native no-hero/both-cloaks/backpack/AI-only guards','Hero-vs-hero swapped mana and both armies ATK/DEF','No machine changes and no adventure primary-stat mutation','Save/load and battle replay controls'],activationReady:false});
console.log('Prepared full source Exchange Cloak overlay; native controls required.');
