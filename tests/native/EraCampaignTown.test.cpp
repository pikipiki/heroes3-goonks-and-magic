#include "../../work/vcmi-wasm/lib/era/EraCampaignTownRule.h"
#include "../../work/vcmi-wasm/lib/era/EraCampaignCreatureCarryRule.h"
#include <array>
#include <cassert>
int main(){
 using namespace era_campaign_town;
 // Source campaign artifact bitmap80ffff... begins immediately after the five creature words.
 for(int source=0;source<=362;++source){const auto index=era_campaign_creature_carry::artifactMaskIndex(source);assert(index.has_value()==(source>=160&&source<197));if(index)assert(*index==source-160);}
 assert(*era_campaign_creature_carry::artifactMaskIndex(168)==8);
 assert(*era_campaign_creature_carry::artifactMaskIndex(172)==12);

 // Original PE table at0x78a194:44 pairs of one building mask byte and its byte index.
 constexpr std::array<int,44> original={{-1,0,1,2,3,-1,-1,-1,7,8,-1,10,11,12,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,30,31,32,33,34,35,36}};
 for(int i=0;i<44;++i)assert(lowerBuilding(i)==original[i]);
 assert(recruitWord(-1)==65535&&recruitQuery(65535)==-1);
 assert(recruitWord(65536)==0&&recruitQuery(65536)==0);
 assert(recruitQuery(32767)==32767&&recruitQuery(32768)==-32768);
 assert(recruitWord(recruitQuery(65535)+2)==1);
}
