#include "../../work/vcmi-wasm/lib/era/EraAtmaState.h"
#include <cassert>
using namespace era_bridge;
int main()
{
    assert((atmaEquipAdjustment(264,{4,9,20,10})==AtmaSkills{5,0,0,0}));
    assert((atmaEquipAdjustment(264,{12,3,1,2})==AtmaSkills{0,9,0,0}));
    assert((atmaEquipAdjustment(265,{4,9,20,10})==AtmaSkills{0,0,0,10}));
    assert((atmaEquipAdjustment(265,{4,9,5,11})==AtmaSkills{0,0,6,0}));
    assert((atmaEquipAdjustment(264,{8,8,1,2})==AtmaSkills{}));
    const auto stored=encodeAtmaState(264,{5,0,0,0});
    assert((decodeAtmaState(stored,264)==AtmaSkills{5,0,0,0}));
    // A later permanent +2 attack survives unequip: remove precisely the cached +5.
    AtmaSkills current{11,9,20,10};const auto old=decodeAtmaState(stored,264);
    for(int i=0;i<4;++i)current[i]-=old[i];
    assert((current==AtmaSkills{6,9,20,10}));
    assert((atmaEquipAdjustment(264,current)==AtmaSkills{3,0,0,0}));
    for(const auto & invalid: {std::vector<int32_t>{2,264,5,0,0,0},std::vector<int32_t>{1,265,5,0,0,0},std::vector<int32_t>{1,264,5,1,0,0}})
    {bool caught=false;try{decodeAtmaState(invalid,264);}catch(const std::invalid_argument&){caught=true;}assert(caught);}
}
