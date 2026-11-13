/* Optional battle-local source45 codec. No new bonus enum or save fields. */
#pragma once
#include "EraWeakness45Rule.h"
#include "EraXpTimed184State.h"
#include "../battle/Unit.h"
#include "../CStack.h"
#include "../bonuses/BonusParameters.h"
#include "../bonuses/Bonus.h"
#include "../constants/EntityIdentifiers.h"
#include "../bonuses/BonusList.h"
#include "../bonuses/BonusSelector.h"
#include "../networkPacks/SetStackEffect.h"
#include <optional>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
inline constexpr const char * weakness45StateTag="eraSourceWeakness45:state:v1";
inline constexpr const char * weakness45LossTag="eraSourceWeakness45:loss:v1";
inline constexpr const char * weakness45VisibleTag="eraSourceWeakness45:visible:v1";
inline constexpr int weakness45StateSignature=0x574b3435;
// Future BattleInfo::removeUnitBonus must AND this optional guard with its
// existing selector. Its ordinary selector omits stacking/parameters/turnsRemain.
inline std::optional<bool> sourceWeakness45RemovalIdentity(const Bonus & requested,const Bonus & candidate)
{
    if(!era_bridge::weakness45OwnedTag(requested.stacking)&&!era_bridge::weakness45OwnedTag(candidate.stacking))return std::nullopt;
    // Do not decode arbitrary mods' addInfo variants. A different tag already
    // proves a different owner, regardless of its numeric/vector parameters.
    if(requested.stacking!=candidate.stacking)return false;
    const std::vector<std::int32_t> empty;
    return era_bridge::weakness45RemovalIdentity(requested.stacking,
        requested.parameters?requested.parameters->toVector():empty,requested.turnsRemain,
        candidate.stacking,candidate.parameters?candidate.parameters->toVector():empty,candidate.turnsRemain);
}
struct Weakness45NativeSnapshot
{
    era_bridge::Weakness45State state;
    bool owned=false,foreignWeakness=false;
    std::int32_t storedAttack=0;
    std::vector<Bonus> bonuses;
};
inline Weakness45NativeSnapshot readSourceWeakness45(const battle::Unit * target)
{
    if(!target)throw std::runtime_error("Source45 target required");
    Weakness45NativeSnapshot result;int stateCount=0,lossCount=0,visibleCount=0;
    const auto sourceBonusList45=target->getBonuses(Selector::typeSubtype(BonusType::PRIMARY_SKILL,BonusSubtypeID(PrimarySkill::ATTACK)));
    for(const auto & bonus:*sourceBonusList45)
    {
        if(bonus->stacking==weakness45StateTag)
        {
            ++stateCount;if(bonus->source!=BonusSource::OTHER||bonus->val!=0||!bonus->parameters)throw std::runtime_error("Malformed source45 state marker");
            const auto p=bonus->parameters->toVector();
            if(p.size()!=7||p[0]!=weakness45StateSignature||p[1]!=1||p[3]<0||p[3]>3)throw std::runtime_error("Malformed source45 serialized state");
            result.state={p[2],p[3],p[4],p[5],static_cast<std::uint32_t>(p[6])};result.owned=true;result.bonuses.push_back(*bonus);
        }
        else if(bonus->stacking==weakness45LossTag){++lossCount;result.bonuses.push_back(*bonus);}
        else if(bonus->stacking==weakness45VisibleTag){++visibleCount;result.bonuses.push_back(*bonus);}
    }
    const auto sourceBonusList57=target->getBonuses(Selector::source(BonusSource::SPELL_EFFECT,BonusSourceID(SpellID(45))));
    for(const auto & bonus:*sourceBonusList57)
        if(bonus->stacking!=weakness45VisibleTag&&bonus->type==BonusType::PRIMARY_SKILL
            &&bonus->subtype==BonusSubtypeID(PrimarySkill::ATTACK)&&bonus->valType==BonusValueType::ADDITIVE_VALUE
            &&bonus->effectRange==BonusLimitEffect::NO_LIMIT)result.foreignWeakness=true;
    if(stateCount>1||lossCount>1||visibleCount>1||(!result.owned&&!result.bonuses.empty()))throw std::runtime_error("Ambiguous source45 state");
    if(result.owned)
    {
        for(const auto & bonus:result.bonuses)
        {
            if(bonus.duration!=BonusDuration::PERMANENT||bonus.effectRange!=BonusLimitEffect::NO_LIMIT)throw std::runtime_error("Source45 lifecycle projection type mismatch");
            if(bonus.stacking==weakness45LossTag&&(bonus.source!=BonusSource::OTHER||bonus.val!=era_bridge::weakness45Negate(result.state.totalLoss())))throw std::runtime_error("Source45 loss projection mismatch");
            if(bonus.stacking==weakness45VisibleTag&&(bonus.source!=BonusSource::SPELL_EFFECT||bonus.sid!=BonusSourceID(SpellID(45))||bonus.val!=0||bonus.turnsRemain!=result.state.duration))throw std::runtime_error("Source45 visible duration mismatch");
        }
        if(lossCount!=(result.state.totalLoss()!=0?1:0)||visibleCount!=(result.state.duration>0?1:0))throw std::runtime_error("Missing source45 lifecycle projection");
    }
    // Stored C8 excludes Bloodlust/Precision/Frenzy's mode-specific additions.
    const auto baseAttack=Selector::typeSubtype(BonusType::PRIMARY_SKILL,BonusSubtypeID(PrimarySkill::ATTACK))
        .And(Selector::effectRange()(BonusLimitEffect::NO_LIMIT))
        .And([](const Bonus * b){return !era_bridge::weakness45OwnedTag(b->stacking)&&!xpTimed184StatProjection(b);});
    const auto withoutLoss=era_bridge::weakness45Signed(static_cast<std::uint32_t>(target->valOfBonuses(baseAttack)));
    result.storedAttack=xpTimed184AttackAfterNative(result.owned?era_bridge::weakness45AttackAfterLoss(withoutLoss,result.state):withoutLoss,*target);
    return result;
}
inline std::optional<int> sourceWeakness45Attack(const battle::Unit & unit,bool ranged)
{
    const auto old=readSourceWeakness45(&unit);if(!old.owned&&!sourceTimedStatActive(unit))return std::nullopt;
    const auto range=Selector::effectRange()(BonusLimitEffect::NO_LIMIT)
        .Or(Selector::effectRange()(ranged?BonusLimitEffect::ONLY_DISTANCE_FIGHT:BonusLimitEffect::ONLY_MELEE_FIGHT));
    const auto others=Selector::typeSubtype(BonusType::PRIMARY_SKILL,BonusSubtypeID(PrimarySkill::ATTACK))
        .And(range).And([](const Bonus * b){return !era_bridge::weakness45OwnedTag(b->stacking)&&!xpTimed184StatProjection(b);});
    const auto native=era_bridge::weakness45Signed(static_cast<uint32_t>(unit.valOfBonuses(others)));
    return xpTimed184AttackAfterNative(era_bridge::weakness45AttackAfterLoss(native,old.state),unit);
}
inline std::vector<Bonus> sourceWeakness45ProjectedBonuses(const era_bridge::Weakness45State & state)
{
    std::vector<Bonus> added;
    if(state.duration!=0||state.permanentLoss!=0||state.unremovableApplications!=0)
    {
        Bonus marker;marker.type=BonusType::PRIMARY_SKILL;marker.subtype=BonusSubtypeID(PrimarySkill::ATTACK);
        marker.source=BonusSource::OTHER;marker.val=0;marker.hidden=true;marker.duration=BonusDuration::PERMANENT;marker.stacking=weakness45StateTag;
        marker.parameters=std::make_shared<BonusParameters>(std::vector<std::int32_t>{weakness45StateSignature,1,state.duration,state.mastery,state.magnitude,state.permanentLoss,era_bridge::weakness45Signed(state.unremovableApplications)});added.push_back(marker);
        if(state.totalLoss()!=0){Bonus loss=marker;loss.parameters.reset();loss.stacking=weakness45LossTag;loss.val=era_bridge::weakness45Negate(state.totalLoss());added.push_back(loss);}
        if(state.duration>0)
        {
            // Native UI/dispel can identify45. Stats live in the separately owned
            // projection so ordinary Bloodlust counters cannot erase them silently.
            Bonus visible=marker;visible.parameters.reset();visible.stacking=weakness45VisibleTag;
            visible.source=BonusSource::SPELL_EFFECT;visible.sid=BonusSourceID(SpellID(45));visible.hidden=false;
            visible.turnsRemain=state.duration;added.push_back(visible);
        }
    }
    return added;
}
inline SetStackEffect sourceWeakness45Packet(BattleID battleID,
    const battle::Unit * target,const Weakness45NativeSnapshot & old,const era_bridge::Weakness45State & state)
{
    SetStackEffect packet;packet.battleID=battleID;
    if(!old.bonuses.empty())packet.toRemove.emplace_back(target->unitId(),old.bonuses);
    auto added=sourceWeakness45ProjectedBonuses(state);
    if(!added.empty())packet.toAdd.emplace_back(target->unitId(),std::move(added));
    return packet;
}
// Must run INSIDE BattleNextRound before generic durations and poison. This is
// deterministic local state application on server and clients, avoiding a later
// second packet and preserving expiry-before-poison-kill ordering.
inline void sourceWeakness45AdvanceLocal(CStack & target,bool tacticsPhase)
{
    const auto old=readSourceWeakness45(&target);if(!old.owned)return;
    const auto local=target.getLocalBonus(CSelector([](const Bonus * bonus){return bonus->stacking==weakness45StateTag;}));
    if(!local)throw std::runtime_error("Inherited/clone source45 state not reconciled");
    const auto change=era_bridge::weakness45Round(old.state,target.alive(),tacticsPhase);
    if(!change.removed&&change.state.duration==old.state.duration)return;
    target.removeBonuses(CSelector([](const Bonus * bonus){return bonus->stacking==weakness45StateTag||bonus->stacking==weakness45LossTag||bonus->stacking==weakness45VisibleTag;}));
    for(const auto & bonus:sourceWeakness45ProjectedBonuses(change.state))target.addNewBonus(std::make_shared<Bonus>(bonus));
}

