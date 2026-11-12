/* Third Upgrade Mod.erm1925..1989; GPL-2.0-or-later. */
#pragma once
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include "../battle/CBattleInfoCallback.h"
#include "../battle/IBattleState.h"
#include "../bonuses/BonusParameters.h"
#include "../mapObjects/CGHeroInstance.h"
#include <stdexcept>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class OblivionPolicy
{
    bool active=false;
public:
    OblivionPolicy()
    {
        const auto resource=JsonPath::builtin("config/era-oblivion-artifact-service");
        if(!CResourceHandler::get()->existsResource(resource))return;
        const JsonNode root(resource);
        if(!root.isStruct() || root.Struct().size()!=2 || !root["schemaVersion"].isNumber()
            || root["schemaVersion"].Float()!=1 || !root["artifact"].isString()
            || root["artifact"].String()!="tum-era:artifact268")
            throw std::runtime_error("Whole source268 Ring of Oblivion contract required");
        active=true;
    }
    static bool enabled(){static const OblivionPolicy policy;return policy.active;}
};
inline bool sourceOblivionActive(const CBattleInfoCallback & battle)
{
    if(!OblivionPolicy::enabled() || !battle.getBattle())return false;
    const auto markers=battle.getBattle()->getBonusBearer()->getBonusesOfType(BonusType::ERA_SOURCE_ARTIFACT_STATE);
    for(const auto & marker:*markers)
        if(marker->source==BonusSource::ARTIFACT && marker->parameters
            && marker->parameters->toVector()==std::vector<int32_t>{1,268})return true;
    return false;
}
inline bool sourceOblivionResult(const CGHeroInstance & hero,const BattleID & battleID)
{
    if(!OblivionPolicy::enabled())return false;
    const auto markers=hero.getBonusesOfType(BonusType::ERA_SOURCE_ARTIFACT_STATE);
    for(const auto & marker:*markers)
        if(marker->source==BonusSource::ARTIFACT && marker->parameters
            && marker->parameters->toVector()==std::vector<int32_t>{1,268,battleID.getNum()})return true;
    return false;
}
}
VCMI_LIB_NAMESPACE_END
