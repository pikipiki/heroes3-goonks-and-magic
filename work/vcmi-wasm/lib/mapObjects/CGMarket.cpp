/*
 * CGMarket.cpp, part of VCMI engine
 *
 * Authors: listed in file AUTHORS in main folder
 *
 * License: GNU General Public License v2.0 or later
 * Full text of license available in license.txt file, in main folder
 *
 */

#include "StdInc.h"
#include "../era/EraMithrilModel.h"
#include "CGMarket.h"

#include "CGHeroInstance.h"
#include "CGTownInstance.h"

//#include "../CCreatureHandler.h"
#include "../CPlayerState.h"
//#include "../CSkillHandler.h"
#include "../IGameSettings.h"
#include "../callback/IGameEventCallback.h"
#include "../callback/IGameInfoCallback.h"
#include "../callback/IGameRandomizer.h"
#include "../mapObjectConstructors/AObjectTypeHandler.h"
#include "../mapObjectConstructors/CObjectClassesHandler.h"
#include "../mapObjectConstructors/MarketInstanceConstructor.h"
#include "../networkPacks/PacksForClient.h"
#include "../texts/TextIdentifier.h"

VCMI_LIB_NAMESPACE_BEGIN

ObjectInstanceID CGMarket::getObjInstanceID() const
{
	return id;
}

void CGMarket::initObj(IGameRandomizer & gameRandomizer)
{
	getObjectHandler()->configureObject(this, gameRandomizer);
}

void CGMarket::onHeroVisit(IGameEventCallback & gameEvents, const CGHeroInstance * h) const
{
	gameEvents.showObjectWindow(this, EOpenWindowMode::MARKET_WINDOW, h, true);
}

std::string CGMarket::getPopupText(PlayerColor player) const
{
	if (!getMarketHandler()->hasDescription())
		return getHoverText(player);

	MetaString message = MetaString::createFromRawString("{%s}\r\n\r\n%s");
	message.replaceName(ID, subID);
	message.replaceTextID(getMarketHandler()->getDescriptionTextID());
	return message.toString();
}

std::string CGMarket::getPopupText(const CGHeroInstance * hero) const
{
	return getPopupText(hero->getOwner());
}

int CGMarket::getMarketEfficiency() const
{
	return getMarketHandler()->getMarketEfficiency();
}

int CGMarket::availableUnits(EMarketMode mode, int marketItemSerial) const
{
	return -1;
}

std::shared_ptr<MarketInstanceConstructor> CGMarket::getMarketHandler() const
{
	const auto & baseHandler = getObjectHandler();
	const auto & ourHandler = std::dynamic_pointer_cast<MarketInstanceConstructor>(baseHandler);
	return ourHandler;
}

std::set<EMarketMode> CGMarket::availableModes() const
{
	return getMarketHandler()->availableModes();
}

CGMarket::CGMarket(IGameInfoCallback *cb)
	: CGObjectInstance(cb)
	, IMarket(cb)
{}

std::vector<TradeItemBuy> CGBlackMarket::availableItemsIds(EMarketMode mode) const
{
	switch(mode)
	{
	case EMarketMode::RESOURCE_ARTIFACT:
		{
			std::vector<TradeItemBuy> ret;
			for(const auto & a : artifacts)
				ret.push_back(a);
			return ret;
		}
	default:
		return std::vector<TradeItemBuy>();
	}
}

void CGBlackMarket::newTurn(IGameEventCallback & gameEvents, IGameRandomizer & gameRandomizer) const
{
	int resetPeriod = cb->getSettings().getInteger(EGameSettings::MARKETS_BLACK_MARKET_RESTOCK_PERIOD);

	bool isFirstDay = cb->getDate(Date::DAY) == 1;
	bool regularResetTriggered = resetPeriod != 0 && ((cb->getDate(Date::DAY)-1) % resetPeriod) == 0;

	if (!isFirstDay && !regularResetTriggered)
		return;

	SetAvailableArtifacts saa;
	saa.id = id;
	saa.arts = gameRandomizer.rollMarketArtifactSet();
	gameEvents.sendAndApply(saa);
}

std::vector<TradeItemBuy> CGUniversity::availableItemsIds(EMarketMode mode) const
{
	switch (mode)
	{
		case EMarketMode::RESOURCE_SKILL:
			return skills;

		default:
			return std::vector<TradeItemBuy>();
	}
}

std::string CGUniversity::getSpeechTranslated() const
{
	return getMarketHandler()->getSpeechTranslated();
}

void CGUniversity::onHeroVisit(IGameEventCallback & gameEvents, const CGHeroInstance * h) const
{
	ChangeObjectVisitors cow;
	cow.object = id;
	cow.mode = ChangeObjectVisitors::VISITOR_ADD_PLAYER;
	cow.hero = h->id;
	gameEvents.sendAndApply(cow);
	gameEvents.showObjectWindow(this, EOpenWindowMode::UNIVERSITY_WINDOW, h, true);
}

void CGUniversity::onUniversityWindowClosed(IGameEventCallback & gameEvents,const CGHeroInstance * h) const
{
	if(era_compat::mithril::universityActive(*cb,id))
	{
		const auto eligible=era_compat::mithril::universitySkills(*this,*h);
		if(!cb->getPlayerState(h->getOwner())->isHuman())
		{
			for(const auto & skill:eligible)gameEvents.changeSecSkill(h,skill,2,ChangeValueMode::ABSOLUTE);
		}
		else if(!eligible.empty()&&cb->getResource(h->getOwner(),GameResID::GOLD)>=3000)
		{
			BlockingDialog dialog(true,eligible.size()>1);dialog.player=h->getOwner();
			dialog.text.appendTextID("tum-era.mithril.university.advance");
			for(const auto & skill:eligible)dialog.components.emplace_back(ComponentType::SEC_SKILL,skill,2);
			gameEvents.showBlockingDialog(this,&dialog);return;
		}
	}
}

void CGUniversity::blockingDialogAnswered(IGameEventCallback & gameEvents,const CGHeroInstance * hero,int32_t answer) const
{
	if(era_compat::mithril::universityActive(*cb,id)&&answer>0)
	{
		const auto eligible=era_compat::mithril::universitySkills(*this,*hero);
		const auto selected=eligible.size()==1?0:answer-1;
		if(selected>=0&&static_cast<size_t>(selected)<eligible.size()&&cb->getResource(hero->getOwner(),GameResID::GOLD)>=3000)
		{
			gameEvents.giveResource(hero->getOwner(),GameResID::GOLD,-3000);
			gameEvents.changeSecSkill(hero,eligible[selected],2,ChangeValueMode::ABSOLUTE);
		}
	}
}

bool CGUniversity::wasVisited (PlayerColor player) const
{
	return cb->getPlayerState(player)->visitedObjects.count(id) != 0;
}

std::vector<Component> CGUniversity::getPopupComponents(PlayerColor player) const
{
	std::vector<Component> result;

	if (!wasVisited(player))
		return result;

	for (auto const & skill : skills)
		result.emplace_back(ComponentType::SEC_SKILL, skill.as<SecondarySkill>());

	return result;
}

VCMI_LIB_NAMESPACE_END
