/** Exact remaining-bank data + whole dependency candidates. Never activates them. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {sourceAdventureFearAura,sourceAdventureFearRank8} from './source-fear-aura.mjs';
import {validateSchema} from '../artifacts/validate-native.mjs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {readEraArchive,readCreatureTable,readCreatureAnimationTable,creatureStats} from '../resources.mjs';
import {compileCreatureProperties} from '../creatures/creature-properties.mjs';
import {parseCreatureExperience,compileCreatureExperience} from '../creatures/crexpbon.mjs';
import {compileFreshSourceExperienceDefaults,adaptSourceOwnHealthExperience} from '../creatures/source-experience-defaults.mjs';
import {finalArcherProfile} from '../creatures/archer-profiles.mjs';
import {readDefFrame} from '../def-frame.mjs';
import {readSoundArchive,decodeDefFrame} from '../roster8/def-frame.mjs';
import {encodePng,identifiersByIndex} from '../artifacts/importer.mjs';
import {createProductionObjectResolvers,readJsonc} from './production-resolvers.mjs';
import {prepareTumObjectImport} from './importer.mjs';
import {readDefaultFlagSpellCatalog} from './spell-catalog.mjs';
import {convertObjectTemplate} from './objects.mjs';

export const REMAINING_BANKS=Object.freeze([48,51,64,65,66,67]);
export const BANK_ACTORS=Object.freeze([253,272,281,289,290,301,302,330,340,358]);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const namespace=id=>'tum-era:eraCreature'+id;
const exactFields={
 253:{Flags:-2146761197,Level:6,ImposedSpell1Number:55,ImposedSpell1Level:3,ImposedSpell2Number:43,ImposedSpell2Level:0,ImposedSpell3Number:48,ImposedSpell3Level:3,RegenerationHitPoints:200,RegenerationChance:100,Fear:1,Fearless:1,JoustingImmune:1,MagicAura:1,MagicMirror:1,Sktransformer:68,'Self-resurrection':1},
 272:{Flags:4118,Level:3,Town:3,UpgradesTo:281},281:{Flags:4118,Level:3,Town:3,RetaliateRanged:1},
 289:{Flags:49168,Level:4,'Vulnerability effect':4,hasFirewall:1,Sktransformer:361,'Fire shield':.2},
 290:{Flags:32784,Level:4,'Vulnerability effect':5,Sktransformer:361},
 301:{Flags:16,Level:2,Town:0,UpgradesTo:302},302:{Flags:65552,Level:2,Town:0,UpgradesTo:358},
 330:{Hate0132:100,Flags:-2147463009,Level:6,'Resistance effect':4,hasFirewall:1,Sktransformer:68,'Shot type':1,'Fire shield':.3},
 340:{Flags:32784,Level:4,Town:0,'Spell 1':17,'Spell 2':2,'Spell 3':5,CreatureSpellPowerAdder:1,AlwaysPositiveMorale:1,Sktransformer:361,isLord:1},
 358:{Flags:65552,Level:1,Town:0,Fearless:1,AlwaysPositiveMorale:1}
};
export function verifyBankActorCfg(id,text){
 if(!BANK_ACTORS.includes(id))throw Error('Unknown original bank actor');
 const entries=text.trim().split(/\r?\n/).map(s=>s.split('=').map(s=>s.trim()));
 if(entries.length!==Object.keys(exactFields[id]).length||new Set(entries.map(e=>e[0])).size!==entries.length
   ||entries.some(([k,v])=>!(k in exactFields[id])||Number(v)!==exactFields[id][k]))throw Error('Changed whole bank actor CFG '+id);
 return exactFields[id];
}
const pending=[];
export function bankRushSpell(){return{
 type:'ability',targetType:'CREATURE',name:'Rush',school:{},level:0,power:0,defaultGainChance:0,gainChance:{},
 animation:{affect:[{defName:'tum-era/banks/rushtrgt',transparency:.5}]},sounds:{cast:'tum-era/banks/rushtrgt'},
 graphics:Object.fromEntries(['Book','Effect','ScenarioBonus','Scroll'].map(k=>['icon'+k,'tum-era/banks/rush-'+k.toLowerCase()+'.png'])),
 levels:{base:{description:'Grants one additional action to an allied troop. Available at experience rank 10; one use per battle.',power:0,cost:1,range:'0',targetModifier:{smart:true},battleEffects:{rush:{type:'core:timed',bonus:{marker:{type:'NONE',val:0,hidden:true}}}}},none:{},basic:{},advanced:{},expert:{}},
 flags:{positive:true,special:true,nonMagical:true},targetCondition:{}};}

export async function prepareSixBankCandidates({projectRoot,sourceRoot,outputRoot}){
 if(path.resolve(outputRoot)===path.resolve(projectRoot)||path.resolve(outputRoot).startsWith(path.resolve(projectRoot)+path.sep))throw Error('Use isolated output outside project');
 const require=createRequire(path.join(projectRoot,'work/browser-tests/package.json')),sharp=require('sharp');
 const archive=readEraArchive(fs.readFileSync(path.join(sourceRoot,'Data/AmeCre.pac')));
 if(archive.sha256!=='452c833214b4c6df2a5e430bf4dd526ccd71792ede166ac2d77646516322731c')throw Error('Changed original source archive');
 const sounds=readSoundArchive(fs.readFileSync(path.join(sourceRoot,'Data/AmeCre.snd')));
 const traits=readCreatureTable(archive.extract('Crtraits.txt').toString('latin1')),animations=readCreatureAnimationTable(archive.extract('cranim.txt').toString('latin1'));
 const rows=parseCreatureExperience(archive.extract('crexpbon.txt').toString('latin1')),installedRows=parseCreatureExperience(fs.readFileSync(path.join(projectRoot,'mod/wake-of-gods/Mods/stackExperience/Content/data/crexpbon.txt'),'latin1'));
 const resolver=createProductionObjectResolvers({projectRoot,sourceRoot});
 const spellRoot=path.join(projectRoot,'work/vcmi-wasm/config/spells'),spells=identifiersByIndex(fs.readdirSync(spellRoot).filter(f=>f.endsWith('.json')).map(f=>readJsonc(path.join(spellRoot,f))));
 const spell=id=>spells.has(id)?'core:'+spells.get(id):undefined;
 const resolveCreature=id=>BANK_ACTORS.includes(id)?namespace(id):resolver.resolveCreature(id);
 const templates=Object.values(JSON.parse(fs.readFileSync(path.join(sourceRoot,'Lang/RMG_Creatures.json'))).RMG.resound.properties).flat();
 const names=JSON.parse(fs.readFileSync(path.join(sourceRoot,'Lang/TUM_Creatures.json'))).era.monsters;
 const files=new Map(),assetProof=[],definitions={},profilePatch={},skeletonPatch={},records=[];
 const add=(file,bytes,source)=>{files.set(file,bytes);assetProof.push({file,source,sha256:sha(bytes),bytes:bytes.length});};
 const profiles=new Map();for(const line of archive.extract('crexpmod.txt').toString('latin1').split(/\r?\n/)){const c=line.trim().split(/\t+/);if(!/^-?\d+$/.test(c[0]))continue;const[id,experienceMultiplier,upgradeMultiplier,fullRank10,battlePercent,rank11Extra]=c.slice(0,6).map(Number);profiles.set(id,{experienceMultiplier,upgradeMultiplier,fullRank10,battlePercent,rank11Extra});}
 for(const id of BANK_ACTORS){
  const cfgBytes=fs.readFileSync(path.join(sourceRoot,'Data/Creatures',id+'.cfg')),cfg=cfgBytes.toString('utf8'),fields=verifyBankActorCfg(id,cfg),key=namespace(id),ownRows=rows.filter(r=>r.creature===id);
  const props=compileCreatureProperties(cfg,{source:'Data/Creatures/'+id+'.cfg',sourceCreatureId:id,freshDefinition:true,analyseOnly:true,nativeBiologyContract:'source-biological-flags-v1',nativeExperienceProfile:true,resolveCreature,resolveSpell:spell,resolveTown:n=>['castle','rampart','tower','inferno','necropolis','dungeon','stronghold','fortress','conflux'][n]?'core:'+['castle','rampart','tower','inferno','necropolis','dungeon','stronghold','fortress','conflux'][n]:undefined});
  if(props.diagnostics?.length)throw Error(JSON.stringify(props.diagnostics));
  const runtimeRows=ownRows.filter(r=>['p','a','K','E','L','B','b','e','U','h'].includes(r.code)||(r.code==='w'&&r.modifier==='C'));
  const ordinary=compileCreatureExperience(rows.filter(r=>r.creature<0||(r.creature===id&&!runtimeRows.includes(r))),{creatureId:id,nativeExperienceProfile:true,installedRows,rankZero:'intrinsic',resolveCreature,resolveSpell:spell,throwOnError:true});
  ordinary.nativePreview.stackExperience=adaptSourceOwnHealthExperience(ordinary.nativePreview.stackExperience,ownRows,'source-health-xp-rounding-v1').stackExperience;
  const defaults=compileFreshSourceExperienceDefaults(rows,{creatureId:id,sourceLevelZeroBased:fields.Level,installedRows,nativeExperienceProfile:true,contract:'source-default-experience-new-creature-v1',freshDefinition:true,nativeDefaultCarrier:'creature-json',healthRoundingContract:'source-health-xp-rounding-v1'});
  if(!defaults.ok)throw Error('Unclosed source default rows '+id);
  const definition={...creatureStats(traits[id]),...props.definition,name:{singular:names[id].name.singular,plural:names[id].name.plural},description:names[id].name.description,faction:props.definition.faction??'core:neutral',shots:traits[id].shots,hasDoubleWeek:false,abilities:{...props.definition.abilities,...ordinary.nativePreview.abilities},stackExperience:[...defaults.definition.stackExperience,...ordinary.nativePreview.stackExperience]};
  const curve=(name,bonus,values)=>{const base=values[0];if(base)definition.abilities[name]={...bonus,val:base};const delta=values.slice(1).map(v=>v-base);if(delta.some(Boolean))definition.stackExperience.push({bonus,values:delta});};
  for(const r of runtimeRows){
   if(r.code==='E'&&id===253)curve('bankDeathStare'+r.line,{type:'DEATH_STARE',subtype:'deathStareGorgon',valueType:'ADDITIVE_VALUE'},r.values);
   else if(r.code==='b')curve('bankDefense'+r.line,{type:'ERA_EXPERIENCE_DEFENSE_REDUCTION',valueType:'ADDITIVE_VALUE'},r.values);
   else if(r.code==='e')curve('bankDeathBlow'+r.line,{type:'DOUBLE_DAMAGE_CHANCE',valueType:'ADDITIVE_VALUE'},r.values);
   else if(r.code==='h')curve('bankHate'+r.line,{type:'HATE',valueType:'ADDITIVE_VALUE',addInfo:{contract:'source-bank-hate-v1',sourceCreatureId:Number(r.modifier.slice(1))}},r.values.map(v=>v*10));
   else if(r.code==='w'&&r.modifier==='C')for(const sid of[16,20]){const b={type:'SPELL_IMMUNITY',subtype:spell(sid)};if(r.values[0]===1)definition.abilities['bankColdImmunity'+sid]=b;else definition.stackExperience.push({bonus:b,values:r.values.slice(1).map(v=>v===1)});}
  }
  if(id===253){definition.abilities.sourceFear=sourceAdventureFearAura(253);definition.abilities.sourceMagicAura={type:'SPELL_RESISTANCE_AURA',val:25,valueType:'INDEPENDENT_MAX'};definition.abilities.sourceMagicMirror={type:'MAGIC_MIRROR',val:20,valueType:'INDEPENDENT_MAX'};}
  if(id===289||id===290)for(const sid of(id===289?[16,20]:[21,22,26]))definition.abilities['sourceVulnerability'+sid]={type:'MORE_DAMAGE_FROM_SPELL',subtype:spell(sid),val:100};
  if(id===330)definition.stackExperience=definition.stackExperience.map(r=>r.bonus.type==='FEARFUL'&&r.bonus.valueType==='ADDITIVE_VALUE'?sourceAdventureFearRank8(r):r);
  if(id===281)definition.abilities.sourceRangedRetaliation={type:'RANGED_RETALIATION'};
  if(id===330)definition.abilities.sourceFireballShot={type:'SPELL_LIKE_ATTACK',subtype:'core:fireball'};
  if(id===340){definition.abilities.sourceLordRush={type:'SPELLCASTER',subtype:'tum-era:sourceLordRush',val:0};definition.abilities.sourcePositiveMorale={type:'MORALE',val:1,valueType:'INDEPENDENT_MAX'};}
  if(id===358)definition.abilities.sourcePositiveMorale={type:'MORALE',val:1,valueType:'INDEPENDENT_MAX'};
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
  const schema=path.join(projectRoot,'work/vcmi-wasm/config/schemas/creature.json'),load=p=>readJsonc(p),schemaErrors=validateSchema(definition,load(schema),{load,base:schema});if(schemaErrors.length)throw Error('Original actor'+id+' native schema: '+schemaErrors.join('\n'));
  definitions[key.split(':')[1]]=definition;resolver.byEra.set(id,key);resolver.byNative.set(key,definition);
  records.push({sourceId:id,nativeId:key,cfgSha256:sha(cfgBytes),allSourceCfgKeys:Object.keys(fields),cfgServices:props.policies,allOwnXpRows:ownRows,runtimeRows,sourceDefaults:defaults.sourceDefaultRows,defaultReplacements:defaults.sourceDefaultsReplacedByOwn,sourceInitialCasts:traits[id].spells,pending:pending.filter(p=>p.sourceId===id)});
 }
 // Existing resolver functions close over these explicit maps; no placeholder definition is installed.
 const rmgSpellCatalog=readDefaultFlagSpellCatalog(readEraArchive(fs.readFileSync(path.join(projectRoot,'work/game-data/homm3eng/home/web_user/.local/share/vcmi/Data/H3bitmap.lod'))).extract('SPTRAITS.txt').toString('latin1'),{spellIds:spells});
 const coreArts=identifiersByIndex([readJsonc(path.join(projectRoot,'work/vcmi-wasm/config/artifacts.json'))]);
 const imported=prepareTumObjectImport({sourceRoot,...resolver,resolveArtifact:id=>id<171?(coreArts.has(id)?'core:'+coreArts.get(id):undefined):'tum-era:artifact'+id,resolveResource:id=>id===7?'wake-of-gods.mithril:mithril':undefined,spellMode:'era-single-filter',spellCatalog:rmgSpellCatalog,appearanceMode:'native-state-hook',guardSlotsMode:'native-original-slots'});
 const bankReports=[];const layouts={};
 for(const id of REMAINING_BANKS){const record=imported.compiled.find(c=>c.kind==='bank'&&String(c.id)===String(id));if(!record)throw Error(JSON.stringify(imported.diagnostics.filter(c=>c.kind==='bank'&&String(c.id)===String(id))));files.set(record.config,imported.files.get(record.config));bankReports.push(record);for(const a of imported.assets.filter(a=>a.object==='bank:'+id))add(a.path.replace(/^content\/sprites\//,'content/Sprites/'),imported.files.get(a.path),a.source);const value=Object.values(JSON.parse(imported.files.get(record.config))['core:creatureBank'].types)[0],layout=value.guardsLayout;layouts[layout]=imported.modPatch.settings.combat.layouts[layout];}
 const effectArchive=readEraArchive(fs.readFileSync(path.join(sourceRoot,'Data/AmeEfect.pac')));
 const effectSounds=readSoundArchive(fs.readFileSync(path.join(sourceRoot,'Data/AmeEfect.snd')));
 add('content/Sprites/tum-era/banks/rushtrgt.def',effectArchive.extract('rushtrgt.def'),'AmeEfect.pac::rushtrgt.def');
 add('content/Sounds/tum-era/banks/rushtrgt.wav',effectSounds.extract('rushtrgt.wav'),'AmeEfect.snd::rushtrgt.wav');
 const manifest=JSON.parse(fs.readFileSync(path.join(projectRoot,'game-data/manifest.json'))),sprite=manifest.files.find(f=>f.path==='Data/H3sprite.lod');
 if(!sprite)throw Error('Verified original H3sprite archive required');
 const spriteBytes=Buffer.concat(sprite.chunks.map(c=>{const b=fs.readFileSync(path.join(projectRoot,'game-data/chunks',c.hash+'.bin'));if(b.length!==c.size||sha(b)!==c.hash)throw Error('Corrupted original sprite chunk');return b;}));
 if(spriteBytes.length!==sprite.size||sha(spriteBytes)!==sprite.hash)throw Error('Corrupted original sprite archive');
 const spriteArchive=readEraArchive(spriteBytes);
 for(const[kind,def,frame]of[['Book','spells.def',53],['Effect','spellint.def',54],['ScenarioBonus','spellbon.def',53],['Scroll','spellscr.def',53]])add('content/Sprites/tum-era/banks/rush-'+kind.toLowerCase()+'.png',encodePng(decodeDefFrame(spriteArchive.extract(def),frame)),'H3sprite.lod::'+def+'#'+frame+' original Haste UI icon reused');
 const runtimePatch={creatures:{[namespace(253)]:{imposedSpells:[{spell:'core:slayer',mastery:3},{spell:'core:bloodlust',mastery:0},{spell:'core:prayer',mastery:3}],regeneration:{hitPoints:200,chancePercent:100},rebirth:{chance:1,fraction:1,guaranteedFraction:1}},[namespace(289)]:{physicalDeflection:{modifier:125,values:Array.from({length:11},(_,i)=>i*6)}},[namespace(290)]:{physicalDeflection:{modifier:125,values:Array.from({length:11},(_,i)=>i*6)}},[namespace(330)]:{allSpellImmunity:{}},[namespace(358)]:{physicalDeflection:{modifier:64,values:Array.from({length:11},(_,i)=>i*2)}}}};
 const write=(file,data)=>files.set(file,Buffer.from(JSON.stringify(data,null,2)+'\n'));
 write('content/config/source-bank-actors.candidate.json',definitions);write('content/config/source-bank-spells.candidate.json',{sourceLordRush:bankRushSpell()});
 write('content/config/source-bank-french.candidate.json',{'spell.tum-era.sourceLordRush.name':'Élan','spell.tum-era.sourceLordRush.description.none':'Accorde une action supplémentaire à une troupe alliée. Disponible au rang d’expérience 10, une charge.','spell.tum-era.sourceLordRush.description.basic':'Accorde une action supplémentaire à une troupe alliée.','spell.tum-era.sourceLordRush.description.advanced':'Accorde une action supplémentaire à une troupe alliée.','spell.tum-era.sourceLordRush.description.expert':'Accorde une action supplémentaire à une troupe alliée.'});
 write('content/config/era-bank-actors.candidate.json',{schemaVersion:1,creatures:BANK_ACTORS.map(namespace)});
 write('bank-registry-patches.json',{identities:Object.fromEntries(BANK_ACTORS.map(id=>[id,namespace(id)])),experience:profilePatch,skeleton:skeletonPatch,runtime:runtimePatch,statusSourceIds:Object.fromEntries(BANK_ACTORS.map(id=>[namespace(id),id])),fear:{[namespace(253)]:{sourceId:253,firstRank:0,marker:'eraSourceFear:253:v1'},[namespace(330)]:{sourceId:330,firstRank:8,marker:'eraSourceFear:330:v1'}},combatLayouts:layouts});
 write('six-banks-review.json',{schemaVersion:1,activated:false,activationReady:false,provenance:{retainedAssembly:'work/downloads/wog-port184/geometry-damage/combat-scan.asm',vulnerability4:'44B1C3 doubles only16/20',vulnerability5:'44B1E8 doubles only21/22/26',rushTarget:'4476A3 calls Bloodlust43 reception Float>0, hypnosis-aware side',deathStare:'75D67B overrides each440C00 roll using71CB80 E;440C31 preserves ceil(count/10) cap; commander-only75D782 bypass does not apply253',rangedRetaliation:'Amethyst tables3160..3250 trigger30304, CanShoot442610, source149 excluded; native blocker ignored only281',magicAura:'767244/76729f source24 Unicorn resistance returns25, XP71EC79 returns25 onlyactivef/u1',mirror:'448531 max(activeMirror,Spells36.base_value0=20); H3Spell stride0x88 offset0x34',sourceSpellTraits:'SPTRAITS original Magic Mirror base0=20'},archiveSha256:archive.sha256,bankIds:REMAINING_BANKS,banks:bankReports,actors:records,pending,assets:assetProof,nativeValidationRequired:true});
 for(const[file,bytes]of files){const dest=path.join(outputRoot,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);}
 return{bankIds:REMAINING_BANKS,actors:BANK_ACTORS,files:files.size,pending,outputRoot};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const[project,source,output]=process.argv.slice(2);if(!output)throw Error('Usage: stage-six-banks.mjs PROJECT TUM ISOLATED_OUTPUT');
 console.log(JSON.stringify(await prepareSixBankCandidates({projectRoot:path.resolve(project),sourceRoot:path.resolve(source),outputRoot:path.resolve(output)})));
}
