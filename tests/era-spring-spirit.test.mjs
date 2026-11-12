import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {execFileSync} from 'node:child_process';
import {reviewedSpringSpirit,SOURCE_SPRING_SPIRIT_CONTRACT} from '../scripts/era-bridge/roster8/spring-spirit.mjs';
import {compileCreatureExperience,parseCreatureExperience} from '../scripts/era-bridge/creatures/crexpbon.mjs';
import {validateRuntimePolicy} from '../scripts/era-bridge/runtime-policy.mjs';
const cfg='ACAST_CUSTOM_Chance=100\nACAST_CUSTOM_Spell=60\nAfterDefendSpell2=27\nFlags=524291\nLevel=6\nTown=1\nRegenerationHitPoints=100\nRegenerationChance=100\nStrikeAllAroundRange=1\n';
test('Spring Spirit preserves dormant source fields instead of inventing Hypnotize/Shield casts',()=>{
 const result=reviewedSpringSpirit(cfg,{contract:SOURCE_SPRING_SPIRIT_CONTRACT,sourceId:350});
 assert.deepEqual(result.inactiveKeys,['ACAST_CUSTOM_Chance','ACAST_CUSTOM_Spell','AfterDefendSpell2']);
 assert.deepEqual(result.services,{sourceRegeneration:{hitPoints:100,chancePercent:100},sourceSplashRangeOne:{}});
 assert.deepEqual(validateRuntimePolicy({schemaVersion:1,creatures:{'tum-era:eraCreature350':result.services}}).creatures['tum-era:eraCreature350'],result.services);
 assert.throws(()=>reviewedSpringSpirit(cfg+'Spell effect=10\n',{contract:SOURCE_SPRING_SPIRIT_CONTRACT,sourceId:350}),/Unreviewed/);
 assert.throws(()=>reviewedSpringSpirit(cfg+'AfterDefendSpell=27\n',{contract:SOURCE_SPRING_SPIRIT_CONTRACT,sourceId:350}),/Unreviewed/);
});
test('Spring Spirit XP retains massCure37 and fixed25% partialdeflection with separate rank strengths',()=>{
 const rows=parseCreatureExperience([[350,'p','#37',...Array.from({length:11},(_,i)=>i*5)].join('\t'),[350,'L','#125',...Array.from({length:11},(_,i)=>i*6)].join('\t')].join('\n'));
 const options={creatureId:350,installedRows:[],nativeExperienceProfile:true,rankZero:'intrinsic',resolveSpell:()=> 'core:cure'};
 assert.equal(compileCreatureExperience(rows,options).ok,false);
 const result=compileCreatureExperience(rows,{...options,experienceSpring:SOURCE_SPRING_SPIRIT_CONTRACT,experienceBeforeAttack:'source-p37-v1'});assert.equal(result.ok,true);
 assert.equal(result.nativePreview.stackExperience[0].bonus.subtype,'core:cure');assert.equal(result.nativePreview.stackExperience[0].bonus.addInfo,3);
 assert.equal(result.runtimeBindings[0].service.modifier,125);assert.equal(result.runtimeBindings[0].service.values[10],60);
});
test('native source radius1 retains pixel distance boundary rather than graph adjacency',()=>{
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-spring-range-'));
 try{
  const header=path.resolve('work/vcmi-wasm/lib/era/EraSourceSplashRange.h');
  fs.writeFileSync(temporary+'/range.cpp',`#include ${JSON.stringify(header)}\n#include <cassert>\nint main(){using era_bridge::sourceSplashRangeOne;assert(sourceSplashRangeOne(93,95));assert(sourceSplashRangeOne(93,91));assert(sourceSplashRangeOne(93,127));assert(!sourceSplashRangeOne(93,128));assert(!sourceSplashRangeOne(93,96));assert(!sourceSplashRangeOne(-1,93));assert(!sourceSplashRangeOne(93,187));for(int a=0;a<187;++a){assert(sourceSplashRangeOne(a,a));for(int b=0;b<187;++b)assert(sourceSplashRangeOne(a,b)==sourceSplashRangeOne(b,a));}}`);
  execFileSync(process.env.CXX||'c++',['-std=c++17','-fsanitize=undefined','-fno-sanitize-recover=all',temporary+'/range.cpp','-o',temporary+'/range']);
  execFileSync(temporary+'/range');
 }finally{fs.rmSync(temporary,{recursive:true,force:true});}
});
test('original350 file matches the reviewed shipped service contract',{skip:!process.env.TUM_SOURCE},()=>{
 assert(reviewedSpringSpirit(fs.readFileSync(process.env.TUM_SOURCE+'/Data/Creatures/350.cfg','utf8'),{contract:SOURCE_SPRING_SPIRIT_CONTRACT,sourceId:350}));
});
