/*
 * NewTurnProcessor.cpp, part of VCMI engine
 *
 * Authors: listed in file AUTHORS in main folder
 *
 * License: GNU General Public License v2.0 or later
 * Full text of license available in license.txt file, in main folder
 *
 */
#include "StdInc.h"
#include "../../lib/era/EraIncomeRuntime.h"
#include "../../lib/era/EraMithrilModel.h"
#include "../era/EraHenchmanRuntime.h"
#include "../era/EraMapRulesRuntime.h"
#include "../era/EraRogueAmbushRuntime.h"
#include "../era/EraCreaturePricesRuntime.h"
#include "../era/EraScriptRulesRuntime.h"
#include "../era/EraMithrilRandomSeed.h"
#include "../era/EraMithrilWeeklySites.h"
#include "../era/EraMithrilResourceReplacement.h"
#include "../era/SourceCampaignProcessor.h"
#include "NewTurnProcessor.h"

#include "HeroPoolProcessor.h"

#include "../CGameHandler.h"
#include "../era/EraWayfarerRuntime.h"
#include "../era/EraDragonlingEvolutionRuntime.h"
#include "../era/EraObjectReplacementRuntime.h"

#include "../../lib/CPlayerState.h"
#include "../../lib/mapObjects/CGMysteriousCave.h"
#include "../../lib/era/EraBridgeArtifactPolicies.h"
#include "../../lib/era/EraBridgePolicies.h"
#include "../../lib/era/EraCampaignCalendarJson.h"
#include "../../lib/era/EraSourceCreatureLevels.h"
#include "../../lib/modding/IdentifierStorage.h"
#include "../../lib/modding/ModScope.h"
#include "../../lib/entities/artifact/CArtifact.h"
#include "../../lib/entities/artifact/CArtifactInstance.h"
#include "../../lib/IGameSettings.h"
#include "../../lib/StartInfo.h"
#include "../../lib/callback/GameRandomizer.h"
#include "../../lib/constants/StringConstants.h"
#include "../../lib/entities/building/CBuilding.h"
#include "../../lib/entities/faction/CTownHandler.h"
#include "../../lib/entities/ResourceTypeHandler.h"
#include "../../lib/gameState/CGameState.h"
#include "../../lib/gameState/SThievesGuildInfo.h"
#include "../../lib/mapObjects/CGHeroInstance.h"
#include "../../lib/mapObjects/CGTownInstance.h"
#include "../../lib/mapObjects/IOwnableObject.h"
#include "../../lib/mapping/CMap.h"
#include "../../lib/mapping/CCastleEvent.h"
#include "../../lib/networkPacks/PacksForClient.h"
#include "../../lib/networkPacks/StackLocation.h"
#include "../../lib/pathfinder/TurnInfo.h"
#include "../../lib/texts/CGeneralTextHandler.h"

#include <vstd/RNG.h>

NewTurnProcessor::NewTurnProcessor(CGameHandler * gameHandler)
	:gameHandler(gameHandler)
{
}

void NewTurnProcessor::handleTimeEvents(PlayerColor color)
{
	for (auto const & event : gameHandler->gameState().getMap().events)
	{
		if (!event.occursToday(gameHandler->gameState().day))
			continue;

		if (!event.affectsDifficulty(gameHandler->gameInfo().getStartInfo()->getDifficulty()))
			continue;

		if (!event.affectsPlayer(color, gameHandler->gameInfo().getPlayerState(color)->isHuman()))
			continue;
		if(gameHandler->sourceCampaigns->timedEvent(event,color))
			continue;
		applyTimeEvent(event,color);
	}
}


void NewTurnProcessor::applyTimeEvent(const CMapEvent & event,PlayerColor color)
{
	InfoWindow iw;
	iw.player = color;
	iw.text = gameHandler->sourceCampaigns->eventMessage(event);

	//give resources
	if (!event.resources.empty())
	{
		gameHandler->giveResources(color, event.resources);
		for (GameResID i : LIBRARY->resourceTypeHandler->getAllObjects())
			if (event.resources[i])
				iw.components.emplace_back(ComponentType::RESOURCE, i, event.resources[i]);
	}

	//remove objects specified by event
	for(const ObjectInstanceID objectIdToRemove : event.deletedObjectsInstances)
	{
		const auto * objectInstance = gameHandler->gameInfo().getObj(objectIdToRemove, false);
		if(objectInstance != nullptr)
			gameHandler->removeObject(objectInstance, PlayerColor::NEUTRAL);
	}
	// A suppressed source GE marker has already executed its script. Keep
	// real messages and resource rewards, without adding an empty window.
    if(!iw.text.toString().empty()||!iw.components.empty()||event.message.toString().empty())
        gameHandler->sendAndApply(iw); //show dialog
}

