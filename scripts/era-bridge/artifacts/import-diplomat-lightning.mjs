/** Source180/220 metadata and explicit pending native event contracts; phase4 overlay only. */
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
for(const id of [180,220]){
 const cfgFile=path.join(source,'Data/artifacts',id+'.cfg');const cfg=id===220?fs.readFileSync(cfgFile,'utf8'):'';if(id===180&&fs.existsSync(cfgFile)||id===220&&cfg.replace(/\r/g,'').trim()!=='Attack=3\nDefence=3\nKnowledge=3\nSpellpower=6\nGivesSpell=19\nGivesSpell=17\nImmunities=19\nImmunities=17')throw Error('Changed source CFG');
 const trait=traits[id],asset='tum-era/artifacts/'+id,icon=decodeArtifactIcon(archive.extract('artifact.def'),id);
 if(!new RegExp('^HrArt0*'+id+'\\.','i').test(icon.name))throw Error('Original icon identity changed');
 const compiled=compileArtifactDefinition({id,text:cfg,duplicates:'emerald-first',authorizeAdapters:['diplomatCloakLegacy','lightningRod'],resolveSpell:n=>spells.has(n)?'core:'+spells.get(n):undefined,resolveArtifact:n=>core.has(n)?'core:'+core.get(n):undefined,
  baseArtifact:{type:['HERO'],class:trait.class,value:trait.value,slot:trait.slot,text:normalizeArtifactLanguage(trait,language[id]).text},
  resolveAssets:()=>({image:asset+'/icon.png',map:asset+'/map.def',scenarioBonus:asset+'/scenario.png'})});
 if(!compiled.ok)throw Error(JSON.stringify(compiled.diagnostics));definitions['artifact'+id]=compiled.definition;
 write('content/Sprites/'+asset+'/map.def',archive.extract('ava'+String(id).padStart(4,'0')+'.def'));
 write('content/Sprites/'+asset+'/map.msk',archive.extract('ava'+String(id).padStart(4,'0')+'.msk'));
 write('content/Data/'+asset+'/icon.png',encodePng(icon));write('content/Data/'+asset+'/scenario.png',encodePng(scenarioIcon(icon)));
}
write('content/config/diplomat-lightning.candidate.json',definitions);
const archer=fs.readFileSync(path.join(source,'Data/s/-1000 tum - Archer.erm'));
if(sha(archer)!=='57a0f834e50e5f67f97b834048bca5da379145304f6da4d1757b53c53e06fe7e')throw Error('Changed source interoperability hooks');
write('runtime.candidate.json',{schemaVersion:1,artifacts:{'tum-era:artifact180':{perceivedStrength:{multiplier:3}},'tum-era:artifact220':{lightningRod:{}}}});
write('source-review.json',{ids:[180,220],scriptSHA256:sha(script),archerSHA256:sha(archer),archiveSHA256:archive.sha256,activationReady:false,
 diplomat:{sourceDescription:'Threefold perceived hero army strength for neutrals and Thieves Guild; components66/67/68 native surrender discounts',optionalSourceHooks:['WOG_71_GetDiploBonus adds3 if EnhancedArtifactII present','ES_786_GetDiscountLevel adds3 if DiplomaticBargain present'],pending:['Verify original perceived-strength hook context and rounding','Native perceived-strength-only adapter; preserve actual combat stats and reward XP','External optional enhancement adapters must have explicit settings and native equivalents']},
 lightning:{source:'Third Upgrade Mod.erm1760..1843',receiverEvidence:'https://www.h3wog.com/erm_help/receivers/receiver_bm_right.htm BM:K direct strike; BM:V animation only',timingEvidence:'https://www.h3wog.com/erm_help/other/trigger_right.htm MR1 after standard correction is computed and before returned damage; local era.dll48FE6B registers named OnMagicCorrectedResistance30308',firstMatchCfg:'Only GivesSpell19 and Immunities19 survive Emerald repeated scalar parsing; do not invent GivesSpell17 or immunity17',contract:['Either side equipped: Lightning Bolt and Chain Lightning ignore natural immunity/resistance','Target artifact Pendant of Negativity or Ionized Armor retains immunity','Caster equipped: ChainLightning own-side targets are immune','Hero ChainLightning with equipped Rod: Every hostile target receives an additional direct BM:K injury of rawLightningBolt(power,LightningBolt mastery); ordinary declining ChainLightning damage remains'],pending:['Native separate raw injury before ordinary already-corrected chain injury; do not fold into spell damage modifiers','Native immunity/chain-target selection/flat-bounce adapter and controls','TUMReborn optional artifactImmunity hook has no active external provider in this build']}});
console.log('Prepared inactive180/220 original metadata; native source contracts remain pending.');
