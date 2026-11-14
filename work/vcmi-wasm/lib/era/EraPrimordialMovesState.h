/* Typed inert battle cache for original additional_moves[42].
 * No new serialized class/field/enum. Missing whole347 policy is inactive.
 * GPL-2.0-or-later. */
#pragma once
#include "EraPrimordialMovesRule.h"
#include "EraPrimordialPolicies.h"
#include "EraBankActors.h"
#include "../battle/CBattleInfoCallback.h"
#include "../battle/IBattleState.h"
#include "../bonuses/BonusParameters.h"
#include "../bonuses/IBonusBearer.h"
#include "../bonuses/BonusList.h"
#include "../bonuses/Bonus.h"
#include "../bonuses/BonusSelector.h"
#include "../constants/EntityIdentifiers.h"
#include <stdexcept>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
inline bool primordialMovesEnabled()
{return PrimordialPolicies::get().is347("tum-era:eraCreature347")
    || BankActors::get().owns("tum-era:eraCreature340");}

inline BonusSourceID primordialMovesSource()
{return BonusSourceID(CreatureID(CreatureID::decode(
    PrimordialPolicies::get().is347("tum-era:eraCreature347")
        ?"tum-era:eraCreature347":"tum-era:eraCreature340")));}

inline const Bonus * primordialMovesMarker(const CBattleInfoCallback & battle)
{
    if(!primordialMovesEnabled() || !battle.getBattle())return nullptr;
    const auto bonuses=battle.getBattle()->getBonusBearer()->getBonusesOfType(BonusType::DEFENSIVE_STANCE);
    const Bonus * result=nullptr;
    for(const auto & bonus:*bonuses)
    {
        if(bonus->source!=BonusSource::CREATURE_ABILITY || bonus->sid!=primordialMovesSource())continue;
        if(bonus->type!=BonusType::DEFENSIVE_STANCE || bonus->val!=0 || !bonus->hidden
            ||!bonus->parameters || !era_bridge::primordialDecodeMoves(bonus->parameters->toVector()))
            throw std::runtime_error("Invalid original347 battle move cache");
        if(result)throw std::runtime_error("Duplicate original347 battle move cache");
        result=bonus.get();
    }
    return result;
}

inline std::optional<era_bridge::PrimordialMoveSlots> primordialCachedMoves(const CBattleInfoCallback & battle)
{
    const auto * marker=primordialMovesMarker(battle);
    return marker?era_bridge::primordialDecodeMoves(marker->parameters->toVector()):std::nullopt;
}
}
VCMI_LIB_NAMESPACE_END
