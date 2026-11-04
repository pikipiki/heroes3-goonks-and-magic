#pragma once
#include "EraBankGuardSlotSemantics.h"
#include "../json/JsonNode.h"
#include <cmath>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_bridge
{
template<class Army>
void applyBankGuardSlots(Army & army,const JsonNode & policy)
{
    if(policy.isNull())
        return;
    if(!policy.isVector())
        throw std::invalid_argument("ERA bank guardian slots policy must be an array");
    std::vector<int> targets;
    for(const auto & node:policy.Vector())
    {
        if(!node.isNumber() || node.Float()<0 || node.Float()>6 || std::floor(node.Float())!=node.Float())
            throw std::invalid_argument("ERA bank guardian slot must be an integer0..6");
        targets.push_back(static_cast<int>(node.Float()));
    }
    ::era_bridge::restoreBankGuardSlots(army,targets,[](int index){return SlotID(index);});
}
}
VCMI_LIB_NAMESPACE_END
