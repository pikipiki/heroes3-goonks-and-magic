#pragma once
#include "../entities/artifact/CArtifactSet.h"
#include "../entities/artifact/CArtifactInstance.h"
#include <algorithm>
#include <utility>

VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat::artifacts
{
inline bool reservedAssemblyPart(const CArtifactSet & holder,ArtifactPosition position,const CArtifactInstance * artifact)
{
    const auto * slot=holder.getSlot(position);
    if(!slot||!slot->locked||!artifact)return false;
    for(const auto & entry:holder.artifactsWorn)
    {
        const auto * parent=entry.second.getArt();
        if(entry.second.locked||!parent||!parent->isCombined())continue;
        for(const auto & part:parent->getPartsInfo())
            if(part.slot==position&&part.getArtifactID()==artifact->getId())return true;
    }
    return false;
}
// HE:A2 scans19 equipped records and64 backpack records. Original assembly
// clears component records; VCMI instead retains locked child placeholders.
template<typename Predicate>
std::pair<int,int> directCounts(const CArtifactSet & holder,const Predicate & matches)
{
    int total=0,worn=0;
    for(const auto & entry:holder.artifactsWorn)
    {
        if(entry.first.getNum()<0||entry.first.getNum()>18)continue;
        const auto * artifact=entry.second.getArt();
        if(artifact&&matches(artifact)&&!reservedAssemblyPart(holder,entry.first,artifact)){++total;++worn;}
    }
    for(std::size_t index=0;index<std::min<std::size_t>(64,holder.artifactsInBackpack.size());++index)
        if(const auto * artifact=holder.artifactsInBackpack[index].getArt();artifact&&matches(artifact))++total;
    return {total,worn};
}
inline int directCount(const CArtifactSet & holder,ArtifactID type)
{
    return directCounts(holder,[type](const CArtifactInstance * artifact){return artifact->getTypeId()==type;}).first;
}
}
VCMI_LIB_NAMESPACE_END
