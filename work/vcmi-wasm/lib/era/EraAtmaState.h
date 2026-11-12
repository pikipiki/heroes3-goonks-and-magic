/* Source264/265 stored primary-skill adjustments, not a dynamic max bonus. */
#pragma once
#include <array>
#include <cstdint>
#include <stdexcept>
#include <limits>
#include <vector>
namespace era_bridge
{
using AtmaSkills=std::array<int32_t,4>;
inline AtmaSkills atmaEquipAdjustment(int source,const AtmaSkills & current)
{
    if(source!=264 && source!=265)throw std::invalid_argument("Unknown source Atma identity");
    const int first=source==264?0:2;
    AtmaSkills result{};
    const int64_t gap=int64_t(current[first+1])-current[first];
    if(gap>std::numeric_limits<int32_t>::max() || gap< -int64_t(std::numeric_limits<int32_t>::max()))
        throw std::overflow_error("Source Atma adjustment outside native stored range");
    if(gap>0)result[first]=int32_t(gap);
    else result[first+1]=int32_t(-gap);
    return result;
}
inline std::vector<int32_t> encodeAtmaState(int source,const AtmaSkills & adjustment)
{
    if(source!=264 && source!=265)throw std::invalid_argument("Unknown source Atma identity");
    const int first=source==264?0:2;
    for(int i=0;i<4;++i)
        if(adjustment[i]<0 || ((i!=first && i!=first+1) && adjustment[i]!=0))
            throw std::invalid_argument("Invalid source Atma adjustment");
    if(adjustment[first] && adjustment[first+1])throw std::invalid_argument("Atma adjusts only the lower skill");
    return {1,source,adjustment[0],adjustment[1],adjustment[2],adjustment[3]};
}
inline AtmaSkills decodeAtmaState(const std::vector<int32_t> & state,int source)
{
    if(state.size()!=6 || state[0]!=1 || state[1]!=source)throw std::invalid_argument("Invalid source artifact state version/identity");
    const AtmaSkills adjustment{state[2],state[3],state[4],state[5]};
    encodeAtmaState(source,adjustment);return adjustment;
}
}