void NewTurnProcessor::handleTownEvents(const CGTownInstance * town)
{
	for (auto const & event : town->events)
	{
		if (!event.occursToday(gameHandler->gameState().day))
			continue;

		if (!event.affectsDifficulty(gameHandler->gameInfo().getStartInfo()->getDifficulty()))
			continue;

		PlayerColor player = town->getOwner();
		if (!event.affectsPlayer(player, gameHandler->gameInfo().getPlayerState(player)->isHuman()))
			continue;

		// dialog
		InfoWindow iw;
		iw.player = player;
		iw.text = gameHandler->sourceCampaigns->eventMessage(event);

		if (event.resources.nonZero())
		{
			gameHandler->giveResources(player, event.resources);

			for (GameResID i : LIBRARY->resourceTypeHandler->getAllObjects())
				if (event.resources[i])
					iw.components.emplace_back(ComponentType::RESOURCE, i, event.resources[i]);
		}

		for (auto & i : event.buildings)
		{
			// Only perform action if:
			// 1. Building exists in town (don't attempt to build Lvl 5 guild in Fortress
			// 2. Building was not built yet
			// othervice, silently ignore / skip it
			if (town->getTown()->buildings.count(i) && !town->hasBuilt(i))
			{
				gameHandler->buildStructure(town->id, i, true);
				iw.components.emplace_back(ComponentType::BUILDING, BuildingTypeUniqueID(town->getFactionID(), i));
			}
		}

		if (!event.creatures.empty())
		{
			SetAvailableCreatures sac;
			sac.tid = town->id;
			sac.creatures = town->creatures;

			for (si32 i=0;i<event.creatures.size();i++) //creature growths
			{
				if (i < town->creatures.size() && !town->creatures.at(i).second.empty() && event.creatures.at(i) > 0)//there is dwelling
				{
					sac.creatures[i].first += event.creatures.at(i);
					iw.components.emplace_back(ComponentType::CREATURE, town->creatures.at(i).second.back(), event.creatures.at(i));
				}
			}

			gameHandler->sendAndApply(sac); //show dialog
		}
		gameHandler->sendAndApply(iw); //show dialog
	}
}

void NewTurnProcessor::onPlayerTurnStarted(PlayerColor which)
{
	if(gameHandler->sourceCampaigns->beginTurn(which))return;
	preparePlayerTurnStarted(which);
	handleTimeEvents(which);
	finishPlayerTurnStarted(which);
}

void NewTurnProcessor::preparePlayerTurnStarted(PlayerColor which)
{
    era_compat::rogues::playerTurn(*gameHandler,which);
    era_compat::creature_prices::playerTurn(*gameHandler,which);
    // Global object newTurn has regenerated weekly stocks before players run.
    era_compat::mithril::replaceResources(*gameHandler);
    era_compat::mithril::weeklySites(*gameHandler);
	// Source rule117 runs after the initial dwelling stocks have been generated.
	era_compat::map_rules::addExtraDwellingCreatures(*gameHandler);
	era_compat::map_rules::markInitialArtifacts(*gameHandler);
	era_compat::map_rules::groundFliers(*gameHandler);
	era_compat::map_rules::disableBaseShooting(*gameHandler);
	era_compat::map_rules::invertCreatureSpeeds(*gameHandler);
	era_compat::map_rules::placeDailyPlains(*gameHandler,which);
	const auto * playerState = gameHandler->gameState().getPlayerState(which);
    applyEraWayfarerDay(*gameHandler,*playerState);

    // Amethyst Daily_Res: maximum per resource across eligible armies, but
    // gold tax is per individual. Garrison heroes are already in getHeroes().
    ResourceSet income;
    int64_t tax = 0;
    const auto accumulate = [&](const CArmedInstance * army)
    {
        for(const auto & entry : army->Slots())
        {
            const auto * stack = entry.second.get();
            const auto rule = era_compat::Policies::get().dailyResources(stack->getId().toCreature()->getJsonKey());
            if(!rule)
                continue;
            income[rule->resource] = std::max<int64_t>(income[rule->resource], rule->amount);
            const int64_t amount = static_cast<int64_t>(rule->goldPerCreature) * stack->getCount();
            if(amount > std::numeric_limits<int64_t>::max() - tax)
                throw std::runtime_error("ERA bridge: daily tax overflow");
            tax += amount;
        }
    };
    for(const auto * hero : playerState->getHeroes())
        accumulate(hero);
    for(const auto * town : playerState->getTowns())
        if(!town->getGarrisonHero())
            accumulate(town);
    if(tax > std::numeric_limits<TResource>::max() - income[GameResID::GOLD])
        throw std::runtime_error("ERA bridge: daily gold overflow");
    income[GameResID::GOLD] += tax;
    if(income.nonZero())
    {
        gameHandler->giveResources(which, income);
    }

	// Emerald events.cpp:303-308: equipped artifacts convert army types for free
	// once at the owning player's new-day turn. Do not use town visits/player UI events: visiting and
	// garrison heroes appear there too, and would be converted twice.
	const auto & artifactPolicies = era_compat::ArtifactPolicies::get();
	for(const CGHeroInstance * hero : playerState->getHeroes())
		{
			::era_bridge::EquippedDailyConversions equipped{};
			for(int position = 0; position < 19; ++position)
			{
				const auto * artifact = hero->getArt(ArtifactPosition(position));
				if(!artifact)
					continue; // excludes backpack and locked combination placeholders
				const auto * pairs = artifactPolicies.dailyConversions(artifact->getType()->getJsonKey());
				if(pairs)
					equipped[position] = *pairs;
			}
			std::array<int, 7> army;
			army.fill(-1);
			for(int slot = 0; slot < 7; ++slot)
				if(hero->hasStackAtSlot(SlotID(slot)))
					army[slot] = hero->getStackPtr(SlotID(slot))->getId().getNum();
			for(const auto & conversion : ::era_bridge::planDailyConversions(army, equipped))
			{
				SetStackType packet;
				packet.army = hero->id;
				packet.slot = SlotID(static_cast<int>(conversion.armySlot));
				packet.type = CreatureID(conversion.to);
				packet.preserveExperience = true;
				gameHandler->sendAndApply(packet); // shared authoritative state, count unchanged
			}
		}

    // Era ProcessErm fires native event handlers before the ERM trigger body.
    applyEraDragonlingEvolutionDay(*gameHandler,*playerState);

}

