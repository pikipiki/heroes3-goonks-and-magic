/* TUM Third Upgrade Mod.erm tum_GetSpecMonsterStats, source-scoped battle bonuses. */
#pragma once
#include "EraSpecialistStats.h"
#include "../filesystem/Filesystem.h"
#include "../CCreatureHandler.h"
#include "../json/JsonNode.h"
#include "../mapObjects/CGHeroInstance.h"
#include "../entities/hero/CHero.h"
#include "../bonuses/Limiters.h"
#include <optional>
#include <stdexcept>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
struct CreatureSpecialtyProgression { CreatureID family; int attackDefense; int damage; int healthPercent; bool warMachines; };
inline std::optional<CreatureSpecialtyProgression> sourceCreatureSpecialty(const CGHeroInstance & hero)
{
    static const bool enabled=[] {
        const auto path=JsonPath::builtin("config/era-bridge-specialists");
        if(!CResourceHandler::get()->existsResource(path))return false;
        const JsonNode root(path);
        if(!root.isStruct() || root.Struct().size()!=2 || root["schemaVersion"].Float()!=1 || !root["enabled"].isBool())
            throw std::runtime_error("ERA specialist: invalid opt-in policy");
        return root["enabled"].Bool();
    }();
    if(!enabled)return std::nullopt;
    for(const auto & bonus:hero.getHeroType()->specialty)
    {
        if(bonus->type!=BonusType::STACKS_SPEED || bonus->val!=1)continue;
        const auto family=std::dynamic_pointer_cast<const CCreatureTypeLimiter>(bonus->limiter);
        if(!family || !family->includeUpgrades)continue;
        const int tier=family->creatureID.toCreature()->getLevel();
        if(tier<1 || tier>7)continue;
        const auto stats=::era_bridge::sourceSpecialistStats(static_cast<int>(hero.level),tier);
        return CreatureSpecialtyProgression{family->creatureID,stats.attackDefense,stats.damage,stats.healthPercent,
            family->creatureID==CreatureID::BALLISTA};
    }
    return std::nullopt;
}
}
VCMI_LIB_NAMESPACE_END
