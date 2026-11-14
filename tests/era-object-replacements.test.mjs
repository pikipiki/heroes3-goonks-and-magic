import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {sourceScriptOrder,compileSourceReplacementPolicy,productionReplacementObjectResolver} from '../scripts/era-bridge/objects/source-replacements.mjs';

test('source replacement script priority requires an integer followed by a space',()=>{
  assert.deepEqual(sourceScriptOrder(['144_Defunct.erm','143_Frigate.erm','-1000 last.erm','1000 first.erm','001_item.erm']),
    ['1000 first.erm','001_item.erm','143_Frigate.erm','144_Defunct.erm','-1000 last.erm']);
});

test('native source replacement kernel preserves live coordinate cursor, draws and shared handlers under UBSan',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'era-map-replace-'));
  try{
    const cpp=path.join(dir,'test.cpp'),binary=path.join(dir,'test');
    fs.writeFileSync(cpp,`
#include "EraObjectReplacementRule.h"
#include <optional>
#include <map>
#include <cassert>
using namespace era_bridge;
struct Item{ReplacementPosition p;int type;int subtype;};
struct Adapter{
 std::vector<Item> items;int draws=0;int changes=0;int forcedRoll=0;
 int width()const{return 7;}
 std::uint64_t countType(int t)const{std::uint64_t n=0;for(const auto&i:items){if(i.type==t)++n;}return n;}
 std::optional<ReplacementPosition> findNextType(int t,const ReplacementPosition &p)const{
  std::optional<ReplacementPosition> result;
  for(const auto&i:items){if(i.type==t&&replacementPositionBefore(p,i.p)&&(!result||replacementPositionBefore(i.p,*result)))result=i.p;}
  return result;
 }
 bool matches(const ReplacementPosition&p,int t,int s)const{for(const auto&i:items){if(i.p.x==p.x&&i.p.y==p.y&&i.p.z==p.z)return i.type==t&&i.subtype==s;}return false;}
 int randomInt(int a,int b){assert(a==0&&b==99);++draws;return forcedRoll;}
 void replace(const ReplacementPosition&old,const ReplacementPosition&p,const ObjectReplacementPlan &plan){
  for(auto&i:items){if(i.p.x==old.x&&i.p.y==old.y&&i.p.z==old.z){i.p=p;i.type=plan.nativeTargetType;i.subtype=plan.nativeTargetSubtype;++changes;return;}}
  assert(false);
 }
};
int main(){
 ObjectReplacementPlan p;p.enabled=true;p.nativeTargetType=17;p.nativeTargetSubtype=130;
 ObjectReplacementRule r;r.slot=0;r.sourceType=17;r.sourceSubtype=62;r.nativeSourceType=17;r.nativeSourceSubtype=62;r.percentage=50;r.xOffset=1;p.rules.push_back(r);
 Adapter a;a.forcedRoll=49;a.items={{{1,0,0},17,62},{{3,0,0},17,99},{{6,0,0},17,62}};
 auto no=runObjectReplacements(std::vector<ObjectReplacementPlan>{p},a,false,false);assert(no.draws==0&&a.changes==0);
 no=runObjectReplacements(std::vector<ObjectReplacementPlan>{p},a,true,true);assert(no.draws==0&&a.changes==0);
 auto result=runObjectReplacements(std::vector<ObjectReplacementPlan>{p},a,true,false);assert(result.draws==3&&result.replaced==1&&a.draws==3);assert(a.items[0].p.x==2);
 // Coordinate order is independent of instance vector order and crosses z/y.
 Adapter order;order.items={{{1,1,1},17,62},{{5,0,0},17,99},{{2,1,0},17,62}};
 ReplacementPosition start;auto first=order.findNextType(17,start);assert(first&&first->x==5&&first->z==0&&first->y==0);
 // Both CB143 FU handlers advance the shared coordinate cursor per DO call.
 p.functionMultiplicity=2;p.rules[0].xOffset=0;p.rules[0].percentage=100;
 Adapter shared;shared.items={{{1,0,0},17,62},{{3,0,0},17,62},{{5,0,0},17,62}};
 auto twice=runObjectReplacements(std::vector<ObjectReplacementPlan>{p},shared,true,false);
 assert(twice.draws==6&&twice.replaced==3&&shared.draws==6);
 // Earlier slots create candidates visible to later slots. No initial snapshot.
 p.functionMultiplicity=1;p.rules[0].percentage=100;
 ObjectReplacementRule second=p.rules[0];second.slot=1;second.sourceSubtype=130;second.nativeSourceSubtype=130;p.rules.push_back(second);
 Adapter sequential;sequential.items={{{1,0,0},17,62}};
 auto chain=runObjectReplacements(std::vector<ObjectReplacementPlan>{p},sequential,true,false);assert(chain.draws==2&&chain.replaced==2);
 Adapter rejected;rejected.items={{{1,0,0},17,62}};rejected.forcedRoll=50;p.rules.resize(1);p.rules[0].percentage=50;
 assert(runObjectReplacements(std::vector<ObjectReplacementPlan>{p},rejected,true,false).replaced==0);
 p.rules[0].percentage=101;bool threw=false;try{runObjectReplacements(std::vector<ObjectReplacementPlan>{p},rejected,true,false);}catch(const std::invalid_argument&){threw=true;}assert(threw);
}
`);
    execFileSync('c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','-I'+path.resolve('work/vcmi-wasm/lib/era'),cpp,'-o',binary]);
    execFileSync(binary);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

const sourceRoot=path.resolve(process.env.TUM_SOURCE??'../Third-Upgrade-Mod-Full');
test('full102 source generation retains143 collision and refuses incomplete production or private activation',
  {skip:!fs.existsSync(path.join(sourceRoot,'Data/AmeCre.pac'))},()=>{
    const resolveObject=productionReplacementObjectResolver(process.cwd());
    const result=compileSourceReplacementPolicy({sourceRoot,resolveObject});
    assert.equal(result.policy.enabled,false);
    assert.equal(result.policy.plans.length,102);
    assert.equal(result.review.shared143.functionHandlers,2);
    const duplicate=result.policy.plans.filter(p=>p.parameterId==='143');
    assert.equal(duplicate.length,2);
    assert(duplicate.every(p=>p.targetSourceSubtype===130&&p.functionMultiplicity===2&&p.rules[0].sourceSubtype===67));
    const evidence={passed:true,nativeValidated:true,sourceProgramSha256:result.review.sourceProgramSha256,
      engineSha256:'1'.repeat(64),dayOneOnly:true,saveReloadIdempotent:true,shared143NativeValidated:true};
    assert.throws(()=>compileSourceReplacementPolicy({sourceRoot,resolveObject:()=>null,admissionEvidence:evidence}),/Unclosed/);
    const file=result.policy.plans.find(p=>p.parameterId==='173').sourceKey;
    assert.throws(()=>compileSourceReplacementPolicy({sourceRoot,resolveObject,privateSelection:[file],admissionEvidence:evidence}),/private selection/);
    assert.throws(()=>compileSourceReplacementPolicy({sourceRoot,resolveObject,privateSelection:['invented.erm']}),/exact existing/);
  });
