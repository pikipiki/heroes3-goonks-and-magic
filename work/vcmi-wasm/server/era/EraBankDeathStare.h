/* Source E253: 75D67B overrides each Gorgon roll; 440C31 keeps its 10% cap. */
#pragma once
#include "../../lib/era/EraBankActors.h"
#include "../../lib/era/EraDwellingServices.h"
#include "../../lib/era/EraSkeletonTransformations.h"
#include "../../lib/CStack.h"
#include "../../lib/mapObjects/army/CStackInstance.h"
#include <optional>

namespace era_compat_server
{
template<class Random>
inline std::optional<int> bankDeathStareKills(bool ranged,const CStack * attacker,const CStack * defender,Random & random)
{
    if(ranged||!attacker)return std::nullopt;
    const auto & key=attacker->unitType()->getJsonKey();
    const bool tiamat=era_compat::BankActors::get().sourceId(key)==253;
    const bool cockatrice=era_compat::DwellingServices::get().actor(312,key);
    if(!tiamat&&!cockatrice)return std::nullopt;
    if(!defender)return 0;
    const auto * biology=era_compat::SkeletonTransformations::get().find(defender->unitType()->getJsonKey());
    if(!(biology?biology->living:defender->isLiving()))return 0;
    const int rank=attacker->base?std::clamp(attacker->base->getExpRank(),0,10):0;
    const int chance=tiamat?era_bridge::bankTiamatDeathStare[rank]:rank;
    // The source calls this service only when an E row is active. At rank0
    // there is no stare at all, hence no RNG consumption.
    if(chance<=0)return 0;
    int killed=0;
    for(int i=0;i<attacker->getCount();++i)if(random.nextInt(1,100)<=chance)++killed;
    return std::min(killed,era_bridge::bankDeathStareCap(attacker->getCount()));
}
}
