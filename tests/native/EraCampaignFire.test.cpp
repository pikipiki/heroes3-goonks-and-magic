#include "../../work/vcmi-wasm/lib/era/EraCampaignFire.h"
#include <cassert>
#include <vector>
int main()
{
 using namespace era_campaign_fire;
 Tree near;near.object=1;near.x=46;near.y=65;
 Tree far=near;far.object=2;far.x=45;
 Tree below=near;below.object=3;below.z=1;
 std::vector<Tree> trees={near,far,below};
 provoke(trees,47,62,0,5,3);
 assert(trees[0].mode==2&&trees[1].mode==0&&trees[2].mode==0);
 // The pinned executable schedules the delay of the *next* phase, including
 // the early transition out of its nominal maximum-fire phase. Preserve it.
 const std::vector<int> phases={1,1,2,3,3,4,4,5};
 for(int phase:phases)
 {
  auto loaded=trees;
  assert(advance(trees)==advance(loaded));
  assert(trees[0].phase==phase&&loaded[0].time==trees[0].time);
  assert(trees[1].phase==0&&trees[2].phase==0);
 }
 assert(trees[0].mode==0&&trees[0].time==1);
 // A saved active maximum-fire phase whose timer reached its infection
 // threshold infects touching idle objects before the transition scan.
 trees[0].phase=2;trees[0].mode=2;trees[0].time=2;trees[0].delay=9;
 advance(trees);assert(trees[1].phase==1&&trees[1].mode==2&&trees[2].mode==0);
 // Repeated ruined-town scans do not reset an active animation.
 const int time=trees[0].time;provoke(trees,47,62,0,5,3);assert(trees[0].time==time);
}
