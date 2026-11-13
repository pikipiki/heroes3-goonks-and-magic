import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const out=process.argv[2]||'outputs/wog-priorities-0.4.147/eighth-evidence';
const binary='../era-project-eng/h3era.exe',source='../h3era-plugins/Amethyst2/amethyst/tables.cpp';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
fs.mkdirSync(out,{recursive:true});
const disassembly=[['primordial346-shield-reflection165',0x4225c0,0x422660],['primordial346-shield-coefficient165',0x442e50,0x442e75]].map(([name,start,stop])=>{
 const bytes=execFileSync('/usr/bin/objdump',['-D',`--start-address=${start}`,`--stop-address=${stop}`,binary]);
 const file=path.join(out,name+'.asm');fs.writeFileSync(file,bytes);return{path:file,sha256:sha(bytes),start,stop};
});
const helper='work/vcmi-wasm/lib/era/EraPrimordialShieldRule.h';
fs.writeFileSync(path.join(out,'primordial346-shield-source165.json'),JSON.stringify({
 status:'source-and-pure-helper-only-inactive',nativeValidated:false,wholeActor346Validated:false,
 binary:{path:binary,sha256:sha(fs.readFileSync(binary))},source:{path:source,sha256:sha(fs.readFileSync(source))},disassembly,
 verified:[
 '442E50 checks active spell29 atstack+20C BEFORE intrinsic fallback. Active coefficient is loaded REAL4 fromstack+4A0. Therefore spell20% overrides intrinsic30%, without addition or max.',
 'Amethyst GetFireShield7826..7843 selects fire_shield_table[creature] when >0.01 and patches REAL4 load442E67. CFG346 Fireshield0.3 loads this table; jump registered13411.',
 '422607..617 selects signed minimum of the two input DWORDs.42261E FILD loads it,422620 FSTPS rounds it to REAL4,422623 FMUL multiplies coefficient by that REAL4,422626 ftol truncates result.',
 '42264B subsequently calls5A7BF0 with spell29, reflectorhero, attackerhero and attacker. This primitive deliberately stops BEFORE that correction and does not replace existing verified B/L/resistance/sorcery ordering.',
 'Defined large input16777219 rounds to16777220 at REAL4 stage and reflects5033166 with intrinsic float0.3, versus5033165 from integer30percent. Neither is an undefined-value correction.'
 ],helper:{path:helper,sha256:sha(fs.readFileSync(helper)),test:'node --test tests/era-primordial-shield.test.mjs',runtimeIncluded:false},
 pending:[
 'Scoped346 BAP replacement preserving original live-spell override, existing magic correction and post-hit ordering; no generic sum of FIRE_SHIELD bonuses.',
 'Source physical damage/available-health parameters and exact relevant caller branches, including nonpositive damage, must match the parent verified shield pipeline before connecting helper.',
 'Native intrinsic30%, weaker20% activeSpell29 override, target fire-immunity, pre-hit health cap, direct doubleAfterDefend29 and source-float boundary controls.'
 ]},null,2)+'\n');
console.log('Retained346 source shield arithmetic; actor and runtime remain inactive.');
