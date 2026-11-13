/* Original manager132A8[2], only initialized by explicit ordered-XP enrollment.
 * Existing bonus serialization; no packet/enum/field addition. GPL-2.0-or-later. */
#pragma once
#include "../battle/CBattleInfoCallback.h"
#include "../battle/IBattleState.h"
#include "../bonuses/BonusParameters.h"
#include "../bonuses/IBonusBearer.h"
#include "../bonuses/BonusList.h"
#include "../bonuses/CBonusSystemNode.h"
#include "../networkPacks/PacksForClient.h"
#include <optional>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
inline const BonusList & xpBattleOwnedBonuses(const CBattleInfoCallback & battle)
{
    const auto * node=dynamic_cast<const CBonusSystemNode *>(battle.getBattle()->getBonusBearer());
    if(!node)throw std::runtime_error("Source XP cache requires battle-owned bonus node");
    return node->getExportedBonusList();
}
inline void xpCacheUniqueOwner(const CBattleInfoCallback & battle,BonusSourceID sid,const std::string & tag)
{
    int own=0;
    for(const auto & b:xpBattleOwnedBonuses(battle))
        if(b->source==BonusSource::CREATURE_ABILITY && b->sid==sid)
        {
            if(b->stacking!=tag)throw std::runtime_error("Reserved source XP battle cache source collision");
            ++own;
        }
    if(own>1)throw std::runtime_error("Duplicate source XP exported battle cache");
}
inline BonusSourceID xpElementalStateSource(){return BonusSourceID(CreatureID(114));}
inline std::optional<std::array<int32_t,2>> xpElementalState(const CBattleInfoCallback & battle)
{
    if(!battle.getBattle())return std::nullopt;
    const Bonus * found=nullptr;
    for(const auto & b:xpBattleOwnedBonuses(battle))
    {
        if(b->source!=BonusSource::CREATURE_ABILITY||b->sid!=xpElementalStateSource()||b->stacking!="eraSourceXp:elementalState:v1")continue;
        if(b->type!=BonusType::DEFENSIVE_STANCE||b->duration!=BonusDuration::ONE_BATTLE||b->val!=0||!b->hidden||!b->parameters)throw std::runtime_error("Invalid source XP elemental cache");
        const auto & p=b->parameters->toVector();
        if(p.size()!=4||p[0]!=0x585045||p[1]!=1||p[2]<-1||p[2]>115||p[3]<-1||p[3]>115
            ||(p[2]!=-1&&(p[2]<112))||(p[3]!=-1&&(p[3]<112)))
            throw std::runtime_error("Invalid source XP elemental cache parameters");
        if(found)throw std::runtime_error("Duplicate source XP elemental cache");found=b.get();
    }
    if(!found)return std::nullopt;
    const auto & p=found->parameters->toVector();return std::array<int32_t,2>{p[2],p[3]};
}
template<class Apply>
void writeXpElementalState(const CBattleInfoCallback & battle,std::array<int32_t,2> value,Apply && apply)
{
    xpCacheUniqueOwner(battle,xpElementalStateSource(),"eraSourceXp:elementalState:v1");
    const auto old=xpElementalState(battle);if(old&&*old==value)return;
    if(old){RemoveBonus remove;remove.who=GiveBonus::ETarget::BATTLE;remove.whoID=battle.getBattle()->getBattleID();
        remove.source=BonusSource::CREATURE_ABILITY;remove.id=xpElementalStateSource();apply(remove);}
    Bonus b;b.type=BonusType::DEFENSIVE_STANCE;b.val=0;b.hidden=true;b.source=BonusSource::CREATURE_ABILITY;
    b.sid=xpElementalStateSource();b.stacking="eraSourceXp:elementalState:v1";b.duration=BonusDuration::ONE_BATTLE;
    b.parameters=std::make_shared<BonusParameters>(std::vector<int32_t>{0x585045,1,value[0],value[1]});
    GiveBonus add(GiveBonus::ETarget::BATTLE,battle.getBattle()->getBattleID(),b);apply(add);
}
template<class Apply>
void recordXpElemental(const CBattleInfoCallback & battle,BattleSide side,int sourceCreature,Apply && apply)
{
    auto state=xpElementalState(battle);if(!state)throw std::runtime_error("Source XP elemental enrollment must precede first action");
    if((side!=BattleSide::ATTACKER&&side!=BattleSide::DEFENDER)||sourceCreature<112||sourceCreature>115)
        throw std::runtime_error("Invalid source XP elemental identity/side");
    (*state)[side==BattleSide::ATTACKER?0:1]=sourceCreature;writeXpElementalState(battle,*state,apply);
}
}
VCMI_LIB_NAMESPACE_END
