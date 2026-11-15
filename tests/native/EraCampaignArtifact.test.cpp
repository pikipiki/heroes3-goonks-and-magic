#include "../../work/vcmi-wasm/lib/era/EraCampaignArtifactRule.h"
#include <cassert>
#include <limits>
int main()
{
 using namespace era_campaign_artifact;
 assert(decode(0)->artifact==0&&encode(0)==1000);
 assert(decode(1000)->artifact==0);
 assert(decode(8)->artifact==8&&encode(8)==8);
 assert(decode(1015)->artifact==1&&decode(1015)->spell==14);
 assert(encode(1,14)==1015);
 assert(decode(1081)->spell==80);
 for(int n:{-1,144,999,1082,std::numeric_limits<int>::max()})assert(!decode(n));
}
