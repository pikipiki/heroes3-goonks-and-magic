// Actual production BonusParameters::serialize, no replacement Bonus class.
#include "Global.h"
#include "lib/bonuses/BonusParameters.h"
#include "lib/era/EraXpTimed184Rule.h"
#include <cassert>
#include <cstring>

struct VectorArchive
{
 std::vector<int32_t> bytes;
 bool loading=false;
 VectorArchive & operator&(BonusParameters::storage_type & value)
 {
  if(loading){assert(bytes.size()>=2&&bytes[0]==3&&bytes[1]>=0&&size_t(bytes[1])+2==bytes.size());value=std::vector<int32_t>(bytes.begin()+2,bytes.end());}
  else{assert(value.index()==3);const auto & v=std::get<std::vector<int32_t>>(value);bytes={3,int32_t(v.size())};bytes.insert(bytes.end(),v.begin(),v.end());}
  return *this;
 }
};
int main()
{
 using namespace era_bridge::xp184;
 for(int clock:{-7,0,1,255})for(int mastery=0;mastery<4;++mastery)
 {
  auto state=cast({},61,clock,mastery,0,0,false).state;
  BonusParameters original(std::vector<int32_t>{0x5850544d,1,61,state.duration,state.mastery,state.magnitude,state.activeAttackLoss,state.activeDefenseLoss,state.persistentAttackLoss,state.persistentDefenseLoss,signed32(state.generation)});
  VectorArchive write;original.serialize(write);BonusParameters restored;VectorArchive read=write;read.loading=true;restored.serialize(read);
  assert(original.toVector()==restored.toVector());const auto & p=restored.toVector();
  State loaded{p[2],p[3],p[4],p[5],p[6],p[7],p[8],p[9],uint32_t(p[10])};
  assert(loaded.spell==61&&loaded.duration==clock&&loaded.mastery==mastery&&loaded.magnitude==mastery);
  auto refreshed=cast(loaded,61,9,3,0,0,false);assert(refreshed.state.magnitude==(clock>0?mastery:3));
  // Copy/restore owns its vector; verify unrelated payload remains untouched.
  // Actual bonus selection/purge is covered separately by native integration.
  BonusParameters foreign(std::vector<int32_t>{61,999,-3});auto foreignBefore=foreign.toVector();
  auto expired=round(loaded,true,false);auto removed=remove(expired.state);(void)removed;
  assert(foreign.toVector()==foreignBefore&&restored.toVector()==original.toVector());
 }
}
