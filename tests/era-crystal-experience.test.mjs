import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {compileCreatureExperience,parseCreatureExperience} from '../scripts/era-bridge/creatures/crexpbon.mjs';
import {validateRuntimePolicy} from '../scripts/era-bridge/runtime-policy.mjs';
const defaults=fs.readFileSync('mod/wake-of-gods/Mods/stackExperience/Content/data/crexpbon.txt','latin1');
const installed=parseCreatureExperience(defaults);
function compile(creature,code,modifier,values,contract='source-crystal-experience-v1'){
 const row=parseCreatureExperience([creature,code,modifier,...values].join('\t'))[0];
 return compileCreatureExperience([...installed.filter(r=>r.creature<0),row],{creatureId:creature,installedRows:installed,nativeExperienceProfile:true,experienceCrystal:contract,rankZero:'intrinsic'});
}
test('Crystal XP regeneration and full block require exact source actors, rows and explicit contracts',()=>{
 const regen=Array.from({length:11},(_,i)=>i*9),block=Array.from({length:11},(_,i)=>Math.min(25,i*5));
 for(const id of [267,268]){const r=compile(id,'r','#100',regen);assert(r.ok);assert.equal(r.runtimeBindings[0].operation,'experienceRegeneration');assert.deepEqual(r.runtimeBindings[0].service,{chancePercent:100,values:regen});}
 const r=compile(268,'B','=',block);assert(r.ok);assert.equal(r.runtimeBindings[0].operation,'physicalBlock');
 assert(!compile(267,'B','=',block).ok);assert(!compile(268,'r','#99',regen).ok);assert(!compile(268,'r','#100',regen,null).ok);
 assert(!compile(268,'r','#100',regen.map((v,i)=>i===10?91:v)).ok);assert(!compile(268,'B','+',block).ok);
});
test('Crystal native policy rejects altered chance/rank tables and unreviewed actors',()=>{
 const service={chancePercent:100,values:Array.from({length:11},(_,i)=>i*9)};
 const p={schemaVersion:1,creatures:{'tum-era:eraCreature267':{experienceRegeneration:service}}};assert.deepEqual(validateRuntimePolicy(p),p);
 for(const mutated of [{...service,chancePercent:99},{...service,values:[...service.values,99]}])assert.throws(()=>validateRuntimePolicy({schemaVersion:1,creatures:{'tum-era:eraCreature267':{experienceRegeneration:mutated}}}));
 assert.throws(()=>validateRuntimePolicy({schemaVersion:1,creatures:{'core:crystalDragon':{experienceRegeneration:service}}}));
});
test('Native source chance boundaries heal only living first-creature damage and full block never partly reduces damage',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-crystal-unit-'));try{const cpp=path.join(tmp,'main.cpp'),bin=path.join(tmp,'check');
 fs.writeFileSync(cpp,`#include "${path.resolve('work/vcmi-wasm/lib/era/EraCrystalExperience.h')}"\n#include <cassert>\nint main(){using namespace era_bridge;assert(sourceExperienceRegeneration(90,150,100,100)==90);assert(sourceExperienceRegeneration(90,3,100,1)==3);assert(sourceExperienceRegeneration(90,0,100,1)==0);assert(sourceExperienceRegeneration(0,50,100,1)==0);assert(sourceExperienceRegeneration(90,50,40,40)==50);assert(sourceExperienceRegeneration(90,50,40,41)==0);assert(!sourcePhysicalBlock(0,1));assert(sourcePhysicalBlock(25,25));assert(!sourcePhysicalBlock(25,26));assert(!sourcePhysicalBlock(25,0));assert(sourcePhysicalBlock(100,100));}`);
 execFileSync('c++',['-std=c++17','-fsanitize=undefined',cpp,'-o',bin]);execFileSync(bin);
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
test('Five source stages retain paid upgrade chain, source Ruby stats and maximum daily crystal income',()=>{
 const read=name=>JSON.parse(fs.readFileSync('mod/tum-era/content/config/'+name+'.json'));
 const d=read('complete-crystal-chain'),old=read('reviewed-crystal-chain'),p=read('era-bridge-runtime').creatures;
 assert.equal(old.eraCreature265.hitPoints,350);assert.equal(old.eraCreature266.hitPoints,550);assert.equal(d['core:crystalDragon'].hitPoints,750);
 assert.equal(d['core:crystalDragon'].abilities.magicResistance,null);
 assert.deepEqual(d['core:crystalDragon'].upgrades,['tum-era:eraCreature267']);assert.deepEqual(d.eraCreature267.upgrades,['tum-era:eraCreature268']);assert(!d.eraCreature268.upgrades?.length);
 for(const[id,amount]of [[267,2],[268,3]])assert.deepEqual(p['tum-era:eraCreature'+id].dailyResources,{resource:'core:crystal',amount,goldPerCreature:0});
 assert.equal(p['tum-era:eraCreature268'].physicalBlock.values[10],25);
});

test('Source full-block animation85 uses the original WoG DEF without an invented audio replacement',()=>{
 const source=fs.readFileSync('mod/wake-of-gods/Mods/heroes3DataPatch/content/sprites/zmgc01.def');const block=fs.readFileSync('mod/tum-era/content/Sprites/tum-era/crystal-block/block.def');assert.deepEqual(block,source);
 const mapping=JSON.parse(fs.readFileSync('mod/tum-era/content/config/battles_graphics.json'));assert.deepEqual(mapping.ac_mapping.filter(entry=>entry.id===85),[{id:85,defnames:['tum-era/crystal-block/block.def']}]);
});

test('Emerald and Sapphire reuse exact optional-provider melee Burst43 source assignments',()=>{
 const p=JSON.parse(fs.readFileSync('mod/tum-era/content/config/era-bridge-landing-effects.json'));
 for(const id of [267,268])assert.deepEqual(p.creatures['tum-era:eraCreature'+id],{melee:{animation:'tum-era/hit-effects/Burst43.def'}});
 const proof=JSON.parse(fs.readFileSync('mod/tum-era/landing-assets-provenance.json'));
 assert.equal(proof.sourceArchiveSha256,'907044343b50277c7ac32748fa9df37699bd333637e87d9026bc60d738e9fd4d');
 assert.equal(fs.readFileSync('mod/tum-era/content/Sprites/tum-era/hit-effects/Burst43.def').length,3672);
});