void NewTurnProcessor::finishPlayerTurnStarted(PlayerColor which)
{
	const auto * playerState = gameHandler->gameState().getPlayerState(which);
	for (const auto * t : playerState->getTowns())
		handleTownEvents(t);

	for (const auto * t : playerState->getTowns())
	{
		//garrison hero first - consistent with original H3 Mana Vortex and Battle Scholar Academy levelup windows order
		if (t->getGarrisonHero() != nullptr)
			gameHandler->objectVisited(t, t->getGarrisonHero(),false);

		if (t->getVisitingHero() != nullptr)
			gameHandler->objectVisited(t, t->getVisitingHero(),false);
	}
    CGMysteriousCave::onPlayerTurnStart(*gameHandler,gameHandler->gameInfo(),which);
}

void NewTurnProcessor::onPlayerTurnEnded(PlayerColor which)
{
	const auto * playerState = gameHandler->gameState().getPlayerState(which);
	assert(playerState->status == EPlayerStatus::INGAME);

 if(!gameHandler->sourceCampaigns->townClockEnded(which))
 {
	if (playerState->getTowns().empty())
	{
		DaysWithoutTown pack;
		pack.player = which;
		pack.daysWithoutCastle = playerState->daysWithoutCastle.value_or(0) + 1;
		gameHandler->sendAndApply(pack);
	}
	else
	{
		if (playerState->daysWithoutCastle.has_value())
		{
			DaysWithoutTown pack;
			pack.player = which;
			pack.daysWithoutCastle = std::nullopt;
			gameHandler->sendAndApply(pack);
		}
	}

 }
	// Both ordinary and source-controlled countdowns use the native loss check.
	gameHandler->checkVictoryLossConditionsForPlayer(which);
	bool newWeek = gameHandler->gameInfo().getDate(Date::DAY_OF_WEEK) == 7; // end of 7th day

	if (newWeek) //new heroes in tavern
		gameHandler->heroPool->onNewWeek(which);
}

