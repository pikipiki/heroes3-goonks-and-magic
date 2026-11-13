/** Source238 HERO_CAST MR0 multiplier; inactive candidate. */
import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';
import{readEraArchive}from'../resources.mjs';
import{readArtifactTraits,normalizeArtifactLanguage,decodeArtifactIcon,encodePng,scenarioIcon,identifiersByIndex,parseJsonc}from'./importer.mjs';
import{compileArtifactDefinition}from'./artifacts.mjs';
import{validateOrbChaos238}from'./orb-chaos238.mjs';
const[project,source,output]=process.argv.slice(2).map(p=>path.resolve(p));
if(!output||(output.startsWith(project+path.sep)&&!output.startsWith(path.join(project,'work','downloads')+path.sep))||fs.existsSync(output))throw Error('PROJECT SOURCE FRESH_OUTPUT required');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const script=fs.readFileSync(path.join(source,'Data/s/Third Upgrade Mod.erm'));
if(sha(script)!=='0dbb2a4498de1ab57492fd506ffd5f177abb6455af6037e42d274d0a3ea8a315')throw Error('Changed original script');
const archive=readEraArchive(fs.readFileSync(path.join(source,'Data/EmeraldArtifacts.pac')));
if(archive.sha256!=='0beb089b85dacd42d456dedd2eaf7dc0b4d35541806f857e24a08e2bad5d3893')throw Error('Changed original artifact archive');
const coreArtifacts=identifiersByIndex([parseJsonc(fs.readFileSync(path.join(project,'work/vcmi-wasm/config/artifacts.json'),'utf8'))]);
const spells=identifiersByIndex(fs.readdirSync(path.join(project,'work/vcmi-wasm/config/spells')).filter(f=>f.endsWith('.json')).map(f=>parseJsonc(fs.readFileSync(path.join(project,'work/vcmi-wasm/config/spells',f),'utf8'))));
const traits=readArtifactTraits(archive.extract('artraits.txt').toString('latin1')),language=JSON.parse(fs.readFileSync(path.join(source,'Lang/TUM_Artifacts.json'))).era.artifacts;
const write=(name,data)=>{const p=path.join(output,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.isBuffer(data)?data:JSON.stringify(data,null,2)+'\n');},definitions={};
for(const id of[238]){
 const cfg=fs.readFileSync(path.join(source,'Data/artifacts',id+'.cfg'),'utf8');if(cfg.replace(/\r/g,'').trim()!=='Autospell=30\nAutospell2=31\nAutospell3=32\nAutospell4=33')throw Error('Changed source238 CFG requires review');
 const trait=traits[id],asset='tum-era/artifacts/'+id,icon=decodeArtifactIcon(archive.extract('artifact.def'),id);
 if(!new RegExp('^HrArt0*'+id+'\\.','i').test(icon.name))throw Error('Original icon identity changed');
 const compiled=compileArtifactDefinition({id,text:cfg,resolveSpell:n=>spells.has(n)?'core:'+spells.get(n):undefined,authorizeAdapters:['orbChaos'],resolveArtifact:id=>coreArtifacts.has(id)?'core:'+coreArtifacts.get(id):undefined,baseArtifact:{type:['HERO'],class:trait.class,value:trait.value,slot:trait.slot,text:normalizeArtifactLanguage(trait,language[id]).text},resolveAssets:()=>({image:asset+'/icon.png',map:asset+'/map.def',scenarioBonus:asset+'/scenario.png'})});
 if(!compiled.ok)throw Error(JSON.stringify(compiled.diagnostics));compiled.definition.text.description="{Orb of Chaos}\n\nAt battle start, grants expert Protection from all four schools for 50 rounds. The hero's damaging spell casts deal an additional 50% damage before target defenses, on top of the four elemental orbs in this combination.";definitions['artifact'+id]=compiled.definition;
 for(const suffix of['def','msk'])write('content/Sprites/'+asset+'/map.'+suffix,archive.extract('ava'+String(id).padStart(4,'0')+'.'+suffix));
 write('content/Data/'+asset+'/icon.png',encodePng(icon));write('content/Data/'+asset+'/scenario.png',encodePng(scenarioIcon(icon)));
}
write('content/config/orb-chaos238.candidate.json',definitions);
write('runtime.candidate.json',validateOrbChaos238({schemaVersion:1,artifact:'tum-era:artifact238'}));
write('source-review.json',{ids:[238],scriptSHA256:sha(script),archiveSHA256:archive.sha256,sourceLines:[1154,1170],mechanism:'MR0 OnMagicBasicResistance: BG:A=HERO_CAST only, CURRENT acting-side hero equipped238; MR:D = signed32wrap(damage*3) /2 truncated toward zero. Apply after existing hero bonuses/orb components but before target innate correction, XP g and school protections.',components:[79,80,81,82],openingSpells:[30,31,32,33],openingDuration:50,sourceIdentity:'Original4E59D0 recognizes an orb component through its combo parent and applies the usual school bonus beforeMR0; the238script is additional and multiplicative.',nativeState:'Scoped BaseMechanics::adjustEffectValue context: action=HERO, non-null actual target, CURRENT side from the shared source battle context (effective hypnosis-aware side), equipment body0..18. Passive openings/creature actions are excluded; no always-on SPELL_DAMAGE50 aura is added.',baseline:'Preserves existing native bridge caster-specific spell-bonus calculation; the source MR0 integer multiplier and ordering are explicit. No claim of bit-exact Win32 floating arithmetic across all pre-existing hero modifiers.',pending:['Native hero/body/backpack/opposite/ordinary components damage','Golem/XPg/Protection order and source fixed50 passive/creature gates','Real GUI targeted/area/chain casts and unrelated effects'],activationReady:false});
console.log('Prepared source238 MR0 candidate without activation.');
