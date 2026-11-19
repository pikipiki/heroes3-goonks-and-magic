/* Aggregate regular income, separate from raw ERM grants; GPL-2.0-or-later. */
#pragma once
#include "EraIncomeRules.h"
#include "../ResourceSet.h"

VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
inline void applyIncomeHandicap(ResourceSet & income, int percent)
{
    for(auto & amount : income)
        amount = static_cast<TResource>(::era_bridge::regularIncomeAfterHandicap(amount, percent, GameConstants::PLAYER_RESOURCES_CAP));
}
}
VCMI_LIB_NAMESPACE_END
