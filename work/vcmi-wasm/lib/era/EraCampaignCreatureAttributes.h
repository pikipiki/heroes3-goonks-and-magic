/* Map-local counterparts of the five numeric MA fields used by zc1-0. */
#pragma once
#include "../CCreatureHandler.h"
#include "../gameState/CGameState.h"
#include "../bonuses/Bonus.h"
#include "../bonuses/BonusSelector.h"
#include "../bonuses/Limiters.h"
#include <cstdint>
#include <limits>
#include <stdexcept>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_campaign_creature_attributes
{
inline int fieldIndex(char field)
{
 switch(field){case 'P':return 0;case 'A':return 1;case 'D':return 2;case 'M':return 3;case 'E':return 4;}
 throw std::runtime_error("Unadmitted original creature attribute");
}
inline int base(const CCreature & creature,char field)
{
 switch(field)
 {
  case 'P':return creature.getBaseHitPoints();case 'A':return creature.getBaseAttack();
  case 'D':return creature.getBaseDefense();case 'M':return creature.getBaseDamageMin();case 'E':return creature.getBaseDamageMax();
 }
 throw std::runtime_error("Unadmitted original creature attribute");
}
inline void apply(CGameState & game,CreatureID id,char field,int amount)
{
 if(id.getNum()<0||id.getNum()>65535||amount<(field=='P'?1:0))throw std::runtime_error("Invalid original creature attribute");
 const auto * creature=id.toCreature();const int index=fieldIndex(field);
 if(!creature)throw std::runtime_error("Unbound original creature attribute");
 const auto delta=std::int64_t(amount)-base(*creature,field);
 if(delta<std::numeric_limits<int>::min()||delta>std::numeric_limits<int>::max())throw std::runtime_error("Original creature attribute delta overflow");
 const BonusSourceID source{BonusCustomSource(0x57000000+id.getNum()*16+index)};
 game.globalEffects.removeBonuses(Selector::source(BonusSource::OTHER,source));
 if(delta==0)return;
 const auto type=field=='P'?BonusType::STACK_HEALTH:(field=='A'||field=='D')?BonusType::PRIMARY_SKILL:BonusType::CREATURE_DAMAGE;
 auto bonus=std::make_shared<Bonus>(BonusDuration::PERMANENT,type,BonusSource::OTHER,int(delta),source);
 if(field=='A'||field=='D')bonus->subtype=BonusSubtypeID(field=='A'?PrimarySkill::ATTACK:PrimarySkill::DEFENSE);
 if(field=='M'||field=='E')bonus->subtype=field=='M'?BonusCustomSubtype::creatureDamageMin:BonusCustomSubtype::creatureDamageMax;
 bonus->valType=BonusValueType::BASE_NUMBER;
 bonus->limiter=std::make_shared<CCreatureTypeLimiter>(*creature,false);
 bonus->hidden=true;game.globalEffects.addNewBonus(bonus);
}
}
VCMI_LIB_NAMESPACE_END
