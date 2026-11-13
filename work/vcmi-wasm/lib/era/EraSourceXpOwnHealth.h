/* Exact additive H+ carrier. No bonus enum or serialized field is added. */
#pragma once
#include "../bonuses/IBonusBearer.h"
#include "../bonuses/BonusList.h"
#include "../bonuses/Bonus.h"
#include "../bonuses/BonusSelector.h"
#include <limits>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
inline int sourceXpOwnHealth(const IBonusBearer & bearer,int experienced)
{
    int amount=0,found=0;
    const auto sourceBonusList14=bearer.getBonuses(Selector::type()(BonusType::NONE));
    for(const auto & b:*sourceBonusList14)
    {
        if(b->stacking!="eraSourceXpOwnHealth:241:v1")continue;
        if(++found>1||b->source!=BonusSource::STACK_EXPERIENCE
            ||b->duration!=BonusDuration::PERMANENT||!b->hidden
            ||b->valType!=BonusValueType::ADDITIVE_VALUE
            ||b->effectRange!=BonusLimitEffect::NO_LIMIT||b->val<0||b->val>14)
            throw std::runtime_error("Invalid source241 additive health rank carrier");
        amount=b->val;
    }
    return static_cast<int>(std::clamp<int64_t>(int64_t(experienced)+amount,
        std::numeric_limits<int>::min(),std::numeric_limits<int>::max()));
}
}
VCMI_LIB_NAMESPACE_END
