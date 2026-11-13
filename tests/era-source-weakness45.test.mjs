import test from'node:test';import fs from'node:fs';import os from'node:os';import path from'node:path';import{execFileSync}from'node:child_process';
test('source45 exact clamp, refresh, positive expiry, zero/negative debt, Bloodlust separation and Win32 arithmetic',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'weakness45-'));try{const cpp=path.join(dir,'x.cpp'),bin=path.join(dir,'x');fs.writeFileSync(cpp,`
#include "EraWeakness45Rule.h"
#include "EraSourceCreatureSpellPower.h"
#include <cassert>
#include <limits>
using namespace era_bridge;
int main(){
 const std::string_view tag="eraSourceWeakness45:state:v1";
 assert(!weakness45RemovalIdentity("goonk",{},0,"banner",{},0).has_value());
 assert(weakness45RemovalIdentity(tag,{1,2},0,tag,{1,2},0)==true);
 assert(weakness45RemovalIdentity(tag,{1,2},0,tag,{1,3},0)==false);
 assert(weakness45RemovalIdentity(tag,{1,2},0,tag,{1,2},1)==false);
 assert(weakness45RemovalIdentity(tag,{},0,"goonk",{},0)==false);
 assert(weakness45RemovalIdentity("goonk",{},0,tag,{},0)==false);
 assert(weakness45RemovalIdentity(tag,{},0,"eraSourceWeakness45:loss:v1",{},0)==false);
 assert(weakness45XpMagnitude('J',60)==6&&weakness45XpMagnitude('J',261)==6&&weakness45XpMagnitude('k',241)==3);
 const int rawC8=1,frenzyDefense=30,bloodlustOnlyMelee=6,precisionOnlyRanged=3;
 assert(rawC8+frenzyDefense+bloodlustOnlyMelee==37&&rawC8+precisionOnlyRanged==4);
 auto frenzied=weakness45Apply({},rawC8,4,2,6);assert(frenzied.attackDelta==-1&&frenzied.state.magnitude==1);
 assert(rawC8+frenzied.attackDelta==0); // removingFrenzy must not expose hidden -2/-5 debt.
 auto prayerC8=weakness45Apply({},rawC8+4,4,2,6);assert(prayerC8.attackDelta==-5); // Prayer changes storedC8, unlike Bloodlust/Precision/Frenzy.
 assert(weakness45AttackAfterLoss(rawC8,prayerC8.state)==-4); // Prayer removed while45 active: signed sourceC8, no native min0.
 auto percent=weakness45Apply({},15,3,2,6);assert(percent.attackDelta==-6);
 assert(weakness45AttackAfterLoss(15,percent.state)==9);assert((10-6)*150/100==6); // loss must NOT be multiplied by GoonkATK%.
 assert(weakness45AttackAfterLoss(24,percent.state)==18); // Native-melee Bloodlust scaling remains native, loss applied once.
 auto prayerZero=weakness45Apply({},5,0,2,6);assert(prayerZero.state.permanentLoss==5);
 int afterPrayer=weakness45AttackAfterLoss(1,prayerZero.state);assert(afterPrayer==-4);
 auto signedRecast=weakness45Apply(prayerZero.state,afterPrayer,0,1,3);assert(signedRecast.state.magnitude==-4&&signedRecast.attackDelta==4&&signedRecast.state.permanentLoss==1);assert(weakness45AttackAfterLoss(1,signedRecast.state)==0);
 auto signedPositive=weakness45Apply(prayerZero.state,-4,3,2,6);assert(signedPositive.state.magnitude==-4&&signedPositive.state.totalLoss()==1);assert(weakness45AttackAfterLoss(1,signedPositive.state)==0);auto signedExpiry=weakness45Remove(signedPositive.state);assert(signedExpiry.attackDelta==-4&&weakness45AttackAfterLoss(1,signedExpiry.state)==-4);
 auto negativeRefresh=weakness45Apply(prayerC8.state,-4,9,2,6);assert(negativeRefresh.attackDelta==0&&negativeRefresh.state.magnitude==5); // existingpositive returns before signed re-clamp.
 auto low=weakness45Apply({},3,4,2,6);assert(low.attackDelta==-3&&low.state.magnitude==3&&low.state.totalLoss()==3);int attack=3+low.attackDelta;assert(attack==0);assert(attack+6==6); // Bloodlust6 stays separate, no hidden -6 debt.
 auto refresh=weakness45Apply(low.state,0,9,3,6);assert(refresh.attackDelta==0&&refresh.state.duration==9&&refresh.state.mastery==3&&refresh.state.magnitude==3);auto shorter=weakness45Apply(refresh.state,0,0,1,3);assert(shorter.state.duration==9&&shorter.state.magnitude==3&&shorter.attackDelta==0);
 auto done=weakness45Remove(refresh.state);assert(done.attackDelta==3&&done.state.duration==0&&done.state.totalLoss()==0);
 auto basic=weakness45Apply({},20,2,1,3);auto stronger=weakness45Apply(basic.state,17,3,2,6);assert(stronger.attackDelta==0&&stronger.state.magnitude==3&&stronger.state.mastery==2);auto tick=weakness45Round(stronger.state,true,false);assert(tick.state.duration==2&&tick.attackDelta==0);tick=weakness45Round(tick.state,true,false);assert(tick.state.duration==1);tick=weakness45Round(tick.state,true,false);assert(tick.removed&&tick.attackDelta==3);
 auto frozen=weakness45Round(stronger.state,false,false);assert(frozen.state.duration==3);auto tactics=weakness45Round(stronger.state,true,true);assert(tactics.state.duration==3);
 const int source352power=SourceCreatureSpellPower::forSource(352).apply(7);assert(source352power==0);
 auto zero=weakness45Apply({},20,source352power,2,6);assert(zero.attackDelta==-6&&zero.state.totalLoss()==6&&!zero.state.durationScanVisible());for(int i=0;i<100;++i)zero=weakness45Round(zero.state,true,false);assert(zero.state.totalLoss()==6&&!weakness45Remove(zero.state).removed);
 auto zero2=weakness45Apply(zero.state,14,0,2,6);assert(zero2.attackDelta==-6&&zero2.state.totalLoss()==12&&zero2.state.unremovableApplications==2);auto positive=weakness45Apply(zero2.state,8,2,2,6);assert(positive.attackDelta==-6&&positive.state.totalLoss()==18&&positive.state.sourceApplicationCount()==3);auto removal=weakness45Remove(positive.state);assert(removal.attackDelta==6&&removal.state.totalLoss()==12&&removal.state.sourceApplicationCount()==2); // old zero debt survives cure/dispel/expiry.
 auto negative=weakness45Apply({},20,-7,1,3);assert(negative.state.durationScanVisible()&&!negative.state.removalAllowed()&&negative.state.totalLoss()==3);assert(weakness45Round(negative.state,true,false).state.duration==-7);
 auto signedAttack=weakness45Apply({},-2,3,2,6);assert(signedAttack.attackDelta==2&&signedAttack.state.magnitude==-2);assert(weakness45Add(-2,signedAttack.attackDelta)==0);
 assert(weakness45Add(std::numeric_limits<std::int32_t>::max(),1)==std::numeric_limits<std::int32_t>::min());assert(weakness45Negate(std::numeric_limits<std::int32_t>::min())==std::numeric_limits<std::int32_t>::min());
}
`);execFileSync('c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined','-I'+path.resolve('work/vcmi-wasm/lib/era'),'-I'+path.resolve('work/vcmi-wasm/lib/era'),cpp,'-o',bin]);execFileSync(bin);}finally{fs.rmSync(dir,{recursive:true,force:true});}});
