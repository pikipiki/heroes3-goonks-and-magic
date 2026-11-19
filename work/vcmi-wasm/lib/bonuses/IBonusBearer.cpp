/*
 * IBonusBearer.cpp, part of VCMI engine
 *
 * Authors: listed in file AUTHORS in main folder
 *
 * License: GNU General Public License v2.0 or later
 * Full text of license available in license.txt file, in main folder
 *
 */

#include "StdInc.h"

#include "IBonusBearer.h"
#include "BonusList.h"
#include "../era/EraMapNoShootingRules.h"

VCMI_LIB_NAMESPACE_BEGIN

int IBonusBearer::valOfBonuses(const CSelector &selector, const std::string &cachingStr, int baseValue) const
{
	TConstBonusListPtr hlp = getBonuses(selector, cachingStr);
	return hlp->totalValue(baseValue);
}

bool IBonusBearer::hasBonus(const CSelector &selector, const std::string &cachingStr) const
{
	//TODO: We don't need to count all bonuses and could break on first matching
	return !getBonuses(selector, cachingStr)->empty();
}

TConstBonusListPtr IBonusBearer::getBonuses(const CSelector &selector, const std::string &cachingStr) const
{
    const auto bonuses=getAllBonuses(selector,cachingStr);
    const auto experienceShooting=[](const Bonus & bonus)
    {
        if(bonus.source!=BonusSource::STACK_EXPERIENCE)return false;
        switch(bonus.type)
        {
            case BonusType::SHOOTER:case BonusType::FREE_SHOOTING:case BonusType::SHOTS:
            case BonusType::NO_MELEE_PENALTY:case BonusType::NO_DISTANCE_PENALTY:
            case BonusType::NO_WALL_PENALTY:return true;
            default:return false;
        }
    };
    const auto baseAbility=[](const Bonus & bonus,BonusType type)
    {return bonus.type==type&&bonus.source==BonusSource::CREATURE_ABILITY;};
    if(std::none_of(bonuses->begin(),bonuses->end(),[&](const auto & bonus)
        {return baseAbility(*bonus,BonusType::FLYING)||baseAbility(*bonus,BonusType::SHOOTER)||experienceShooting(*bonus);}))return bonuses;
    const auto markers=getAllBonuses(Selector::type()(BonusType::NONE),"eraMapCreatureRuleMarkers");
    bool flight=false,shooting=false,experience=false;
    for(const auto & marker:*markers)
    {
        if(marker->source!=BonusSource::OTHER||!marker->hidden||marker->val!=1)continue;
        flight|=marker->stacking=="eraCampaign:flightDisabled:v1";
        shooting|=marker->stacking==era_bridge::map_rules::noShootingBaseMarker;
        experience|=marker->stacking==era_bridge::map_rules::noShootingExperienceMarker;
    }
    if(!flight&&!shooting&&!experience)return bonuses;
    auto filtered=std::make_shared<BonusList>();
    for(const auto & bonus:*bonuses)
        if(!(flight&&baseAbility(*bonus,BonusType::FLYING))
            &&!(shooting&&baseAbility(*bonus,BonusType::SHOOTER))
            &&!(experience&&experienceShooting(*bonus)))filtered->push_back(bonus);
    return filtered;
}

TConstBonusListPtr IBonusBearer::getBonusesFrom(BonusSource source) const
{
	std::string cachingStr = "source_" + std::to_string(static_cast<int>(source));
	CSelector s = Selector::sourceTypeSel(source);
	return getBonuses(s, cachingStr);
}

TConstBonusListPtr IBonusBearer::getBonusesOfType(BonusType type) const
{
	std::string cachingStr = "type_" + std::to_string(static_cast<int>(type));
	CSelector s = Selector::type()(type);
	return getBonuses(s, cachingStr);
}

TConstBonusListPtr IBonusBearer::getBonusesOfType(BonusType type, BonusSubtypeID subtype) const
{
	std::string cachingStr = "type_" + std::to_string(static_cast<int>(type)) + "_" + std::to_string(subtype.getNum());
	CSelector s = Selector::typeSubtype(type, subtype);
	return getBonuses(s, cachingStr);
}

int IBonusBearer::applyBonuses(BonusType type, int baseValue) const
{
	//This part is performance-critical
	std::string cachingStr = "type_" + std::to_string(static_cast<int>(type));
	CSelector s = Selector::type()(type);
	return valOfBonuses(s, cachingStr, baseValue);
}

int IBonusBearer::valOfBonuses(BonusType type) const
{
	return applyBonuses(type, 0);
}

bool IBonusBearer::hasBonusOfType(BonusType type) const
{
	//This part is performance-critical
	std::string cachingStr = "type_" + std::to_string(static_cast<int>(type));

	CSelector s = Selector::type()(type);

	return hasBonus(s, cachingStr);
}

int IBonusBearer::valOfBonuses(BonusType type, BonusSubtypeID subtype) const
{
	//This part is performance-critical
	std::string cachingStr = "type_" + std::to_string(static_cast<int>(type)) + "_" + std::to_string(subtype.getNum());

	CSelector s = Selector::typeSubtype(type, subtype);

	return valOfBonuses(s, cachingStr);
}

bool IBonusBearer::hasBonusOfType(BonusType type, BonusSubtypeID subtype) const
{
	//This part is performance-critical
	std::string cachingStr = "type_" + std::to_string(static_cast<int>(type)) + "_" + std::to_string(subtype.getNum());

	CSelector s = Selector::typeSubtype(type, subtype);

	return hasBonus(s, cachingStr);
}

bool IBonusBearer::hasBonusFrom(BonusSource source, BonusSourceID sourceID) const
{
	std::string cachingStr = "source_" + std::to_string(static_cast<int>(source)) + "_" + std::to_string(sourceID.getNum());
	return hasBonus(Selector::source(source,sourceID), cachingStr);
}

bool IBonusBearer::hasBonusFrom(BonusSource source) const
{
	std::string cachingStr = "source_" + std::to_string(static_cast<int>(source));
	return hasBonus((Selector::sourceTypeSel(source)), cachingStr);
}

std::shared_ptr<const Bonus> IBonusBearer::getBonus(const CSelector &selector) const
{
	auto bonuses = getAllBonuses(selector);
	return bonuses->getFirst(Selector::all);
}

VCMI_LIB_NAMESPACE_END