inline void sourceWeakness45ClearOnDeathLocal(CStack & target)
{
 const auto old=readSourceWeakness45(&target);if(!old.owned||!old.state.removalAllowed())return;
 target.removeBonuses(CSelector([](const Bonus * b){return era_bridge::weakness45OwnedTag(b->stacking);}));
 for(const auto & b:sourceWeakness45ProjectedBonuses(era_bridge::weakness45Remove(old.state).state))
     target.addNewBonus(std::make_shared<Bonus>(b));
}
inline bool preserveSourceWeakness45Counter(int spell,const Bonus & bonus)
{return spell==43&&bonus.stacking==weakness45VisibleTag;}
inline std::optional<SetStackEffect> sourceWeakness45RemovalPacket(BattleID battleID,const battle::Unit * target)
{
    const auto old=readSourceWeakness45(target);if(!old.owned||!old.state.removalAllowed())return std::nullopt;
    return sourceWeakness45Packet(battleID,target,old,era_bridge::weakness45Remove(old.state).state);
}
inline std::optional<SetStackEffect> sourceWeakness45RoundPacket(BattleID battleID,const battle::Unit * target,bool tacticsPhase)
{
    const auto old=readSourceWeakness45(target);if(!old.owned)return std::nullopt;
    const auto change=era_bridge::weakness45Round(old.state,target->alive(),tacticsPhase);
    if(!change.removed&&change.state.duration==old.state.duration)return std::nullopt;
    return sourceWeakness45Packet(battleID,target,old,change.state);
}
}
VCMI_LIB_NAMESPACE_END
