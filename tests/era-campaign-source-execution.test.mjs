import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {compileNativeCampaign} from '../scripts/era-bridge/campaigns/native-compiler.mjs';
import {compileCaveFile} from '../scripts/era-bridge/campaigns/importer.mjs';

// Build ephemeral native fixtures from the actual pinned AST, without a second
// JavaScript implementation of the interpreter or generated files in releases.
const quote = value => JSON.stringify(value);
function operand(o) {
 const kind = {default:'Default',number:'Number',string:'String',macro:'Macro',day:'Day',variable:'Variable',fast:'Fast'}[o.kind];
 const access = {read:'Read',write:'Write',compare:'Compare',relative:'Relative'}[o.access];
 assert(kind && access);
 return `[]{Operand o;o.kind=Kind::${kind};o.access=Access::${access};${
  ['number','offset'].filter(k=>o[k]!==undefined).map(k=>`o.${k}=${o[k]};`).join('')}${
  ['name','text','comparison'].filter(k=>o[k]!==undefined).map(k=>`o.${k}=${quote(o[k])};`).join('')}${
  o.space?`o.space='${o.space}';`:''}${o.negate?'o.negate=true;':''}${
  o.index?`o.index=std::make_shared<Operand>(${operand(o.index)});`:''}return o;}()`;
}
const operands = values => `{${values.map(operand).join(',')}}`;
function conditions(groups) {
 return `{${groups.map(group=>`{${group.any.map(p=>p.flag!==undefined?
  `[]{Predicate p;p.isFlag=true;p.flag=${p.flag};p.expected=${p.expected};return p;}()`:
  `[]{Predicate p;p.left=${operand(p.left)};p.right=${operand(p.right)};p.comparison=${quote(p.comparison)};return p;}()`
 ).join(',')}}`).join(',')}}`;
}
function command(c) {
 return `[]{Command c;c.receiver=${quote(c.receiver)};c.selectors=${operands(c.selectors)};c.conditions=${conditions(c.conditions)};c.operations={${
  c.operations.map(o=>`{${quote(o.code)},${operands(o.args)}}`).join(',')}};return c;}()`;
}
function block(b) {
 return `[]{Trigger b;b.receiver=${quote(b.receiver)};b.selectors=${operands(b.selectors)};b.conditions=${conditions(b.conditions)};b.commands={${b.commands.map(command).join(',')}};return b;}()`;
}

