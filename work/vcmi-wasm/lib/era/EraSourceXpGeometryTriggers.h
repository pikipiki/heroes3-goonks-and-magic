/* Original ground441FBD/442039; per-hex46A150: wall, mine, moat. */
#pragma once
#include "EraSourceXpGeometryState.h"
#include "EraSourceXpObstacle.h"
#include "../spells/ObstacleCasterProxy.h"
#include "../spells/Problem.h"
#include "../networkPacks/PacksForClientBattle.h"
#include <set>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
inline const SpellCreatedObstacle * xpLatestObstacle(const CBattleInfoCallback & battle,int hex)
{
    const auto state=xpGeometryState(battle);if(!state)return nullptr;
    for(const auto & o:battle.battleGetAllObstacles())
        if(o->uniqueID==state->latest[hex])return dynamic_cast<const SpellCreatedObstacle *>(o.get());
    return nullptr;
}
inline bool xpDescriptorKnown(const SpellCreatedObstacle & o){return !o.hidden||o.revealed;}
inline bool xpGeometryVisible(const CBattleInfoCallback & battle,const CObstacleInstance & o,BattleSide side)
{
    if(!xpGeometryState(battle)||o.obstacleType!=CObstacleInstance::SPELL_CREATED||o.ID<10||o.ID>13)return battle.battleIsObstacleVisibleForSide(o,side);
    if(const auto * latest=xpLatestObstacle(battle,o.pos.toInt()))return latest->casterSide==side||xpDescriptorKnown(*latest);
    return false;
}
inline bool xpCastObstacle(SpellCastEnvironment & env,const CBattleInfoCallback & battle,
    const battle::Unit & unit,const SpellCreatedObstacle & record,int original)
{
    auto descriptor=record;descriptor.casterSpellPower=0;
    if(xpObstacleOriginal(record.trigger.hasValue()?record.trigger.toSpell():SpellID(original).toSpell())<0)
    {
        const auto * source=SpellID(record.ID).toSpell();
        const uint32_t raw=uint32_t(record.casterSpellPower)*uint32_t(source->getBasePower())+uint32_t(source->getLevelPower(record.spellLevel));
        std::memcpy(&descriptor.minimalDamage,&raw,sizeof(raw));
    }
    const auto * sp=SpellID(SpellID::decode(original==11?"tum-era:sourceXpLandMineTrigger":"tum-era:sourceXpFireWallTrigger")).toSpell();
    descriptor.trigger=SpellID(sp->getIndex());
    spells::ObstacleCasterProxy caster(battle.sideToPlayer(record.casterSide),battle.battleGetFightingHero(record.casterSide),descriptor);
    spells::BattleCast cast(&battle,&caster,spells::Mode::PASSIVE,sp);
    spells::Target target(1,spells::Destination(&unit));spells::detail::ProblemImpl problem;
    if(!sp->battleMechanics(&cast)->canBeCastAt(target,problem))return false;
    cast.cast(&env,target);env.afterObstacleTrigger(battle);return true;
}
inline bool xpGeometryTriggers(SpellCastEnvironment & env,const CBattleInfoCallback & battle,
    const battle::Unit & unit,const BattleHexArray & passed,std::set<int> & handled)
{
    if(!xpGeometryState(battle))return false;
    //Source46A150 reuses a visited-hex bitmap across the movement episode.
    bool stopped=false,moatAlready=false;
    const auto obstacles=battle.battleGetAllObstacles();
    for(const auto & o:obstacles)
        if(o->obstacleType==CObstacleInstance::MOAT||(o->obstacleType==CObstacleInstance::SPELL_CREATED&&o->ID>=10&&o->ID<=13))handled.insert(o->uniqueID);
    for(const auto hex:unit.getHexes())
    {
        if(!hex.isValid()||passed.contains(hex))continue;
        auto state=xpGeometryState(battle);const int p=hex.toInt();
        if((state->flags[p]&4)&&!unit.hasBonusOfType(BonusType::FLYING))
        {
            stopped=true;
            if(const auto * record=xpLatestObstacle(battle,p))
            {
                SpellCreatedObstacle update;update.uniqueID=record->uniqueID;update.revealed=true;
                BattleObstaclesChanged packet;packet.battleID=battle.getBattle()->getBattleID();packet.changes.emplace_back();
                update.toInfo(packet.changes.back(),ObstacleChanges::EOperation::UPDATE);env.apply(packet);
            }
        }
        //Each phase rereads latest:355AfterWound can create a newer wall.
        if(unit.alive()&&(xpGeometryState(battle)->flags[p]&16))
            if(const auto * record=xpLatestObstacle(battle,p))xpCastObstacle(env,battle,unit,*record,13);
        if(unit.alive()&&(xpGeometryState(battle)->flags[p]&8))
            if(const auto * record=xpLatestObstacle(battle,p))
                if(unit.unitSide()!=record->casterSide&&!xpDescriptorKnown(*record))
                {
                    const auto descriptor=*record;
                    if(xpCastObstacle(env,battle,unit,descriptor,11))
                    {
                        noteXpGeometryRemoved(battle,descriptor,[&](auto & packet){env.apply(packet);});
                        BattleObstaclesChanged remove;remove.battleID=battle.getBattle()->getBattleID();
                        remove.changes.emplace_back(descriptor.uniqueID,ObstacleChanges::EOperation::REMOVE);env.apply(remove);
                    }
                }
        if(!unit.alive())return true;
        //46A150 calls moat once even when both head/tail are in it.
        for(const auto & o:obstacles)
        {
            if(moatAlready||o->obstacleType!=CObstacleInstance::MOAT||!o->getAffectedTiles().contains(hex))continue;
            if(hex==BattleHex::GATE_BRIDGE&&battle.battleIsGatePassable())continue;
            moatAlready=true;stopped=true;
            const auto * record=dynamic_cast<const SpellCreatedObstacle *>(o.get());
            if(!record||!record->trigger.hasValue())continue;
            const auto * sp=record->trigger.toSpell();
            spells::ObstacleCasterProxy caster(battle.sideToPlayer(record->casterSide),battle.battleGetFightingHero(record->casterSide),*record);
            spells::BattleCast cast(&battle,&caster,spells::Mode::PASSIVE,sp);spells::Target target(1,spells::Destination(&unit));spells::detail::ProblemImpl problem;
            if(sp->battleMechanics(&cast)->canBeCastAt(target,problem)){cast.cast(&env,target);env.afterObstacleTrigger(battle);}
            if(!unit.alive())return true;
        }
    }
    return stopped;
}
}
VCMI_LIB_NAMESPACE_END
