#pragma once
#include "EraStatusSelectors.h"
#include "../CStack.h"
#include "../GameLibrary.h"
#include "../BattleFieldHandler.h"
#include <vcmi/spells/Spell.h>
#include "../battle/CBattleInfoCallback.h"
#include "../bonuses/BonusList.h"
#include "../entities/hero/CHero.h"
#include "../mapObjects/CGHeroInstance.h"
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include "../modding/IdentifierStorage.h"
#include "../modding/ModScope.h"
#include <map>
#include <set>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class StatusAttacks
{
    bool active=false;
    bool redAgeActive=false;
    bool dispelActive=false;
    bool gemBlindActive=false;
    bool antichristStoneActive=false;
    std::map<std::string,int> sourceIds;
public:
    StatusAttacks()
    {
        const auto path=JsonPath::builtin("config/era-bridge-status-attacks");
        if(!CResourceHandler::get()->existsResource(path))return;
        const JsonNode root(path);
        if(!root.isStruct() || root.Struct().size()!=3 || !root["schemaVersion"].isNumber()
            || root["schemaVersion"].Float()!=1 || !root["creatures"].isVector()
            || !root["sourceIds"].isStruct())throw std::runtime_error("ERA status attacks: invalid document");
        for(const auto & value:root["creatures"].Vector())
        {
            if(!value.isString())throw std::runtime_error("ERA status attacks: actor must be a string");
            if(value.String()=="tum-era:necrossDragon" && !active)active=true;
            else if(value.String()=="tum-era:redBonesDragon" && !redAgeActive)redAgeActive=true;
            else if(value.String()=="tum-era:chasmDragon" && !dispelActive)dispelActive=true;
            else if(value.String()=="tum-era:gemDragon" && !gemBlindActive)gemBlindActive=true;
            else if(value.String()=="tum-era:antichrist" && !antichristStoneActive)antichristStoneActive=true;
            else throw std::runtime_error("ERA status attacks: unproven or duplicate actor");
        }
        std::set<int> ids;
        for(const auto & entry:root["sourceIds"].Struct())
        {
            if(entry.first.find(':')==std::string::npos || !entry.second.isNumber()
                || entry.second.Float()<0 || entry.second.Float()>1023
                || entry.second.Float()!=int(entry.second.Float()) || !ids.insert(int(entry.second.Float())).second)
                throw std::runtime_error("ERA status attacks: invalid source identity");
            const auto resolved=LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(),"creature",entry.first,true);
            if(!resolved)throw std::runtime_error("ERA status attacks: unresolved creature "+entry.first);
            sourceIds.emplace(entry.first,int(entry.second.Float()));
        }
        if(active && id("tum-era:necrossDragon")!=254)
            throw std::runtime_error("ERA status attacks: actor254 identity required");
        if(redAgeActive && id("tum-era:redBonesDragon")!=224)
            throw std::runtime_error("ERA status attacks: actor224 identity required");
        if(dispelActive && id("tum-era:chasmDragon")!=231)
            throw std::runtime_error("ERA status attacks: actor231 identity required");
        if(gemBlindActive && id("tum-era:gemDragon")!=207)
            throw std::runtime_error("ERA status attacks: actor207 identity required");
        if(antichristStoneActive && id("tum-era:antichrist")!=219)
            throw std::runtime_error("ERA status attacks: actor219 identity required");
    }
    int id(const std::string & key)const
    {
        const auto found=sourceIds.find(key);return found==sourceIds.end()?-1:found->second;
    }
    bool enabled(const CStack * actor)const
    {return active && actor && actor->creatureId().toCreature()->getJsonKey()=="tum-era:necrossDragon";}
    bool intrinsicAge(const CStack * actor)const
    {return enabled(actor) || (redAgeActive && actor && actor->creatureId().toCreature()->getJsonKey()=="tum-era:redBonesDragon");}
    bool queuedDispel(const CStack * actor)const
    {return dispelActive && actor && actor->creatureId().toCreature()->getJsonKey()=="tum-era:chasmDragon";}
    bool intrinsicBlind(const CStack * actor)const
    {return queuedDispel(actor) || (gemBlindActive && actor && actor->creatureId().toCreature()->getJsonKey()=="tum-era:gemDragon");}
    bool intrinsicStone(const CStack * actor)const
    {return antichristStoneActive && actor && actor->creatureId().toCreature()->getJsonKey()=="tum-era:antichrist";}
    static const StatusAttacks & get(){static const StatusAttacks value;return value;}
};
inline bool statusHasArtifact(const CGHeroInstance * hero,int id)
{return hero && hero->hasArt(ArtifactID(id),true,false);}
inline bool statusEitherArtifact(const CBattleInfoCallback & battle,int id)
{return statusHasArtifact(battle.battleGetFightingHero(BattleSide::ATTACKER),id)
    || statusHasArtifact(battle.battleGetFightingHero(BattleSide::DEFENDER),id);}
