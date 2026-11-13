/* Exact source a78 endpoint; caller owns chance/primary rolls and group timing. */
#pragma once
#include "../../lib/era/EraSourceXpAdmission.h"
#include "../../lib/era/EraDragonFly241State.h"
#include "../../lib/era/EraSourceDefendState.h"
#include "EraStatusAttacks.h"
#include "../../lib/networkPacks/PacksForClientBattle.h"
namespace era_compat_server {
inline bool sourceXp78Row(const era_bridge::SourceXpProvenance &r){return (r.sourceId==66||r.sourceId==223)&&r.code=='a'&&r.spell==78&&!r.existingSourceOwner;}
inline void requireXpDispel78(const CBattleInfoCallback&battle,const CStack*actor,const CStack*target,const era_bridge::SourceXpProvenance&r){if(!sourceXp78Row(r)||!actor||!target||actor->creatureId().toCreature()->getJsonKey()!=r.nativeId||!era_compat::SourceXpAdmissionPolicy::get().owns(r)||!era_compat::sourceXpBattleAdmitted(battle))throw std::runtime_error("Independent exact XP78 admission required");if(SpellID(78).toSpell()->getJsonKey()!="core:dispelHelpful")throw std::runtime_error("Canonical source78 identity changed");}
// No chance or primary resistance draw here. This early source return bypasses
// later ordinary MR/immunity; Sphere92 belongs to target's effective-side hero.
inline int queryXpDispel78(const CBattleInfoCallback&battle,const CStack*actor,const CStack*target,const era_bridge::SourceXpProvenance&r){requireXpDispel78(battle,actor,target,r);const auto effects=era_compat::captureDragonFly241Effects(*target);auto side=target->unitSide();if(target->isHypnotized())side=side==BattleSide::ATTACKER?BattleSide::DEFENDER:BattleSide::ATTACKER;if(era_compat::statusHasArtifact(battle.battleGetFightingHero(side),92))return 0;for(const auto&s:era_compat::dragonFly241SpellKeys)if(effects.durations[s.id]!=0)return 100;return 0;}
// Called only after the router's accepted primary query. Expert3/power3/kind1
// are validated explicitly; source direct241's mastery0 is a different caller.
inline void castXpDispel78(CGameHandler&handler,const CBattleInfoCallback&battle,const CStack*actor,const CStack*target,const era_bridge::SourceXpCastRequest&request){const auto&r=request.provenance;requireXpDispel78(battle,actor,target,r);if(request.mastery!=3||request.power!=3||request.casterKind!=1||request.primaryQuerySide<0||request.primaryQuerySide>1||request.currentSide<0||request.currentSide>1)throw std::runtime_error("Source a78 expert3/power3/kind1 required");const auto effects=era_compat::captureDragonFly241Effects(*target);if(target->hasBonusOfType(BonusType::UNIT_DEFENDING)&&(effects.durations[46]>0||effects.durations[48]>0||effects.durations[56]>0)&&!era_compat::sourceDefendState(*target))throw std::runtime_error("Source78 needs verified rawCC/DEFEND before removal");BattleSpellCast visual;visual.battleID=battle.getBattle()->getBattleID();visual.activeCast=false;visual.side=request.primaryQuerySide==0?BattleSide::ATTACKER:BattleSide::DEFENDER;visual.spellID=SpellID(78);visual.tile=target->getPosition();visual.affectedCres.insert(target->unitId());visual.casterStack=actor->unitId();visual.castByHero=false;handler.sendAndApply(visual);std::vector<int>removed;for(const auto&s:era_compat::dragonFly241SpellKeys)if(s.id>=10&&s.id<70&&effects.durations[s.id]>0)removed.push_back(s.id);auto packet=era_compat::dragonFly241RemovalPacket(battle.getBattle()->getBattleID(),*target,effects,removed);if(!packet.toRemove.empty()||!packet.toAdd.empty())handler.sendAndApply(packet);}
// No native SPELL_AFTER_ATTACK filter belongs here.66/223 innateCurse,
// deathblow, JSONcurse, Goonks, banners and all custom>81 providers stay native.
}
