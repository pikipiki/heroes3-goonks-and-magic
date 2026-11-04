import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';
const project=process.env.TUM_PROJECT_ROOT,source=process.env.TUM_SOURCE_ROOT,out=process.env.TUM_NECROSS_OUTPUT;
if(!project||!source||!out)throw Error('Set TUM_PROJECT_ROOT, TUM_SOURCE_ROOT and TUM_NECROSS_OUTPUT to explicitly supplied local corpus/output');
const read=p=>JSON.parse(fs.readFileSync(path.join(out,p),'utf8')),creature=read('content/config/necross-dragon.json').necrossDragon,report=read('necross-import-report.json');
test('all six source XP rows have distinct native or exact runtime ownership; no duplicate poison/age bonuses',()=>{
 assert.equal(report.nativeExperience.length,3);assert.equal(report.runtimeExperienceBindings.length,3);
 assert.deepEqual(report.runtimeExperienceBindings.map(x=>x.row.code).sort(),['L','c','k']);
 for(const row of report.runtimeExperienceBindings){assert.equal(row.emittedBonuses,0);assert.deepEqual(row.row.values,[0,5,10,15,20,25,30,35,40,45,50]);}
 const text=JSON.stringify({abilities:creature.abilities,xp:creature.stackExperience});assert(!text.includes('SPELL_BEFORE_ATTACK'));assert(!text.includes('SPELL_AFTER_ATTACK'));
 assert.equal(creature.shots,10,'Source Crtraits254 has ten initial shots independently of the O+ XP row');assert.equal(creature.abilities.magicResistance.val,40);assert.equal(creature.abilities.deathCloud.subtype,'tum-era:necrossDeathCloud');
 assert.deepEqual(read('content/config/era-bridge-runtime.json').creatures['tum-era:necrossDragon'].physicalDeflection,{modifier:49,values:[0,5,10,15,20,25,30,35,40,45,50]});
});
test('source chain, experience, policies and unrelated registrations survive the candidate overlay',()=>{
 assert.deepEqual(read('content/config/necross-dragon.json')['wake-of-gods.creatures:dracolich'].upgrades,['tum-era:necrossDragon']);
 const old=JSON.parse(fs.readFileSync(project+'/mod/tum-era/content/config/era-bridge-experience.json','utf8')),current=read('content/config/era-bridge-experience.json');for(const[key,value]of Object.entries(old.creatures))assert.deepEqual(current.creatures[key],value);
 assert.deepEqual(current.creatures['tum-era:necrossDragon'],{fullRank10:147000,rank11Extra:14700,battlePercent:20,experienceMultiplier:1,upgradeMultiplier:.75});
 const manifest=read('mod.candidate.json');assert(manifest.creatures.includes('config/necross-dragon.json'));assert(manifest.creatures.includes('config/undead-morale-creatures.json'));assert(manifest.spells.includes('config/necross-spells.json'));
 const status=read('content/config/era-bridge-status-attacks.json');assert(status.creatures.includes('tum-era:necrossDragon'));assert.equal(status.sourceIds['tum-era:necrossDragon'],254);
 assert.equal(read('era-identities.candidate.json').creatures['254'],'tum-era:necrossDragon');assert.equal(report.registered,false);assert.equal(report.activationReady,false);assert(!fs.existsSync(out+'/mod.json'));
});
test('actual portrait pixels match original ERA254 frame256, not frame254',async()=>{
 const {readEraArchive}=await import(pathToFileURL(project+'/scripts/era-bridge/resources.mjs')),{decodeDefFrame}=await import(pathToFileURL(project+'/scripts/era-bridge/roster8/def-frame.mjs')),sharp=createRequire(project+'/work/browser-tests/package.json')('sharp');
 const archive=readEraArchive(fs.readFileSync(source+'/Data/AmeCre.pac'));
 for(const[field,def]of [['iconSmall','cprsmall.def'],['iconLarge','twcrport.def']]){
  const actual=await sharp(out+'/content/Data/'+creature.graphics[field]).ensureAlpha().raw().toBuffer({resolveWithObject:true}),expected=decodeDefFrame(archive.extract(def),256);
  assert.equal(actual.info.width,expected.width);assert.equal(actual.info.height,expected.height);assert(actual.data.equals(expected.rgba));
 }
});
test('verified landing assets resolve through spell and melee policy; the original army aura replaces all five native copies',()=>{
 assert.equal(report.assets.length,15);for(const asset of report.assets)assert(fs.existsSync(out+'/'+asset.file),asset.file);
 const spell=read('content/config/necross-spells.json').necrossDeathCloud;for(const level of Object.values(spell.levels)){assert.equal(level.range,'0-1');assert.equal(level.battleEffects.damage.ignoreImmunity,true);}
 assert.equal(spell.animation.hit[0].defName,'tum-era/hit-effects/Burst17.def');assert.equal(spell.sounds.cast,'tum-era/hit-effects/DEATHCLS.wav');
 assert.equal(read('content/config/era-bridge-landing-effects.json').creatures['tum-era:necrossDragon'].melee.animation,'tum-era/hit-effects/Burst25.def');
 assert.equal(read('content/config/era-bridge-undead-army-morale.json').enabled,true);
 const removed=read('content/config/undead-morale-creatures.json');assert.equal(Object.keys(removed).length,5);for(const row of Object.values(removed))assert.equal(Object.values(row.abilities)[0],null);
});
