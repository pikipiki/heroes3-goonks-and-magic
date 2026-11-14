#pragma once

#include "CRewardableObject.h"

VCMI_LIB_NAMESPACE_BEGIN

class CGTownInstance;

/// Faithful source Cave state is carried by Rewardable::Variables, which is
/// already networked and serialized. No state is kept in process-global caches.
class DLL_LINKAGE CGMysteriousCave : public CRewardableObject
{
 mutable bool appearanceChangedForView=false; // Local renderer invalidation only; never gameplay/save state.
 static void migrateHeroState(IGameEventCallback & events,const IGameInfoCallback & callback);
 void write(IGameEventCallback & events,const std::map<std::string,int> & changes) const;
 int read(const std::string & key,int fallback=0) const;
 void finishVisit(IGameEventCallback & events,const CGHeroInstance * hero,bool convertSubtype=true) const;
 void grantChoice(IGameEventCallback & events,const CGHeroInstance * hero,int choice,bool accepted) const;
 void message(IGameEventCallback & events,const CGHeroInstance * hero,const std::string & text) const;
 bool remoteVisit(IGameEventCallback & events,const CGHeroInstance * hero,int selection) const;
 bool revealObelisk(IGameEventCallback & events,const CGHeroInstance * hero) const;
 bool buildGuild(IGameEventCallback & events,const CGHeroInstance * hero) const;
 void grantArtifact(IGameEventCallback & events,const CGHeroInstance * hero,int sourceId) const;
public:
 using CRewardableObject::CRewardableObject;
 void initObj(IGameRandomizer & randomizer) override;
 bool refreshAppearance();
 bool takeAppearanceChange() const { const bool changed=appearanceChangedForView;appearanceChangedForView=false;return changed; }
 void onHeroVisit(IGameEventCallback & events,const CGHeroInstance * hero) const override;
 void blockingDialogAnswered(IGameEventCallback & events,const CGHeroInstance * hero,int32_t answer) const override;
 void newTurn(IGameEventCallback &,IGameRandomizer &) const override {}
 std::string getHoverText(PlayerColor player) const override;
 std::string getHoverText(const CGHeroInstance * hero) const override;
 std::string getPopupText(PlayerColor player) const override;
 std::string getPopupText(const CGHeroInstance * hero) const override;
 bool wasVisited(PlayerColor player) const override;
 bool wasVisited(const CGHeroInstance * hero) const override;
 static const CGMysteriousCave * controller(const IGameInfoCallback & callback);
 static int heroDays(const IGameInfoCallback & callback,const CGHeroInstance * hero,const std::string & effect);
 static void onPlayerTurnStart(IGameEventCallback & events,IGameInfoCallback & callback,PlayerColor player);
 static void onHeroActivated(IGameEventCallback & events,const CGHeroInstance * hero);
 static void onHeroMoved(IGameEventCallback & events,const CGHeroInstance * hero);
 static bool preventsHostileApproach(const CGHeroInstance * hero,PlayerColor attacker);
 static void recordNeutralHealth(IGameEventCallback & events,const CGHeroInstance * hero,std::int64_t health);
 static void grantNeutralLoot(IGameEventCallback & events,const CGHeroInstance * hero);
 static std::string describeHeroEffects(const CGHeroInstance * hero);
 static bool hasDailyMovementBlessing(const CGHeroInstance * hero);
 static bool isBuilder(const CGHeroInstance * hero);
 static int builderDemolitionsRemaining(const CGHeroInstance * hero,const CGTownInstance * town);
 static bool consumeBuilderDemolition(IGameEventCallback & events,const CGHeroInstance * hero,const CGTownInstance * town);
 static JsonNode builderSnapshot(const CGHeroInstance * hero,const CGTownInstance * town);
 static bool builderDemolish(IGameEventCallback & events,const CGHeroInstance * hero,const CGTownInstance * town,int building,bool recoverGrail=false,bool payOccupants=false);
 static bool builderFightOccupants(IGameEventCallback & events,const CGHeroInstance * hero,const CGTownInstance * town,int building);
 void battleFinished(IGameEventCallback & events,const CGHeroInstance * hero,const BattleResult & result) const override;
 static bool builderRebuild(IGameEventCallback & events,IGameRandomizer & randomizer,const CGHeroInstance * hero,const CGTownInstance * town,int faction);
 static int townDemolitionDamage(const CGTownInstance * town);
 static std::string townDemolitionAnimation(const CGTownInstance * town);
 static int townRebuildReadyDay(const CGTownInstance * town);
 static void setTownRebuildReadyDay(IGameEventCallback & events,const CGTownInstance * town,int day);
 static void clearTownRebuild(IGameEventCallback & events,const CGTownInstance * town);
 static void expireBuilder(IGameEventCallback & events,const CGHeroInstance * hero);
 template<typename Handler> void serialize(Handler & h)
 {
  h & static_cast<CRewardableObject &>(*this);
 }
};

VCMI_LIB_NAMESPACE_END
