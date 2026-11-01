import test from'node:test';
import fs from'node:fs';import assert from'node:assert/strict';
import path from'node:path';import{pathToFileURL}from'node:url';const project=path.resolve(process.env.ERA_PROJECT||process.cwd());const{parseCreatureExperience,compileCreatureExperience}=await import(pathToFileURL(path.join(project,'scripts/era-bridge/creatures/crexpbon.mjs')));
test('212 extracted stats, assets and XP rows',{skip:!process.env.ERA_212_OVERLAY},()=>{
const read=f=>JSON.parse(fs.readFileSync(path.join(process.env.ERA_212_OVERLAY||path.join(project,'work/tum-reviewed/guardian-zeus'),f))),c=read('content/config/guardian-zeus.candidate.json').guardianOfZeus;
assert.deepEqual([c.hitPoints,c.speed,c.attack,c.defense,c.shots],[600,15,36,36,24]);assert.deepEqual(c.damage,{min:60,max:75});assert.deepEqual([c.cost.gems,c.cost.gold],[5,10000]);assert.deepEqual(c.name,{singular:'Master of Thunder',plural:'Masters of Thunder'});assert.equal(c.doubleWide,false);assert.equal(c.level,7);
assert.equal(c.abilities.doubleShot.effectRange,'ONLY_DISTANCE_FIGHT');assert.equal(c.abilities.doubleShot.val,1);assert.equal(c.abilities.king3.val,3);assert.equal(c.abilities.initialUnusedSpellCharge.val,1);assert(c.abilities.mindImmunity);assert(c.abilities.noMeleePenalty);assert(c.abilities.noWallPenalty);assert(!Object.values(c.abilities).some(b=>['SPELLCASTER','FIRE_IMMUNITY','SPELL_AFTER_ATTACK'].includes(b.type)));assert(!Object.values(c.abilities).some(b=>b.subtype==='core:chainLightning'));
for(const type of['core:redDragon','core:blackDragon'])assert(Object.values(c.abilities).some(b=>b.type==='HATE'&&b.subtype===type&&b.val===200));
for(const type of['wake-of-gods.level8units:darknessDragon','tum-era:chasmDragon'])assert(Object.values(c.abilities).some(b=>b.type==='HATE'&&b.subtype===type&&b.val===50));
assert(Object.values(c.abilities).some(b=>b.type==='NEGATIVE_EFFECTS_IMMUNITY'&&b.subtype==='spellSchool.air'));assert.equal(c.stackExperience.length,7);assert(c.stackExperience.some(b=>b.bonus.type==='SPELL_BEFORE_ATTACK'&&b.bonus.subtype==='core:titanBolt'&&b.bonus.addInfo===3));
assert.equal(c.graphics.missile.projectile,'tum-era/guardian-zeus/SHOT212');
for(const name of Object.values(c.sound)){const bytes=fs.readFileSync(path.join(process.env.ERA_212_OVERLAY||path.join(project,'work/tum-reviewed/guardian-zeus'),'content/Sounds',name));assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WAVE');}
const policy=read('content/config/era-bridge-runtime.candidate.json').creatures['tum-era:guardianOfZeus'];assert.deepEqual(policy,{imposedSpells:[{spell:'core:airShield',mastery:3}],artifactMimic:{artifact:135}});
const tower=read('content/config/tower.candidate.json')['core:tower'].town;assert.equal(tower.creatures[6].at(-1),'guardianOfZeus');assert.equal(tower.buildings.dwellingUp3Lvl7.name,'Upg. Storm Temple');assert.deepEqual(tower.buildings.dwellingUp3Lvl7.cost,{wood:10,ore:10,gems:35,gold:25000});
const report=read('guardian-zeus-import-report.json');assert.equal(report.activationReady,false);assert.equal(report.nativeXPSourceRows.length,8);assert.deepEqual(report.sourceUnportedXPRows,[]);assert.equal(report.inactiveConfiguration.CastsSpell,19);assert.equal(report.inactiveConfiguration.AfterActionSpellMastery,0);assert(!fs.existsSync(path.join(process.env.ERA_212_OVERLAY||path.join(project,'work/tum-reviewed/guardian-zeus'),'mod.json')));

});
test('p57 strict contract requires source profile and exact212 row',()=>{
const row=(id,code,modifier,values)=>[id,code,modifier,...values].join('\t'),rows=parseCreatureExperience(row(212,'p','#57',Array.from({length:11},(_,i)=>i))),options={creatureId:212,installedRows:[],nativeExperienceProfile:true,experienceBeforeAttack:'source-p57-v1',resolveSpell:()=> 'core:titanBolt'};
assert.equal(compileCreatureExperience(rows,options).ok,true);assert.equal(compileCreatureExperience(rows,{...options,experienceBeforeAttack:undefined}).ok,false);assert.equal(compileCreatureExperience(rows,{...options,nativeExperienceProfile:false}).ok,false);assert.equal(compileCreatureExperience(parseCreatureExperience(row(212,'p','#57',Array(11).fill(1))),options).ok,false);

});
