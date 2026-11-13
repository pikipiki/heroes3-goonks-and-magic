/* Native custom-positive compatibility lane, only for owned241 late78. */
#pragma once
#include <optional>
VCMI_LIB_NAMESPACE_BEGIN
namespace battle{class Unit;}
namespace spells{class Caster;}
namespace era_compat
{
inline constexpr bool dragonFly241CustomPositiveSpell(int spell){return spell>81;}
class DragonFly241DispelCustomScope
{
 inline static thread_local const spells::Caster * currentCaster=nullptr;
 inline static thread_local const battle::Unit * currentTarget=nullptr;
 const spells::Caster * oldCaster;const battle::Unit * oldTarget;
public:
 DragonFly241DispelCustomScope(const spells::Caster * caster,const battle::Unit * target)
     :oldCaster(currentCaster),oldTarget(currentTarget){currentCaster=caster;currentTarget=target;}
 ~DragonFly241DispelCustomScope(){currentCaster=oldCaster;currentTarget=oldTarget;}
 DragonFly241DispelCustomScope(const DragonFly241DispelCustomScope &)=delete;
 DragonFly241DispelCustomScope & operator=(const DragonFly241DispelCustomScope &)=delete;
 static bool applies(int spell,const spells::Caster * caster,const battle::Unit * target)
 {return spell==78&&caster&&caster==currentCaster&&target&&target==currentTarget;}
};
}
VCMI_LIB_NAMESPACE_END
