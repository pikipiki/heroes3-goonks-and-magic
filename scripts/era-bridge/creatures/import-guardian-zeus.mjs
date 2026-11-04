/** Closed source contract for TUM212. Writes a reviewable mod overlay only. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';
const [project,tum,destination]=process.argv.slice(2).map(x=>path.resolve(x));
if(!project||!tum||!destination)throw Error('Usage: node import-guardian-zeus.mjs PROJECT TUM OUTPUT');
const imp=p=>import(pathToFileURL(path.join(project,p))), require=createRequire(path.join(project,'work/browser-tests/package.json')),sharp=require('sharp'),JSON5=require('json5');
const {readEraArchive,readCreatureTable,creatureStats,readCreatureAnimationTable}=await imp('scripts/era-bridge/resources.mjs');
const {parseCreatureProperties}=await imp('scripts/era-bridge/creatures/creature-properties.mjs');
const {parseCreatureExperience,compileCreatureExperience}=await (process.env.TUM_XP_COMPILER ? import(pathToFileURL(path.resolve(process.env.TUM_XP_COMPILER))) : imp('scripts/era-bridge/creatures/crexpbon.mjs'));
const {identifiersByIndex}=await imp('scripts/era-bridge/artifacts/importer.mjs');const {readDefFrame}=await imp('scripts/era-bridge/def-frame.mjs');
const read=f=>JSON5.parse(fs.readFileSync(path.join(project,f),'utf8')),write=(f,v)=>{const target=path.join(destination,f);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(v,null,2)+'\n')};
const cfg=fs.readFileSync(path.join(tum,'Data/Creatures/212.cfg'),'utf8'),values=Object.fromEntries(parseCreatureProperties(cfg).map(e=>[e.key,Number(e.rawValue)])),expected={Hate0082:200,Hate0083:200,AfterActionSpellMastery:0,Flags:38420,Level:6,Town:2,'Attack effect':1,ImposedSpell1Number:28,ImposedSpell1Level:3,CastsSpell:19,Fearless:1,NoWallPenalty:1,CreatureMimicArtifact:135};
if(JSON.stringify(Object.entries(values).sort())!==JSON.stringify(Object.entries(expected).sort()))throw Error('Changed212.cfg requires a new source audit');
const archive=readEraArchive(fs.readFileSync(path.join(tum,'Data/AmeCre.pac'))),stats=readCreatureTable(archive.extract('Crtraits.txt').toString('latin1'))[212],animations=readCreatureAnimationTable(archive.extract('cranim.txt').toString('latin1'))[212];
const spellIds=identifiersByIndex(fs.readdirSync(path.join(project,'work/vcmi-wasm/config/spells')).filter(n=>n.endsWith('.json')).map(n=>read('work/vcmi-wasm/config/spells/'+n)));
const xpRows=parseCreatureExperience(archive.extract('crexpbon.txt').toString('latin1'));
const experience=compileCreatureExperience(xpRows,{creatureId:212,nativeExperienceProfile:true,experienceBeforeAttack:'source-p57-v1',installedRows:parseCreatureExperience(fs.readFileSync(path.join(project,'mod/wake-of-gods/Mods/stackExperience/Content/data/crexpbon.txt'),'latin1')),rankZero:'intrinsic',resolveSpell:id=>spellIds.has(id)?'core:'+spellIds.get(id):undefined,resolveCreature:id=>({155:'wake-of-gods.level8units:darknessDragon',231:'tum-era:chasmDragon'})[id]});
if(!experience.ok)throw Error('212 remaining XP mapping incomplete:'+JSON.stringify(experience.diagnostics));
const prefix='tum-era/guardian-zeus',sprites='content/Sprites/'+prefix;fs.mkdirSync(path.join(destination,sprites),{recursive:true});
if(destination===project||destination.startsWith(project+path.sep))throw Error('Use an isolated review output, never the source project');
for(const n of ['cr212.def','AVWCR212.DEF','AVWCR212.msk','SHOT212.def'])fs.writeFileSync(path.join(destination,sprites,n),archive.extract(n));
for(const [n,out]of[['cprsmall.def','portrait-small.png'],['twcrport.def','portrait-large.png']]){const f=readDefFrame(archive.extract(n),212+2);await sharp(f.rgba,{raw:{width:f.width,height:f.height,channels:4}}).png().toFile(path.join(destination,sprites,out));}
// SND entries have40-byte names and twoDWORD bounds; retain original PCM WAV.
const soundBytes=fs.readFileSync(path.join(tum,'Data/AmeCre.snd')),count=soundBytes.readUInt32LE(0),end=4+count*48,sounds=new Map();
if(end>soundBytes.length)throw Error('Truncated SND directory');
for(let i=0;i<count;i++){const p=4+i*48,name=soundBytes.subarray(p,p+40).toString('latin1').split('\0')[0],offset=soundBytes.readUInt32LE(p+40),length=soundBytes.readUInt32LE(p+44);if(offset<end||offset+length>soundBytes.length)throw Error('Invalid SND bounds:'+name);if(sounds.has(name.toUpperCase()))throw Error('Duplicate SND entry:'+name);sounds.set(name.toUpperCase(),soundBytes.subarray(offset,offset+length));}
const sound={};for(const[key,suffix]of Object.entries({attack:'ATTK',defend:'DFND',killed:'KILL',move:'MOVE',shoot:'SHOT',wince:'WNCE'})){const name='S212'+suffix,bytes=sounds.get(name);if(!bytes||bytes.subarray(0,4).toString()!=='RIFF')throw Error('Missing original sound:'+name);const file=path.join(destination,'content/Sounds',prefix,name+'.wav');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);sound[key]=prefix+'/'+name+'.wav';}

const base=read('mod/wake-of-gods/Mods/level8Units/content/config/creatures/lordOfThunder.json').lordOfThunder;
const creature={...creatureStats(stats),name:{singular:'Master of Thunder',plural:'Masters of Thunder'},faction:'core:tower',level:7,doubleWide:false,hasDoubleWeek:false,shots:stats.shots,abilities:{
 hateRedDragons:{type:'ERA_PERSONAL_HATE_DAMAGE',subtype:'core:redDragon',val:200},hateBlackDragons:{type:'ERA_PERSONAL_HATE_DAMAGE',subtype:'core:blackDragon',val:200},
 shooter:{type:'SHOOTER'},king3:{type:'KING',val:3},mindImmunity:{type:'MIND_IMMUNITY'},noMeleePenalty:{type:'NO_MELEE_PENALTY'},
 doubleShot:{type:'ADDITIONAL_ATTACK',val:1,effectRange:'ONLY_DISTANCE_FIGHT'},noWallPenalty:{type:'NO_WALL_PENALTY'},
 initialUnusedSpellCharge:{type:'CASTS',val:stats.spells},fearless:{type:'FEARFUL',val:0,valueType:'INDEPENDENT_MIN'},...experience.definition.abilities},
 graphics:{...base.graphics,...animations.graphics,missile:{...base.graphics.missile,...animations.graphics.missile,projectile:prefix+'/SHOT212'},animation:prefix+'/cr212',map:prefix+'/AVWCR212',iconSmall:prefix+'/portrait-small',iconLarge:prefix+'/portrait-large'},sound,stackExperience:experience.definition.stackExperience};
write('content/config/guardian-zeus.candidate.json',{guardianOfZeus:creature,'wake-of-gods.level8units:lordOfThunder':{upgrades:['guardianOfZeus']}});
function preserveTown(a,b){const r=structuredClone(a);for(const[k,v]of Object.entries(b)){if(v&&typeof v==='object'&&!Array.isArray(v)&&r[k]&&typeof r[k]==='object'&&!Array.isArray(r[k]))r[k]=preserveTown(r[k],v);else r[k]=structuredClone(v);}return r;}
const towerExisting=path.join(project,'mod/tum-era/content/config/tower.json'),towerOverlay=fs.existsSync(towerExisting)?JSON5.parse(fs.readFileSync(towerExisting,'utf8'))['core:tower']?.town??{}:{};
const town=preserveTown(read('mod/third-upgrades/content/config/town-screen/tower/factions.json')['core:tower'].town,towerOverlay),creatures=structuredClone(town.creatures),hallSlots=structuredClone(town.hallSlots);if(!creatures[6].includes('guardianOfZeus'))creatures[6].push('guardianOfZeus');if(!hallSlots[4][2].includes('dwellingUp3Lvl7'))hallSlots[4][2].push('dwellingUp3Lvl7');
const townCfg=fs.readFileSync(path.join(tum,'Data/towns/2.cfg'),'utf8'),buildingCost=townCfg.match(/^BuildingCost0077="([^"]+)"/m)?.[1].trim().split(/\s+/).map(Number);const sourceCost=[10,0,10,0,0,35,25000];if(JSON.stringify(buildingCost)!==JSON.stringify(sourceCost))throw Error('Changed212buildingcost:'+buildingCost);
write('content/config/tower.candidate.json',{'core:tower':{town:{creatures,hallSlots,buildingsIcons:'tum-era/tower-hall',structures:{dwellingUp3Lvl7:{...town.structures.dwellingUp2Lvl7,builds:'dwellingUp3Lvl7',hidden:false}},buildings:{dwellingUp3Lvl7:{name:'Upg. Storm Temple',description:'Allows recruitment and upgrades of Masters of Thunder.',upgrades:'dwellingUp2Lvl7',requires:['dwellingUp2Lvl7'],cost:{wood:10,ore:10,gems:35,gold:25000}}}}}});
const sourceHallArchive=readEraArchive(fs.readFileSync(path.join(tum,'Data/Common Def.pac'))),sourceHall=readDefFrame(sourceHallArchive.extract('HallTowr.def'),77),sourceHallBase=read('mod/third-upgrades/content/config/town-screen/tower/factions.json')['core:tower'].town.buildingsIcons;
await sharp(sourceHall.rgba,{raw:{width:sourceHall.width,height:sourceHall.height,channels:4}}).png().toFile(path.join(destination,'content/Sprites/tum-era/tower-building77.png'));
write('content/Sprites/tum-era/tower-hall.json',{images:[...Array.from({length:51},(_,frame)=>({frame,defFile:sourceHallBase,defFrame:frame})),{frame:57,file:'tum-era/tower-building77.png'}]});
write('tower-building77-provenance.json',{archive:'Common Def.pac',archiveSha256:sourceHallArchive.sha256,entry:'HallTowr.def',sourceFrame:77,nativeFrame:57,rgbaSha256:crypto.createHash('sha256').update(sourceHall.rgba).digest('hex'),baseHallReference:sourceHallBase});
write('guardian-zeus-runtime-bindings.json',{eraId:212,runtimeBindings:experience.runtimeBindings,requirements:experience.requirements});
write('content/config/era-bridge-experience-attack-spells.candidate.json',{schemaVersion:1,creatures:{'tum-era:guardianOfZeus':['core:titanBolt']}});
write('content/config/era-bridge-runtime.candidate.json',{schemaVersion:1,creatures:{'tum-era:guardianOfZeus':{imposedSpells:[{spell:'core:airShield',mastery:3}],artifactMimic:{artifact:135}}}});
write('content/config/era-bridge-experience.candidate.json',{schemaVersion:1,creatures:{'tum-era:guardianOfZeus':{fullRank10:147000,rank11Extra:14700,battlePercent:20,experienceMultiplier:1,upgradeMultiplier:.75}}});
write('content/config/era-bridge-thunder-attacks.candidate.json',{schemaVersion:1,creatures:['tum-era:guardianOfZeus']});
write('guardian-zeus-import-report.json',{eraId:212,activationReady:false,sourceArchiveSha256:archive.sha256,sourceCfgSha256:crypto.createHash('sha256').update(cfg).digest('hex'),nativeXPSourceRows:experience.mapped,sourceUnportedXPRows:[],sourceSoundPrefix:'S212',sourceFlagsHex:'0x9614',
 inactiveConfiguration:{CastsSpell:19,AfterActionSpellMastery:0,reason:'Spell1 selector remains default9 (shipped DLL jump9=4483DD no action), Spell2 default8. CastsSpell19 writes active spell field but does not change selectors. No AfterMelee/Shoot/Defend/Wound spells configured, so AfterActionSpellMastery0 has no consumer for212. No synthesized manual ChainLightning.'},
 requiredRuntime:['CreatureMimicArtifact135 original-army hero TitanBolt grant','Source intrinsic Thunder melee20% gate17/damage10*alive/L endpoint','XPp57 source primary gate and direct600damage without secondary resistance roll','ImposedAirShield28expert3 duration1000'],
 blockers:['Native135/p57/Thunder services must compile and pass E2E before activation','HATE target231 must be imported together; candidate uses explicit tum-era:chasmDragon'],
 unimplementedVisuals:['HitEffects.Melee212 Burst10.def/GOGFLAME.wav and Shot212 Burst11.def require native landing-effects adapter','Original fourth-dwelling town animation reuses third-dwelling art; hall icon uses source frame77'],manifest:'Absent until closure.'});
console.log('Generated review-only Master of Thunder212 data in '+destination);

// Complete portable review overlay: merge every shared registry from the
// selected project and preserve actors/configuration already supplied there.
const sourceMod=path.join(project,'mod/tum-era');
const existing=(relative,fallback)=>{const file=path.join(sourceMod,relative);return fs.existsSync(file)?JSON5.parse(fs.readFileSync(file,'utf8')):structuredClone(fallback);};
const mergeObject=(a,b)=>{const result=structuredClone(a);for(const[k,v]of Object.entries(b)){if(v&&typeof v==='object'&&!Array.isArray(v)&&result[k]&&typeof result[k]==='object'&&!Array.isArray(result[k]))result[k]=mergeObject(result[k],v);else result[k]=structuredClone(v);}return result;};
const candidate=name=>JSON.parse(fs.readFileSync(path.join(destination,'content/config/'+name+'.candidate.json'),'utf8'));
for(const name of['era-bridge-runtime','era-bridge-experience','era-bridge-experience-attack-spells']){
 const base=existing('content/config/'+name+'.json',{schemaVersion:1,creatures:{}}),extra=candidate(name);
 if(base.schemaVersion!==1||!base.creatures||Array.isArray(base.creatures))throw Error('Invalid shared registry '+name);
 write('content/config/'+name+'.json',mergeObject(base,extra));
}
const thunder=existing('content/config/era-bridge-thunder-attacks.json',{schemaVersion:1,creatures:[]});
if(thunder.schemaVersion!==1||!Array.isArray(thunder.creatures))throw Error('Invalid thunder registry');
thunder.creatures=[...new Set([...thunder.creatures,'tum-era:guardianOfZeus'])];write('content/config/era-bridge-thunder-attacks.json',thunder);
// The shared status identity index is used by resistance/aura selectors even
// when this actor itself has no c/k selector. Never replace existing IDs.
const status=existing('content/config/era-bridge-status-attacks.json',{schemaVersion:1,creatures:[],sourceIds:{}});
if(status.schemaVersion!==1||!Array.isArray(status.creatures)||!status.sourceIds)throw Error('Invalid status identity registry');
if(status.sourceIds['tum-era:guardianOfZeus']!==undefined&&status.sourceIds['tum-era:guardianOfZeus']!==212)throw Error('Guardian source identity conflict');
if(Object.entries(status.sourceIds).some(([key,id])=>id===212&&key!=='tum-era:guardianOfZeus'))throw Error('Duplicate source212 mapping');
status.sourceIds['tum-era:guardianOfZeus']=212;write('content/config/era-bridge-status-attacks.json',status);
const identities=existing('era-identities.json',{schemaVersion:1,creatures:{}});
if(identities.creatures['212']&&identities.creatures['212']!=='tum-era:guardianOfZeus')throw Error('Source212 identity conflict');
identities.creatures['212']='tum-era:guardianOfZeus';write('era-identities.candidate.json',identities);
write('content/config/guardian-zeus.json',mergeObject(existing('content/config/guardian-zeus.json',{}),candidate('guardian-zeus')));
write('content/config/tower.json',mergeObject(existing('content/config/tower.json',{}),candidate('tower')));
const expectedLanding={
 'content/Sprites/tum-era/hit-effects/Burst10.def':'e586052a71c59d576916fe50af39a9758f1ee9d0a4ee793f548da48592943beb',
 'content/Sprites/tum-era/hit-effects/Burst11.def':'d94fa4477b8621de902e950f8df53f76172bb0c4f8791849f8fdd11a46af7494',
 'content/Sounds/tum-era/hit-effects/GOGFLAME.wav':'0e26ddafba9989d05f178fa083ce8ec7dd53123b03f30836c13d843cd968b7ee'};
const hitData=process.argv[5]?path.resolve(process.argv[5]):process.env.TUM_HIT_EFFECTS_DATA?path.resolve(process.env.TUM_HIT_EFFECTS_DATA):null;
let hitPac=null,hitSnd=null;
if(hitData){hitPac=readEraArchive(fs.readFileSync(path.join(hitData,'HitEffects.pac')));const bytes=fs.readFileSync(path.join(hitData,'HitSounds.snd')),count=bytes.readUInt32LE(0),end=4+count*48;hitSnd=new Map();if(end>bytes.length)throw Error('Invalid landing SND');for(let i=0;i<count;i++){const p=4+i*48,n=bytes.subarray(p,p+40).toString('latin1').split('\0')[0].toUpperCase(),offset=bytes.readUInt32LE(p+40),length=bytes.readUInt32LE(p+44);if(offset<end||offset+length>bytes.length||hitSnd.has(n))throw Error('Invalid landing SND entry');hitSnd.set(n,bytes.subarray(offset,offset+length));}}
const sourceHitAssets=process.env.TUM_HIT_EFFECTS_ASSET_ROOT?path.resolve(process.env.TUM_HIT_EFFECTS_ASSET_ROOT):sourceMod;
const landingFiles=[];
for(const[relative,expected]of Object.entries(expectedLanding)){
 const name=path.basename(relative),bytes=hitData?(relative.includes('/Sounds/')?hitSnd.get(name.replace(/\.wav$/i,'').toUpperCase()):hitPac.extract(name)):fs.readFileSync(path.join(sourceHitAssets,relative));
 if(!bytes||crypto.createHash('sha256').update(bytes).digest('hex')!==expected)throw Error('Unreviewed original landing resource '+relative);
 const target=path.join(destination,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);landingFiles.push({file:relative,sha256:expected,bytes:bytes.length});
}
const landing=existing('content/config/era-bridge-landing-effects.json',{schemaVersion:1,creatures:{}});
if(landing.schemaVersion!==1||!landing.creatures)throw Error('Invalid landing registry');
write('content/config/era-bridge-landing-effects.json',mergeObject(landing,{creatures:{'tum-era:guardianOfZeus':{melee:{animation:'tum-era/hit-effects/Burst10.def',sound:'tum-era/hit-effects/GOGFLAME.wav'},ranged:{animation:'tum-era/hit-effects/Burst11.def'}}}}));
const manifest=existing('mod.json',{});manifest.creatures=[...new Set([...(manifest.creatures??[]),'config/guardian-zeus.json'])];manifest.factions=[...new Set([...(manifest.factions??[]),'config/tower.json'])];write('mod.candidate.json',manifest);
const reportFile=path.join(destination,'guardian-zeus-import-report.json'),report=JSON.parse(fs.readFileSync(reportFile,'utf8'));
report.portable={completeReviewOverlay:true,sharedRegistriesMerged:['runtime','experience','experience-attack-spells','thunder-attacks','status-attacks.sourceIds','landing-effects'],landingFiles,requiredJointDefinition:{sourceId:231,native:'tum-era:chasmDragon',reason:'Reciprocal HATE212/231, must be registered before activation'},manifest:'mod.candidate.json; no active mod.json emitted'};
report.unimplementedVisuals=['Native ranged/melee landing playback must pass visual E2E on new engine','Original fourth-dwelling town animation reuses third-dwelling art; hall icon uses source frame77'];fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');
console.log('Merged portable212 overlay; active registration remains absent.');
