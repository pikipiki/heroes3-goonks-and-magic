/** Whole source dwelling dependency candidates. Never activates partial actors. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {readEraArchive,readCreatureTable,readCreatureAnimationTable,creatureStats} from '../resources.mjs';
import {compileCreatureProperties} from '../creatures/creature-properties.mjs';
import {parseCreatureExperience,compileCreatureExperience} from '../creatures/crexpbon.mjs';
import {compileFreshSourceExperienceDefaults,adaptSourceOwnHealthExperience} from '../creatures/source-experience-defaults.mjs';
import {finalArcherProfile} from '../creatures/archer-profiles.mjs';
import {readDefFrame} from '../def-frame.mjs';
import {readSoundArchive} from '../roster8/def-frame.mjs';
import {identifiersByIndex} from '../artifacts/importer.mjs';
import {createProductionObjectResolvers,readJsonc} from './production-resolvers.mjs';
import {convertObjectTemplate} from './objects.mjs';

import {readUnconditionalSourceUpgrades} from '../creatures/native-closed-upgrade-source.mjs';
import {sourceDwellingFlatHealthRows} from './source-dwelling-flat-health.mjs';
import {createSourceDeathBlowBinding} from '../creatures/death-blow-contract.mjs';
import {simulateSourceXpCache14} from '../creatures/source-xp-cache14.mjs';
import {dwellingExperienceRuntimeRows,compileDwellingExperienceServices} from './source-dwelling-experience-services.mjs';
import {compileDwellingExtraServices} from './source-dwelling-extra-services.mjs';
import {sourceSorceress316Services} from '../creatures/source-sorceress316.mjs';
import {compileDwellingServices} from './source-dwelling-services.mjs';
export const DWELLING_CLOSURE=Object.freeze([200,239,253,262,264,270,272,274,276,277,279,281,282,284,285,288,289,290,292,296,298,301,302,303,304,305,306,307,308,309,310,311,312,313,314,315,316,317,319,322,323,325,326,327,328,330,333,334,335,336,340,358,360,362]);
const BANK_OWNED=new Set([253,272,281,289,290,301,302,330,340,358]);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const namespace=id=>'tum-era:eraCreature'+id;
export async function prepareDwellingCandidates({projectRoot,sourceRoot,outputRoot}){
 if(fs.existsSync(outputRoot)&&fs.readdirSync(outputRoot).length)throw Error('Use fresh isolated output');
 if(path.resolve(outputRoot)===path.resolve(projectRoot)||path.resolve(outputRoot).startsWith(path.resolve(projectRoot)+path.sep))throw Error('Use isolated output outside project');
 const require=createRequire(path.join(projectRoot,'work/browser-tests/package.json')),sharp=require('sharp');
 const archive=readEraArchive(fs.readFileSync(path.join(sourceRoot,'Data/AmeCre.pac')));
 if(archive.sha256!=='452c833214b4c6df2a5e430bf4dd526ccd71792ede166ac2d77646516322731c')throw Error('Changed original source archive');
 const soundBytes=fs.readFileSync(path.join(sourceRoot,'Data/AmeCre.snd'));if(sha(soundBytes)!=='1da1264707a6dd7da79490bed64798a7bd6cf7cba12581e5b93549f0c29bbc32')throw Error('Changed source sound archive');
 const sounds=readSoundArchive(soundBytes);
 const traits=readCreatureTable(archive.extract('Crtraits.txt').toString('latin1')),animations=readCreatureAnimationTable(archive.extract('cranim.txt').toString('latin1'));
 const rows=parseCreatureExperience(archive.extract('crexpbon.txt').toString('latin1')),installedRows=parseCreatureExperience(fs.readFileSync(path.join(projectRoot,'mod/wake-of-gods/Mods/stackExperience/Content/data/crexpbon.txt'),'latin1'));
 const resolver=createProductionObjectResolvers({projectRoot,sourceRoot});
 const spellRoot=path.join(projectRoot,'work/vcmi-wasm/config/spells'),spells=identifiersByIndex(fs.readdirSync(spellRoot).filter(f=>f.endsWith('.json')).map(f=>readJsonc(path.join(spellRoot,f))));
 const artifacts=identifiersByIndex([readJsonc(path.join(projectRoot,'work/vcmi-wasm/config/artifacts.json'))]);
 const spell=id=>spells.has(id)?'core:'+spells.get(id):undefined;
 const resolveCreature=id=>DWELLING_CLOSURE.includes(id)?namespace(id):resolver.resolveCreature(id);
 const pinnedText=(file,expected)=>{const bytes=fs.readFileSync(path.join(sourceRoot,file));if(sha(bytes)!==expected)throw Error('Changed source '+file);return bytes.toString('utf8');};
 const sourceUpgrades=readUnconditionalSourceUpgrades(pinnedText('Data/s/Third Upgrade Mod.erm','0dbb2a4498de1ab57492fd506ffd5f177abb6455af6037e42d274d0a3ea8a315'),pinnedText('Data/s/1000 tum - consts.erm','cf39435c763439482ce6a96fc7d589abd27c96779de04e719678c2ec0db82d76'),{MON_CRYSTAL_DRAGON:133});
 const templateBytes=fs.readFileSync(path.join(sourceRoot,'Lang/RMG_Creatures.json'));if(sha(templateBytes)!=='87c32a48ad6855fa5d14d4a32b7e2522c499844dd2bac7f21cccdb5f0383cd93')throw Error('Changed source map templates');
 const templates=Object.values(JSON.parse(templateBytes).RMG.resound.properties).flat();
 const xpAdmission=readJsonc(path.join(projectRoot,'tests/fixtures/tum/dwelling-xp17.json'));if(xpAdmission.contract!=='source-dwelling-xp17-v1'||xpAdmission.rows.length!==17)throw Error('Exact dwelling XP17 cohort required');
 const names=JSON.parse(pinnedText('Lang/TUM_Creatures.json','0e392924b9fea7ec05657634668f37d828657b066ce90a78c2a1547dc0974ba0')).era.monsters;
 const files=new Map(),assetProof=[],definitions={},spellDefinitions={},profilePatch={},skeletonPatch={},records=[],runtime={schemaVersion:1,creatures:{}};
 const add=(file,bytes,source)=>{files.set(file,bytes);assetProof.push({file,source,sha256:sha(bytes),bytes:bytes.length});};
 const profiles=new Map();for(const line of archive.extract('crexpmod.txt').toString('latin1').split(/\r?\n/)){const c=line.trim().split(/\t+/);if(!/^-?\d+$/.test(c[0]))continue;const[id,experienceMultiplier,upgradeMultiplier,fullRank10,battlePercent,rank11Extra]=c.slice(0,6).map(Number);profiles.set(id,{experienceMultiplier,upgradeMultiplier,fullRank10,battlePercent,rank11Extra});}
 for(const id of DWELLING_CLOSURE.filter(id=>!BANK_OWNED.has(id))){
  const cfgBytes=fs.readFileSync(path.join(sourceRoot,'Data/Creatures',id+'.cfg')),cfg=cfgBytes.toString('utf8'),fields=Object.fromEntries(cfg.trim().split(/\r?\n/).map(line=>line.split('=').map(v=>v.trim())).map(([k,v])=>[k,Number(v)])),key=namespace(id),ownRows=rows.filter(r=>r.creature===id);
  const props=compileCreatureProperties(cfg,{source:'Data/Creatures/'+id+'.cfg',sourceCreatureId:id,freshDefinition:true,analyseOnly:true,nativeBiologyContract:'source-biological-flags-inanimate-v1',nativeExperienceProfile:true,resolveCreature,resolveSpell:spell,resolveArtifact:n=>artifacts.has(n)?'core:'+artifacts.get(n):undefined,resolveTown:n=>['castle','rampart','tower','inferno','necropolis','dungeon','stronghold','fortress','conflux'][n]?'core:'+['castle','rampart','tower','inferno','necropolis','dungeon','stronghold','fortress','conflux'][n]:undefined});
  const obligations=[...(props.diagnostics??[]),...props.policies.filter(p=>!p.bound).map(p=>({code:'unbound-cfg',kind:p.kind,keys:p.keys,parameters:p.parameters}))];
  const admittedRows=ownRows.filter(r=>xpAdmission.rows.some(p=>p.sourceId===id&&p.sourceLine===r.line&&p.code===r.code&&r.modifier==='#'+p.spell&&JSON.stringify(r.values)===JSON.stringify(p.chances)));
  const reusableRows=dwellingExperienceRuntimeRows(id,ownRows);
  const runtimeRows=ownRows.filter(r=>reusableRows.includes(r)||['p','a','K','E','U'].includes(r.code)||(id===316&&r.code==='u')||(id===322&&r.code==='l')||([309,310].includes(id)&&r.code==='H')||(r.code==='w'&&r.modifier==='C'));
  const ordinary=compileCreatureExperience(rows.filter(r=>r.creature<0||(r.creature===id&&!runtimeRows.includes(r))),{creatureId:id,nativeExperienceProfile:true,dispelProtection:'native-era-v1',negativeSpellLevels:'source-w-level-v1',experienceDefenseReduction:'source-experience-defense-v1',deathBlowCRT:[200,319,326].includes(id)?createSourceDeathBlowBinding({contract:'source-deathblow-crt-v1',sourceId:id,nativeId:key,kind:'xp',nativeExperienceProfile:true}):undefined,installedRows,rankZero:'intrinsic',resolveCreature,resolveSpell:spell,throwOnError:false});
  try{ordinary.nativePreview.stackExperience=adaptSourceOwnHealthExperience(ordinary.nativePreview.stackExperience,[309,310].includes(id)?ownRows.filter(r=>r.code!=='H'):ownRows,'source-health-xp-rounding-v1').stackExperience;}catch(error){obligations.push({code:'source-own-health-runtime',diagnostics:error.diagnostics});}
  const defaults=compileFreshSourceExperienceDefaults(rows,{creatureId:id,sourceLevelZeroBased:fields.Level,installedRows,nativeExperienceProfile:true,contract:'source-default-experience-new-creature-v1',freshDefinition:true,nativeDefaultCarrier:'creature-json',healthRoundingContract:'source-health-xp-rounding-v1'});
  if(!defaults.ok)throw Error('Unclosed source default rows '+id);
  obligations.push(...ordinary.diagnostics);
  let stats=traits[id];if(id===305){if(stats.advMapAmount.min!==25||stats.advMapAmount.max!==16)throw Error('Changed source305 invalid range');stats={...stats,invalidRange:false,advMapAmount:{min:16,max:25}};obligations.push({code:'source-exception-native-validation',field:'advMapAmount',original:[25,16],candidate:[16,25],reason:'Original inverted range has no defined valid native counterpart; bounds sorted as authorized undefined-value correction'});}
  const definition={...creatureStats(stats),...props.definition,name:{singular:names[id].name.singular,plural:names[id].name.plural},description:names[id].name.description,faction:props.definition.faction??'core:neutral',shots:traits[id].shots,hasDoubleWeek:false,abilities:{...props.definition.abilities,...ordinary.nativePreview.abilities},stackExperience:[...defaults.definition.stackExperience,...ordinary.nativePreview.stackExperience]};
  if(sourceUpgrades.upgrades.has(id))definition.upgrades=[resolveCreature(sourceUpgrades.upgrades.get(id).to)];
  if([309,310].includes(id)){
   const own=ownRows.filter(r=>r.code==='H');const expected=[0,1,2,4,5,7,8,10,11,13,14];
   if(own.length!==1||own[0].modifier!=='+'||JSON.stringify(own[0].values)!==JSON.stringify(expected))throw Error('Changed dwelling additive source health');
   definition.stackExperience.push(...sourceDwellingFlatHealthRows(expected));
  }
  if(ownRows.some(r=>r.code==='f'&&r.modifier==='u')){
   for(const bonus of[...Object.values(definition.abilities),...definition.stackExperience.map(r=>r.bonus)])if(bonus.type==='SPELL_RESISTANCE_AURA'&&bonus.val===20)bonus.val=25;
  }
  const services=compileDwellingServices(id,cfg,fields,key,definition);
  if(id===316){const source=sourceSorceress316Services(cfg,{deathCloudSpell:readJsonc(path.join(projectRoot,'mod/tum-era/content/config/necross-spells.json')).necrossDeathCloud});Object.assign(definition.abilities,source.abilities);Object.assign(spellDefinitions,source.spells);services.consumed.push(...source.consumedKeys);services.evidence.push(source.source);}
  const xpServices=compileDwellingExperienceServices(id,ownRows,definition,services.runtime,simulateSourceXpCache14(rows,{sourceId:id,zeroBasedLevel:fields.Level}));services.evidence.push(...xpServices.evidence);
  const extra=compileDwellingExtraServices(id,fields,key,definition);Object.assign(services.runtime,extra.runtime);services.consumed.push(...extra.consumed);services.evidence.push(...extra.evidence);services.pending.push(...extra.pending);
  for(let i=obligations.length-1;i>=0;i--)if(obligations[i].code==='unbound-cfg'&&obligations[i].keys.every(k=>services.consumed.includes(k)))obligations.splice(i,1);
  if(id===312)services.pending.push({code:'native-death-stare-proof-required',sourceId:id,values:Array.from({length:11},(_,i)=>i)});
  if(admittedRows.length)services.evidence.push({native:'SourceDwellingXpPolicy17 independent private/validated admission',rows:admittedRows.map(r=>({line:r.line,code:r.code,modifier:r.modifier,values:r.values})),nativeValidationRequired:true});
  obligations.push(...services.pending);
  runtime.creatures[key]=services.runtime;if([200,319,326].includes(id))runtime.creatures[key].deathBlowCRT={};
  obligations.push(...runtimeRows.filter(r=>!admittedRows.includes(r)&&!xpServices.consumedRows.includes(r)&&!([309,310].includes(id)&&r.code==='H')&&!(id===316&&r.code==='u')&&!(id===323&&r.code==='U')&&!(id===288&&r.code==='U')&&!(id===322&&r.code==='l')).map(r=>({code:'source-xp-runtime',line:r.line,selector:r.code+r.modifier,values:r.values})));
  if(traits[id].spells>0)definition.abilities.sourceInitialCasts={type:'CASTS',val:traits[id].spells};
  const skeleton=fields.Sktransformer??56;definition.abilities.sourceSkeletonTarget??={type:'SKELETON_TRANSFORMER_TARGET',subtype:resolveCreature(skeleton)};
  skeletonPatch[key]={target:resolveCreature(skeleton),living:!!((fields.Flags>>>0)&16)};
  const prefix='tum-era/creatures/'+id;const map=templates.filter(line=>{const c=line.trim().split(/\s+/);return Number(c[5])===54&&Number(c[6])===id;});if(map.length!==1)throw Error('One original map template required '+id);
  const mapDef=map[0].trim().split(/\s+/)[0],msk=mapDef.replace(/\.def$/i,'.msk');
  const template=convertObjectTemplate(map[0],{maskBytes:archive.extract(msk),animationPrefix:prefix+'/'}).template;
  for(const file of['CR'+id+'.def',mapDef,msk])add('content/Sprites/'+prefix+'/'+file,archive.extract(file),'AmeCre.pac::'+file);
  for(const[entry,file]of[['CPRSMALL.def','small.png'],['TWCRPORT.def','large.png']]){const f=readDefFrame(archive.extract(entry),id+2);const bytes=await sharp(f.rgba,{raw:{width:f.width,height:f.height,channels:4}}).png().toBuffer();add('content/Sprites/'+prefix+'/'+file,bytes,'AmeCre.pac::'+entry+'#'+(id+2));}
  definition.graphics={...animations[id].graphics,animation:prefix+'/CR'+id,map:prefix+'/'+mapDef,mapMask:template.mask,iconSmall:prefix+'/small',iconLarge:prefix+'/large'};
  if((fields.Flags>>>0)&4){const shot='SHOT'+id+'.def';add('content/Sprites/'+prefix+'/'+shot,archive.extract(shot),'AmeCre.pac::'+shot);definition.graphics.missile={...definition.graphics.missile,projectile:prefix+'/'+shot};}
  definition.sound={};for(const[k,suffix]of Object.entries({attack:'ATTK',defend:'DFND',killed:'KILL',move:'MOVE',wince:'WNCE',...(((fields.Flags>>>0)&4)?{shoot:'SHOT'}:{})})){const name='S'+id+suffix+'.wav';add('content/Sounds/'+prefix+'/'+name,sounds.extract(name),'AmeCre.snd::'+name);definition.sound[k]=prefix+'/'+name;}
  profilePatch[key]=finalArcherProfile(id,profiles.get(id)??profiles.get(-fields.Level-1),traits[id].fightValue,traits[154].fightValue).profile;
  definitions[key.split(':')[1]]=definition;resolver.byEra.set(id,key);resolver.byNative.set(key,definition);
  records.push({sourceId:id,nativeId:key,cfgSha256:sha(cfgBytes),allSourceCfgKeys:Object.keys(fields),cfgServices:props.policies,allOwnXpRows:ownRows,runtimeRows,sourceDefaults:defaults.sourceDefaultRows,defaultReplacements:defaults.sourceDefaultsReplacedByOwn,sourceInitialCasts:traits[id].spells,obligations,services:services.evidence});
 }
 const locallyClosedIds=records.filter(r=>!r.obligations.length).map(r=>r.sourceId);
 let candidateIds=[...locallyClosedIds];for(let changed=true;changed;){changed=false;candidateIds=candidateIds.filter(id=>{const def=definitions['eraCreature'+id],missing=(def.upgrades??[]).some(target=>{const n=Number(target.replace('tum-era:eraCreature',''));return DWELLING_CLOSURE.includes(n)&&!BANK_OWNED.has(n)&&!candidateIds.includes(n);});if(missing)changed=true;return !missing;});}
 // These definitions remain private until every actor, runtime row and dependency is validated.
 const write=(file,data)=>files.set(file,Buffer.from(JSON.stringify(data,null,2)+'\n'));
 write('content/config/source-dwelling-actors.candidate.json',definitions);
 write('content/config/era-dwelling-services-v1.candidate.json',{schemaVersion:1,contract:'source-dwelling-services-v1',enabled:false,sourceIds:DWELLING_CLOSURE.filter(id=>!BANK_OWNED.has(id))});
 const demonTemplate=readJsonc(path.join(projectRoot,'mod/tum-era/content/config/source-demonology-spells.json')).sourceDemonology49;
 const demonSpells={};for(const[targetId,target]of[[315,namespace(315)],[60,'core:wight']]){const spell=structuredClone(demonTemplate);spell.levels.base.battleEffects.demonSummon.id=target;spell.name='Demonology';spell.levels.base.description='Converts a fallen living allied troop into '+(targetId===315?'Brownies':'Wights')+'. Each caster supplies 50 hit points, capped by the corpse hit points and original troop count.';demonSpells['sourceDwellingDemonology'+targetId]=spell;}
 write('content/config/source-dwelling-spells.candidate.json',{...demonSpells,...spellDefinitions});
 write('dwelling-registry-patches.json',{identities:Object.fromEntries(records.map(r=>[r.sourceId,r.nativeId])),experience:profilePatch,skeleton:skeletonPatch,runtime,fear:{[namespace(306)]:{sourceId:306,firstRank:0,marker:'eraSourceFear:306:v1'}},statusSourceIds:Object.fromEntries(records.map(r=>[r.nativeId,r.sourceId]))});
 write('dwelling-closure-review.json',{schemaVersion:1,activationReady:false,activated:false,closure:DWELLING_CLOSURE,bankOwned:[...BANK_OWNED],candidateIds,locallyClosedIds,actors:records,assets:assetProof,nativeValidationRequired:true});
 for(const[file,bytes]of files){const dest=path.join(outputRoot,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);}
 return {outputRoot,actors:records.length,locallyClosed:candidateIds,files:files.size};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const[project,source,output]=process.argv.slice(2);if(!output)throw Error('Usage: stage-dwelling-closure.mjs PROJECT TUM ISOLATED_OUTPUT');
 console.log(JSON.stringify(await prepareDwellingCandidates({projectRoot:path.resolve(project),sourceRoot:path.resolve(source),outputRoot:path.resolve(output)})));
}
