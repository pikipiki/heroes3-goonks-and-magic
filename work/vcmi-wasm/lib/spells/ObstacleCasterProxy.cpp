/*
 * ObstacleCasterProxy.cpp, part of VCMI engine
 *
 * Authors: listed in file AUTHORS in main folder
 *
 * License: GNU General Public License v2.0 or later
 * Full text of license available in license.txt file, in main folder
 *
 */

#include "StdInc.h"
#include "ObstacleCasterProxy.h"
#include "../era/EraConfluxPolicies.h"
#include "CSpellHandler.h"

VCMI_LIB_NAMESPACE_BEGIN

namespace spells
{

ObstacleCasterProxy::ObstacleCasterProxy(PlayerColor owner_, const Caster * hero_, const SpellCreatedObstacle & obs_):
	SilentCaster(owner_, hero_),
	obs(obs_)
{
}

int32_t ObstacleCasterProxy::getSpellSchoolLevel(const Spell * spell, SpellSchool * outSelectedSchool) const
{
	return obs.spellLevel;
}

int32_t ObstacleCasterProxy::getEffectLevel(const Spell * spell) const
{
	return obs.spellLevel;
}

int64_t ObstacleCasterProxy::getSpellBonus(const Spell * spell, int64_t base, const battle::Unit * affectedStack) const
{
    const auto * sourceSpell=era_compat::ConfluxPolicies::get().enabled()
        && spell->getJsonKey()=="tum-era:sourceConfluxFireWallTrigger"?SpellID(13).toSpell():spell;
    //5A008F uses stored-side hero with the ORIGINAL13, not the trigger's
    //synthetic native identifier. This preserves FireWall hero specialties.
	if(actualCaster)
		return std::max<int64_t>(actualCaster->getSpellBonus(sourceSpell, base, affectedStack), obs.minimalDamage);

	return std::max<int64_t>(base, obs.minimalDamage);
}

int32_t ObstacleCasterProxy::getEffectPower(const Spell * spell) const
{
	return obs.casterSpellPower;
}

int32_t ObstacleCasterProxy::getEnchantPower(const Spell * spell) const
{
	return obs.casterSpellPower;
}

int64_t ObstacleCasterProxy::getEffectValue(const Spell * spell) const
{
	if(actualCaster)
		return std::max(static_cast<int64_t>(obs.minimalDamage), actualCaster->getEffectValue(spell));
	else
		return obs.minimalDamage;
}

int64_t ObstacleCasterProxy::getEffectRange(const Spell * spell) const
{
	if(actualCaster)
		actualCaster->getEffectRange(spell);

	return 0;
}

int32_t SilentCaster::manaLimit() const
{
	return 0;
}

SilentCaster::SilentCaster(PlayerColor owner_, const Caster * hero_):
	ProxyCaster(hero_),
	owner(std::move(owner_))
{
}

void SilentCaster::getCasterName(MetaString & text) const
{
	// NOTE: can be triggered (for example) if creature steps into Tower mines/moat while hero has Recanter's Cloak
	logGlobal->debug("Unexpected call to SilentCaster::getCasterName");
}

void SilentCaster::getCastDescription(const Spell * spell, const battle::Units & attacked, MetaString & text) const
{
		//do nothing
}

void SilentCaster::spendMana(ServerCallback * server, const int spellCost) const
{
		//do nothing
}

PlayerColor SilentCaster::getCasterOwner() const
{
	if(actualCaster)
		return actualCaster->getCasterOwner();

	return owner;
}

}
VCMI_LIB_NAMESPACE_END
