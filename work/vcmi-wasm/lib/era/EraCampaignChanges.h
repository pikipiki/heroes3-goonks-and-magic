/* Closed replicated mutations used by the pinned original campaign adapters. */
#pragma once
#include "../gameState/CGameState.h"
#include "../CPlayerState.h"
#include "EraCampaignJson.h"
#include "../mapping/CMap.h"
#include "../mapObjects/CGHeroInstance.h"
#include "../mapObjects/CGCreature.h"
#include "../mapObjects/CGPandoraBox.h"
#include "../mapObjects/CGTownInstance.h"
#include "../mapObjects/ObjectTemplate.h"
#include "../mapObjects/MiscObjects.h"
#include "../mapObjects/army/CStackInstance.h"
#include "../bonuses/BonusSelector.h"
#include "../bonuses/Limiters.h"
#include "../bonuses/BonusParameters.h"
#include "../mapping/CCastleEvent.h"
#include "../networkPacks/SourceCampaignChange.h"
#include "../entities/ResourceTypeHandler.h"
#include "EraCampaignTerrainRule.h"
#include <stdexcept>
#include <set>
#include <algorithm>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
inline int campaignInteger(const JsonNode & n)
{
 return era_campaign_json::integer(n);
}
inline void applySourceCampaignChange(CGameState & gs, const SourceCampaignChange & packet)
{
 if(packet.state.isNull()&&packet.worldState.isNull())throw std::runtime_error("Empty original campaign state packet");
 if(!packet.state.isNull())
 {
  if(!packet.state.isStruct()||packet.state["contract"].String()!="source-campaign-state-v1")throw std::runtime_error("Invalid original campaign state packet");
 }
 if(!packet.worldState.isNull())
 {
  const auto & vm=packet.state.isNull()?gs.getMap().sourceCampaignState:packet.state;
  if(!vm.isStruct()||vm["contract"].String()!="source-campaign-state-v1"||!packet.worldState.isStruct()||packet.worldState["contract"].String()!="source-campaign-world-v1"||!packet.worldState["programId"].isString()||!packet.worldState["programSha256"].isString()||packet.worldState["programId"]!=vm["programId"]||packet.worldState["programSha256"]!=vm["vm"]["programSha256"])
   throw std::runtime_error("Invalid original campaign world state packet");
 }
 if(!packet.state.isNull())gs.getMap().sourceCampaignState=packet.state;
 if(!packet.worldState.isNull())gs.getMap().sourceCampaignWorld=packet.worldState;
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
  if(kind=="mapRefresh")
  {
   const int mode=campaignInteger(change["mode"]);const PlayerColor player(campaignInteger(change["player"]));
   if((mode!=1&&mode!=2)||!player.isValidPlayer())throw std::runtime_error("Invalid original redraw request");
   continue;
  }
  if(kind=="terrainAppearance")
  {
   const int3 position(campaignInteger(change["x"]),campaignInteger(change["y"]),campaignInteger(change["z"]));
   if(!gs.getMap().isInTheMap(position))throw std::runtime_error("Invalid original terrain appearance position");
   auto & tile=gs.getMap().getTile(position);
   if(!change["terrain"].isNull())tile.terrainType=TerrainId(campaignInteger(change["terrain"]));
   if(!change["frame"].isNull())tile.terView=era_campaign_terrain::byteWord(campaignInteger(change["frame"]));
   if(!change["road"].isNull())tile.roadType=RoadId(campaignInteger(change["road"]));
   if(!change["mirror"].isNull())tile.extTileFlags=era_campaign_terrain::byteWord(campaignInteger(change["mirror"]));
   gs.getMap().calculateGuardingGreaturePositions(position-int3(1,1,0),position+int3(1,1,0));
   continue;
  }
  if(kind=="terrainAccess")
  {
   const int3 position(campaignInteger(change["x"]),campaignInteger(change["y"]),campaignInteger(change["z"]));
   if(!gs.getMap().isInTheMap(position)||!change["enabled"].isBool())throw std::runtime_error("Invalid original terrain mutation");
   auto & tile=gs.getMap().getTile(position);const bool enabled=change["enabled"].Bool();const auto & operation=change["operation"].String();
   if(operation=="P")
   {
    if(enabled)era_campaign_terrain::hide(tile.blockingObjects,tile.sourceHiddenBlockingObjects);
    else era_campaign_terrain::restore(tile.blockingObjects,tile.sourceHiddenBlockingObjects,[&](ObjectInstanceID id){const auto * obj=gs.getObj(id);return obj&&obj->blockingAt(position);});
    tile.sourceForceBlocked=!enabled;
   }
   else if(operation=="E")
   {
    if(!enabled)era_campaign_terrain::hide(tile.visitableObjects,tile.sourceHiddenVisitableObjects);
    else era_campaign_terrain::restore(tile.visitableObjects,tile.sourceHiddenVisitableObjects,[&](ObjectInstanceID id){const auto * obj=gs.getObj(id);return obj&&obj->visitableAt(position);});
    tile.sourceForceVisitable=enabled;
   }
   else throw std::runtime_error("Invalid original terrain operation");
   gs.getMap().calculateGuardingGreaturePositions(position-int3(1,1,0),position+int3(1,1,0));
   continue;
  }
  if(kind=="playerKey")
  {
   const PlayerColor color(campaignInteger(change["player"]));const int key=campaignInteger(change["color"]);
   if(!color.isValidPlayer()||key<0||key>=8||!change["visited"].isBool())throw std::runtime_error("Invalid original key mutation");
   auto * player=gs.getPlayerState(color,false);if(!player)throw std::runtime_error("Original key owner missing");
   if(change["visited"].Bool())player->visitedObjectsGlobal.insert({Obj::KEYMASTER,MapObjectSubID(key)});
   else player->visitedObjectsGlobal.erase({Obj::KEYMASTER,MapObjectSubID(key)});
   continue;
  }
  if(kind=="playerTownDays")
  {
   const PlayerColor color(campaignInteger(change["player"]));if(!color.isValidPlayer())throw std::runtime_error("Invalid original countdown owner");
   auto * player=gs.getPlayerState(color,false);if(!player)throw std::runtime_error("Original countdown owner missing");
   if(change["days"].isNull())player->daysWithoutCastle=std::nullopt;
   else{const int days=campaignInteger(change["days"]);if(days<0||days>7)throw std::runtime_error("Invalid original countdown shadow");player->daysWithoutCastle=static_cast<std::uint8_t>(days);}
   continue;
  }
  if(kind=="playerResource")
  {
   const PlayerColor color(campaignInteger(change["player"]));
   if(!color.isValidPlayer())throw std::runtime_error("Invalid original resource owner");
   auto * player=gs.getPlayerState(color,false);const GameResID resource(campaignInteger(change["resource"]));
   const auto & resources=LIBRARY->resourceTypeHandler->getAllObjects();
   if(!player||std::find(resources.begin(),resources.end(),resource)==resources.end())throw std::runtime_error("Invalid original player resource mutation");
   // WoG writes the signed word directly; SetResources clamps its whole set.
   player->resources[resource]=campaignInteger(change["amount"]);
   continue;
  }
  const auto id=ObjectInstanceID(campaignInteger(change["object"]));
  auto * object=gs.getObjInstance(id);
  if(!object)throw std::runtime_error("Original campaign mutation target missing");
  if(kind=="firePhase")
  {
   const int phase=campaignInteger(change["phase"]);if(phase<0||phase>5||!object->appearance)throw std::runtime_error("Invalid source fire phase");
   auto appearance=std::make_shared<ObjectTemplate>(*object->appearance);appearance->animationFile=AnimationPath::builtin("era-campaign/fire/phase"+std::to_string(phase));object->appearance=std::move(appearance);
  }
  else if(kind=="heroText")
  {
   auto * hero=dynamic_cast<CGHeroInstance *>(object);
   const int field=campaignInteger(change["field"]);
   if(!hero||(field!=0&&field!=1)||!change["text"].isString())throw std::runtime_error("Invalid original hero text mutation");
   auto & target=field==0?hero->nameCustomTextId:hero->biographyCustomTextId;
   const auto & text=change["text"].String();
   if(text.empty())target.clear();
   else target=mapRegisterLocalizedString("map",gs.getMap(),TextIdentifier("map","sourceCampaign","heroes",id.getNum(),field==0?"name":"biography"),text,"english");
  }
  else if(kind=="heroAppearance")
  {
   if(!dynamic_cast<CGHeroInstance *>(object))throw std::runtime_error("Original portrait target is not a hero");
   // Definitions live in the replicated map state, not global hero types.
  }
  else if(kind=="heroLevel")
  {
   auto * hero=dynamic_cast<CGHeroInstance *>(object);const int level=campaignInteger(change["level"]);
   if(!hero||level<-32768||level>32767)throw std::runtime_error("Invalid original hero level mutation");
   hero->level=static_cast<std::uint32_t>(level);hero->nodeHasChanged();
  }
  else if(kind=="heroGender")
  {
   auto * hero=dynamic_cast<CGHeroInstance *>(object);
   const int gender=campaignInteger(change["gender"]);
   if(!hero||(gender!=0&&gender!=1))throw std::runtime_error("Invalid original hero gender mutation");
   hero->gender=static_cast<EHeroGender>(gender);
  }
  else if(kind=="garrisonRemoval")
  {
   auto * garrison=dynamic_cast<CGGarrison *>(object);if(!garrison||!change["removable"].isBool())throw std::runtime_error("Invalid original garrison removal policy");garrison->removableUnits=change["removable"].Bool();
  }
  else if(kind=="townName")
  {
   auto * town=dynamic_cast<CGTownInstance *>(object);if(!town||!change["text"].isString())throw std::runtime_error("Invalid source town name");town->setCustomName(change["text"].String());
  }
  else if(kind=="townBuilding")
  {
   auto * town=dynamic_cast<CGTownInstance *>(object);const int mode=campaignInteger(change["mode"]),source=campaignInteger(change["building"]),lower=campaignInteger(change["lower"]);
   if(!town||mode<1||mode>5||mode==3||source<0||source>=44||lower< -1||lower>=44)throw std::runtime_error("Invalid source town building mutation");
   const BuildingID building(source);
   if(mode==1)town->addBuilding(building);
   if(mode==2){town->removeBuilding(building);if(lower>=0)town->addBuilding(BuildingID(lower));}
   if(mode==4)town->forbiddenBuildings.erase(building);
   if(mode==5)town->forbiddenBuildings.insert(building);
   town->updateAppearance();town->recreateBuildingsBonuses();
  }
  else if(kind=="heroPatrol")
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
   if(change["neverFlees"].isBool())monster->neverFlees=change["neverFlees"].Bool();
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
   if(change["removeAfterVisit"].isBool())
   {
    event->removeAfterVisit=change["removeAfterVisit"].Bool();
    for(auto & reward:event->configuration.info)reward.reward.removeObject=event->removeAfterVisit;
   }
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
