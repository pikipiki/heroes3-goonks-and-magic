/* Existing native66 JSON extension for custom>81, independent of source20 slots. */
#pragma once
#include "EraSourceXpDispel78.h"
#include "../../lib/era/EraDragonFly241DispelScope.h"
#include "../../lib/spells/AbilityCaster.h"
#include "../../lib/spells/ISpellMechanics.h"
#include "../../lib/callback/GameRandomizer.h"
#include "../../lib/mapObjects/army/CArmedInstance.h"
namespace era_compat_server {
// Once per original after-attack frame AFTER reflection, at the ordinary native
// alive boundary. The router supplies its XP-module gate separately.223 has no
// old native78 copy: do NOT create a late extension for that actor.
inline bool castXpDispel78LegacyLate(CGameHandler&handler,const CBattleInfoCallback&battle,
 const CStack*actor,const CStack*target,const era_bridge::SourceXpProvenance&row,
 int legacyRank,bool xpModuleEnabled,bool ranged=false)
{
 if(ranged||!xpModuleEnabled||!actor||!target||!actor->alive()||!target->alive()||row.sourceId!=66)return false;
 requireXpDispel78(battle,actor,target,row);
 if(legacyRank<0||legacyRank>10)throw std::runtime_error("Native66 XP rank0..10 required");
 const int chance=legacyRank*10;if(chance==0)return false;
 const auto*spell=SpellID(78).toSpell();spells::AbilityCaster caster(actor,3); // exact active JSON addInfo[3,2]: expert, melee-only
 spells::BattleCast cast(&battle,&caster,spells::Mode::PASSIVE,spell);spells::Target aim;aim.emplace_back(target);
 era_compat::DragonFly241DispelCustomScope customOnly(&caster,target); // pointer+target+78, not actor-name inference
 auto mechanics=spell->battleMechanics(&cast);if(!mechanics->canBeCastAt(aim))return false;
 const auto army=battle.getBattle()->getSideArmy(actor->unitSide())->id;
 // Keep native seed setup and100% fast path, not the source XP primary RNG.
 if(!handler.randomizer->rollCombatAbility(army,chance))return false;
 cast.cast(handler.spellcastEnvironment(),aim);return true;
}
}
