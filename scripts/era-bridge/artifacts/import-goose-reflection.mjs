/** Source179/181/197 metadata and precise service contracts; phase3 overlay only. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {readEraArchive} from '../resources.mjs';
import {readArtifactTraits,normalizeArtifactLanguage,decodeArtifactIcon,encodePng,scenarioIcon,identifiersByIndex,parseJsonc} from './importer.mjs';
import {compileArtifactDefinition} from './artifacts.mjs';
const [project,source,output]=process.argv.slice(2).map(p=>path.resolve(p));
if(!output||output.startsWith(project+path.sep)||fs.existsSync(output))throw Error('PROJECT SOURCE FRESH_OUTPUT required');
const script=fs.readFileSync(path.join(source,'Data/s/Third Upgrade Mod.erm'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
if(sha(script)!=='0dbb2a4498de1ab57492fd506ffd5f177abb6455af6037e42d274d0a3ea8a315')throw Error('Changed original script');
const archive=readEraArchive(fs.readFileSync(path.join(source,'Data/EmeraldArtifacts.pac')));
if(archive.sha256!=='0beb089b85dacd42d456dedd2eaf7dc0b4d35541806f857e24a08e2bad5d3893')throw Error('Changed original artifact archive');
const traits=readArtifactTraits(archive.extract('artraits.txt').toString('latin1'));
const language=JSON.parse(fs.readFileSync(path.join(source,'Lang/TUM_Artifacts.json'))).era.artifacts;
const core=identifiersByIndex([parseJsonc(fs.readFileSync(path.join(project,'work/vcmi-wasm/config/artifacts.json'),'utf8'))]);
const spellDir=path.join(project,'work/vcmi-wasm/config/spells');const spells=identifiersByIndex(fs.readdirSync(spellDir).filter(f=>f.endsWith('.json')).map(f=>parseJsonc(fs.readFileSync(path.join(spellDir,f),'utf8'))));
const definitions={},write=(name,data)=>{const p=path.join(output,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.isBuffer(data)?data:JSON.stringify(data,null,2)+'\n');};
for(const id of [179,181,197]){
 const cfgFile=path.join(source,'Data/artifacts',id+'.cfg');const cfg=id===197?fs.readFileSync(cfgFile,'utf8'):'';if(id!==197&&fs.existsSync(cfgFile)||id===197&&cfg.trim()!=='GivesSpellSet=17')throw Error('Additional source CFG needs review');
 const trait=traits[id],asset='tum-era/artifacts/'+id,icon=decodeArtifactIcon(archive.extract('artifact.def'),id);
 if(!new RegExp('^HrArt0*'+id+'\\.','i').test(icon.name))throw Error('Original icon identity changed');
 const compiled=compileArtifactDefinition({id,text:cfg,authorizeAdapters:['goldenGoose','reflection','elementalExclusivity'],resolveSpell:n=>spells.has(n)?'core:'+spells.get(n):undefined,resolveArtifact:n=>core.has(n)?'core:'+core.get(n):undefined,
  baseArtifact:{type:['HERO'],class:trait.class,value:trait.value,slot:trait.slot,text:normalizeArtifactLanguage(trait,language[id]).text},
  resolveAssets:()=>({image:asset+'/icon.png',map:asset+'/map.def',scenarioBonus:asset+'/scenario.png'})});
 if(!compiled.ok)throw Error(JSON.stringify(compiled.diagnostics));definitions['artifact'+id]=compiled.definition;
 write('content/Sprites/'+asset+'/map.def',archive.extract('ava'+String(id).padStart(4,'0')+'.def'));
 write('content/Sprites/'+asset+'/map.msk',archive.extract('ava'+String(id).padStart(4,'0')+'.msk'));
 write('content/Data/'+asset+'/icon.png',encodePng(icon));write('content/Data/'+asset+'/scenario.png',encodePng(scenarioIcon(icon)));
}
write('content/config/goose-reflection.candidate.json',definitions);
write('runtime.candidate.json',{schemaVersion:1,creatures:{},artifacts:{'tum-era:artifact179':{goldenGoose:{countBackpack:false}},'tum-era:artifact181':{reflection:{resistanceBonus:20}},'tum-era:artifact197':{elementalFreedom:{}}}});
write('goose-reflection-source.json',{ids:[179,181,197],scriptSHA256:sha(script),archiveSHA256:archive.sha256,
 goose:{sourceGoldPerCopy:7000,sourceOptionalBackpackSwitch:727,defaultBackpackOption:false,nativeComponents:[115,116,117],nativeEquivalence:'Subtract each equipped Goose instance native inherited gold generation before native income handicap, then add raw7000 per eligible source copy after handicap. Separate native resource artifacts remain untouched.'},
 reflection:{source:'OnDwarfMagicResistance: add20 to current resistance then clamp0..100; equipped original hero only',nativeEquivalence:'Apply after native base/aura aggregation, not a pre-aura MAGIC_RESISTANCE bonus',components:[57,58,59]},
 ring:{source:'Ring of Elements OnBattleRound0 / tum_ActivateElemRing',native:'Per-casting-side equipped ring; require at least one human participant in native detailed combat; ordinary restriction remains for the other side'},
 pending:['Native daily-income adapter and handler','Native reflection post-aura adapter','Native copies, equip/backpack, income-handicap controls','Native resistance/aura/hostile spell and component immunity controls'],activationReady:false});
console.log('Prepared original Goose/Reflection overlay; native phase3 services required.');
