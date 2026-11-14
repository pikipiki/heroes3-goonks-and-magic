/* Original Lord340 Spell1 mode17: add one to additional_moves[42]. */
#pragma once
#include "EraBankActors.h"
#include "EraPrimordialMovesState.h"
#include "EraSourceSpellAccuracy.h"
#include "../spells/ISpellMechanics.h"
#include "../spells/CSpellHandler.h"
#include "../CStack.h"
#include "../networkPacks/PacksForClient.h"

VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
inline bool bankRushTargetAllowed(const spells::Mechanics & mechanics,const battle::Unit * target)
{
    const auto & battle=*mechanics.battle();
    const CStack * caster=battle.battleGetStackByID(mechanics.caster->getCasterUnitId());
    if(!caster||!target||!target->alive()||BankActors::get().sourceId(caster->unitType()->getJsonKey())!=340
        ||battle.battleGetOwner(caster)!=battle.battleGetOwner(target))return false;
    // Original Spell2 mode2 ->4476A3 asks CanStackReceiveSpell(43 Bloodlust,
    // hypnosis-aware side,target,1,1). It tests FLOAT>0 without a RNG draw.
    const auto * bloodlust=SpellID(43).toSpell();
    const auto side=battle.playerToSide(battle.battleGetOwner(caster));
    ConfluxSideScope current(side,1);ConfluxResistanceScope primary(true,side);
    spells::BattleCast query(&battle,mechanics.caster,spells::Mode::PASSIVE,bloodlust);
    query.eraExperiencePreAttack=true;query.setSpellLevel(1);
    auto m=bloodlust->battleMechanics(&query);m->casterSide=side;
    return sourceSpellContextAllows(battle,target,bloodlust)&&m->isReceptive(target)
        &&statusRawAccuracy(battle,target,true,side,true)>0;
}
inline bool applyBankRush(ServerCallback & server,const spells::Mechanics & mechanics,
    const spells::Target & targets)
{
    if(mechanics.getSpellId().toSpell()->getJsonKey()!="tum-era:sourceLordRush")return false;
    const auto & battle=*mechanics.battle();
    const CStack * caster=battle.battleGetStackByID(mechanics.caster->getCasterUnitId());
    if(!caster||BankActors::get().sourceId(caster->unitType()->getJsonKey())!=340)
        throw std::runtime_error("Source Rush requires original Lord340 caster");
    auto moves=primordialCachedMoves(battle);
    if(!moves)throw std::runtime_error("Source Rush requires initialized additional-moves cache");
    for(const auto & destination:targets)
    {
        const auto * target=dynamic_cast<const CStack *>(destination.unitValue);
        if(!target||!target->alive()||battle.battleGetOwner(target)!=battle.battleGetOwner(caster))continue;
        const int slot=era_bridge::primordialMoveSlot(int(target->unitSide()),target->sourceMassSlot());
        if(slot<0)continue;
        (*moves)[slot]=static_cast<std::uint8_t>(era_bridge::bankRushCounter((*moves)[slot]));
    }
    RemoveBonus remove;remove.who=GiveBonus::ETarget::BATTLE;
    remove.whoID=battle.getBattle()->getBattleID();remove.source=BonusSource::CREATURE_ABILITY;
    remove.id=primordialMovesSource();server.apply(remove);
    Bonus marker;marker.type=BonusType::DEFENSIVE_STANCE;marker.val=0;marker.hidden=true;
    marker.source=BonusSource::CREATURE_ABILITY;marker.sid=primordialMovesSource();
    marker.duration=BonusDuration::ONE_BATTLE;
    marker.parameters=std::make_shared<BonusParameters>(era_bridge::primordialEncodeMoves(*moves));
    GiveBonus packet(GiveBonus::ETarget::BATTLE,battle.getBattle()->getBattleID(),marker);
    server.apply(packet);
    return true;
}
}
VCMI_LIB_NAMESPACE_END
