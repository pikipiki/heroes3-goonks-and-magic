#pragma once
#include <cstdint>
#include <vector>
namespace era_bridge
{
struct UndeadMoraleMember { int64_t count; int role; };
// role0 RedBones224,1 Blood154,2 Necross254,3 Dracolich196,
// role4 original Bone/Ghost; unknown role -1. SourceArcherERM982..1010.
inline int undeadMoraleRole(const std::vector<UndeadMoraleMember> & slots)
{
    int selected=5;
    for(const auto & slot:slots)
        if(slot.count>0 && slot.role>=0 && slot.role<selected)
            selected=slot.role;
    return selected;
}
inline constexpr int undeadMoralePower(int role)
{
    return role<0 || role>4 ? 0 : role<2 ? 2 : 1;
}
}
