import {test} from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
test('Portable ERA runtime uses exact probability boundaries, raw resurrection HP and authoritative event deltas',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'heroes-era-runtime-'));
 try{let compiler;for(const candidate of [...new Set([process.env.CXX,'clang++','g++'].filter(Boolean))]){try{execFileSync(candidate,['--version'],{stdio:'ignore'});compiler=candidate;break;}catch{}}
 assert(compiler,'A C++17 compiler is required to verify the native ERA bridge');
 for(const source of ['EraBridgeRuntime','EraBridgeArtifactRuntime','EraExperience','EraPetrificationPending','EraCreatureArtifactRuntime','EraBankSemantics','EraSourceRankRange','EraSignedDamage','EraCorpseTransformation','EraExperienceParser','EraSourceAttackGate','EraCloneHealScope','EraExperienceDistribution','EraTransformerPreview','EraAcidAttack','EraDeathCloud','EraUndeadArmyMorale','EraPhysicalDeflection','EraStatusHealth','EraDefenseReduction','EraBattleSlots','EraExperienceCastTargets','EraStatusSelectors','EraCDispelSelector','WebAudioThread']){const binary=path.join(directory,source);execFileSync(compiler,['-std=c++17','-pthread','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=address,undefined','tests/native/'+source+'.test.cpp','-o',binary],{stdio:'pipe'});execFileSync(binary,[],{stdio:'pipe'});}
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
