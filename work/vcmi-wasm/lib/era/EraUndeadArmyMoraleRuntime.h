#pragma once
#include <algorithm>
#include <stdexcept>
#include <string>
#include "EraUndeadArmyMorale.h"
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include "../CCreatureHandler.h"
#include "../mapObjects/army/CArmedInstance.h"
#include "../mapObjects/army/CStackInstance.h"
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
inline bool undeadArmyMoraleEnabled()
{
    static const bool enabled=[]()
    {
        const auto path=JsonPath::builtin("config/era-bridge-undead-army-morale");
        if(!CResourceHandler::get()->existsResource(path))return false;
        const JsonNode root(path);
        if(!root.isStruct() || root.Struct().size()!=2 || !root["schemaVersion"].isNumber()
            || root["schemaVersion"].Float()!=1 || !root["enabled"].isBool())
            throw std::runtime_error("ERA undead army morale: invalid document");
        return root["enabled"].Bool();
    }();
    return enabled;
}
struct UndeadArmyMorale { int power=0; CreatureID source=CreatureID::NONE; };
inline UndeadArmyMorale originalArmyUndeadMorale(const CArmedInstance & army)
{
    if(!undeadArmyMoraleEnabled())return {};
    const std::vector<std::string> keys={"tum-era:redBonesDragon","wake-of-gods.level8units:bloodDragon",
        "tum-era:necrossDragon","wake-of-gods.creatures:dracolich","core:boneDragon","core:ghostDragon"};
    std::vector<::era_bridge::UndeadMoraleMember> slots;
    std::vector<CreatureID> roles(5,CreatureID::NONE);
    for(const auto & entry:army.Slots())
    {
        const auto * stack=entry.second.get();
        if(!stack->getCreatureID().hasValue() || stack->getCount()<=0)continue;
        const auto key=stack->getCreatureID().toCreature()->getJsonKey();
        const auto found=std::find(keys.begin(),keys.end(),key);
        if(found==keys.end())continue;
        const int role=std::min<int>(4,std::distance(keys.begin(),found));
        slots.push_back({stack->getCount(),role});roles[role]=stack->getCreatureID();
    }
    const int role=::era_bridge::undeadMoraleRole(slots);
    return {::era_bridge::undeadMoralePower(role),role<5?roles[role]:CreatureID::NONE};
}
}
VCMI_LIB_NAMESPACE_END
