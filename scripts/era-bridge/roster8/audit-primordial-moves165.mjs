/** Local shipped-code/source evidence; no connector export or activation. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const [out='outputs/wog-priorities-0.4.147/eighth-evidence'] = process.argv.slice(2);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const binary='../era-project-eng/h3era.exe';
const source='../h3era-plugins/Amethyst2/amethyst/';
fs.mkdirSync(out,{recursive:true});
const ranges=[['primordial347-morale-entry165',0x464500,0x464720],['primordial347-action-dispatch165',0x478950,0x479510]];
const disassembly=ranges.map(([name,start,stop])=>{
 const text=execFileSync('/usr/bin/objdump',['-D',`--start-address=${start}`,`--stop-address=${stop}`,binary]);
 const file=path.join(out,name+'.asm');fs.writeFileSync(file,text);return{path:file,sha256:sha(text),start,stop};
});
const sources=['tables.cpp','dllmain.cpp'].map(name=>({path:source+name,sha256:sha(fs.readFileSync(source+name))}));
const report={status:'source-and-pure-helper-only-inactive',nativeValidated:false,wholeActor347Validated:false,
 binary:{path:binary,sha256:sha(fs.readFileSync(binary))},sources,disassembly,
 verified:[
 'dllmain.cpp339 resets all42 BYTE counters at OnBeforeBattleUniversal.350..363 seeds counter1 for occupied MovesTwice slots only when v997==0; type>=0, no alive test. Registrations1333..1334.',
 'tables.cpp3380..3400 hooks4645BA: natural morale success bypasses additional_moves. On failure, nonzero physical-side*21+slot counter clears flags byF2FFFFFF and decrements; zero counter rearms1 only when current type/per-slot MovesTwice is enabled.',
 '464500 entry returns for tactics, DEFENDING bit27, HAD_MORALE bit24 or zero alive count. It does not guard on WAIT bit25, canMove or a positive morale value. The original draw remains1..24 even for zero/negative morale.',
 'Action dispatcher calls464500 for original action2 walk,6 melee,7 shoot,9 catapult,10 creature spell. Hero spell1,Defend3,retreat4,surrender5,Wait8,first aid11 andnothing12 do not enter this procedure.',
 'A new347 mid-battle begins with the zero physical-slot counter unless that slot has residue. Its first failed-morale action rearms1 without granting another action. A non347 replacement can spend a previously occupied347 slot counter.',
 'F2FFFFFF clears bits24,26,27 and preserves WAIT25. Source state must not be represented by a native generic two-attacks/two-turns bonus.'
 ],
 helper:{path:'work/vcmi-wasm/lib/era/EraPrimordialMovesRule.h',sha256:sha(fs.readFileSync('work/vcmi-wasm/lib/era/EraPrimordialMovesRule.h')),test:'node --test tests/era-primordial-moves.test.mjs',runtimeIncluded:false},
 pending:[
 'Battle-bonus typed42-byte cache and save/load shuffle validation; preserve physical sourceMassSlot and slot residue instead of native stackID.',
 'Optional runtime source morale1..24 integration and exact action gates; no change to ordinary unrelated native morale.',
 'Native initial347, two actions, successful morale ordering, Defend/Wait/Skip, midbattle invocation, slotreuse and savedbattle controls.',
 'Additional Rush mutable-counter scripts remain outside this actor347 contract; do not claim the unrestricted legacy script engine is ported.'
 ]};
fs.writeFileSync(path.join(out,'primordial347-moves-source165.json'),JSON.stringify(report,null,2)+'\n');
console.log('Retained local MovesTwice source/disassembly proof; no runtime activation.');
