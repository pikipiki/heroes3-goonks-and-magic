import test from'node:test';import fs from'node:fs';import os from'node:os';import path from'node:path';import{execFileSync}from'node:child_process';
test('source DEFEND stores signed/truncated/max1 4DC, remains fixed through later buff changes, tactics/siege zero',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'source-defend-'));try{const cpp=path.join(dir,'x.cpp'),bin=path.join(dir,'x');fs.writeFileSync(cpp,`
#include "EraSourceDefendRule.h"
#include "EraSourceDefendActionFrame.h"
#include <cassert>
#include <limits>
using namespace era_bridge;
int main(){
 int actor=0,other=0;bool nativeDefending=false;
 assert(!sourceDefendBeforeAction(&actor));
 {
  SourceDefendActionScope scope(&actor,nativeDefending);
  nativeDefending=true; // The actual native StartAction transition.
  assert(sourceDefendBeforeAction(&actor)==false);
  assert(!sourceDefendBeforeAction(&other));
  assert(sourceDefend({13,false,false,*sourceDefendBeforeAction(&actor)}).delta==2);
  {SourceDefendActionScope nested(&other,true);assert(sourceDefendBeforeAction(&other)==true);assert(!sourceDefendBeforeAction(&actor));}
  assert(sourceDefendBeforeAction(&actor)==false);
  try{SourceDefendActionScope nested(&other,true);throw 7;}catch(int){}
  assert(sourceDefendBeforeAction(&actor)==false);
  {SourceDefendActionScope disabled(nullptr,false);assert(!sourceDefendBeforeAction(&actor));}
  assert(sourceDefendBeforeAction(&actor)==false);
 }
 assert(!sourceDefendBeforeAction(&actor));
 {SourceDefendActionScope already(&actor,true);assert(!sourceDefend({13,false,false,*sourceDefendBeforeAction(&actor)}).write);}
 for(int x=-25;x<26;++x){auto c=sourceDefend({x,false,false,false});assert(c.write&&c.setDefending&&c.delta==std::max(1,(20*x)/100));}
 auto prayer=sourceDefend({14,false,false,false});assert(prayer.delta==2);int defense=14+prayer.delta;defense-=4;assert(defense==12);assert(10+10/5==12); // still2 after Prayer removed.
 auto threshold=sourceDefend({10,false,false,false});assert(threshold.delta==2);assert(10+2-4==8);assert(6+6/5==7); // distinguish original8 vs dynamic native7.
 assert(sourceDefend({999,true,false,false}).delta==0&&!sourceDefend({999,true,false,false}).setDefending);
 assert(sourceDefend({999,false,true,false}).delta==0);
 assert(!sourceDefend({999,false,false,true}).write);
 assert(!sourceDefendActivationClears(3,3)); // morale/additional selection is not a new source4F0 epoch.
 assert(sourceDefendActivationClears(3,4)); // clear before regen/Fear on first next-round selection.
 assert(sourceDefendActivationClears(-1,0)); // tactics to first regular round.
 assert(sourceDefend({std::numeric_limits<int>::max(),false,false,false}).delta==1); // wrapped20*x=-20.
 assert(sourceDefend({std::numeric_limits<int>::min(),false,false,false}).delta==1);
}
`);execFileSync('c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','-I'+path.resolve('work/vcmi-wasm/lib/era'),cpp,'-o',bin]);execFileSync(bin);}finally{fs.rmSync(dir,{recursive:true,force:true});}});
