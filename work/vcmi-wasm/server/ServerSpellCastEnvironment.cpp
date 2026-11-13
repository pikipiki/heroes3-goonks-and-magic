/*
 * ServerSpellCastEnvironment.cpp, part of VCMI engine
 *
 * Authors: listed in file AUTHORS in main folder
 *
 * License: GNU General Public License v2.0 or later
 * Full text of license available in license.txt file, in main folder
 *
 */
#include "StdInc.h"
#include "../lib/era/EraSourceXpGeometryState.h"
#include "ServerSpellCastEnvironment.h"
#include "era/EraRebirth.h"

#include "CGameHandler.h"
#include "queries/QueriesProcessor.h"
#include "queries/CQuery.h"

#include "../lib/gameState/CGameState.h"
#include "../lib/networkPacks/PacksForClientBattle.h"
#include "../lib/networkPacks/SetStackEffect.h"

///ServerSpellCastEnvironment
ServerSpellCastEnvironment::ServerSpellCastEnvironment(CGameHandler * gh)
	: gh(gh)
{
}

bool ServerSpellCastEnvironment::describeChanges() const
{
	return true;
}

void ServerSpellCastEnvironment::complain(const std::string & problem)
{
	gh->complain(problem);
}

vstd::RNG * ServerSpellCastEnvironment::getRNG()
{
	return &gh->getRandomGenerator();
}

void ServerSpellCastEnvironment::apply(CPackForClient & pack)
{
	gh->sendAndApply(pack);
}

void ServerSpellCastEnvironment::apply(BattleLogMessage & pack)
{
	gh->sendAndApply(pack);
}

void ServerSpellCastEnvironment::apply(BattleStackMoved & pack)
{
	gh->sendAndApply(pack);
}

void ServerSpellCastEnvironment::apply(BattleUnitsChanged & pack)
{
	gh->sendAndApply(pack);
}

void ServerSpellCastEnvironment::apply(SetStackEffect & pack)
{
	gh->sendAndApply(pack);
}

void ServerSpellCastEnvironment::apply(StacksInjured & pack)
{
	gh->sendAndApply(pack);
}

void ServerSpellCastEnvironment::apply(BattleObstaclesChanged & pack)
{
    if(const auto * battle=gh->gameState().getBattle(pack.battleID))
        if(auto cache=era_compat::xpGeometryState(*battle))
        {
            for(auto & change:pack.changes)
            {
                if(change.operation==BattleChanges::EOperation::ADD)
                {
                    SpellCreatedObstacle obstacle;obstacle.fromInfo(change);
                    if(obstacle.ID==10||obstacle.ID==11)
                    {
                        obstacle.nativeVisible=false;
                        obstacle.revealed=battle->battleHasNativeStack(obstacle.casterSide==BattleSide::ATTACKER?BattleSide::DEFENDER:BattleSide::ATTACKER);
                        obstacle.toInfo(change);
                    }
                    era_compat::xpGeometryCreated(*cache,obstacle);
                }
                else if(change.operation==BattleChanges::EOperation::REMOVE)
                    for(const auto & obstacle:battle->battleGetAllObstacles())
                        if(obstacle->uniqueID==change.id)era_compat::xpGeometryRemoved(*cache,*obstacle);
            }
            era_compat::writeXpGeometryState(*battle,*cache,[&](auto & packet){gh->sendAndApply(packet);});
        }

	gh->sendAndApply(pack);
}

void ServerSpellCastEnvironment::apply(CatapultAttack & pack)
{
	gh->sendAndApply(pack);
}

const IGameInfoCallback * ServerSpellCastEnvironment::getCb() const
{
	return &gh->gameInfo();
}

const CMap * ServerSpellCastEnvironment::getMap() const
{
	return &gh->gameState().getMap();
}

bool ServerSpellCastEnvironment::moveHero(ObjectInstanceID hid, int3 dst, EMovementMode mode)
{
	return gh->moveHero(hid, dst, mode, false);
}

void ServerSpellCastEnvironment::createBoat(const int3 & visitablePosition, BoatId type, PlayerColor initiator)
{
	return gh->createBoat(visitablePosition, type, initiator);
}

void ServerSpellCastEnvironment::genericQuery(Query * request, PlayerColor color, std::function<void(std::optional<int32_t>)> callback)
{
	auto query = std::make_shared<CGenericQuery>(gh, color, callback);
	request->queryID = query->queryID;
	gh->queries->addQuery(query);
	gh->sendAndApply(*request);
}

void ServerSpellCastEnvironment::afterObstacleTrigger(const CBattleInfoCallback & battle)
{
    applyEraRebirth(*gh, battle);
}
