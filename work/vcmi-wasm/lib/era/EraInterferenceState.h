/* Cached combat power lives on the battle, never mutates map hero skills. */
#pragma once
#include "EraInterferencePolicies.h"
#include "../battle/CBattleInfoCallback.h"
#include "../battle/IBattleState.h"
#include "../bonuses/BonusParameters.h"
#include "../mapObjects/CGHeroInstance.h"
#include <optional>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
struct InterferencePowerState {int original;int effective;};
inline std::optional<InterferencePowerState> sourceInterferencePower(const CBattleInfoCallback & battle,const CGHeroInstance * hero)
{
    if(!hero || !battle.getBattle())return std::nullopt;
    int side=-1;
    for(const auto candidate:{BattleSide::ATTACKER,BattleSide::DEFENDER})
        if(battle.getBattle()->getSideHero(candidate)==hero)side=int(candidate);
    if(side<0)return std::nullopt;
    const auto bonuses=battle.getBattle()->getBonusBearer()->getBonusesOfType(BonusType::ERA_SOURCE_ARTIFACT_STATE);
    for(const auto & marker:*bonuses)
    {
        if(!marker->parameters)continue;
        const auto & data=marker->parameters->toVector();
        if(data.size()!=5 || data[1]<269 || data[1]>271)continue;
        if(data[0]!=1 || data[2]<0 || data[2]>1 || data[3]<1 || data[4]<0)
            throw std::runtime_error("Invalid cached source Interference state");
        if(data[2]==side && InterferencePolicies::get().sourceIdentity("tum-era:artifact"+std::to_string(data[1])))
            return InterferencePowerState{data[4],data[3]};
    }
    return std::nullopt;
}
}
VCMI_LIB_NAMESPACE_END
