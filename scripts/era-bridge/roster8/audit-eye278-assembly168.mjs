/** Extend278 audit with verifiable uncombine/slot facts, never activate it. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const out=process.argv[2]||'outputs/wog-priorities-0.4.147/eighth-evidence';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const sources=['../h3era-plugins/Emerald3/emerald/ArtifactCombos.cpp','../h3era-plugins/Emerald3/emerald/emerald.cpp',
 'work/vcmi-wasm/lib/gameState/GameStatePackVisitor.cpp','work/vcmi-wasm/lib/entities/artifact/CArtifactSet.cpp'];
const native={...JSON.parse(fs.readFileSync('mod/tum-era/content/config/reviewed-conversion-artifacts.json')),
 ...JSON.parse(fs.readFileSync('mod/tum-era/content/config/reviewed-eyes275-276.json'))};
const components=[273,274,276,277].map(id=>{
 const file='../Third-Upgrade-Mod-Full/Data/artifacts/'+id+'.cfg',bytes=fs.readFileSync(file),definition=native['artifact'+id];
 if(!definition)throw Error('Missing real native component'+id);
 return{id,source:{path:file,sha256:sha(bytes),fields:bytes.toString('latin1').trim().split(/\r?\n/).filter(Boolean)},
 native:{slot:definition.slot,bonuses:definition.bonuses,sha256:sha(Buffer.from(JSON.stringify(definition)))}};
});
fs.mkdirSync(out,{recursive:true});
const binary='../era-project-eng/h3era.exe';
const bytes=execFileSync('/usr/bin/objdump',['-D','--start-address=0x4dc2e0','--stop-address=0x4dc367',binary]);
const assembly=path.join(out,'eye278-source-uncombine168.asm');fs.writeFileSync(assembly,bytes);
const result={status:'future168-source-only-inactive',artifact278Active:false,nativeGuiAssemblyValidated:false,
 sources:sources.map(file=>({path:file,sha256:sha(fs.readFileSync(file))})),components,
 uncombine:{path:assembly,sha256:sha(bytes),binarySHA:sha(fs.readFileSync(binary))},
 verified:[
 'Original4DC2E0 reads parent comboID and calls RemoveArtFromHero4E2E40. It then scans constituent IDs ascending, constructs each{id,-1}, and calls AddArtToHero4E2C70 withslot-1. Original equipment positions are NOT saved/restored by this routine.',
 'Emerald ArtifactCombos263..269 patches4DC310 bitset stride/size. Active dwords_0x160_to_3C0 list includes4DC319+2, while emerald.cpp631 writes4DC358=NEW_ARTS_AMOUNT. random.cpp371 is COMMENTED and is deliberately not evidence.',
 'Removing parent decrements the same category reservation counters added while equipping it. Empty component ID fields therefore do not imply extra available equipment slots.',
 'Native visitDisassembledArtifact instead restores remembered equipment part.slot, mainpart replacing the parent position. This is an actual placement-order difference needing a scoped278 decision, not proof that native extra locked slots are wrong.',
 'For these four native component definitions the explicit bonus lists contain only custom Emerald damage endpoints. Their source CFG fields contain endpoint bonuses and daily upgrade pairs; no other custom bonus field. Original ordinary hero primary-stat inheritance is handled separately by AddArtToHero4E2D62..7D and must not be removed globally.'
 ],
 obligations:[
 'Keep source reversible combination: irreversible consuming recipe would be incorrect.',
 'Audit equivalence of source category reservations and native locked MISC slots with actual GUI assembly/disassembly; test source ascending-ID/first-available placement, including separately equipped duplicate components.',
 'Retain noncustom inherited primary-stat/spell effects when applying any parent-specific custom-damage compensation.',
 'Validate all component definitions and actual aggregate+5/+5; then equipped/backpack, save/load, banner/XP and daily conversions. All346/347/339 family prerequisites remain separately gated.'
 ]};
fs.writeFileSync(path.join(out,'eye278-assembly-source168.json'),JSON.stringify(result,null,2)+'\n');
console.log('Retained reversible278 assembly/slot audit; no production mutation.');
