/* Source AoE5A4C80 uses CURRENT side's hero for magical damage correction,
 * independently of initial kind1's NULL hero. GPL-2.0-or-later. */
#pragma once
#include "../spells/ProxyCaster.h"
#include "../mapObjects/CGHeroInstance.h"
#include <vcmi/spells/Spell.h>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class ConfluxCaster final:public spells::ProxyCaster
{
    const CGHeroInstance * areaHero;
    PlayerColor owner;
public:
    ConfluxCaster(const spells::Caster * actual,const CGHeroInstance * hero,PlayerColor color)
        :spells::ProxyCaster(actual),areaHero(hero),owner(color){}
    PlayerColor getCasterOwner()const override{return owner;}
    int64_t getSpellBonus(const spells::Spell * spell,int64_t value,const battle::Unit * target)const override
    {
        const int id=spell->getIndex();
        return areaHero && id>=19 && id<=23?areaHero->getSpellBonus(spell,value,target)
            :spells::ProxyCaster::getSpellBonus(spell,value,target);
    }
};
}
VCMI_LIB_NAMESPACE_END
