#include "../../work/vcmi-wasm/lib/era/EraCampaignChestRule.h"
#include "../../work/vcmi-wasm/lib/era/EraCampaignProgram.h"
#include <cassert>
#include <cstdint>
using namespace era_campaign_chest;
int main(){
 era_campaign::Operand keep;assert(era_campaign::unchangedOperand(keep));keep.kind=era_campaign::Kind::Fast;keep.name="d";assert(era_campaign::unchangedOperand(keep));keep.name="f";assert(!era_campaign::unchangedOperand(keep));keep.name="d";keep.negate=true;assert(!era_campaign::unchangedOperand(keep));
 assert(mode(3)==1&&mode(-2)==0);assert(artifact(-1)==1023);assert(bonus(16)==0&&bonus(-1)==15);
 assert(gold(3)==1500&&experience(3)==1000);assert(gold(1)==500&&experience(1)==0);
 assert(gold(16)==0&&experience(16)==-500);
 const auto debt=addExperience(0,-500);assert(debt==UINT32_C(4294966796));assert(signedWord(debt)==-500);
 assert(signedWord(addExperience(debt,200))==-300);assert(addExperience(debt,1000)==500);
 assert(signedWord(UINT32_C(2147483648))==INT32_MIN);assert(signedWord(UINT64_C(4294967296))==0);
 assert(addExperience(UINT32_MAX,1)==0);assert(signedWord(addExperience(0,-575))==-575);
 for(int n=0;n<16;++n){assert(bonus(n+16)==n);assert(gold(n)==500*n);assert(experience(n)==500*n-500);}
}
