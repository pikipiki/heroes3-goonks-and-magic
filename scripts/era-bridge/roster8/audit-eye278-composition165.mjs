/** Emerald custom endpoint bonuses use visible equipped IDs, not combo parts. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const out=process.argv[2]||'outputs/wog-priorities-0.4.147/eighth-evidence';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const sources=[
 '../h3era-plugins/Emerald3/emerald/ArtifactCombos.cpp',
 '../h3era-plugins/Emerald3/emerald/events.cpp',
 '../h3era-plugins/Emerald3/emerald/properties.cpp',
 'work/vcmi-wasm/lib/entities/artifact/CArtifactInstance.cpp',
 'work/vcmi-wasm/lib/entities/artifact/CArtifactSet.h',
 'work/vcmi-wasm/lib/entities/artifact/CArtifactSet.cpp',
 'work/vcmi-wasm/server/processors/NewTurnProcessor.cpp'
].map(file=>({path:file,sha256:sha(fs.readFileSync(file))}));
const source=fs.readFileSync(sources[0].path,'latin1');
const start=source.indexOf('char __stdcall BuildComboArtIfHasAllParts_4DC1A0');
const end=source.indexOf('void Hook_BuildComboArtIfHasAllParts',start);
if(start<0||end<0)throw Error('Unverified Emerald assembly source');
fs.mkdirSync(out,{recursive:true});
const extract=path.join(out,'eye278-source-assembly165.txt');
fs.writeFileSync(extract,source.slice(start,end));
const binary='../era-project-eng/h3era.exe';
const asm=execFileSync('/usr/bin/objdump',['-D','--start-address=0x4e2e40','--stop-address=0x4e2fb4',binary]);
const assembly=path.join(out,'eye278-source-remove-equipped165.asm');fs.writeFileSync(assembly,asm);
const slotEvidence=[['eye278-source-add-reservations165',0x4e2c70,0x4e2e40],['eye278-source-equip-capacity165',0x4e27c0,0x4e2910]].map(([name,start,stop])=>{
 const bytes=execFileSync('/usr/bin/objdump',['-D',`--start-address=${start}`,`--stop-address=${stop}`,binary]);
 const file=path.join(out,name+'.asm');fs.writeFileSync(file,bytes);return{path:file,sha256:sha(bytes),start,stop};
});
fs.writeFileSync(path.join(out,'eye278-composition-source165.json'),JSON.stringify({
 status:'source-audit-inactive',artifact278Active:false,nativeAssemblyValidated:false,sources,
 originalAssembly:{path:extract,sha256:sha(fs.readFileSync(extract))},
 originalRemove:{path:assembly,sha256:sha(asm),binarySHA:sha(fs.readFileSync(binary))},
 slotEvidence,
 verified:[
 'Emerald ArtifactCombos.cpp1188..1269 replaces4DC1A0 through Hook_BuildComboArtIfHasAllParts registration1449. It removes every required equipped ID using RemoveArtFromHero4E2E40, then equips the parent ID through AddArtToHero4E2C70. The original component IDs no longer occupy their former equipped slots.',
 '4E2F5A..4E2F67 writes DWORD-1 into both removed equipped ID and custom-data fields at hero+12D+8*slot /+131+8*slot.',
 'Emerald events.cpp59..68 computes custom DamageLow/High by scanning only the19 IArt IDs. properties.cpp66..73 returns the per-ID configured custom value, with no constituent recursion.',
 'Native CArtifactSet.getArt defaults excludeLocked=true; putArtifact leaves genuine constituent instances in locked slots. Daily conversion loops calling getArt(slot) therefore see only unlocked parent ID, preserving source daily conversion selection.',
 'Native CCombinedArtifactInstance.addPart attaches every constituent instance as a bonus source of the parent, then CGHeroInstance.putArtifact attaches the parent. Consequently ordinary inherited component bonuses are retained; custom EmeraldDamage also needs a separately scoped source278 composition contract.',
 'Source AddArtToHero4E2C70 also iterates the combo bitset and increments hero+1C5 category reservations for component slots, except one primary match (4E2D9F..4E2DC1). CanEquip4E27C0 reads these counters at4E2878..2886 and checks category capacity. Component ID removal alone does NOT establish free equipment slots; native locked constituent slots may encode the same reservation.'
 ],
 damageContract:{parent:{id:278,min:5,max:5},parts:[{id:273,min:1,max:0},{id:274,min:0,max:1},{id:276,min:0,max:2},{id:277,min:2,max:2}],
  expectedSourceParentOnly:{min:5,max:5},unadjustedNativeInherited:{min:8,max:10}},
 pending:[
 'Keep component standard artifact inheritance, but neutralize only their custom DamageMin/Max contribution inside this exact278 combo; do not globally suppress separately equipped component copies.',
 'A parent-specific additive compensation is one possible implementation, requiring strict source component bonus validation and Emerald endpoint opt-in support. No compensation is installed by this audit.',
 'Audit Emerald custom assembly and disassembly category reservations/other innate component bonuses before selecting a native combo or consuming recipe. Do not infer extra available slots from the removed ID fields.',
 'Real GUI assembly/disassembly, parent equipped/backpack, duplicate separate component, save/load, banner/XP daily conversions and all five target family prerequisites must pass before278 activation.'
 ]},null,2)+'\n');
console.log('Retained278 assembly/endpoints evidence; no definition or runtime activated.');
