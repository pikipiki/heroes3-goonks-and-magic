/* Source hex.low6 + shared latest obstacle index. Older visuals do not imply
 * older mechanical flags after466710. Only explicit XP enrollment creates it. */
#pragma once
#include "EraSourceXpElementalState.h"
#include "EraSourceXpGeometryRule.h"
#include "../battle/CObstacleInstance.h"
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
using XpGeometryState=era_bridge_xp_geometry::HexState;
inline BonusSourceID xpGeometrySource(){return BonusSourceID(CreatureID(115));}
inline std::optional<XpGeometryState> xpGeometryState(const CBattleInfoCallback & battle)
{
    if(!battle.getBattle())return std::nullopt;std::optional<XpGeometryState> state;
    for(const auto & b:xpBattleOwnedBonuses(battle))
    {
        if(b->source!=BonusSource::CREATURE_ABILITY||b->sid!=xpGeometrySource()||b->stacking!="eraSourceXp:geometryState:v1")continue;
        if(state||b->type!=BonusType::DEFENSIVE_STANCE||b->duration!=BonusDuration::ONE_BATTLE||b->val!=0||!b->hidden||!b->parameters)throw std::runtime_error("Invalid source XP hex cache");
        state=era_bridge_xp_geometry::decode(b->parameters->toVector());
    }
    return state;
}
inline int xpObstacleFlags(const CObstacleInstance & obstacle)
{
    if(obstacle.obstacleType==CObstacleInstance::MOAT)return 0;
    if(obstacle.obstacleType!=CObstacleInstance::SPELL_CREATED)return 3;
    switch(obstacle.ID){case 10:return 5;case 11:return 9;case 12:return 35;case 13:return 17;default:return 0;}
}
inline void xpGeometryCreated(XpGeometryState & s,const CObstacleInstance & obstacle)
{
    const int flags=xpObstacleFlags(obstacle);if(!flags)return;
    std::vector<int> shape;for(const auto hex:obstacle.getAffectedTiles())shape.push_back(hex.toInt());
    era_bridge_xp_geometry::created(s,obstacle.pos.toInt(),shape,obstacle.uniqueID,flags);
}
inline void xpGeometryRemoved(XpGeometryState & s,const CObstacleInstance & obstacle)
{
    if(!xpObstacleFlags(obstacle))return;
    std::vector<int> shape;for(const auto hex:obstacle.getAffectedTiles())shape.push_back(hex.toInt());
    era_bridge_xp_geometry::removed(s,obstacle.pos.toInt(),shape);
}
template<class Apply>
void writeXpGeometryState(const CBattleInfoCallback & battle,const XpGeometryState & state,Apply && apply)
{
    xpCacheUniqueOwner(battle,xpGeometrySource(),"eraSourceXp:geometryState:v1");
    if(const auto old=xpGeometryState(battle))
    {
        if(old->flags==state.flags&&old->latest==state.latest)return;
        RemoveBonus remove;remove.who=GiveBonus::ETarget::BATTLE;remove.whoID=battle.getBattle()->getBattleID();remove.source=BonusSource::CREATURE_ABILITY;remove.id=xpGeometrySource();apply(remove);
    }
    const auto p=era_bridge_xp_geometry::encode(state);
    Bonus b;b.type=BonusType::DEFENSIVE_STANCE;b.val=0;b.hidden=true;b.source=BonusSource::CREATURE_ABILITY;b.sid=xpGeometrySource();b.stacking="eraSourceXp:geometryState:v1";b.duration=BonusDuration::ONE_BATTLE;b.parameters=std::make_shared<BonusParameters>(p);
    GiveBonus packet(GiveBonus::ETarget::BATTLE,battle.getBattle()->getBattleID(),b);apply(packet);
}
template<class Apply>
void initializeXpGeometryState(const CBattleInfoCallback & battle,Apply && apply)
{
    if(xpGeometryState(battle))return;XpGeometryState state;
    for(const auto & obstacle:battle.battleGetAllObstacles())xpGeometryCreated(state,*obstacle);
    writeXpGeometryState(battle,state,apply);
}
template<class Apply>
void noteXpGeometryCreated(const CBattleInfoCallback & battle,const CObstacleInstance & obstacle,Apply && apply)
{if(auto state=xpGeometryState(battle)){xpGeometryCreated(*state,obstacle);writeXpGeometryState(battle,*state,apply);}}
template<class Apply>
void noteXpGeometryRemoved(const CBattleInfoCallback & battle,const CObstacleInstance & obstacle,Apply && apply)
{if(auto state=xpGeometryState(battle)){xpGeometryRemoved(*state,obstacle);writeXpGeometryState(battle,*state,apply);}}
inline bool xpGeometryActive(const CBattleInfoCallback & battle,const CObstacleInstance & obstacle,BattleHex hex)
{
    const auto state=xpGeometryState(battle);if(!state||!hex.isValid()||obstacle.obstacleType==CObstacleInstance::MOAT)return true;
    const int bits=xpObstacleFlags(obstacle);return bits==0||(state->flags[hex.toInt()]&bits&~1)!=0;
}
}
VCMI_LIB_NAMESPACE_END