inline bool statusThorgrim(const CGHeroInstance * hero)
{return hero && hero->getHeroType()->getJsonKey()=="core:thorgrim";}
inline int statusCHeroResistance(const CGHeroInstance * hero)
{
    if(!hero)return 0;
    const auto source=era_bridge::sourceCHeroResistance(hero->getSecSkillLevel(SecondarySkill::RESISTANCE),hero->level,
        statusThorgrim(hero),statusHasArtifact(hero,57),statusHasArtifact(hero,58),statusHasArtifact(hero,59));
    // Additional hero mods keep their native contributions, never disappear.
    const auto native=hero->valOfBonuses(BonusType::MAGIC_RESISTANCE);
    return hero->getHeroType()->getModScope()=="core" && native==source?source:native;
}
// Context gates precede source natural/hero/aura arithmetic in5A83A0.
// Keep RawAccuracy reusable; callers must still apply their spell/nature checks.
inline bool sourceSpellContextAllows(const CBattleInfoCallback & battle,
    const battle::Unit * target,const spells::Spell * spell)
{
    if(!target || target->isGhost() || !target->alive())return false;
    const int level=spell->getLevel();
    const auto field=battle.battleGetBattlefieldType();
    if(level>1 && field!=BattleField::NONE
        && LIBRARY->battlefields()->getById(field)->identifier=="cursed_ground")return false;
    if(level>2 && statusEitherArtifact(battle,83))return false; //5A8406..8439 Recanter, either hero.
    //44A1EE is before Orb negation; it also protects against level0 abilities.
    if(level<=4 && statusHasArtifact(battle.battleGetOwnerHero(target),134))return false;
    return true;
}
inline float statusSourceAura(const CBattleInfoCallback & battle,const battle::Unit * target)
{
    int aura=0;
    for(const auto * adjacent:battle.battleAdjacentUnits(target))
    {
        if(battle.battleGetOwner(adjacent)!=battle.battleGetOwner(target)
            || !adjacent->alive())continue;
        BonusList values;
        for(const auto & bonus:*adjacent->getBonusesOfType(BonusType::SPELL_RESISTANCE_AURA))
        {
            // Original43E800 builds the aura list independently of Orb93.
            if(bonus->source==BonusSource::ARTIFACT && bonus->sid==BonusSourceID(ArtifactID(93)))continue;
            values.push_back(std::make_shared<Bonus>(*bonus));
        }
        aura=std::max(aura,values.totalValue());
    }
    return static_cast<float>(1.0-double(std::clamp(aura,0,100))/100.0);
}
inline int statusRawAccuracy(const CBattleInfoCallback & battle,const battle::Unit * target)
{
    if(!target || !target->alive() || target->isGhost())return 0;
    const auto sourceId=StatusAttacks::get().id(target->creatureId().toCreature()->getJsonKey());
    const auto * hero=battle.battleGetOwnerHero(target);
    if(sourceId<0) // Additional game creatures keep native resistance and aura.
        return std::clamp(100-target->magicResistance(),0,100);
    if(statusEitherArtifact(battle,93))
        return era_bridge::sourceAccuracyPercent(1.0f,statusSourceAura(battle,target));
    // Reconstruct only source-owned intrinsic/XP and canonical hero inputs.
    // Unknown mod contributions retain native accuracy; they are not discarded.
    BonusList intrinsic;
    for(const auto & bonus:*target->getBonusesOfType(BonusType::MAGIC_RESISTANCE))
    {
        if(bonus->source==BonusSource::CREATURE_ABILITY || bonus->source==BonusSource::STACK_EXPERIENCE)
            intrinsic.push_back(std::make_shared<Bonus>(*bonus));
        else if(bonus->source==BonusSource::SECONDARY_SKILL || bonus->source==BonusSource::HERO_SPECIAL){}
        else if(bonus->source==BonusSource::ARTIFACT && (bonus->sid==BonusSourceID(ArtifactID(57))
            || bonus->sid==BonusSourceID(ArtifactID(58)) || bonus->sid==BonusSourceID(ArtifactID(59)))){}
        else return std::clamp(100-target->magicResistance(),0,100);
    }
    if(hero && hero->getHeroType()->getModScope()!="core")
        return std::clamp(100-target->magicResistance(),0,100);
    const float natural=static_cast<float>(1.0-double(std::clamp(intrinsic.totalValue(),0,100))/100.0);
    const float resistance=hero?era_bridge::sourceHeroResistance(hero->getSecSkillLevel(SecondarySkill::RESISTANCE),
        hero->level,statusThorgrim(hero),statusHasArtifact(hero,57),statusHasArtifact(hero,58),statusHasArtifact(hero,59)):0.0f;
    const float acceptance=static_cast<float>(double(natural)-double(resistance));
    return era_bridge::sourceAccuracyPercent(acceptance,statusSourceAura(battle,target));
}
}
VCMI_LIB_NAMESPACE_END
