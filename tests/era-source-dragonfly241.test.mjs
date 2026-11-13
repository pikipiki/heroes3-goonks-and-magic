import test from'node:test';import fs from'node:fs';import os from'node:os';import path from'node:path';import{execFileSync}from'node:child_process';
test('source241 direct78 query/duration/side/RNG/order, no c78 selector or implicit actor-alive gate',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'source241-'));try{const cpp=path.join(dir,'x.cpp'),bin=path.join(dir,'x');fs.writeFileSync(cpp,`
#include "EraDragonFly241Rule.h"
#include <cassert>
using namespace era_bridge;
struct Sink{int draws=0,casts=0;std::vector<int> removed;int uniform(int a,int b){assert(a==1&&b==100);++draws;return 100;}void beginDirectCast(int id,int m,int p,int k,int query,int current){assert(id==78&&m==0&&p==3&&k==1&&query==1&&current==0);++casts;}void removePositiveSourceSpell(int id){removed.push_back(id);}void endDirectCast(){}};
int main(){
 assert(!dragonFly241PacketIdentity("goonk",3,"",3).has_value());
 assert(dragonFly241PacketIdentity("eraSource241:remove:v1:banner",3,"banner",3)==true);
 assert(dragonFly241PacketIdentity("eraSource241:remove:v1:banner",3,"goonk",3)==false);
 assert(dragonFly241PacketIdentity("eraSource241:remove:v1:",3,"",0)==false);
 assert(dragonFly241PacketIdentity("eraSource241:remove:v1:",0,"",0)==false);
 DragonFly241Snapshot s;Sink off;assert(!runPrivateDragonFly241(s,off).handled&&off.draws==0);s.privatePermit=true;s.sourceId=241;s.originalActorSide=0;s.actorHypnotized=true;s.currentSide=0;s.sourceDurationsVerified=true;s.targetAlive=true;
 Sink empty;auto a=runPrivateDragonFly241(s,empty);assert(a.handled&&a.queried&&!a.cast&&empty.draws==1);
 s.durations[43]=3;s.durations[45]=9;s.durations[53]=1;Sink yes;auto b=runPrivateDragonFly241(s,yes);assert(b.cast&&b.querySide==1&&b.currentSide==0&&yes.draws==1&&yes.casts==1);assert((yes.removed==std::vector<int>{43,53}));
 s.targetHeroSphere92=true;Sink sphere;assert(!runPrivateDragonFly241(s,sphere).cast&&sphere.draws==1);s.targetHeroSphere92=false;
 s.durations={};s.durations[43]=-1;Sink negative;auto c=runPrivateDragonFly241(s,negative);assert(c.cast&&negative.draws==1&&negative.removed.empty()); // eligibility !=0, removal >0.
 s.targetAlive=false;Sink dead;assert(!runPrivateDragonFly241(s,dead).queried&&dead.draws==0);
 s.targetAlive=true;s.sourceId=105;Sink intrinsic105;assert(!runPrivateDragonFly241(s,intrinsic105).handled&&intrinsic105.draws==0); // no global dragonfly change.
 s.sourceId=241;s.sourceDurationsVerified=false;bool rejected=false;try{Sink bad;runPrivateDragonFly241(s,bad);}catch(const std::invalid_argument &){rejected=true;}assert(rejected);
}
`);execFileSync('c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','-I'+path.resolve('work/vcmi-wasm/lib/era'),cpp,'-o',bin]);execFileSync(bin);}finally{fs.rmSync(dir,{recursive:true,force:true});}});
