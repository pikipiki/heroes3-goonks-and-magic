/* TUM340 R10 extra action, Third Upgrade Mod.erm993..1039 + stdlib238..250.
 * Distinct from the Amethyst additional_moves BYTE table used by Rush/347. */
#pragma once
#include "../CGameHandler.h"
#include "../../lib/era/EraBankActors.h"
#include "../../lib/era/EraPrimordialMovesRule.h"
#include "../../lib/CStack.h"
#include "../../lib/mapObjects/army/CStackInstance.h"
#include "../../lib/battle/CBattleInfoCallback.h"
#include "../../lib/battle/IBattleState.h"
#include "../../lib/battle/CUnitState.h"
#include "../../lib/battle/BattleAction.h"
#include "../../lib/bonuses/BonusParameters.h"
#include "../../lib/networkPacks/PacksForClient.h"
#include "../../lib/networkPacks/PacksForClientBattle.h"
#include <array>

namespace era_compat_server
{
struct BankSwordmasterState
{
    int round=0,pending=-1;
    std::array<int,42> counters{};
};
inline BonusSourceID bankSwordmasterSource()
{return BonusSourceID(SpellID(SpellID::decode("tum-era:sourceLordRush")));}
inline BankSwordmasterState bankSwordmasterState(const CBattleInfoCallback & battle)
{
    BankSwordmasterState result;result.round=battle.battleGetRound();
    const auto list=battle.getBattle()->getBonusBearer()->getBonusesOfType(BonusType::NONE);
    bool found=false;
    for(const auto & bonus:*list)
    {
        if(bonus->stacking!="eraBankSwordmaster:v1")continue;
        if(found||bonus->source!=BonusSource::SPELL_EFFECT||bonus->sid!=bankSwordmasterSource()
            ||!bonus->hidden||!bonus->parameters)throw std::runtime_error("Invalid source340 action cache");
        found=true;const auto & data=bonus->parameters->toVector();
        if(data.size()!=46||data[0]!=1||data[1]!=340||data[2]<0||data[3]<-1||data[3]>=42)
            throw std::runtime_error("Invalid source340 action cache payload");
        result.round=data[2];result.pending=data[3];
        for(int i=0;i<42;++i)
        {
            if(data[i+4]<0||data[i+4]>1)throw std::runtime_error("Invalid source340 per-round action counter");
            result.counters[i]=data[i+4];
        }
    }
    if(result.round!=battle.battleGetRound())
    {
        // stdlib decrements, saturating at0, rather than clearing an arbitrary
        // counter. This source cohort only writes0/1 to its own slots.
        for(int & count:result.counters)count=std::max(0,count-(battle.battleGetRound()-result.round));
        result.round=battle.battleGetRound();result.pending=-1;
    }
    return result;
}
inline void writeBankSwordmaster(CGameHandler & handler,const CBattleInfoCallback & battle,const BankSwordmasterState & state)
{
    RemoveBonus remove;remove.who=GiveBonus::ETarget::BATTLE;remove.whoID=battle.getBattle()->getBattleID();
    remove.source=BonusSource::SPELL_EFFECT;remove.id=bankSwordmasterSource();handler.sendAndApply(remove);
    std::vector<int32_t> data{1,340,state.round,state.pending};
    data.insert(data.end(),state.counters.begin(),state.counters.end());
    Bonus marker;marker.type=BonusType::NONE;marker.val=0;marker.hidden=true;marker.duration=BonusDuration::ONE_BATTLE;
    marker.source=BonusSource::SPELL_EFFECT;marker.sid=bankSwordmasterSource();marker.stacking="eraBankSwordmaster:v1";
    marker.parameters=std::make_shared<BonusParameters>(std::move(data));
    GiveBonus packet(GiveBonus::ETarget::BATTLE,battle.getBattle()->getBattleID(),marker);handler.sendAndApply(packet);
}
inline void bankSwordmasterAfterAction(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,EActionType action)
{
    if(!actor||!actor->alive()||era_compat::BankActors::get().sourceId(actor->unitType()->getJsonKey())!=340
        ||!actor->base||actor->base->getExpRank()<10)return;
    if(action!=EActionType::WALK&&action!=EActionType::WALK_AND_ATTACK&&action!=EActionType::SHOOT
        &&action!=EActionType::CATAPULT&&action!=EActionType::MONSTER_SPELL&&action!=EActionType::STACK_HEAL)return;
    const int slot=era_bridge::primordialMoveSlot(int(actor->unitSide()),actor->sourceMassSlot());
    if(slot<0)return;
    auto cache=bankSwordmasterState(battle);
    if(cache.counters[slot]!=0)return;
    cache.pending=slot;writeBankSwordmaster(handler,battle,cache);
    auto state=actor->acquireState();state->movedThisRound=false;state->eraDoneRound=false;
    state->castSpellThisTurn=false;
    // Preserve HAD_MORALE and other source bits. The forced activation consumes
    // this counter even if the ordinary positive-morale path selected it first.
    BattleUnitsChanged change;change.battleID=battle.getBattle()->getBattleID();
    change.changedStacks.emplace_back(actor->unitId(),UnitChanges::EOperation::RESET_STATE);
    state->save(change.changedStacks.back().data);handler.sendAndApply(change);
}
inline const battle::Unit * bankSwordmasterBeforeActivation(CGameHandler & handler,
    const CBattleInfoCallback & battle,const battle::Unit * proposed)
{
    if(!era_compat::BankActors::get().enabled())return proposed;
    auto cache=bankSwordmasterState(battle);
    if(cache.pending<0)return proposed;
    const int slot=cache.pending;cache.pending=-1;
    const CStack * chosen=nullptr;
    for(const auto * stack:battle.battleGetAllStacks(false))
        if(era_bridge::primordialMoveSlot(int(stack->unitSide()),stack->sourceMassSlot())==slot
            &&stack->alive()&&era_compat::BankActors::get().sourceId(stack->unitType()->getJsonKey())==340)
            chosen=stack;
    if(chosen&&cache.counters[slot]==0)cache.counters[slot]++;
    else chosen=nullptr;
    writeBankSwordmaster(handler,battle,cache);
    return chosen?chosen:proposed;
}
}