ResourceSet NewTurnProcessor::generatePlayerIncome(PlayerColor playerID, bool newWeek)
{
	const auto & playerSettings = gameHandler->gameInfo().getPlayerSettings(playerID);
	const PlayerState & state = gameHandler->gameState().players.at(playerID);
	ResourceSet income;

	for (const auto & town : state.getTowns())
	{
		if (newWeek && town->hasBuilt(BuildingSubID::TREASURY))
		{
			//give 10% of starting gold
			income[EGameResID::GOLD] += state.resources[EGameResID::GOLD] / 10;
		}

		//give resources if there's a Mystic Pond
		if (newWeek && town->hasBuilt(BuildingSubID::MYSTIC_POND))
		{
			static constexpr std::array rareResources = {
				GameResID::MERCURY,
				GameResID::SULFUR,
				GameResID::CRYSTAL,
				GameResID::GEMS
			};

			auto resID = *RandomGeneratorUtil::nextItem(rareResources, gameHandler->getRandomGenerator());
			int resVal = gameHandler->getRandomGenerator().nextInt(1, 4);

			income[resID] += resVal;

			gameHandler->setObjPropertyValue(town->id, ObjProperty::BONUS_VALUE_FIRST, resID);
			gameHandler->setObjPropertyValue(town->id, ObjProperty::BONUS_VALUE_SECOND, resVal);
		}
	}

	for(auto & k : LIBRARY->resourceTypeHandler->getAllObjects())
	{
		income += state.valOfBonuses(BonusType::RESOURCES_CONSTANT_BOOST, BonusSubtypeID(k));
		income += state.valOfBonuses(BonusType::RESOURCES_TOWN_MULTIPLYING_BOOST, BonusSubtypeID(k)) * state.getTowns().size();
	}

	if(newWeek) //weekly crystal generation if 1 or more crystal dragons in any hero army or town garrison
	{
		bool hasCrystalGenCreature = false;
		for (const auto & hero : state.getHeroes())
			for(const auto & stack : hero->stacks)
				if(stack.second->hasBonusOfType(BonusType::SPECIAL_CRYSTAL_GENERATION))
					hasCrystalGenCreature = true;

		for(const auto & town : state.getTowns())
			for(const auto & stack : town->stacks)
				if(stack.second->hasBonusOfType(BonusType::SPECIAL_CRYSTAL_GENERATION))
					hasCrystalGenCreature = true;

		if(hasCrystalGenCreature)
			income[EGameResID::CRYSTAL] += 3;
	}

	ResourceSet unscaledIncome;
	for (const auto * obj : state.getOwnedObjects())
	{
		income += obj->asOwnable()->dailyIncomeBeforeHandicap();
		unscaledIncome += obj->asOwnable()->dailyIncomeOutsideHandicap();
	}
	TResources incomeHandicapped = income;

	if (!state.isHuman())
	{
		// Initialize bonuses for different resources
		int difficultyIndex = gameHandler->gameState().getStartInfo()->difficulty;
		const std::string & difficultyName = GameConstants::DIFFICULTY_NAMES[difficultyIndex];
		const JsonNode & weeklyBonusesConfig = gameHandler->gameState().getSettings().getValue(EGameSettings::RESOURCES_WEEKLY_BONUSES_AI);
		const JsonNode & difficultyConfig = weeklyBonusesConfig[difficultyName];

		// Distribute weekly bonuses over 7 days, depending on the current day of the week
		for (GameResID i : LIBRARY->resourceTypeHandler->getAllObjects())
		{
			const std::string & name = i.toResource()->getJsonKey();
			int64_t weeklyBonus = difficultyConfig[name].Integer();
			int64_t dayOfWeek = gameHandler->gameState().getDate(Date::DAY_OF_WEEK);
			int64_t dailyIncome = incomeHandicapped[i];
			int64_t amountTillToday = dailyIncome * weeklyBonus * (dayOfWeek-1) / 7 / 100;
			int64_t amountAfterToday = dailyIncome * weeklyBonus * dayOfWeek / 7 / 100;
			int64_t dailyBonusToday = amountAfterToday - amountTillToday;
			int64_t totalIncomeToday = std::min(GameConstants::PLAYER_RESOURCES_CAP, incomeHandicapped[i] + dailyBonusToday);
			incomeHandicapped[i] = totalIncomeToday;
		}
	}

	// ERA rounds once per resource, after summing mines and other regular income.
	era_compat::applyIncomeHandicap(incomeHandicapped, playerSettings->handicap.percentIncome);
	incomeHandicapped += unscaledIncome;
	// Source OW:R compensation is a raw grant, after ordinary income modifiers.
	if(!state.isHuman() && era_compat::mithril::enabled(gameHandler->gameInfo()))
	{
		const auto currency = era_compat::mithril::resource();
		if(currency != GameResID::NONE)
			incomeHandicapped[GameResID::GOLD] += (state.resources[currency] + incomeHandicapped[currency]) * 100;
	}

	return incomeHandicapped;
}

SetAvailableCreatures NewTurnProcessor::generateTownGrowth(const CGTownInstance * t, EWeekType weekType, CreatureID creatureWeek, bool firstDay, int additionalGrowth)
{
	SetAvailableCreatures sac;
	PlayerColor player = t->tempOwner;

	sac.tid = t->id;
	sac.creatures = t->creatures;
 if(CGMysteriousCave::sourceTownRuin(t))
 {
  for(auto & level:sac.creatures){level.first=0;level.second.clear();}
  return sac;
 }

	for (int k=0; k < t->getTown()->creatures.size(); k++)
	{
		if (t->creatures.at(k).second.empty())
			continue;

		uint32_t creaturesBefore = t->creatures.at(k).first;
		uint32_t creatureGrowth = 0;
		const CCreature *cre = t->creatures.at(k).second.back().toCreature();

		if (firstDay)
		{
			creatureGrowth = cre->getGrowth();
		}
		else
		{
			creatureGrowth = t->creatureGrowth(k);

			//Deity of fire week - upgrade both imps and upgrades
			if (weekType == EWeekType::DEITYOFFIRE && vstd::contains(t->creatures.at(k).second, creatureWeek))
				creatureGrowth += additionalGrowth;

			//bonus week, effect applies only to identical creatures
			if (weekType == EWeekType::BONUS_GROWTH && cre->getId() == creatureWeek)
				creatureGrowth += additionalGrowth;
		}

		// Neutral towns have halved creature growth
		if (!player.isValidPlayer())
			creatureGrowth /= 2;

		uint32_t resultingCreatures = 0;

		if (weekType == EWeekType::PLAGUE)
			resultingCreatures = creaturesBefore / 2;
		else if (weekType == EWeekType::DOUBLE_GROWTH && vstd::contains(t->creatures.at(k).second, creatureWeek))
			resultingCreatures = (creaturesBefore + creatureGrowth) * 2;
		else
			resultingCreatures = creaturesBefore + creatureGrowth;

		sac.creatures.at(k).first = resultingCreatures;
	}

	return sac;
}

