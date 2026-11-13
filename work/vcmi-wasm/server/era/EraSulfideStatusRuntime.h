/* Original339 CFG status script (46453E/441B62), distinct from XP selectors.
 * Optional service only: whole339 content and source identity must be reviewed
 * before the missing-by-default policy document may be installed. */
#pragma once
#include "EraStatusAttacks.h"
#include "../../lib/era/EraSulfideDragon.h"
#include "../../lib/era/EraSulfideDragonRule.h"
namespace era_compat_server
{
inline bool sulfideStatusActor(const CStack * actor)
{return actor && era_compat::SulfideDragon::get().enabled(actor->creatureId().toCreature()->getJsonKey());}
inline bool sulfideStatusEligible(const CBattleInfoCallback & battle,const CStack * actor,
    const CStack * target,int spell)
{
    if(!target || !target->alive() || target->isGhost() || target->hasBonusOfType(BonusType::SIEGE_WEAPON))return false;
    const auto id=StatusAttacks::get().id(target->creatureId().toCreature()->getJsonKey());
    if(id==149)return false; //44A247 arrowtower, before Orb.
    if(spell==71 && (!statusLiving(target)||id==30||id==31))return false; //44A3E3..404, before Orb.
    if(!era_compat::sourceSpellContextAllows(battle,target,SpellID(spell).toSpell()))return false;
    // CanCastSpellAtCoord passes ignoreSide=1 at5A3D2A. This is a hero-aware
    // eligibility query, with the actor's PHYSICAL side, even if hypnotized.
    era_compat::ConfluxCastQueryScope query(actor->unitSide(),2);
    if(!era_compat::confluxCatalystNegates(battle,actor->unitSide(),true))
    {
        StatusAttackCaster caster(actor,1,battle.sideToPlayer(actor->unitSide()));
        spells::BattleCast cast(&battle,&caster,spells::Mode::PASSIVE,SpellID(spell).toSpell());
        cast.setSpellLevel(1);cast.setEffectPower(100);cast.setEffectDuration(100);
        const auto * factory=spells::TargetConditionItemFactory::getDefault();
        spells::TargetCondition condition;
        condition.absolute={factory->createAbsoluteSpell(),factory->createAbsoluteLevel()};
        condition.normal={factory->createElemental(),factory->createNormalLevel(),factory->createNormalSpell()};
        condition.negation={factory->createReceptiveFeature(),factory->createImmunityNegation()};
        //75/74 bypass original Nature switch17..71. In particular Age can
        //affect undead/nonliving; source71's separate ALIVE test is above.
        if(!condition.isReceptive(SpellID(spell).toSpell()->battleMechanics(&cast).get(),target))return false;
    }
    //5A3D38 tests float probability>0; it does NOT draw a resistance roll.
    return statusRawAccuracy(battle,target,true,actor->unitSide(),true)>0;
}
inline void applySulfideStatuses(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,BattleHex targetHex)
{
    if(!sulfideStatusActor(actor)||!targetHex.isValid())return;
    const auto owner=battle.sideToPlayer(era_compat::confluxActiveSide(battle));
    for(const int spell:{75,71})
    {
        const auto * target=battle.battleGetStackByPos(targetHex,false);
        if(sulfideStatusEligible(battle,actor,target,spell))
            applySourceStatus(handler,battle,actor,target,SpellID(spell),1,owner,100);
    }
    // Source draws this even if target died, before its eligibility query.
    if(era_bridge::SulfideDragonRule::paralysis(handler.getRandomGenerator().nextInt(0,100)))
    {
        const auto * target=battle.battleGetStackByPos(targetHex,false);
        if(sulfideStatusEligible(battle,actor,target,74))
            applySourceStatus(handler,battle,actor,target,SpellID(74),1,owner,100);
    }
}
}