test('native VM executes original campaign creature-selection and Cave flag instructions', () => {
 const scenario = compileNativeCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc4.vcmp').scenarios.find(s=>s.member==='wog_camp4a.vmap');
 const selection = scenario.program.blocks.find(b=>b.receiver==='FU'&&b.selectors[0]?.number===844);
 assert.equal(selection.source.sha256,'484a430f9b7c60cf90b288565fe655055fbf7dd2b0bc5d98814f3b1c639e0af4');
 const witch = compileCaveFile().blocks.find(b=>b.receiver==='LE'&&b.selectors.map(o=>o.number).join('/')==='28/16/0');
 assert.equal(witch.commands[0].operations[0].code,'R');
 assert.equal(witch.commands[1].operations[0].code,'M');
 const prefix = {...witch,commands:witch.commands.slice(0,2)};
 const source = `#include ${quote(path.resolve('work/vcmi-wasm/lib/era/EraCampaignExecutor.h'))}
#include <cassert>
using namespace era_campaign;
struct HostProbe:Host {
 int shown=0;
 Step execute(const Command&c,const Operation&o,State&,const Context&)override {assert(c.receiver=="IF"&&o.code=="M");++shown;return Step::Suspend;}
 int32_t random(int32_t,bool)override {throw std::runtime_error("Unexpected random operation");}
};
int main(){
 Context context;HostProbe host;Program p;p.sha256=${quote(scenario.program.sha256)};p.blocks={${block(selection)}};
 for(int input=-1;input<=150;++input){
  State state;state.frames[0].x[1]=input;Executor vm(p,state,context,host);vm.dispatch("FU",{844});assert(vm.run());
  int expected=input+1;
  switch(expected){case 113:expected=127;break;case 114:expected=125;break;case 115:expected=129;break;case 116:expected=123;break;}
  if(expected>111&&expected!=123&&expected!=125&&expected!=127&&expected!=129&&expected!=119&&expected!=121&&expected!=131)expected=-1;
  if(expected<111&&(expected&1)==0)expected=-1;
  assert(state.v[609]==expected);
 }
 Program cave;cave.sha256="original-cave-witch-prefix";cave.blocks={${block(prefix)}};
 State state;for(int n=1;n<=11;++n)state.flags[n]=true;
 Executor vm(cave,state,context,host);vm.dispatch("LE",{28,16,0});assert(!vm.run());assert(host.shown==1);
 for(int n=1;n<=11;++n)assert(state.flags[n]==(n==9||n==11));
}`;
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-source-campaign-'));
 try {
  const cpp=path.join(dir,'test.cpp'),binary=path.join(dir,'test');fs.writeFileSync(cpp,source);
  execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=address,undefined',cpp,'-o',binary]);
  execFileSync(binary);
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});

test('all eleven original campaign answer predicates compare text contents and case',()=>{
 const cases=[];
 for(let id=1;id<=4;id++)for(const scenario of compileNativeCampaign(`mod/wake-of-gods/Mods/maps/content/maps/zc${id}.vcmp`).scenarios){
  const commands=[...scenario.program.initializers,...scenario.program.blocks.flatMap(b=>b.commands)];
  for(const entry of [...scenario.program.blocks,...commands])for(const group of entry.conditions||[])for(const predicate of group.any){
   if(predicate.right?.space!=='z'&&predicate.left?.space!=='z')continue;
   const alias=predicate.left.kind==='macro'?commands.find(c=>c.receiver==='MC'&&c.operations.some(o=>o.code==='S'&&o.args[0]?.name===predicate.left.name)):null;
   if(predicate.left.kind==='macro')assert(alias,'Original macro binding exists');
   const left=alias?.selectors[0]||predicate.left,right=predicate.right;
   assert.equal(left.space,'z');assert.equal(right.space,'z');
   const expected=commands.find(c=>c.receiver==='VR'&&c.selectors[0]?.space==='z'&&c.selectors[0].index?.number===right.index.number&&c.operations[0]?.code==='S'&&c.operations[0].args[0]?.kind==='string')?.operations[0].args[0].text||'Diplomacy';
   const choice=cmdForPredicate(predicate,cases.length);
   cases.push({choice,left,right,alias:predicate.left.kind==='macro'?{name:predicate.left.name,operand:left}:null,expected,equal:predicate.comparison==='='});
  }
 }
 function cmdForPredicate(predicate,index){return{receiver:'VR',selectors:[{kind:'variable',access:'read',space:'v',index:{kind:'number',access:'read',number:9990}}],conditions:[{any:[predicate]}],operations:[{code:'+',args:[{kind:'number',access:'read',number:1}]}]};}
 assert.equal(cases.length,11);
 const source=`#include ${quote(path.resolve('work/vcmi-wasm/lib/era/EraCampaignExecutor.h'))}
#include <cassert>
#include <cctype>
using namespace era_campaign;
struct NoHost:Host{Step execute(const Command&,const Operation&,State&,const Context&)override{throw std::runtime_error("Unexpected host call");}int32_t random(int32_t,bool)override{return 0;}};
int main(){Context context;NoHost host;
${cases.map((c,i)=>`{
 Program p;p.sha256="original-text-predicate-${i}";p.blocks={${block({receiver:'LE',selectors:[],conditions:[],commands:[c.choice]})}};
 State s;${c.alias?`s.macros[${quote(c.alias.name)}]=${operand(c.alias.operand)};`:''}
 s.z[${c.right.index.number}]=${quote(c.expected)};s.z[${c.left.index.number}]=${quote(c.expected.toUpperCase())};
 Executor vm(p,s,context,host);vm.dispatch("LE");assert(vm.run()&&s.v[9990]==${c.equal?1:0});
 s.v[9990]=0;s.z[${c.left.index.number}]="A different answer";vm.dispatch("LE");assert(vm.run()&&s.v[9990]==${c.equal?0:1});
}`).join('\n')}
}`;
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-campaign-answers-'));
 try{const cpp=path.join(dir,'test.cpp'),binary=path.join(dir,'test');fs.writeFileSync(cpp,source);execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=address,undefined',cpp,'-o',binary]);execFileSync(binary);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