void NewTurnProcessor::updateNeutralTownGarrison(const CGTownInstance * t, int currentWeek) const
{
 if(CGMysteriousCave::sourceTownRuin(t))return;
	assert(t);
	assert(!t->getOwner().isValidPlayer());

	constexpr int randomRollsCounts = 3; // H3 makes around 3 random rolls to make simple bell curve distribution
	constexpr int upgradeChance = 5; // Chance for a unit to get an upgrade
	constexpr int growthChanceFort = 80; // Chance for growth to occur in towns with fort built
	constexpr int growthChanceVillage = 40; // Chance for growth to occur in towns without fort

	const auto & takeFromAvailable = [this, t](CreatureID creatureID)
	{
		int tierToSubstract = -1;
		for (int i = 0; i < t->getTown()->creatures.size(); ++i)
			if (vstd::contains(t->getTown()->creatures[i], creatureID))
				tierToSubstract = i;

		if (tierToSubstract == -1)
			return; // impossible?

		int creaturesAvailable = t->creatures[tierToSubstract].first;
		int creaturesRecruited = creatureID.toCreature()->getGrowth();
		int creaturesLeft = std::max(0, creaturesAvailable - creaturesRecruited);

		if (creaturesLeft != creaturesAvailable)
		{
			SetAvailableCreatures sac;
			sac.tid = t->id;
			sac.creatures = t->creatures;
			sac.creatures[tierToSubstract].first = creaturesLeft;
			gameHandler->sendAndApply(sac);
		}
	};

	int growthChance = t->hasFort()	? growthChanceFort : growthChanceVillage;
	int growthRoll = gameHandler->getRandomGenerator().nextInt(0, 99);

	if (growthRoll >= growthChance)
		return;

	int tierRoll = 0;
	for(int i = 0; i < randomRollsCounts; ++i)
		tierRoll += gameHandler->getRandomGenerator().nextInt(0, currentWeek);

	// NOTE: determined by observing H3 games, might not match H3 100%
	int tierToGrow = std::clamp(tierRoll / randomRollsCounts, 0, 6) + 1;

	bool upgradeUnit = gameHandler->getRandomGenerator().nextInt(0, 99) < upgradeChance;

	// Check if town garrison already has unit of specified tier
	for(const auto & slot : t->Slots())
	{
		const auto * creature = slot.second->getCreature();

		if (creature->getFactionID() != t->getFactionID())
			continue;

		if (creature->getLevel() != tierToGrow)
			continue;

		StackLocation stackLocation(t->id, slot.first);
		gameHandler->changeStackCount(stackLocation, creature->getGrowth(), ChangeValueMode::RELATIVE);
		takeFromAvailable(creature->getGrowth());

		if (upgradeUnit && !creature->upgrades.empty())
		{
			CreatureID upgraded = *RandomGeneratorUtil::nextItem(creature->upgrades, gameHandler->getRandomGenerator());
			gameHandler->changeStackType(stackLocation, upgraded.toCreature());
		}
		else
			gameHandler->changeStackType(stackLocation, creature);
		return;
	}

	// No existing creatures in garrison, but we have a free slot we can use
	SlotID freeSlotID = t->getFreeSlot();
	if (freeSlotID.validSlot())
	{
		for (auto const & tierVector : t->getTown()->creatures)
		{
			CreatureID baseCreature	= tierVector.at(0);

			if (baseCreature.toEntity(LIBRARY)->getLevel() != tierToGrow)
				continue;

			StackLocation stackLocation(t->id, freeSlotID);

			if (upgradeUnit && !baseCreature.toCreature()->upgrades.empty())
			{
				CreatureID upgraded = *RandomGeneratorUtil::nextItem(baseCreature.toCreature()->upgrades, gameHandler->getRandomGenerator());
				gameHandler->insertNewStack(stackLocation, upgraded.toCreature(), upgraded.toCreature()->getGrowth());
				takeFromAvailable(upgraded.toCreature()->getGrowth());
			}
			else
			{
				gameHandler->insertNewStack(stackLocation, baseCreature.toCreature(), baseCreature.toCreature()->getGrowth());
				takeFromAvailable(baseCreature.toCreature()->getGrowth());
			}

			return;
		}
	}
}

