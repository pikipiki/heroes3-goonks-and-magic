#include "../../work/vcmi-wasm/lib/era/EraCampaignRemovalBatch.h"
#include <cassert>
#include <string>
int main(int argc,char ** argv)
{
 using era_campaign_removal::guaranteedClear;
 if(argc>1)
 {
  std::vector<std::uint32_t> coverage;
  for(int i=2;i<argc;++i)coverage.push_back(std::stoul(argv[i]));
  return guaranteedClear(coverage,std::stoul(argv[1]))?0:2;
 }
 assert(guaranteedClear({},0));
 assert(!guaranteedClear({},1));
 assert(guaranteedClear({1},1));
 assert(!guaranteedClear({3},2));
 assert(guaranteedClear({3,3},2));
 // One permitted first choice leaves an object outside the second tile.
 assert(!guaranteedClear({3,1},2));
 assert(guaranteedClear({3,2,1},2));
 assert(!guaranteedClear({1,1,1},2));
 assert(guaranteedClear({0,3,0,3},2));
 assert(!guaranteedClear({4},2));
 assert(!guaranteedClear({1},17));
 assert(!guaranteedClear(std::vector<std::uint32_t>(65,1),1));
}
