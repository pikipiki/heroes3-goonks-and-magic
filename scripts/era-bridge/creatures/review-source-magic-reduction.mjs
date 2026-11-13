/** Local bounded PE evidence; no binary is uploaded or executed. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const [exe='../era-project-eng/h3era.exe',out='outputs/wog-priorities-0.4.147/source-magic-reduction.json']=process.argv.slice(2);
const bytes=fs.readFileSync(exe),sha=crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(sha,'451e208cb2985bca75330f0e3c52f89f9219c0c3701bc6e1f354217890c36181');
const pe=bytes.readUInt32LE(60),base=bytes.readUInt32LE(pe+52),count=bytes.readUInt16LE(pe+6),optional=bytes.readUInt16LE(pe+20);
const read=(address,length)=>{for(let i=0;i<count;i++){const p=pe+24+optional+i*40,va=base+bytes.readUInt32LE(p+12),size=bytes.readUInt32LE(p+16),raw=bytes.readUInt32LE(p+20);if(address>=va&&address+length<=va+size)return bytes.subarray(raw+address-va,raw+address-va+length);}throw Error('Unmapped source bytes');};
assert.equal(read(0x71e8ad,10).toString('hex'),'807de0677402eb60db45');
assert.equal(read(0x71e8d9,3).toString('hex'),'d95dfc');
assert.equal(read(0x71e90e,5).toString('hex'),'e83de60500');
assert.equal(read(0x61e549,15).toString('hex'),'68000003006800000100e8326b0000');
assert.equal(read(0x68f728,4).readUInt32LE(),0x617f44);
const evidence=[[0x701000,24],[0x61a929,5],[0x6193bd,11],[0x68f728,4],[0x617f44,23],[0x61e549,18],[0x5a7c20,45],[0x75d93c,31],[0x71e8ad,118]].map(([address,length])=>({address:'0x'+address.toString(16),length,hex:read(address,length).toString('hex')}));
const result={sourceExeSha256:sha,localOfflineOnly:true,activation:false,evidence,contract:{code:'g',rankValue:'unsigned byte',raw:'arg3 ORIGINALRAW, not corrected44B180 output',precision:'Entry701000 jumps61A884; CRT61A929→6193BD→[68F728]=617F44→61E549 invokes controlFP(value0x10000,mask0x30000): 53-bit precision. g arithmetic then stores F32 at71E8D9.',order:['caster bonuses5A7C26','MR0','innate44B180','g71E766 replacing innate output','MR1','school protections5A7EC0'],truncation:'F32 stored before MSVCftol2 call71E90E; source clamp itself writes ORIGINALRAW back as F32',examples:[{raw:30,g:95,stored:1.5,integer:1,schoolReduction:30,final:0,nativeFormerSchoolFirst:1},{raw:16777219,g:0,integer:16777220,reason:'Defined F32 upward rounding retained'}]},documentedExtensionFix:{condition:'raw outside nonnegative signed Win32 input domain, or F32 result outside signed Win32 return domain',behavior:'Saturate safely to0..INT32_MAX; no undefined/overflowing integer conversion replicated'},requiredNativeControls:['g0 mixed ANY','unregistered Goonk ANY unchanged','g50 Golem innate replacement','actual equipped WardingBanner preserved','g95 before school and Sorcery','g100 zero-damage eligibility','source355 zero-wound Shield before first physical hit']};
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log('Recorded bounded source g%/FPU evidence.');
