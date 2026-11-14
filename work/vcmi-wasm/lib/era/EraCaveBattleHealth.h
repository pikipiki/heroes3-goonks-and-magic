#pragma once
#include "../bonuses/IBonusBearer.h"
#include "../bonuses/Bonus.h"
#include "../bonuses/BonusSelector.h"
#include <stdexcept>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat {
// BF's BM:H stores an initialized per-creature HP value, after experience and
// specialty. A final-value marker avoids multiplying XP or specialty twice.
inline int caveInitializedHealth(const IBonusBearer&bearer,int normal)
{
 const auto list=bearer.getBonuses(Selector::type()(BonusType::NONE));
 bool found=false;int result=normal;
 for(const auto&bonus:*list)
 {
  if(bonus->stacking!="eraCave:initializedHealth:v1")continue;
  if(found||bonus->source!=BonusSource::OTHER||bonus->duration!=BonusDuration::ONE_BATTLE
     ||!bonus->hidden||bonus->val<=0||bonus->limiter||bonus->updater||bonus->propagator)
    throw std::runtime_error("Invalid Cave initialized health marker");
  found=true;result=bonus->val;
 }
 return result;
}
inline bool caveBuilderSpecialty(const IBonusBearer&bearer)
{
 const auto list=bearer.getBonuses(Selector::type()(BonusType::NONE));
 for(const auto&bonus:*list)if(bonus->stacking=="eraCave:builder:v1")return true;
 return false;
}
}
VCMI_LIB_NAMESPACE_END
