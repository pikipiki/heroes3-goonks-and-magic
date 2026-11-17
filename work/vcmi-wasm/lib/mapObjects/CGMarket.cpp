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
#include "../networkPacks/EraGameplayPacks.h"
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

namespace
{
void storeUniversityQuery(IGameEventCallback & events,const IGameInfoCallback & cb,const CGHeroInstance & hero,const JsonNode & query)
{
    EraGameplayChange change;change.system="mithril";change.state=era_compat::mithril::state(cb);
    change.state["revision"].Integer()=era_compat::mithril::revision(cb)+1;
    change.state["universityQueries"][std::to_string(hero.id.getNum())]=query;
    events.sendAndApply(change);
}
void showUniversityQuery(IGameEventCallback & events,const CGUniversity & university,const CGHeroInstance & hero,const JsonNode & query)
{
    const int stage=static_cast<int>(query["stage"].Integer());
    BlockingDialog dialog(stage==1,stage==2);dialog.player=hero.getOwner();
    const char * text=stage==1?"advance":stage==2?"choose":stage==3?"learned":"insufficientGold";
    dialog.text.appendTextID(std::string("tum-era.mithril.university.")+text);
    if(stage==1||stage==4)dialog.components.emplace_back(ComponentType::RESOURCE,GameResID(GameResID::GOLD),3000);
    else if(stage==2)
        for(const auto & value:query["choices"].Vector())dialog.components.emplace_back(ComponentType::SEC_SKILL,SecondarySkill(static_cast<int32_t>(value.Integer())),2);
    else dialog.components.emplace_back(ComponentType::SEC_SKILL,SecondarySkill(static_cast<int32_t>(query["chosen"].Integer())),2);
    events.showBlockingDialog(&university,&dialog);
}
}

void CGUniversity::onUniversityWindowClosed(IGameEventCallback & events,const CGHeroInstance * hero) const
{
    if(!era_compat::mithril::universityActive(*cb,id))return;
    const auto eligible=era_compat::mithril::universitySkills(*this,*hero);
    if(!cb->getPlayerState(hero->getOwner())->isHuman())
    {
        for(const auto & skill:eligible)events.changeSecSkill(hero,skill,2,ChangeValueMode::ABSOLUTE);
        return;
    }
    if(eligible.empty())return;
    JsonNode query;query["object"].Integer()=id.getNum();
    query["stage"].Integer()=cb->getResource(hero->getOwner(),GameResID::GOLD)>=3000?1:4;
    for(const auto & skill:eligible)query["choices"].Vector().emplace_back(static_cast<double>(skill.getNum()));
    storeUniversityQuery(events,*cb,*hero,query);showUniversityQuery(events,*this,*hero,query);
}

void CGUniversity::blockingDialogAnswered(IGameEventCallback & events,const CGHeroInstance * hero,int32_t answer) const
{
    if(!era_compat::mithril::universityActive(*cb,id))return;
    auto query=era_compat::mithril::state(*cb)["universityQueries"][std::to_string(hero->id.getNum())];
    if(!query["object"].isNumber()||query["object"].Integer()!=id.getNum())return;
    const int stage=static_cast<int>(query["stage"].Integer());
    const auto clear=[&](){storeUniversityQuery(events,*cb,*hero,JsonNode());};
    if(stage==4||answer<=0){clear();return;}
    if(stage==1)
    {
        if(answer!=1||query["choices"].Vector().empty()){clear();return;}
        query["stage"].Integer()=query["choices"].Vector().size()>1?2:3;
        if(query["stage"].Integer()==3)query["chosen"]=query["choices"].Vector().front();
        storeUniversityQuery(events,*cb,*hero,query);showUniversityQuery(events,*this,*hero,query);return;
    }
    if(stage==2)
    {
        if(static_cast<size_t>(answer)>query["choices"].Vector().size()){clear();return;}
        query["chosen"]=query["choices"].Vector().at(answer-1);query["stage"].Integer()=3;
        const SecondarySkill selected(static_cast<int32_t>(query["chosen"].Integer()));
        if(!selected.hasValue()||hero->getSecSkillLevel(selected)!=1){clear();return;}
        // FU8189 grants a chosen lesson before its acknowledgement. With a
        // single eligible skill, the grant follows that acknowledgement.
        query["skillGranted"].Bool()=true;storeUniversityQuery(events,*cb,*hero,query);
        events.changeSecSkill(hero,selected,2,ChangeValueMode::ABSOLUTE);
        showUniversityQuery(events,*this,*hero,query);return;
    }
    if(stage!=3||answer!=1){clear();return;}
    const SecondarySkill skill(static_cast<int32_t>(query["chosen"].Integer()));
    const bool granted=query["skillGranted"].Bool();
    const bool valid=skill.hasValue()&&(granted?hero->getSecSkillLevel(skill)>=2:hero->getSecSkillLevel(skill)==1)
        &&std::any_of(query["choices"].Vector().begin(),query["choices"].Vector().end(),[&](const JsonNode & value){return value.Integer()==skill.getNum();});
    clear();
    if(valid)
    {
        if(!granted)events.changeSecSkill(hero,skill,2,ChangeValueMode::ABSOLUTE);
        events.giveResource(hero->getOwner(),GameResID::GOLD,-3000);
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
