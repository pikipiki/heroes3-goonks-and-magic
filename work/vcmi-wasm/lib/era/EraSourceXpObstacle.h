/* Unique synthetic triggers owned only by enrolled ordered-XP placement. */
#pragma once
#include "EraSourceSpellAccuracy.h"
#include "../spells/TargetCondition.h"
#include "../spells/CSpellHandler.h"
#include "../spells/ISpellMechanics.h"
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
inline int xpObstacleOriginal(const spells::Spell * spell)
{
    const auto & key=spell->getJsonKey();return key=="tum-era:sourceXpLandMineTrigger"?11:key=="tum-era:sourceXpFireWallTrigger"?13:-1;
}
inline thread_local bool xpObstacleDamageCorrection=false;
struct XpObstacleDamageScope{bool prior=xpObstacleDamageCorrection;XpObstacleDamageScope(){xpObstacleDamageCorrection=true;}~XpObstacleDamageScope(){xpObstacleDamageCorrection=prior;}};
inline bool xpObstacleTargetAllowed(const CBattleInfoCallback & battle,const spells::Caster * caster,
    BattleSide storedSide,const battle::Unit * target,int original)
{
    const auto * spell=SpellID(original).toSpell();
    if(!sourceSpellContextAllows(battle,target,spell))return false;
    spells::BattleCast query(&battle,caster,spells::Mode::PASSIVE,spell);
    auto mechanics=spell->battleMechanics(&query);mechanics->casterSide=storedSide;
    const auto * f=spells::TargetConditionItemFactory::getDefault();spells::TargetCondition c;
    c.absolute={f->createAbsoluteSpell(),f->createAbsoluteLevel()};c.normal={f->createElemental(),f->createNormalLevel(),f->createNormalSpell()};
    c.negation={f->createReceptiveFeature(),f->createImmunityNegation()};
    ConfluxResistanceScope side(true,storedSide);
    return c.isReceptive(mechanics.get(),target)&&statusRawAccuracy(battle,target,true,storedSide,true)>0;
}
}
VCMI_LIB_NAMESPACE_END
