#pragma once
#include "../CGameHandler.h"
#include "../../lib/era/EraHenchmanModel.h"
#include "../../lib/networkPacks/HenchmanPacks.h"
#include "../../lib/networkPacks/StackLocation.h"
#include "../../lib/networkPacks/PacksForClient.h"
#include "../../lib/gameState/CGameState.h"
#include "../../lib/CPlayerState.h"
#include "../../lib/mapObjects/CGTownInstance.h"
#include "../../lib/battle/CBattleInfoCallback.h"
#include "../../lib/CStack.h"
#include "../../lib/networkPacks/ArtifactLocation.h"
#include "../../lib/networkPacks/EraGameplayPacks.h"
#include "../../lib/filesystem/Filesystem.h"
#include "../../lib/StartInfo.h"
#include "../../lib/era/EraHenchmanBannerSourceRows.h"
#include "../../lib/era/EraSourceCreatureLevels.h"

namespace era_compat::henchmen
{
inline HenchmanChange snapshot(const CGHeroInstance & hero);
inline void initializeSettings(CGameHandler & gh,bool firstTurn)
{
    if(!enabled(gh.gameInfo())||gh.gameState().getMap().eraGameplayState["henchmen"]["settings"].isStruct())return;
    HenchmanSettings rules;
    const auto path=JsonPath::builtin("config/henchmen-settings");
    if(firstTurn&&CResourceHandler::get()->existsResource(path))
        rules=settingsFromJson(JsonNode(path)["henchmen"]["settings"]);
    EraGameplayChange packet;packet.system="henchmen";
    packet.state["settings"]=settingsToJson(rules);gh.sendAndApply(packet);
    const bool resetCampaign=firstTurn&&gh.gameInfo().getStartInfo()->campState&&!rules.campaignTransfer;
    if(!rules.stackExperience||resetCampaign)
        for(const auto id:gh.gameState().getMap().getHeroesOnMap())
            if(const auto * hero=gh.gameInfo().getHero(id))
                if(hero->henchman.stack)
                {
                    auto update=snapshot(*hero);update.stackExperience=0;
                    if(resetCampaign)
                    {update.creature=CreatureID();update.experience=0;update.alive=false;update.declined=false;update.banner=-1;}
                    gh.sendAndApply(update);
                }
}
inline HenchmanChange snapshot(const CGHeroInstance & hero)
{
    HenchmanChange result;result.hero=hero.id;
    const auto & state=hero.henchman;
    if(state.stack){result.creature=state.stack->getId();result.stackExperience=state.stack->getAverageExperience();}
    result.experience=state.experience;result.alive=state.alive;result.declined=state.declined;
    result.banner=bannerStyle(hero);result.revision=state.revision+1;
    return result;
}
inline bool action(CGameHandler & gh,const HenchmanAction & request)
{
    const auto * hero=gh.gameInfo().getHero(request.hero);
    if(!hero||!enabled(gh.gameInfo())||hero->battle||hero->getOwner()!=request.player
        ||hero->henchman.revision!=request.revision)return false;
    auto update=snapshot(*hero);
    const auto rules=settings(gh.gameInfo());
    if(request.operation==HenchmanAction::RESURRECT)
    {
        const auto * town=hero->getVisitedTown();
        if(!hero->henchman.stack||hero->henchman.alive
            ||(!rules.reviveAnywhere&&(!town||town->getOwner()!=hero->getOwner())))return false;
        const auto cost=era_bridge::henchmen::resurrectionCost(
            hero->henchman.stack->getType()->getRecruitCost(GameResID::GOLD),progress(*hero,gh.gameState().day).level);
        if(cost<0||gh.gameInfo().getPlayerState(request.player)->resources[GameResID::GOLD]<cost)return false;
        gh.giveResource(request.player,GameResID::GOLD,-cost);update.alive=true;
    }
    else if(request.operation==HenchmanAction::DISMISS)
    {
        if(!hero->henchman.stack)return false;
        update.creature=CreatureID();update.experience=0;update.stackExperience=0;
        update.alive=false;update.declined=true;
        // Source dismissal discards the equipped banner; only explicit
        // RETURN_BANNER creates an artifact, replacement keeps the style.
        if(rules.banner)update.banner=-1;
    }
    else if(request.operation==HenchmanAction::EQUIP_BANNER)
    {
        if(!rules.banner||!hero->henchman.stack||update.banner>=0
            ||(!hero->henchman.alive&&rules.reviveAnywhere))return false;
        const auto position=availableBanner(*hero);
        if(position==ArtifactPosition::PRE_FIRST)return false;
        gh.removeArtifact(ArtifactLocation(hero->id,position));update.banner=0;
    }
    else if(request.operation==HenchmanAction::SET_BANNER_STYLE)
    {
        if(!rules.banner||!hero->henchman.stack||update.banner<0
            ||request.slot<0||request.slot>8)return false;
        update.banner=request.slot;
    }
    else if(request.operation==HenchmanAction::RETURN_BANNER)
    {
        if(!rules.banner||!hero->henchman.stack||update.banner<0)return false;
        const auto id=bannerArtifact();
        if(!id.hasValue())return false;
        const auto position=ArtifactUtils::getArtBackpackPosition(hero,id);
        if(position==ArtifactPosition::PRE_FIRST||!gh.giveHeroNewArtifact(hero,id,position))return false;
        update.banner=-1;
    }
    else if(request.operation==HenchmanAction::SELECT)
    {
        const SlotID slot(request.slot);
        if(!slot.validSlot()||!hero->hasStackAtSlot(slot))return false;
        const auto & chosen=hero->getStack(slot);
        if(chosen.getId()!=request.expectedCreature||chosen.getCount()<1||emissary(*chosen.getType()))return false;
        if(!era_bridge::henchmen::eligible(candidates(*hero),false,rules.returnToArmy&&hero->henchman.stack&&hero->henchman.alive))return false;
        const auto equipment=chosen.getCount()==1?equipmentReturn(*hero,chosen)
            :std::optional<std::vector<std::pair<ArtifactPosition,ArtifactPosition>>>(std::in_place);
        if(!equipment)return false;
        const bool giveBack=rules.returnToArmy&&hero->henchman.stack&&hero->henchman.alive;
        SlotID returnSlot;
        if(giveBack)
        {
            returnSlot=hero->getSlotFor(hero->henchman.stack->getId());
            if(!returnSlot.validSlot()&&chosen.getCount()==1)returnSlot=slot;
            if(!returnSlot.validSlot())return false;
        }
        update.creature=chosen.getId();update.stackExperience=rules.stackExperience?chosen.getAverageExperience():0;
        update.experience=era_bridge::henchmen::experienceAfterReplacement(hero->henchman.experience,rules);
        const auto oldCreature=hero->henchman.stack?hero->henchman.stack->getId():CreatureID();
        const auto oldExperience=hero->henchman.stack?hero->henchman.stack->getAverageExperience():0;
        for(const auto & [source,destination]:*equipment)
            if(!gh.moveArtifact(request.player,ArtifactLocation(hero->id,slot,source),ArtifactLocation(hero->id,destination)))
                throw std::runtime_error("Henchmen: prevalidated equipment return failed");
        if(!gh.changeStackCount({hero->id,slot},-1,ChangeValueMode::RELATIVE))return false;
        if(giveBack)
        {
            const auto before=hero->getStackPtr(returnSlot);
            const auto count=before?before->getCount():0;
            const auto total=before?before->getTotalExperience():0;
            if(!gh.addToSlot({hero->id,returnSlot},oldCreature.toCreature(),1))throw std::runtime_error("Henchmen: prevalidated return failed");
            // Weighted native stack experience when the returned unit merges.
            update.returnedSlot=returnSlot;
            update.returnedExperience=((total+oldExperience)/(count+1))*(count+1);
        }
        update.alive=true;update.declined=false;
    }
    else return false;
    gh.sendAndApply(update);return true;
}

inline void prepareAI(CGameHandler & gh,const CGHeroInstance * hero)
{
    if(!hero||!enabled(gh.gameInfo())||gh.gameInfo().getPlayerState(hero->getOwner())->isHuman())return;
    const auto options=candidates(*hero);
    const int choice=era_bridge::henchmen::aiCandidate(options);
    if(choice<0)return;
    auto update=snapshot(*hero);update.creature=CreatureID(options[choice].creature);update.alive=true;
    const auto rules=settings(gh.gameInfo());
    if(!rules.stackExperience)update.stackExperience=0;
    if(rules.banner&&update.banner<0)
    {
        const auto position=availableBanner(*hero);
        if(position!=ArtifactPosition::PRE_FIRST)
        {
            update.banner=gh.getRandomGenerator().nextInt(8);
            gh.removeArtifact(ArtifactLocation(hero->id,position));
        }
    }
    gh.sendAndApply(update);
}

inline void finishBattle(CGameHandler & gh,const CBattleInfoCallback & battle,BattleSide winner,
    bool draw,const std::array<int64_t,2> & previousExperience)
{
    if(!enabled(gh.gameInfo()))return;
    const auto rules=settings(gh.gameInfo());
    for(const auto side:{BattleSide::ATTACKER,BattleSide::DEFENDER})
    {
        const auto * hero=battle.battleGetFightingHero(side);
        if(!hero||!hero->henchman.stack)continue;
        const auto actors=battle.battleGetStacksIf([&](const CStack * stack)
            {return stack->unitSide()==side&&stack->unitSlot()==SlotID::HENCHMAN_SLOT_PLACEHOLDER;});
        if(actors.empty())continue;
        auto update=snapshot(*hero);update.alive=actors.front()->alive()&&actors.front()->getCount()>0;
        if(!update.alive)update.stackExperience=0;
        const auto gained=std::max<int64_t>(0,int64_t(hero->exp)-previousExperience[static_cast<int>(side)]);
        const bool ai=!gh.gameInfo().getPlayerState(hero->getOwner())->isHuman();
        if(!draw&&side==winner&&(update.alive||ai)&&gained>0)
        {
            const auto root=era_bridge::henchmen::heroExperienceRoot(static_cast<int32_t>(std::min<int64_t>(gained,INT32_MAX)));
            const int reward=era_bridge::henchmen::battleExperience(gh.getRandomGenerator().nextInt(rules.battleRandom),root,hero->level,ai,0,rules);
            update.experience=era_bridge::henchmen::add(update.experience,reward);
            const auto & stack=*hero->henchman.stack;
            if(update.alive&&rules.stackExperience)
            {
                const auto id=era_bridge::sourceCreatureIdForLevel(stack.getType()->getJsonKey());
                const auto * table=id?era_bridge::henchmen::sourceExperienceTable(*id):nullptr;
                if(table)
                    update.stackExperience=era_bridge::henchmen::stackExperienceGain(
                        era_bridge::henchmen::word(update.stackExperience),era_bridge::henchmen::word(gained),
                        rules.banner&&update.banner==5,*table);
                else
                {
                    const auto added=std::min<int64_t>(gained*stack.getExperienceMultiplier(),stack.getMaxExperienceGainPerBattle());
                    update.stackExperience=std::min<int64_t>(stack.getMaxExperiencePerUnit(),update.stackExperience+added);
                }
            }
        }
        gh.sendAndApply(update);
    }
}
}
