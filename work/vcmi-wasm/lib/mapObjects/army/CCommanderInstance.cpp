/*
 * CCommanderInstance.cpp, part of VCMI engine
 *
 * Authors: listed in file AUTHORS in main folder
 *
 * License: GNU General Public License v2.0 or later
 * Full text of license available in license.txt file, in main folder
 *
 */
#include "StdInc.h"
#include "CCommanderInstance.h"
#include "../../era/EraStartingLevelRules.h"

#include "../../GameLibrary.h"
#include "../../entities/hero/CHeroHandler.h"

VCMI_LIB_NAMESPACE_BEGIN

CCommanderInstance::CCommanderInstance(IGameInfoCallback * cb)
	: CStackInstance(cb)
{
}

CCommanderInstance::CCommanderInstance(IGameInfoCallback * cb, const CreatureID & id)
	: CStackInstance(cb, BonusNodeType::COMMANDER, false)
	, name("Commando")
{
	alive = true;
	level = 1;
	setCount(1);
	setType(nullptr);
	secondarySkills.resize(ECommander::SPELL_POWER + 1);
	setType(id);
	//TODO - parse them
}

void CCommanderInstance::setAlive(bool Alive)
{
	//TODO: helm of immortality
	alive = Alive;
	if(!alive)
	{
		removeBonusesRecursive(Bonus::UntilCommanderKilled);
	}
}

bool CCommanderInstance::canGainExperience() const
{
	return alive;
}

int CCommanderInstance::getExpRank() const
{
	if(eraExperienceWord)
		return level;
	return LIBRARY->heroh->level(getTotalExperience());
}

int CCommanderInstance::getLevel() const
{
	return std::max(1, getExpRank());
}

void CCommanderInstance::levelUp()
{
	level++;
	for(const auto & bonus : LIBRARY->creh->commanderLevelPremy)
	{ //grant all regular level-up bonuses
		accumulateBonus(bonus);
	}
}

ArtBearer CCommanderInstance::bearerType() const
{
	return ArtBearer::COMMANDER;
}

bool CCommanderInstance::gainsLevel() const
{
	if(eraExperienceWord)
		return alive && level < 75 && level < LIBRARY->heroh->maxSupportedLevel()
			&& int64_t(era_bridge::starting_level::signedWord(uint32_t(getTotalExperience()))) >= int64_t(LIBRARY->heroh->reqExp(level + 1));
	return level < LIBRARY->heroh->maxSupportedLevel() && getTotalExperience() >= LIBRARY->heroh->reqExp(level + 1);
}

VCMI_LIB_NAMESPACE_END
