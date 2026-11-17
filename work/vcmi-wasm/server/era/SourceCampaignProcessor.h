/* Original campaign event host; GPL-2.0-or-later. */
#pragma once
#include "../../lib/constants/EntityIdentifiers.h"
#include "../../lib/int3.h"
#include <memory>
#include <functional>
#include <string>
class CGameHandler;
VCMI_LIB_NAMESPACE_BEGIN
class CGObjectInstance;
class CGHeroInstance;
class CMapEvent;
class MetaString;
class BattleAction;
VCMI_LIB_NAMESPACE_END
class SourceCampaignProcessor
{
 struct Impl;
 std::unique_ptr<Impl> impl;
public:
 explicit SourceCampaignProcessor(CGameHandler & handler);
 ~SourceCampaignProcessor();
 bool battleEvent(int stage,ObjectInstanceID attacker,ObjectInstanceID defender,ObjectInstanceID attackerHero,ObjectInstanceID defenderHero,std::function<void()> resume);
 bool battleRound(BattleID battle,int sourceRound,std::function<void()> resume);
 bool battleField(BattleID battle,std::function<void()> resume);
 void battleAction(BattleID battle,int stage,const BattleAction & action);
 const CGHeroInstance * battleHero(int side,const CGHeroInstance * fallback);
 int battleBackground();
 void battlePrepared();
 bool demolitionFight(ObjectInstanceID hero,ObjectInstanceID town,int building);
 void demolitionBattleEnding(ObjectInstanceID attacker,ObjectInstanceID defender,bool won);
 void demolitionBattleEnded(ObjectInstanceID attacker,ObjectInstanceID defender,bool won);
 bool preservesAuthoredObjects();
 bool onReady(PlayerColor player);
 bool reply(QueryID query,int selection,const std::string & text,PlayerColor player);
 bool draft(QueryID query,int selection,const std::string & text,PlayerColor player);
 bool deployTroops(ObjectInstanceID hero,SlotID slot,CreatureID creature,int count,const int3 & position,bool takeBack,PlayerColor player);
 bool visit(const CGObjectInstance * object,const CGHeroInstance * hero,bool actualEntry = true);
 void visitEnded(ObjectInstanceID object,ObjectInstanceID hero);
 bool visitPosition(const int3 & position,const CGHeroInstance * hero);
 bool beginTurn(PlayerColor player);
 bool turnPending(PlayerColor player);
 void syncTownClock(PlayerColor player);
 bool townClockEnded(PlayerColor player);
 bool timedEvent(const CMapEvent & event,PlayerColor player);
 MetaString eventMessage(const CMapEvent & event) const;
};