RumorState NewTurnProcessor::pickNewRumor()
{
	RumorState newRumor;

	static const std::vector<RumorState::ERumorType> rumorTypes = {RumorState::TYPE_MAP, RumorState::TYPE_SPECIAL, RumorState::TYPE_RAND, RumorState::TYPE_RAND};
	std::vector<RumorState::ERumorTypeSpecial> sRumorTypes = {
															  RumorState::RUMOR_OBELISKS, RumorState::RUMOR_ARTIFACTS, RumorState::RUMOR_ARMY, RumorState::RUMOR_INCOME};
	if(gameHandler->gameState().getMap().grailPos.isValid()) // Grail should always be on map, but I had related crash I didn't manage to reproduce
		sRumorTypes.push_back(RumorState::RUMOR_GRAIL);

	int rumorId = -1;
	int rumorExtra = -1;
	auto & rand = gameHandler->getRandomGenerator();
	newRumor.type = *RandomGeneratorUtil::nextItem(rumorTypes, rand);

	do
	{
		switch(newRumor.type)
		{
			case RumorState::TYPE_SPECIAL:
			{
				SThievesGuildInfo tgi;
				gameHandler->gameState().obtainPlayersStats(tgi, 20);
				rumorId = *RandomGeneratorUtil::nextItem(sRumorTypes, rand);
				if(rumorId == RumorState::RUMOR_GRAIL)
				{
					rumorExtra = gameHandler->gameState().getTile(gameHandler->gameState().getMap().grailPos)->getTerrainID().getNum();
					break;
				}

				std::vector<PlayerColor> players = {};
				switch(rumorId)
				{
					case RumorState::RUMOR_OBELISKS:
						players = tgi.obelisks[0];
						break;

					case RumorState::RUMOR_ARTIFACTS:
						players = tgi.artifacts[0];
						break;

					case RumorState::RUMOR_ARMY:
						players = tgi.army[0];
						break;

					case RumorState::RUMOR_INCOME:
						players = tgi.income[0];
						break;
				}
				rumorExtra = RandomGeneratorUtil::nextItem(players, rand)->getNum();

				break;
			}
			case RumorState::TYPE_MAP:
				// Makes sure that map rumors only used if there enough rumors too choose from
				if(!gameHandler->gameState().getMap().rumors.empty() && (gameHandler->gameState().getMap().rumors.size() > 1 || !gameHandler->gameState().currentRumor.last.count(RumorState::TYPE_MAP)))
				{
					rumorId = rand.nextInt(gameHandler->gameState().getMap().rumors.size() - 1);
					break;
				}
				else
					newRumor.type = RumorState::TYPE_RAND;
				[[fallthrough]];

			case RumorState::TYPE_RAND:
				auto vector = LIBRARY->generaltexth->findStringsWithPrefix("core.randtvrn");
				rumorId = rand.nextInt(static_cast<int>(vector.size()) - 1);

				break;
		}
	}
	while(!newRumor.update(rumorId, rumorExtra));

	return newRumor;
}

std::tuple<EWeekType, CreatureID, int> NewTurnProcessor::pickWeekType(bool newMonth)
{
	std::vector<std::tuple<CreatureID, int>> creaturesWithDeityOfFireBonus;
	for(const auto & bonus : *gameHandler->gameState().globalEffects.getBonusesOfType(BonusType::DEITYOFFIRE))
		creaturesWithDeityOfFireBonus.push_back({bonus->subtype.as<CreatureID>(), bonus->val});
	if(!creaturesWithDeityOfFireBonus.empty())
	{
		auto item = *RandomGeneratorUtil::nextItem(creaturesWithDeityOfFireBonus, gameHandler->getRandomGenerator());
		return { EWeekType::DEITYOFFIRE, std::get<0>(item), std::get<1>(item)};
	}

 // The original UN overrides do not suppress the Inferno Grail week/month.
 const auto sourceSettings=era_campaign_calendar_json::read(gameHandler->gameState().getMap().sourceCampaignState);
 const auto sourceEffect=era_campaign_calendar::effect(sourceSettings,newMonth);
 const bool randomWeeks=gameHandler->gameInfo().getSettings().getBoolean(EGameSettings::CREATURES_ALLOW_RANDOM_SPECIAL_WEEKS);
 if(!randomWeeks&&sourceEffect==era_campaign_calendar::Effect::Inherit)return {EWeekType::NORMAL,CreatureID::NONE,0};
 // Keep the native calendar roll even when the source forces its result.
 const int monthType=gameHandler->getRandomGenerator().nextInt(99);
 if(sourceEffect==era_campaign_calendar::Effect::Normal)return {EWeekType::NORMAL,CreatureID::NONE,0};
 if(sourceEffect==era_campaign_calendar::Effect::Plague)return {EWeekType::PLAGUE,CreatureID::NONE,0};
 if(sourceEffect==era_campaign_calendar::Effect::DoubleGrowth)
 {
  for(const auto & binding:era_bridge::sourceCreatureLevelBindings)if(binding.sourceId==sourceSettings.creature)
  {
   const auto id=LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(),"creature",std::string(binding.key),true);
   if(!id)throw std::runtime_error("Unresolved source campaign month creature");
   return {EWeekType::DOUBLE_GROWTH,CreatureID(*id),0};
  }
  throw std::runtime_error("Unbound source campaign month creature");
 }

	if (newMonth) //new month
	{
		if (monthType < gameHandler->gameInfo().getSettings().getInteger(EGameSettings::CREATURES_MONTH_DOUBLE_GROWTH_PROBABILITY)) //double growth
		{
			if (gameHandler->gameInfo().getSettings().getBoolean(EGameSettings::CREATURES_ALLOW_ALL_FOR_DOUBLE_MONTH))
			{
				CreatureID creatureID = gameHandler->randomizer->rollCreature();
				return { EWeekType::DOUBLE_GROWTH, creatureID, 0};
			}
			else if (!LIBRARY->creh->doubledCreatures.empty())
			{
				CreatureID creatureID = *RandomGeneratorUtil::nextItem(LIBRARY->creh->doubledCreatures, gameHandler->getRandomGenerator());
				return { EWeekType::DOUBLE_GROWTH, creatureID, 0};
			}
			else
			{
				gameHandler->complain("Cannot find creature that can be spawned!");
				return { EWeekType::NORMAL, CreatureID::NONE, 0};
			}
		}

		if (monthType < gameHandler->gameInfo().getSettings().getInteger(EGameSettings::CREATURES_MONTH_DOUBLE_GROWTH_PROBABILITY) +
						 gameHandler->gameInfo().getSettings().getInteger(EGameSettings::CREATURES_MONTH_PLAGUE_PROBABILITY)) //plague
			return { EWeekType::PLAGUE, CreatureID::NONE, 0};

		return { EWeekType::NORMAL, CreatureID::NONE, 0};
	}
	else //it's a week, but not full month
	{
		if (monthType < gameHandler->gameInfo().getSettings().getInteger(EGameSettings::CREATURES_WEEK_SPECIAL_PROBABILITY))
		{
			std::pair<int, CreatureID> newMonster(54, CreatureID());
			do
			{
				newMonster.second = gameHandler->randomizer->rollCreature();
			} while (newMonster.second.toEntity(LIBRARY)->getFactionID().toFaction()->town == nullptr); // find first non neutral creature

			return { EWeekType::BONUS_GROWTH, newMonster.second, gameHandler->gameInfo().getSettings().getInteger(EGameSettings::CREATURES_ADDITIONAL_WEEKLY_GROWTH_SPECIAL_WEEK)};
		}
		return { EWeekType::NORMAL, CreatureID::NONE, 0};
	}
}

