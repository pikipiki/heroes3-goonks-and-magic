/* Original Shot type4 physical chain. GPL-2.0-or-later. */
#pragma once
#include "EraDungeonChainTargets.h"
#include "EraOblivionRuntime.h"
#include "../../lib/era/EraCrystalExperienceRuntime.h"
#include "../../lib/era/EraDeflectionRuntime.h"
#include "../../lib/era/EraDeflectionLog.h"
#include "../../lib/era/EraSourceRangedResistance.h"
namespace era_compat_server
{
inline void dungeonChainClearStruckStatuses(CGameHandler & handler,const CBattleInfoCallback & battle,const CStack * target)
{
    std::vector<Bonus> removed;
    for(const auto & bonus:*target->getBonuses(Selector::sourceTypeSel(BonusSource::SPELL_EFFECT)))
    {
        const int spell=bonus->sid.as<SpellID>().num;
        if(spell==62||spell==70||spell==74)removed.push_back(*bonus);
    }
    if(removed.empty())return;
    SetStackEffect packet;packet.battleID=battle.getBattle()->getBattleID();
    packet.toRemove.emplace_back(target->unitId(),std::move(removed));handler.sendAndApply(packet);
}
struct DungeonPhysicalResult{int64_t damage=0;bool fullBlock=false;};
inline DungeonPhysicalResult dungeonChainPhysicalWrappers(CGameHandler & handler,
    const CBattleInfoCallback & battle,const CStack * target,int64_t raw,bool primaryAction)
{
    DungeonPhysicalResult result{raw,false};
    const auto battleID=battle.getBattle()->getBattleID();
    result.fullBlock=applyEraCrystalPhysicalBlock(target,handler.getRandomGenerator());
    if(result.fullBlock)
    {
        result.damage=0;
        BattleTriggerEffect cue;cue.battleID=battleID;cue.stackID=target->unitId();
        cue.effect=BonusType::GENERAL_DAMAGE_REDUCTION;cue.val=100;cue.additionalInfo=85;if(target->alive())handler.sendAndApply(cue);
        BattleLogMessage log;log.battleID=battleID;MetaString line;
        line.appendTextID("tum-era.deflection.fullBlock");log.lines.push_back(line);handler.sendAndApply(log);
    }
    else
    {
        if(primaryAction&&era_compat::Policies::get().sourceRangedResistance30(target->creatureId().toCreature()->getJsonKey()))
        {
            result.damage=::era_bridge::sourceRangedResistance30(result.damage);
            BattleTriggerEffect cue;cue.battleID=battleID;cue.stackID=target->unitId();
            cue.effect=BonusType::GENERAL_DAMAGE_REDUCTION;cue.val=30;cue.additionalInfo=89;if(target->alive())handler.sendAndApply(cue);
        }
        result.damage=applyEraDeflection(target,handler.getRandomGenerator(),result.damage,
            [&](int strength,int chance){auto log=eraDeflectionLog(battleID,strength,chance);handler.sendAndApply(log);});
    }
    return result;
}
inline BattleStackAttacked dungeonChainPhysicalState(CGameHandler & handler,const CStack * actor,
    const CStack * target,const DungeonPhysicalResult & hit)
{
    BattleStackAttacked result;result.attackerID=actor->unitId();result.stackAttacked=target->unitId();result.damageAmount=hit.damage;
    auto state=target->acquireState();
    if(!hit.fullBlock&&hit.damage<0)
    {
        // Both physical ChainShot calls and the earlier spell-inversion port
        // enter EXACTLY443DB0. Its signed IDIV health operation is identical;
        // only the entry wrapper differs. Avoid unsigned killedAmount wrap.
        if(target->isClone())
        {
            result.damageAmount=1;CStack::prepareAttacked(result,handler.getRandomGenerator(),state);
            return result; //Native clone damage becomes0 and sets CLONE_KILLED.
        }
        state->health.applyEraNegativeSpellDamage(hit.damage);
        result.damageAmount=0;CStack::prepareAttacked(result,handler.getRandomGenerator(),state);
        result.damageAmount=hit.damage;result.newState.healthDelta=-hit.damage;
        return result;
    }
    if(!hit.fullBlock&&target->isClone()&&hit.damage==0)
    {
        // Original443DDE destroys CLONE even for zero physical input; B full
        // block returns before the core443DB0 call and must retain the clone.
        int64_t trigger=1;state->damage(trigger);
    }
    CStack::prepareAttacked(result,handler.getRandomGenerator(),state);
    return result;
}
inline void dungeonChainZeroSecondPass(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,const CStack * target,bool primaryAction)
{
    // The ABI-undefined second input is explicitly normalized0. Its B/L RNG,
    // block announcements and core status clearing are NOT skipped.
    const auto hit=dungeonChainPhysicalWrappers(handler,battle,target,
        ::era_bridge::dungeonChainUndefinedSecondPassDamage,primaryAction);
    if(!hit.fullBlock)dungeonChainClearStruckStatuses(handler,battle,target);
    if(target->alive())
    {
        StacksInjured packet;packet.battleID=battle.getBattle()->getBattleID();
        packet.stacks.push_back(dungeonChainPhysicalState(handler,actor,target,hit));handler.sendAndApply(packet);
    }
}
// Called after before-attack spells and normal life checks, before ordinary
// damage/luck/archery calculation, matching43F72C->43FE10 bypass.
inline bool applyDungeonChainShot(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,const CStack * primary,bool ranged,bool counter,bool consumeCounter)
{
    if(!ranged||!primary||!StatusAttacks::get().queuedSlow(actor)
        ||actor->creatureId().toCreature()->getJsonKey()!="tum-era:eraCreature352")return false;
    const int low=actor->getMinDamage(true),high=actor->getMaxDamage(true);
    const int32_t initial=::era_bridge::dungeonChainRaw(uint32_t(actor->getCount()),uint32_t(handler.getRandomGenerator().nextInt(low,high)));
    int64_t raw=initial;int32_t total=0;
    std::vector<uint32_t> visited;
    auto previous=dungeonSourceCandidate(primary);
    const CStack * current=primary;
    for(int hop=0;hop<4&&current;++hop)
    {
        const auto candidate=dungeonSourceCandidate(current);
        if(!::era_bridge::dungeonChainContinues(previous,candidate))break;
        const auto hit=dungeonChainPhysicalWrappers(handler,battle,current,raw,!counter);
        const auto attacked=dungeonChainPhysicalState(handler,actor,current,hit);
        if(hop==0)
        {
            BattleAttack packet;packet.battleID=battle.getBattle()->getBattleID();
            packet.attackerChanges.battleID=packet.battleID;packet.stackAttacking=actor->unitId();
            packet.tile=primary->getPosition();packet.flags=BattleAttack::SHOT|(counter?BattleAttack::COUNTER:0);
            auto state=actor->acquireState();state->afterAttack(true,counter&&consumeCounter);
            UnitChanges change(actor->unitId(),UnitChanges::EOperation::RESET_STATE);state->save(change.data);
            packet.attackerChanges.changedStacks.push_back(change);packet.bsa.push_back(attacked);handler.sendAndApply(packet);
        }
        else
        {
            BattleSpellCast animation;animation.battleID=battle.getBattle()->getBattleID();
            animation.activeCast=false;animation.side=battle.playerToSide(battle.battleGetOwner(actor));
            const auto visual=LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(),"spell","tum-era:sourceSpiderChainShot",false);
            if(!visual)throw std::runtime_error("Source352 chain visual spell required");
            animation.spellID=SpellID(*visual);animation.tile=current->getPosition();animation.casterStack=previous.id;
            animation.castByHero=false;animation.affectedCres.insert(current->unitId());handler.sendAndApply(animation);
            StacksInjured packet;packet.battleID=animation.battleID;packet.stacks.push_back(attacked);handler.sendAndApply(packet);
        }
        if(!hit.fullBlock)dungeonChainClearStruckStatuses(handler,battle,current);
        total=::era_bridge::dungeonChainAdd(total,int32_t(raw));raw=::era_bridge::dungeonChainHalf(raw);
        dungeonChainZeroSecondPass(handler,battle,actor,current,!counter);
        visited.push_back(current->unitId());previous=candidate;
        // Source5A68B2 selects AFTER every hit, including hit4 before the
        // subsequent4-hop limit. Preserve the otherwise invisible last RNG scan.
        const auto candidates=dungeonSourceCandidates(battle);
        const auto * next=::era_bridge::dungeonChainNext(previous,candidates,visited,[&](const auto & c)
            {return dungeonSourceAccuracy(handler,battle,actor,battle.battleGetStackByID(c.id,false));});
        current=next?battle.battleGetStackByID(next->id,false):nullptr;
    }
    BattleLogMessage log;log.battleID=battle.getBattle()->getBattleID();MetaString line;
    line.appendRawString(actor->getCount()>1?actor->creatureId().toCreature()->getNamePluralTranslated():actor->creatureId().toCreature()->getNameSingularTranslated());
    line.appendRawString(" chainshot "+std::to_string(total)+" damage");log.lines.push_back(line);handler.sendAndApply(log);
    removeEraOblivionCorpses(handler,battle);
    return true;
}
}
