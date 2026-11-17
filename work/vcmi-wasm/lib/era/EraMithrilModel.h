#pragma once
#include "EraMithrilRules.h"
#include "EraMapRulesModel.h"
#include "../IGameSettings.h"
#include "../callback/IGameInfoCallback.h"
#include "../gameState/CGameState.h"
#include "../mapping/CMap.h"
#include "../mapObjects/MiscObjects.h"
#include "../mapObjects/CGDwelling.h"
#include "../mapObjects/CGHeroInstance.h"
#include "../mapObjects/CGTownInstance.h"
#include "../mapObjects/CGMarket.h"
#include "../mapObjects/CRewardableObject.h"
#include "../CCreatureHandler.h"
#include "../entities/ResourceTypeHandler.h"
#include "../CPlayerState.h"
#include "../spells/CSpellHandler.h"

namespace era_compat::mithril
{
enum Kind {NONE=-1,MINE=0,DWELLING=1,MILL=2,UNIVERSITY=3,SHRINE=4,HUT=5,MONOLITH=6,SHIPYARD=7,TOWN=8};
struct Offer
{
    int kind=NONE,cost=0;
    std::vector<CreatureID> upgrades;
    std::vector<int> alternatives;
    int level=0,current=-1;
    bool available() const{return kind!=NONE&&cost>0;}
};
inline bool enabled(const IGameInfoCallback & cb)
{return cb.getSettings().getBoolean(EGameSettings::MODULE_MITHRIL_ENHANCEMENTS);}
inline const JsonNode & state(const IGameInfoCallback & cb)
{return cb.gameState().getMap().eraGameplayState["mithril"];}
inline uint32_t revision(const IGameInfoCallback & cb)
{return static_cast<uint32_t>(state(cb)["revision"].Integer());}
inline const JsonNode & entry(const IGameInfoCallback & cb,ObjectInstanceID object)
{return state(cb)["objects"][std::to_string(object.getNum())];}
inline GameResID resource()
{
    for(const auto & object:LIBRARY->resourceTypeHandler->objects)
        if(object&&object->getJsonKey()=="mithril"&&object->getModScope()=="wake-of-gods.mithril")return object->getId();
    return GameResID::NONE;
}
inline bool mineActive(const IGameInfoCallback & cb,ObjectInstanceID object)
{return enabled(cb)&&!map_rules::weeklyMines(cb)&&era_bridge::mithril::mineActive(cb.getDate(Date::DAY),entry(cb,object)["mineUntil"].Integer());}
inline bool mineProtected(const IGameInfoCallback & cb,ObjectInstanceID object)
{return enabled(cb)&&map_rules::weeklyMines(cb)&&entry(cb,object)["mineProtected"].Bool();}
inline bool millActive(const IGameInfoCallback & cb,ObjectInstanceID object)
{return enabled(cb)&&entry(cb,object)["mill"].Bool();}
inline bool universityActive(const IGameInfoCallback & cb,ObjectInstanceID object)
{return enabled(cb)&&entry(cb,object)["university"].Bool();}
inline std::vector<SecondarySkill> universitySkills(const CGUniversity & university,const CGHeroInstance & hero)
{
    std::vector<SecondarySkill> result;
    for(const auto & item:university.skills)
    {
        const auto skill=item.as<SecondarySkill>();
        if(skill.hasValue()&&hero.getSecSkillLevel(skill)==1)result.push_back(skill);
        if(result.size()==2)break;
    }
    return result;
}
inline bool nearby(const IGameInfoCallback & cb,const CGObjectInstance & object,PlayerColor player)
{
    const auto target=object.visitablePos();
    for(const auto & id:cb.gameState().getMap().getHeroesOnMap())
        if(const auto * hero=cb.getHero(id))
            if(hero->getOwner()==player&&!hero->isGarrisoned())
            {
                const auto position=hero->visitablePos();
                if(era_bridge::mithril::near(position.x,position.y,position.z,target.x,target.y,target.z))return true;
            }
    return false;
}
inline CreatureID nextUpgrade(CreatureID creature)
{
    const auto & upgrades=creature.toCreature()->upgrades;
    return upgrades.empty()?CreatureID():*upgrades.begin();
}
inline Offer offer(const IGameInfoCallback & cb,const CGObjectInstance & object,PlayerColor player,int choice=0)
{
    Offer result;
    if(!enabled(cb)||!player.isValidPlayer()||resource()==GameResID::NONE)return result;
    const auto relation=cb.getPlayerRelations(player,object.getOwner());
    const bool team=relation==PlayerRelations::SAME_PLAYER||relation==PlayerRelations::ALLIES;
    if(object.ID==Obj::TOWN)
    {
        if(object.getOwner()!=player||choice<0||choice>8)return result;
        result.kind=TOWN;result.cost=choice<7?1:3;return result;
    }
    if(const auto * mine=dynamic_cast<const CGMine *>(&object))
    {
        if(!object.getOwner().isValidPlayer()||!team||mineActive(cb,object.id)||mineProtected(cb,object.id))return result;
        result.kind=MINE;result.cost=era_bridge::mithril::mineCost(mine->producedResource.getNum(),map_rules::weeklyMines(cb));return result;
    }
    if(const auto * dwelling=dynamic_cast<const CGDwelling *>(&object))
    {
        if(!object.getOwner().isValidPlayer()||!team||dwelling->creatures.empty()
            ||dwelling->creatures[0].second.empty())return result;
        if(object.ID!=Obj::CREATURE_GENERATOR1&&object.ID!=Obj::CREATURE_GENERATOR4)return result;
        const auto original=dwelling->creatures[0].second.front();
        const auto upgraded=nextUpgrade(original);
        if(!upgraded.hasValue()||upgraded==original||upgraded.toCreature()->getLevel()!=original.toCreature()->getLevel())return result;
        const CCreature * bloodDragon=nullptr;
        for(const auto & candidate:LIBRARY->creh->objects)
            if(candidate&&candidate->getJsonKey()=="wake-of-gods.level8units:bloodDragon")bloodDragon=candidate.get();
        if(!bloodDragon||upgraded.toCreature()->getFightValue()>=bloodDragon->getFightValue())return result;
        for(size_t i=1;i<dwelling->creatures.size();++i)
            if(!dwelling->creatures[i].second.empty()&&dwelling->creatures[i].second.front()==upgraded)return result;
        result.kind=DWELLING;
        if(object.ID==Obj::CREATURE_GENERATOR4)
        {
            if(original!=CreatureID::AIR_ELEMENTAL)return {};
            result.cost=4;
            for(const auto & slot:dwelling->creatures)
                result.upgrades.push_back(slot.second.empty()?CreatureID():nextUpgrade(slot.second.front()));
        }
        else
        {
            bool previous=false;
            for(const auto & candidate:LIBRARY->creh->objects)
                if(candidate&&candidate->upgrades.count(original)){previous=true;break;}
            result.cost=era_bridge::mithril::dwellingCost(upgraded.toCreature()->getLevel(),previous);
            result.upgrades.push_back(upgraded);
        }
        return result;
    }
    if(object.ID==Obj::SHIPYARD)
    {
        const auto target=object.visitablePos()+int3(-1,0,0);
        if(object.getOwner()==player&&cb.isInTheMap(target)&&cb.getTile(target)->visitableObjects.empty())
        {result.kind=SHIPYARD;result.cost=3;}
        return result;
    }
    if(!nearby(cb,object,player))return result;
    if((object.ID==Obj::WINDMILL||object.ID==Obj::WATER_WHEEL)&&!millActive(cb,object.id))
    {result.kind=MILL;result.cost=5;}
    else if(object.ID==Obj::UNIVERSITY&&!universityActive(cb,object.id))
    {result.kind=UNIVERSITY;result.cost=4;}
    else if(object.ID==Obj::MONOLITH_ONE_WAY_ENTRANCE||object.ID==Obj::MONOLITH_TWO_WAY)
    {result.kind=MONOLITH;result.cost=1;}
    else if(object.ID==Obj::WITCH_HUT)
    {
        const auto * reward=dynamic_cast<const CRewardableObject *>(&object);
        if(!reward||!cb.getPlayerState(player)->visitedObjects.count(object.id))return result;
        const auto current=reward->configuration.getVariable("secondarySkill","gainedSkill");
        if(!current)return result;
        result.current=*current;
        for(int skill=0;skill<28;++skill)
            if(skill!=*current&&cb.isAllowed(SecondarySkill(skill)))result.alternatives.push_back(skill);
        if(!result.alternatives.empty()){result.kind=HUT;result.cost=2;}
    }
    else if(object.ID==Obj::SHRINE_OF_MAGIC_INCANTATION||object.ID==Obj::SHRINE_OF_MAGIC_GESTURE||object.ID==Obj::SHRINE_OF_MAGIC_THOUGHT)
    {
        const auto * reward=dynamic_cast<const CRewardableObject *>(&object);
        if(!reward||!cb.getPlayerState(player)->visitedObjects.count(object.id))return result;
        result.level=object.ID.getNum()-Obj::SHRINE_OF_MAGIC_INCANTATION+1;
        if(object.ID==Obj::SHRINE_OF_MAGIC_INCANTATION)result.level+=object.getObjTypeIndex().getNum();
        const auto current=reward->configuration.getVariable("spell","gainedSpell");
        if(!current)return result;
        result.current=*current;
        for(const auto & spell:LIBRARY->spellh->objects)
            if(spell&&!spell->isSpecial()&&!spell->isCreatureAbility()&&spell->getLevel()==result.level
                &&spell->getId().getNum()!=*current&&cb.isAllowed(spell->getId()))result.alternatives.push_back(spell->getId().getNum());
        if(!result.alternatives.empty()){result.kind=SHRINE;result.cost=result.level;}
    }
    return result;
}
}