std::vector<SetMana> NewTurnProcessor::updateHeroesManaPoints()
{
	std::vector<SetMana> result;

	for (const auto & elem : gameHandler->gameState().players)
	{
		for (const CGHeroInstance *h : elem.second.getHeroes())
		{
			int32_t newMana = h->getManaNewTurn();

			if (newMana != h->mana)
				result.emplace_back(h->id, newMana, ChangeValueMode::ABSOLUTE);
		}
	}
	return result;
}

std::vector<SetMovePoints> NewTurnProcessor::updateHeroesMovementPoints()
{
	std::vector<SetMovePoints> result;

	for (const auto & elem : gameHandler->gameState().players)
	{
		for (const CGHeroInstance *h : elem.second.getHeroes())
		{
			auto ti = h->getTurnInfo(1);
			// NOTE: this code executed when bonuses of previous day not yet updated (this happen in NewTurn::applyGs). See issue 2356
			int32_t newMovementPoints = h->movementPointsLimitCached(gameHandler->gameState().getMap().getTile(h->visitablePos()).isLand(), ti.get());

			if (newMovementPoints != h->movementPointsRemaining())
				result.emplace_back(h->id, newMovementPoints);
		}
	}
	return result;
}

InfoWindow NewTurnProcessor::createInfoWindow(EWeekType weekType, CreatureID creatureWeek, bool newMonth, int additionalGrowth)
{
	InfoWindow iw;
 if(const auto text=era_campaign_calendar_json::message(gameHandler->gameState().getMap().sourceCampaignState,gameHandler->gameState().day+1))
 {iw.text.appendRawString(*text);return iw;}
	switch (weekType)
	{
		case EWeekType::DOUBLE_GROWTH:
			iw.text.appendLocalString(EMetaText::ARRAY_TXT, 131);
			iw.text.replaceNameSingular(creatureWeek);
			iw.text.replaceNameSingular(creatureWeek);
			break;
		case EWeekType::PLAGUE:
			iw.text.appendLocalString(EMetaText::ARRAY_TXT, 132);
			break;
		case EWeekType::BONUS_GROWTH:
			iw.text.appendLocalString(EMetaText::ARRAY_TXT, 134);
			iw.text.replaceNameSingular(creatureWeek);
			iw.text.replaceNameSingular(creatureWeek);
			break;
		case EWeekType::DEITYOFFIRE:
		{
			const CCreature *base = creatureWeek.toCreature();
			CreatureID upgradedCreature = creatureWeek;
			if(base && !base->upgrades.empty())
				upgradedCreature = *base->upgrades.rbegin();
			iw.text.appendLocalString(EMetaText::ARRAY_TXT, 135);
			iw.text.replaceNameSingular(creatureWeek);
			iw.text.replaceNameSingular(creatureWeek);
			iw.text.replacePositiveNumber(additionalGrowth);
			iw.text.replaceNameSingular(upgradedCreature);
			iw.text.replacePositiveNumber(additionalGrowth);
			break;
		}
		default:
			if (newMonth)
			{
				iw.text.appendLocalString(EMetaText::ARRAY_TXT, 130);
				iw.text.replaceLocalString(EMetaText::ARRAY_TXT, gameHandler->getRandomGenerator().nextInt(32, 41));
			}
			else
			{
				iw.text.appendLocalString(EMetaText::ARRAY_TXT, 133);
				iw.text.replaceLocalString(EMetaText::ARRAY_TXT, gameHandler->getRandomGenerator().nextInt(43, 57));
			}
	}
	return iw;
}

