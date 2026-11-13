/** Bounded source evidence for the g%/FireShield compatibility obligation. */
import fs from'node:fs';
import crypto from'node:crypto';
import assert from'node:assert/strict';
const source=process.argv[2]||'../era-project-eng/h3era.exe';
const output=process.argv[3]||'outputs/wog-priorities-0.4.147/source-g-fire-shield.json';
const bytes=fs.readFileSync(source),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(sha(bytes),'451e208cb2985bca75330f0e3c52f89f9219c0c3701bc6e1f354217890c36181');
const pe=bytes.readUInt32LE(60),opt=pe+24,sections=opt+bytes.readUInt16LE(pe+20),base=bytes.readUInt32LE(opt+28);
function at(address,length){for(let i=0;i<bytes.readUInt16LE(pe+6);i++){const s=sections+i*40,va=base+bytes.readUInt32LE(s+12),size=bytes.readUInt32LE(s+16);if(address>=va&&address+length<=va+size)return bytes.subarray(bytes.readUInt32LE(s+20)+address-va,bytes.readUInt32LE(s+20)+address-va+length);}throw Error('Unmapped source evidence');}
function call(address,target){const b=at(address,5);assert.equal(b[0],0xe8);assert.equal(address+5+b.readInt32LE(1),target);return{address:'0x'+address.toString(16),target:'0x'+target.toString(16),bytes:b.toString('hex')};}
assert.equal(at(0x441996,10).toString('hex'),'8b45e885c07e08508bce');
assert.equal(at(0x44084f,9).toString('hex'),'8b75088b5dec568bcb');
const calls=[call(0x441991,0x4408e0),call(0x4419a0,0x4406e0),call(0x440858,0x443db0)];
const backlog=JSON.parse(fs.readFileSync('outputs/wog-priorities-0.4.147/source-combat-gap-backlog.json'));
const obligation=backlog.obligations.find(o=>o.id==='source-g-percent-fire-shield-direct');
const report={schemaVersion:1,complete:false,sourceExecutableSHA256:sha(bytes),scope:'Only the15 explicitly typed source g% actors. Unregistered VCMI/Goonk targets retain native FireShield adjustment.',calls,flow:'441991 finishes the physical attack;441996 loads cached reflection amount from EBP-18, passes it to4406E0;44084F reloads its original argument and440858 passes it directly to443DB0 physical damage. No normal spell correction is introduced on this path.',boundedEvidence:[[0x441982,0x23],[0x4406e0,0x17d],[0x443db0,0x60]].map(([address,length])=>({address:'0x'+address.toString(16),length,sha256:sha(at(address,length))})),actors:obligation.registeredGPercentActors,proposedNativeGuard:'Existing sourceMagicReduction(unit).has_value() identifies compiler-owned g% metadata including rank-zero g0; ordinary ANY equipment does not opt in.',requiredNativeControls:['R0g0 and R0g50 reflect floor(actual physical damage*20/100) against real FireShield20 despite shield-owner Sorcery15%; retain actual native-terrain stat adjustments.','Real earnedR10g95 also reflects that same raw formula.','Source g% with independent ANY30 equipment still reflects the raw amount.','Unregistered Goonk retains Sorcery15% correction, followed by ordinary ANY30 equipment when worn; calculate from observed physical input.'],limitations:['This is local primary binary/source evidence, not execution of Windows ERA.','No source activation or engine fix is made by this review.','Native controls and preserved physical wrappers remain required.']};
fs.mkdirSync(output.slice(0,output.lastIndexOf('/')),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log('Verified bounded source FireShield flow and15 explicit actor obligations.');
