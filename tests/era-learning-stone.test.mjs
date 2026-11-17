import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
const fixture=JSON.parse(fs.readFileSync('tests/fixtures/era-gameplay/era-native-learning-reference.json','utf8'));
test('ERA779 learning power matches120 original executable ABI outputs',()=>{
 assert.equal(fixture.vectors.length,120);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-learning-stone-'));
 try{
  const source=path.join(dir,'test.cpp'),binary=path.join(dir,'test');
  const cases=fixture.vectors.map(v=>`{${v.level},${v.learning},${v.specialist?'true':'false'},${v.powerBits}u}`).join(',\n');
  fs.writeFileSync(source,`#include "${path.resolve('work/vcmi-wasm/lib/era/EraLearningStoneRule.h')}"
#include <cassert>
#include <cstring>
struct Case{int level,skill;bool specialist;std::uint32_t bits;};
int main(){
 const Case cases[]={${cases}};
 for(const auto & item:cases){const auto value=era_compat::learning_stone::learningPower(item.level,item.skill,item.specialist);std::uint32_t bits;std::memcpy(&bits,&value,4);assert(bits==item.bits);}
 using namespace era_compat::learning_stone;
 assert(experience(1,learningPower(1,0,false))==1000);
 assert(experience(2,learningPower(2,1,false))==1155);
 assert(experience(2,learningPower(2,2,false))==1210);
 assert(experience(2,learningPower(2,3,false))==1265);
 assert(experience(1,learningPower(1,1,true))==1052);
 assert(experience(10,learningPower(10,3,true))==2327);
 bool threw=false;try{learningPower(1,4,false);}catch(const std::runtime_error&){threw=true;}assert(threw);
}
`);
  execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=address,undefined',source,'-o',binary],{timeout:60000});
  execFileSync(binary,{timeout:30000});
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
const root=path.resolve('work/vcmi-wasm'),boost=process.env.GOONK_BOOST_INCLUDE||'/usr/include';
const available=process.platform==='linux'&&fs.existsSync(path.join(boost,'boost/version.hpp'));
test('frozen ERA rules preserve existing choices and keep missing old-save rules disabled',{skip:available?false:'Requires Linux native compiler and Boost/TBB headers; also executed in engine build container'},()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-script-rules-'));
 try{
  const binary=path.join(dir,'test');
  execFileSync(process.env.CXX||'c++',['-std=c++17','-O0','-g','-ffunction-sections','-fdata-sections','-fsanitize=address,undefined','-I'+root,'-I'+path.join(root,'lib'),'-I'+path.join(root,'include'),'-I'+boost,'-I'+(process.env.GOONK_TBB_INCLUDE||'/usr/include'),'tests/native/EraScriptRules.test.cpp',path.join(root,'lib/json/JsonNode.cpp'),'-Wl,--gc-sections','-o',binary],{timeout:180000});
  execFileSync(binary,{timeout:30000});
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