NewTurn NewTurnProcessor::generateNewTurnPack()
{
	NewTurn n;
	n.specialWeek = EWeekType::FIRST_WEEK;
	n.creatureid = CreatureID::NONE;
	n.day = gameHandler->gameState().day + 1;

	bool firstTurn = !gameHandler->gameInfo().getDate(Date::DAY);
	era_compat::henchmen::initializeSettings(*gameHandler,firstTurn);
	era_compat::map_rules::initializeSettings(*gameHandler,firstTurn);
	era_compat::map_rules::removeInitialFortifications(*gameHandler,firstTurn);
	era_compat::script_rules::initializeSettings(*gameHandler,firstTurn);
	era_compat::mithril::initializeSeed(*gameHandler,firstTurn);
	era_compat::mithril::initializeSiteMarkers(*gameHandler);
	bool newWeek = gameHandler->gameInfo().getDate(Date::DAY_OF_WEEK) == 7; //day numbers are confusing, as day was not yet switched
	bool newMonth = gameHandler->gameInfo().getDate(Date::DAY_OF_MONTH) == 28;

	int additionalGrowth = 0;

	if (!firstTurn)
	{
		for (const auto & player : gameHandler->gameState().players)
			n.playerIncome[player.first] = generatePlayerIncome(player.first, newWeek);
	}

	if (newWeek && !firstTurn)
	{
		auto [specialWeek, creatureID, addGrowth] = pickWeekType(newMonth);
		n.specialWeek = specialWeek;
		n.creatureid = creatureID;
		additionalGrowth = addGrowth;
	}

	n.heroesMana = updateHeroesManaPoints();
	n.heroesMovement = updateHeroesMovementPoints();

	if (newWeek)
	{
		for (const auto & townID : gameHandler->gameState().getMap().getAllTowns())
		{
			const auto * t = gameHandler->gameState().getTown(townID);
			n.availableCreatures.push_back(generateTownGrowth(t, n.specialWeek, n.creatureid, firstTurn, additionalGrowth));
		}

		n.newRumor = pickNewRumor();

		//new week info popup
		if (n.specialWeek != EWeekType::FIRST_WEEK)
			n.newWeekNotification = createInfoWindow(n.specialWeek, n.creatureid, newMonth, additionalGrowth);
	}

	return n;
}

void NewTurnProcessor::onNewTurn()
{
	NewTurn n = generateNewTurnPack();

	bool firstTurn = !gameHandler->gameInfo().getDate(Date::DAY);
	bool newWeek = gameHandler->gameInfo().getDate(Date::DAY_OF_WEEK) == 7; //day numbers are confusing, as day was not yet switched
	bool newMonth = gameHandler->gameInfo().getDate(Date::DAY_OF_MONTH) == 28;

	gameHandler->sendAndApply(n);
	era_compat::map_rules::onNewDay(*gameHandler);

    // Authored original campaign scripts address their exact source objects.
    // TUM's optional random first-day replacement pass would remove those targets.
    if(!firstTurn||!gameHandler->sourceCampaigns->preservesAuthoredObjects())
     era_compat::applyEraFirstDayObjectReplacements(*gameHandler,firstTurn);


	if (newWeek)
	{
		for (const auto & townID : gameHandler->gameState().getMap().getAllTowns())
		{
			const auto * t = gameHandler->gameState().getTown(townID);
			if (t->hasBuilt(BuildingSubID::PORTAL_OF_SUMMONING))
				gameHandler->setPortalDwelling(t, true, n.specialWeek == EWeekType::PLAGUE); //set creatures for Portal of Summoning
		}
	}

	if (newWeek && !firstTurn)
	{
		for (const auto & townID : gameHandler->gameState().getMap().getAllTowns())
		{
			const auto * t = gameHandler->gameState().getTown(townID);
			if (!t->getOwner().isValidPlayer())
				updateNeutralTownGarrison(t, 1 + gameHandler->gameInfo().getDate(Date::DAY) / 7);
		}
	}

	//spawn wandering monsters
	if (newMonth && (n.specialWeek == EWeekType::DOUBLE_GROWTH || n.specialWeek == EWeekType::DEITYOFFIRE))
	{
		gameHandler->spawnWanderingMonsters(n.creatureid);
	}

	logGlobal->trace("Info about turn %d has been sent!", n.day);
}
