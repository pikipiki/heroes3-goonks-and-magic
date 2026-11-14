/* Closed replicated mutations used by the pinned original campaign adapters. */
#pragma once
#include "../gameState/CGameState.h"
#include "EraCampaignJson.h"
#include "../mapping/CMap.h"
#include "../mapObjects/CGHeroInstance.h"
#include "../mapObjects/CGCreature.h"
#include "../mapObjects/CGPandoraBox.h"
#include "../mapObjects/CGTownInstance.h"
#include "../mapObjects/army/CStackInstance.h"
#include "../bonuses/BonusSelector.h"
#include "../bonuses/Limiters.h"
#include "../bonuses/BonusParameters.h"
#include "../mapping/CCastleEvent.h"
#include "../networkPacks/SourceCampaignChange.h"
#include <stdexcept>
#include <set>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
inline int campaignInteger(const JsonNode & n)
{
 return era_campaign_json::integer(n);
}
inline void applySourceCampaignChange(CGameState & gs, const SourceCampaignChange & packet)
{
 if(!packet.state.isStruct() || packet.state["contract"].String()!="source-campaign-state-v1")
  throw std::runtime_error("Invalid original campaign state packet");
 gs.getMap().sourceCampaignState=packet.state;
 for(const auto & entry:packet.rewardConfigurations)
 {
  auto * reward=dynamic_cast<CRewardableObject *>(gs.getObjInstance(entry.first));
  if(!reward)throw std::runtime_error("Original campaign reward target missing");
  // LE modifies the event's rewards independently of its seven guard slots.
  // The general SetRewardableConfiguration packet rebuilds guards, so the
  // source adapter deliberately preserves those slots here.
  reward->configuration=entry.second;
 }
 for(const auto & change:packet.changes.Vector())
 {
  const auto & kind=change["kind"].String();
  const auto id=ObjectInstanceID(campaignInteger(change["object"]));
  auto * object=gs.getObjInstance(id);
  if(!object)throw std::runtime_error("Original campaign mutation target missing");
  if(kind=="heroPatrol")
  {
   auto * hero=dynamic_cast<CGHeroInstance *>(object);
   if(!hero)throw std::runtime_error("Original campaign patrol target is not a hero");
   const int radius=campaignInteger(change["radius"]);
   if(radius< -1)throw std::runtime_error("Invalid original campaign patrol radius");
   hero->patrol.initialPos=int3(campaignInteger(change["x"]),campaignInteger(change["y"]),hero->pos.z);
   hero->patrol.patrolling=radius!=-1;
   hero->patrol.patrolRadius=radius==-1?CGHeroInstance::NO_PATROLLING:static_cast<ui32>(radius);
  }
  else if(kind=="heroSpecialty")
  {
   auto * hero=dynamic_cast<CGHeroInstance *>(object);
   if(!hero)throw std::runtime_error("Original campaign specialty target is not a hero");
   const auto & a=change["arguments"].Vector();
   if(a.empty())throw std::runtime_error("Missing original campaign specialty");
   const int type=campaignInteger(a[0]);
   if(type!=4 && type!=6)throw std::runtime_error("Unadmitted original campaign specialty type");
   const auto source=BonusSourceID(hero->getHeroTypeID());
   hero->removeBonusesRecursive(Selector::sourceTypeSel(BonusSource::HERO_SPECIAL));
   if(type==4)
   {
    if(a.size()!=5)throw std::runtime_error("Invalid original campaign creature specialty");
    const auto creature=CreatureID(campaignInteger(a[1]));
    const auto add=[&](BonusType bonusType,BonusSubtypeID subtype,int value)
    {
     auto bonus=std::make_shared<Bonus>(BonusDuration::PERMANENT,bonusType,BonusSource::HERO_SPECIAL,value,source);
     bonus->subtype=subtype;
     bonus->limiter=std::make_shared<CCreatureTypeLimiter>(*creature.toCreature(),true);
     hero->addNewBonus(bonus);
    };
    add(BonusType::PRIMARY_SKILL,BonusSubtypeID(PrimarySkill::ATTACK),campaignInteger(a[2]));
    add(BonusType::PRIMARY_SKILL,BonusSubtypeID(PrimarySkill::DEFENSE),campaignInteger(a[3]));
    add(BonusType::CREATURE_DAMAGE,BonusCustomSubtype::creatureDamageBoth,campaignInteger(a[4]));
   }
   else
   {
    if(a.size()!=4)throw std::runtime_error("Invalid original campaign upgrade specialty");
    for(const int from:std::set<int>{campaignInteger(a[1]),campaignInteger(a[2])})
    {
     auto bonus=std::make_shared<Bonus>(BonusDuration::PERMANENT,BonusType::SPECIAL_UPGRADE,BonusSource::HERO_SPECIAL,0,source);
     bonus->subtype=BonusSubtypeID(CreatureID(from));
     bonus->parameters=std::make_shared<BonusParameters>(CreatureID(campaignInteger(a[3])));
     hero->addNewBonus(bonus);
    }
   }
  }
  else if(kind=="monster")
  {
   auto * monster=dynamic_cast<CGCreature *>(object);
   if(!monster)throw std::runtime_error("Original campaign monster target invalid");
   if(change["message"].isString()){monster->message.clear();monster->message.appendRawString(change["message"].String());}
   if(change["notGrowing"].isBool())monster->notGrowingTeam=change["notGrowing"].Bool();
   if(change["aggression"].isNumber())monster->agression=campaignInteger(change["aggression"]);
   if(change["count"].isNumber())
   {
    const int count=campaignInteger(change["count"]);if(count<0)throw std::runtime_error("Negative original monster count");
    // Source MO:G0 keeps the object and its treasure until the next visit.
    // Preserve the zero-count slot rather than deleting the creature object.
    auto * stack=monster->getStackPtr(SlotID(0));if(!stack)throw std::runtime_error("Missing original monster slot");stack->setCount(count);
   }
  }
  else if(kind=="event")
  {
   auto * event=dynamic_cast<CGEvent *>(object);
   if(!event)throw std::runtime_error("Original campaign local event target invalid");
   if(change["message"].isString()){event->message.clear();event->message.appendRawString(change["message"].String());}
   if(change["players"].isVector())
   {
    event->availableFor.clear();
    for(const auto & player:change["players"].Vector())event->availableFor.insert(PlayerColor(campaignInteger(player)));
   }
   if(change["human"].isBool())event->humanActivate=change["human"].Bool();
   if(change["computer"].isBool())event->computerActivate=change["computer"].Bool();
   if(change["removeAfterVisit"].isBool())event->removeAfterVisit=change["removeAfterVisit"].Bool();
  }
  else if(kind=="eventGuards")
  {
   auto * event=dynamic_cast<CGEvent *>(object);
   if(!event)throw std::runtime_error("Original campaign guard target invalid");
   event->clearSlots();
   for(const auto & slot:change["slots"].Vector())
   {
    const int count=campaignInteger(slot["count"]),index=campaignInteger(slot["slot"]);
    if(index<0||index>6||count<0)throw std::runtime_error("Invalid original campaign guard slot");
    if(count)event->putStack(SlotID(index),std::make_unique<CStackInstance>(&gs,CreatureID(campaignInteger(slot["creature"])),count));
   }
  }
  else if(kind=="castleEvent")
  {
   auto * town=dynamic_cast<CGTownInstance *>(object);
   const int index=campaignInteger(change["index"]);
   if(!town||index<0||index>=town->events.size())throw std::runtime_error("Original campaign castle event target invalid");
   auto & event=town->events[index];
   if(change["firstOccurrence"].isNumber())event.firstOccurrence=campaignInteger(change["firstOccurrence"]);
   if(change["building"].isNumber())event.buildings.insert(BuildingID(campaignInteger(change["building"])));
   if(change["creatureTier"].isNumber())
   {
    const int tier=campaignInteger(change["creatureTier"]);
    if(tier<0||tier>6)throw std::runtime_error("Original campaign castle creature tier invalid");
    event.creatures.resize(std::max<std::size_t>(event.creatures.size(),7));
    event.creatures[tier]=campaignInteger(change["creatureCount"]);
   }
  }
  else throw std::runtime_error("Unadmitted original campaign mutation: "+kind);
 }
}
}
VCMI_LIB_NAMESPACE_END
