#include "../../work/vcmi-wasm/lib/era/EraCampaignTerrainRule.h"
#include "../../work/vcmi-wasm/lib/serializer/ESerializationVersion.h"
#include <cassert>
static_assert(static_cast<int>(ESerializationVersion::GOONK_CAMPAIGN_TERRAIN)==static_cast<int>(ESerializationVersion::GOONK_CAMPAIGN_CARRYOVER)+1);
int main()
{
 using namespace era_campaign_terrain;
 std::vector<int> active{3,1},hidden;
 hide(active,hidden);assert(active.empty()&&hidden==std::vector<int>({3,1}));
 hide(active,hidden);assert(hidden==std::vector<int>({3,1}));
 // A new native hero occupies the scripted cell after the old scenery mask
 // was hidden. Restoring scenery keeps the newer hero at the top.
 active={9};restore(active,hidden,[](int){return true;});
 assert(active==std::vector<int>({3,1,9})&&hidden.empty());
 hide(active,hidden);active={12,9};
 // A deleted/moved object is not resurrected, and a still-active hero is not
 // duplicated when restoring a repeated tile override.
 restore(active,hidden,[](int id){return id!=1;});
 assert(active==std::vector<int>({3,9,12})&&hidden.empty());
}
