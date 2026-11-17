#pragma once
#include "EraLearningStoneRule.h"
#include "EraScriptRulesModel.h"
#include "../mapObjects/CGHeroInstance.h"
#include "../mapObjects/CGObjectInstance.h"
#include "../entities/hero/CHero.h"
#include "../bonuses/Updaters.h"
#include "../networkPacks/Component.h"
#include <typeinfo>
namespace era_compat::learning_stone
{
inline bool applies(const CGObjectInstance * object,const CGHeroInstance * hero)
{
 return object&&hero&&hero->cb&&object->ID==Obj::LEARNING_STONE&&object->subID.getNum()==0&&script_rules::learningStones(*hero->cb);
}
inline float nativeLearningPower(const CGHeroInstance & hero)
{
 const auto level=static_cast<std::int32_t>(hero.level);
 if(level<1||level>32767)throw std::runtime_error("ERA779 hero level is not source-validated");
 const int tier=hero.getSecSkillLevel(SecondarySkill::LEARNING);
 if(tier<0||tier>3)throw std::runtime_error("ERA779 custom learning tier is not source-validated");
 bool specialist=false;
 // The native ABI reads only the Learning specialty tag and its fixed5%
 // coefficient. Other experience bonuses are intentionally ignored here.
 for(const auto & bonus:hero.getHeroType()->specialty)
 {
  const auto * updater=bonus->updater.get();
  if(bonus->type==BonusType::HERO_EXPERIENCE_GAIN_PERCENT&&bonus->valType==BonusValueType::PERCENT_TO_TARGET_TYPE
     &&bonus->targetSourceType==BonusSource::SECONDARY_SKILL&&updater
     &&typeid(*updater)==typeid(TimesHeroLevelUpdater))specialist=true;
 }
 return learningPower(level,tier,specialist);
}
// Public shared reward calculation for an ordinary visit and the future
// source WOG_23_HeroGetLearningStoneExperience remote-visit adapter.
inline std::int32_t heroExperience(const CGHeroInstance & hero)
{return experience(static_cast<std::int32_t>(hero.level),nativeLearningPower(hero));}
inline void replaceComponents(std::vector<Component> & components,const CGObjectInstance * object,const CGHeroInstance * hero)
{
 if(!applies(object,hero))return;
 for(auto & component:components)if(component.type==ComponentType::EXPERIENCE&&component.value.value_or(0)>0)component.value=heroExperience(*hero);
}
}
