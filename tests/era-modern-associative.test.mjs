import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {compileErm,parseOperand,parseServiceOperand,tokenizeErm} from '../scripts/era-bridge/campaigns/parser.mjs';

test('modern associative operands retain exact names and separate typed spaces',()=>{
 for(const [raw,space,name,access] of [['i^ACM_level^','i','ACM_level','read'],['?s^Text^','s','Text','write'],['di^hero_%V1^','i','hero_%V1','relative']]){
  const p=parseOperand(raw);assert.equal(p.kind,'named');assert.equal(p.space,space);assert.equal(p.name,name);assert.equal(p.access,access);
 }
 assert.equal(parseOperand('vi^index^').index.kind,'named');
 const punctuated=compileErm('!?TM1;!!VRi^a&b=x|y/z^&i^a&b=x|y/z^>0:S1;').blocks[0].commands[0];
 assert.equal(punctuated.selectors[0].name,'a&b=x|y/z');assert.equal(punctuated.conditions[0].any[0].left.name,'a&b=x|y/z');
 assert.throws(()=>parseOperand('-s^text^'),/negate/);
 assert.notEqual(parseOperand('i^same^').name,parseOperand('i^Same^').name);
 const program=compileErm('!#SN:W^Adept_Level_Global_Value^/10;!?TM1;!!VRi^level^:Si^Adept_Level_Global_Value^;!!VRs^Text^:S^Hello^;!!SN:W^Text^/?s^copy^;!!SN:W;');
 assert.equal(program.blocks[0].commands[0].operations[0].args[0].kind,'named');
 assert.equal(program.blocks[0].commands[2].operations[0].args[1].name,'copy');
 assert.deepEqual(program.blocks[0].commands[3].operations[0].args,[]);
 assert.throws(()=>compileErm('!#SN:E0;'),/Unbound receiver SN/);
 assert.throws(()=>compileErm('!#SN:W^supported^/1 E0;'),/Unbound receiver SN/);
 assert.throws(()=>compileErm('!#SN:T^unbound^/?z1;'),/Unbound receiver SN/);
});
test('SN service modifiers are represented without becoming numeric aliases',()=>{
 for(const [raw,modifier] of [['d','+'],['d*4','*'],['d-4','-'],['d|3','|'],['d<<100','<<'],['d>>-1','>>'],['d&^ suffix^','&'],['di^count^','+']]){
  const operand=parseServiceOperand(raw);assert.equal(operand.access,'relative');assert.equal(operand.modifier,modifier);
  assert.deepEqual(compileErm(`!#SN:W^key^/${raw};`).initializers[0].operations[0].args[1],operand);
 }
 assert.throws(()=>parseServiceOperand('d*?v1'),/modifier/);
});
const ac='work/era-gameplay-reference/Mods/Advanced Classes Mod/Data/s/advanced classes skills.erm';
test('original AC class thresholds compile unchanged through SN associative memory',{skip:fs.existsSync(ac)?false:'Local official ERA reference not installed'},()=>{
 const source=fs.readFileSync(ac),tokens=tokenizeErm(source,{encoding:'windows-1252'});
 const thresholds=tokens.filter(t=>/^!#SN:W\^(Adept|Expert|Master|Grandmaster)_Level_Global_Value\^\//.test(t.statement));
 assert.equal(thresholds.length,4);
 const compiled=compileErm(thresholds.map(t=>t.statement).join('\n'));
 assert.deepEqual(compiled.initializers.map(c=>c.operations[0].args[1].number),[10,20,35,58]);
});
test('native VM runs named variables and full SN:W int/string mutations',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-era-associative-'));
 try{
  const binary=path.join(dir,'test');
  execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=address,undefined','tests/native/EraCampaignAssociative.test.cpp','-o',binary],{timeout:60000});
  execFileSync(binary,{timeout:30000});
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
const root=path.resolve('work/vcmi-wasm');
const boost=process.env.GOONK_BOOST_INCLUDE||'/usr/include';
const codecAvailable=process.platform==='linux'&&fs.existsSync(path.join(boost,'boost/version.hpp'));
test('production JSON persists independent named fields and resumes without replay',{skip:codecAvailable?false:'Requires Linux compiler and Boost headers; exercised alongside WebAssembly build'},()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-associative-codec-'));
 try{
  const binary=path.join(dir,'test'),includes=[root,path.join(root,'lib'),path.join(root,'include'),boost];
  if(fs.existsSync(path.join(boost,'libs')))for(const entry of fs.readdirSync(path.join(boost,'libs'))){const inc=path.join(boost,'libs',entry,'include');if(fs.existsSync(inc))includes.push(inc);}
  execFileSync(process.env.CXX||'c++',['-std=c++17','-O0','-g','-ffunction-sections','-fdata-sections','-fsanitize=address,undefined',...includes.map(inc=>'-I'+inc),'tests/native/EraCampaignAssociativeCodec.test.cpp',path.join(root,'lib/json/JsonNode.cpp'),path.join(root,'lib/era/EraCampaignRuntime.cpp'),'-Wl,--gc-sections','-o',binary],{timeout:180000});
  execFileSync(binary,{timeout:30000});
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
