/* Explicit source compiler metadata, never inferred from an ordinary ANY bonus. */
#pragma once
#include "EraExperienceMagicReduction.h"
#include "../battle/Unit.h"
#include "../bonuses/BonusParameters.h"
#include "../bonuses/BonusList.h"
#include "../bonuses/BonusSelector.h"
#include <optional>
#include <stdexcept>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
inline bool sourceMagicReductionBonus(const Bonus & bonus)
{
    if(bonus.type!=BonusType::SPELL_DAMAGE_REDUCTION
        || bonus.subtype!=BonusSubtypeID(SpellSchool::ANY) || !bonus.parameters)return false;
    // BonusParameters::toJsonNode is still a TODO returning null in this
    // engine. Read the authoritative typed payload; foreign ANY parameters
    // retain ordinary behavior rather than becoming source declarations.
    try
    {
        const auto & payload=bonus.parameters->toVector();
        return payload.size()==2 && payload[0]==::era_bridge::sourceMagicReductionMarker && payload[1]>=0;
    }
    catch(const std::runtime_error &){return false;}
}
inline std::optional<int> sourceMagicReduction(const battle::Unit * unit)
{
    if(!unit)return std::nullopt;
    const auto selector=Selector::typeSubtype(BonusType::SPELL_DAMAGE_REDUCTION,BonusSubtypeID(SpellSchool::ANY));
    auto selected=unit->getBonusBearer()->getBonuses(selector);
    int64_t value=0;bool found=false;
    for(const auto & bonus:*selected)if(sourceMagicReductionBonus(*bonus))
    {found=true;value+=bonus->val;}
    if(!found)return std::nullopt;
    return static_cast<int>(std::clamp<int64_t>(value,0,255));
}
inline CSelector nonSourceMagicReduction(bool retainIntrinsic=true)
{
    return Selector::typeSubtype(BonusType::SPELL_DAMAGE_REDUCTION,BonusSubtypeID(SpellSchool::ANY))
        .And([retainIntrinsic](const Bonus * bonus)
        {
            return !sourceMagicReductionBonus(*bonus)
                && (retainIntrinsic || bonus->source!=BonusSource::CREATURE_ABILITY);
        });
}
}
VCMI_LIB_NAMESPACE_END
