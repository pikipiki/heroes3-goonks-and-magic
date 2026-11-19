/*
 * VisitQueries.cpp, part of VCMI engine
 *
 * Authors: listed in file AUTHORS in main folder
 *
 * License: GNU General Public License v2.0 or later
 * Full text of license available in license.txt file, in main folder
 *
 */
#include "StdInc.h"
#include "VisitQueries.h"

#include "../../lib/gameState/CGameState.h"
#include "../../lib/mapObjects/CGHeroInstance.h"
#include "../../lib/mapObjects/CGTownInstance.h"
#include "../../lib/mapObjects/TownBuildingInstance.h"
#include "../CGameHandler.h"
#include "../era/SourceCampaignProcessor.h"
#include "QueriesProcessor.h"

VisitQuery::VisitQuery(CGameHandler * owner, const CGObjectInstance * Obj, const CGHeroInstance * Hero)
	: CQuery(owner)
	, visitedObject(Obj->id)
	, visitingHero(Hero->id)
{
	addPlayer(Hero->tempOwner);
}

bool VisitQuery::blocksPack(const CPackForServer * pack) const
{
	//During the visit itself ALL actions are blocked.
	//(However, the visit may trigger a query above that'll pass some.)
	return true;
}

void MapObjectVisitQuery::onExposure(QueryPtr topQuery)
{
	auto object = gh->gameState().getObjInstance(visitedObject);
	auto hero = gh->gameState().getHero(visitingHero);

	//Object may have been removed and deleted.
	if (object)
		topQuery->notifyObjectAboutRemoval(object, hero);

	owner->popIfTop(*this);
}

MapObjectVisitQuery::MapObjectVisitQuery(CGameHandler * owner, const CGObjectInstance * Obj, const CGHeroInstance * Hero)
	: VisitQuery(owner, Obj, Hero)
	, removeObjectAfterVisit(false)
{
}

void MapObjectVisitQuery::onRemoval(PlayerColor color)
{
	gh->objectVisitEnded(visitingHero, players.front());
	gh->sourceCampaigns->visitEnded(visitedObject, visitingHero);

	//Can object visit affect 2 players and what would be desired behavior?
	if(removeObjectAfterVisit)
		if(auto object = gh->gameState().getObjInstance(visitedObject))
			gh->removeObject(object, color);
}

TownBuildingVisitQuery::TownBuildingVisitQuery(CGameHandler * owner, const CGTownInstance * Obj, std::vector<const CGHeroInstance *> heroes, std::vector<BuildingID> buildingToVisit)
	: VisitQuery(owner, Obj, heroes.front())
	, visitedTown(Obj)
{
	// generate in reverse order - first building-hero pair to handle must be in the end of vector
	for (auto const * hero : boost::adaptors::reverse(heroes))
		for (auto const & building : boost::adaptors::reverse(buildingToVisit))
			visitedBuilding.push_back({ hero, building});
}

void TownBuildingVisitQuery::onExposure(QueryPtr topQuery)
{
	auto object = gh->gameState().getObjInstance(visitedObject);
	auto hero = gh->gameState().getHero(visitingHero);

	if(topQuery->completesHeroLevelUp() && activeBuilding.getNum() >= 0)
		visitedTown->rewardableBuildings.at(activeBuilding)->heroLevelUpDone(*gh,hero);
	else
		topQuery->notifyObjectAboutRemoval(object, hero);

	onAdded(players.front());
}

void TownBuildingVisitQuery::onAdded(PlayerColor color)
{
	if(restored){restored=false;return;}
	while (!visitedBuilding.empty() && owner->topQuery(color).get() == this)
	{
		visitingHero = visitedBuilding.back().hero->id;
		activeBuilding = visitedBuilding.back().building;
		const auto & building = visitedTown->rewardableBuildings.at(visitedBuilding.back().building);
		processingBuilding = true;
		building->onHeroVisit(*gh, visitedBuilding.back().hero);
		processingBuilding = false;
		visitedBuilding.pop_back();
	}

	if (visitedBuilding.empty() && owner->topQuery(color).get() == this)
		owner->popIfTop(*this);
}

JsonNode TownBuildingVisitQuery::checkpoint() const
{
	JsonNode value;value["kind"].String()="town";
	value["object"].Integer()=visitedObject.getNum();value["hero"].Integer()=visitingHero.getNum();
	value["activeBuilding"].Integer()=activeBuilding.getNum();
	const size_t count=visitedBuilding.size()-(processingBuilding?1:0);
	for(size_t i=0;i<count;++i)
	{
		JsonNode entry;entry["hero"].Integer()=visitedBuilding[i].hero->id.getNum();entry["building"].Integer()=visitedBuilding[i].building.getNum();
		value["remaining"].Vector().push_back(entry);
	}
	return value;
}

TownBuildingVisitQuery::TownBuildingVisitQuery(CGameHandler * owner,const JsonNode & saved)
	:VisitQuery(owner,owner->gameInfo().getObjInstance(ObjectInstanceID(saved["object"].Integer())),owner->gameInfo().getHero(ObjectInstanceID(saved["hero"].Integer())))
	,visitedTown(dynamic_cast<const CGTownInstance *>(owner->gameInfo().getObjInstance(visitedObject)))
	,activeBuilding(saved["activeBuilding"].Integer()),restored(true)
{
	if(!visitedTown)throw std::runtime_error("Saved level reward town no longer exists");
	for(const auto & value:saved["remaining"].Vector())
	{
		const auto * hero=owner->gameInfo().getHero(ObjectInstanceID(value["hero"].Integer()));
		if(!hero)throw std::runtime_error("Saved town building visitor no longer exists");
		visitedBuilding.push_back({hero,BuildingID(value["building"].Integer())});
	}
}
