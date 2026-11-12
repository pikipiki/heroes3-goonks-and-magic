/** Complete source217 patch for the EXISTING third-upgrades:tumPitMaster identity.
 * Quarantined candidate only; native build and gameplay validation precede install. */
import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';
import{readEraArchive,readCreatureTable,creatureStats,readCreatureAnimationTable}from'../resources.mjs';
import{readJsonc,createProductionObjectResolvers}from'../objects/production-resolvers.mjs';import{identifiersByIndex}from'../artifacts/importer.mjs';
import{compileCreatureProperties}from'../creatures/creature-properties.mjs';import{parseCreatureExperience,compileCreatureExperience}from'../creatures/crexpbon.mjs';
import{compileFreshSourceExperienceDefaults}from'../creatures/source-experience-defaults.mjs';
import{sourceDemonologyCaster,sourceDemonologySpell,SOURCE_DEMONOLOGY_CONTRACT}from'./demonology-source.mjs';
import{prepareDemonologyUI}from'./demonology-ui-assets.mjs';
const[project,source,out]=process.argv.slice(2);if(!out||fs.existsSync(out))throw Error('Usage: prepare-pit-master.mjs PROJECT TUM FRESH_OUTPUT');
const write=(name,data)=>{const p=path.join(out,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(data,null,2)+'\n');},sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const canonical='third-upgrades:tumPitMaster',alias=createProductionObjectResolvers({projectRoot:path.resolve(project),sourceRoot:path.resolve(source)}).resolveCreature(217);if(alias!==canonical)throw Error('Source217 existing canonical identity required');
const existing=readJsonc(path.join(project,'mod/third-upgrades/content/config/creatures/inferno/lvl5Upg2.json')).tumPitMaster;
if(JSON.stringify(Object.keys(existing.abilities).sort())!==JSON.stringify(['attackAround','castsAmount','noRetaliation','resurrects','summons50HP'].sort()))throw Error('Existing alias ability set changed; do not inherit unknown abilities');
const archive=readEraArchive(fs.readFileSync(path.join(source,'Data/AmeCre.pac'))),cfg=fs.readFileSync(path.join(source,'Data/Creatures/217.cfg'),'utf8'),traits=readCreatureTable(archive.extract('Crtraits.txt').toString('latin1'))[217],an=readCreatureAnimationTable(archive.extract('cranim.txt').toString('latin1'))[217];
const caster=sourceDemonologyCaster(cfg,{sourceId:217,contract:SOURCE_DEMONOLOGY_CONTRACT});if(traits.spells!==1)throw Error('Original one cast required');
const spellDir=path.join(project,'work/vcmi-wasm/config/spells'),spellIds=identifiersByIndex(fs.readdirSync(spellDir).filter(n=>n.endsWith('.json')).map(n=>readJsonc(path.join(spellDir,n)))),resolveSpell=id=>spellIds.has(id)?'core:'+spellIds.get(id):undefined;
const properties=compileCreatureProperties(cfg,{sourceCreatureId:217,freshDefinition:true,analyseOnly:true,nativeBiologyContract:'source-biological-flags-v1',nativeDemonologyContract:SOURCE_DEMONOLOGY_CONTRACT,resolveTown:()=> 'core:inferno',resolveCreature:id=>id===49?'core:hornedDemon':undefined});if(properties.policies.length||properties.diagnostics?.length)throw Error('Unclosed Pit Master CFG');
const rows=parseCreatureExperience(archive.extract('crexpbon.txt').toString('latin1')),installedRows=parseCreatureExperience(fs.readFileSync(path.join(project,'mod/wake-of-gods/Mods/stackExperience/Content/data/crexpbon.txt'),'latin1'));
const xp=compileCreatureExperience(rows,{creatureId:217,nativeExperienceProfile:true,installedRows,rankZero:'intrinsic',experienceDemonology:SOURCE_DEMONOLOGY_CONTRACT,resolveSpell,throwOnError:true});
const defaults=compileFreshSourceExperienceDefaults(rows,{contract:'source-default-experience-new-creature-v1',freshDefinition:true,nativeDefaultCarrier:'creature-json',healthRoundingContract:'source-health-xp-rounding-v1',sourceLevelZeroBased:4,creatureId:217,installedRows,nativeExperienceProfile:true});if(!defaults.ok)throw Error('Source default XP not closed');
// Preserve the same registered name/key and graphics resources. Replace the five
// pre-existing ability keys, so no legacy summon/casts bonus survives by merge.
const definition={...creatureStats(traits),level:5,faction:'core:inferno',doubleWide:false,shots:traits.shots,hasDoubleWeek:false,abilities:{summons50HP:caster.abilities.sourceDemonPower,resurrects:caster.abilities.sourceDemonCaster,noRetaliation:{type:'BLOCKS_RETALIATION'},castsAmount:{type:'CASTS',val:1},attackAround:{type:'THREE_HEADED_ATTACK'},...xp.nativePreview.abilities},stackExperience:[...defaults.definition.stackExperience,...xp.nativePreview.stackExperience],graphics:{...existing.graphics,...an.graphics}};
const oldSprite=fs.readFileSync(path.join(project,'mod/third-upgrades/content/sprites/creatures/inferno/battle/cr217.def')),sourceSprite=archive.extract('CR217.def');if(!oldSprite.equals(sourceSprite))throw Error('Existing canonical sprite does not match original source217');
write('content/config/complete-pit-master.candidate.json',{[canonical]:definition});write('content/config/source-demonology-spells.candidate.json',{sourceDemonology49:sourceDemonologySpell(readJsonc(path.join(spellDir,'vcmiAbility.json')).summonDemons,caster)});
write('runtime.candidate.json',{sourceRoundTwoDemons:xp.runtimeBindings.find(b=>b.operation==='sourceRoundTwoDemons').service});
const uiAssets=prepareDemonologyUI(project,out);
write('review.json',{uiAssets,active:false,sourceId:217,canonical,sourceCfgSha256:sha(Buffer.from(cfg)),archiveSha256:archive.sha256,originalBattleSpriteSha256:sha(sourceSprite),replacesExistingAlias:true,legacyAbilitiesRebound:Object.keys(existing.abilities),sourceXP:rows.filter(r=>r.creature===217),runtimeBindings:xp.runtimeBindings,defaults:defaults.sourceDefaultRows,pending:['Native round2 placement/no-persistence/casualtyXP/elemental-bookkeeping controls','Native mode2 corpse conversion and source quantity controls','Source canonical town recruitment and existing save identity controls']});
console.log(JSON.stringify({output:path.resolve(out),canonical,duplicateActorCreated:false,active:false}));
