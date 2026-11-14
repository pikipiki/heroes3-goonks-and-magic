#pragma once
#include "../../lib/era/EraXpTimed184State.h"
#include "../../lib/era/EraXpTimed184Canonical.h"
#include "EraStatusAttacks.h"
#include "../../lib/era/EraExperienceAttackSpells.h"
#include "../../lib/era/EraExperienceCastTargets.h"
#include "../../lib/era/EraInterferenceState.h"
#include "../../lib/era/EraHypnotizeHealth.h"
#include "../../lib/CCreatureHandler.h"
#include "../../lib/era/EraStatusHealthBonuses.h"
#include "../../lib/battle/CUnitState.h"
#include "../../lib/spells/TargetCondition.h"
#include <functional>
namespace era_compat_server
{
// Root's strict43 ledger supplies this access. DEFEND tags never grant access.
// No document, actor identity or typed state alone automatically enables casts.
struct XpTimed184Access
{
 bool admitted=false,lifecycleInstalled=false;
 std::function<int(const battle::Unit&)> storedAttack,storedDefense;
 // Counter callback must route registered owned slots through their lifecycle,
 // and canonical original native slots through the existing original20 removal.
 // It must preserve unrelated custom/banners and reject unreconciled mixtures.
 std::function<void(const battle::Unit&,int)> removeCanonicalCounter;
 std::function<void(const battle::Unit&,int)> removeNativeCureCompatibility;
 // An unregistered Goonk/banner/custom native provider can coexist only by
 // explicit provenance decision in Root's ledger, never by shared spell name.
 std::function<bool(const battle::Unit&,int,const std::vector<Bonus>&)> preserveNativeCoexistence;
};
inline thread_local const XpTimed184Access * xpTimed184Access=nullptr;
class XpTimed184AccessScope
{
 const XpTimed184Access * previous;
public:
 explicit XpTimed184AccessScope(const XpTimed184Access &a):previous(xpTimed184Access){xpTimed184Access=&a;}
 ~XpTimed184AccessScope(){xpTimed184Access=previous;}
 XpTimed184AccessScope(const XpTimed184AccessScope&)=delete;
 XpTimed184AccessScope&operator=(const XpTimed184AccessScope&)=delete;
};
inline void requireXpTimed184Access()
{if(!xpTimed184Access||!xpTimed184Access->admitted||!xpTimed184Access->lifecycleInstalled)throw std::runtime_error("Source timed184 requires distinct XP admission and installed lifecycle");}
inline bool supportsXpTimed(int spell){return spell==37||era_bridge::xp184::supports(spell);}
inline bool xpTimed184Nature(const CBattleInfoCallback &battle,const CStack *target,int spell)
{
 const auto * creature=target->creatureId().toCreature();
 const int id=StatusAttacks::get().id(creature->getJsonKey());
 const bool undead=target->hasBonusOfType(BonusType::UNDEAD);
 if(id==149)return false; //44A247 before Orb.
 if(spell==62&&undead)return false; //44A29C, distinct from44A235 SIEGEbit6
 if((spell==54||spell==59||spell==60||spell==62||spell==70||spell==73||spell==74)&&creature->hasBonusOfType(BonusType::SIEGE_WEAPON))return false;
 const auto * hero=battle.battleGetOwnerHero(target);
 if(spell==42&&(undead||creature->getBaseDamageMax()==0||statusHasArtifact(hero,102)))return false;
 if((spell==51||spell==52)&&creature->getBaseDamageMax()==0)return false;
 if((spell==49||spell==50)&&creature->hasBonusOfType(BonusType::NO_MORALE))return false; //44A3B0, beforeOrb
 if((spell==62||spell==70)&&(id==70||id==71))return false;
 if(spell==62&&statusHasArtifact(hero,101))return false;
 if(spell==59&&statusHasArtifact(hero,100))return false;
 if(spell==60&&statusHasArtifact(hero,105))return false;
 if(!era_compat::confluxCatalystNegates(battle,era_compat::confluxQuerySide.value_or(era_compat::confluxActiveSide(battle)),true)
    &&(spell==49||spell==50||spell==59||spell==60||spell==62)
    &&(target->hasBonusOfType(BonusType::MIND_IMMUNITY)||statusHasArtifact(hero,49)))return false;
 return true;
}
inline int xpTimed184ReceptionPercent(const CBattleInfoCallback &battle,const CStack *actor,
 const CStack *target,int spell,int mastery,BattleSide currentSide,BattleSide querySide,bool positiveQuery=false,bool massQuery=false)
{
 if(!target)return 0;
 StatusAttackCaster caster(actor,mastery,battle.sideToPlayer(querySide));
 era_compat::ConfluxSideScope current(currentSide,1);
 era_compat::ConfluxCastQueryScope query(querySide,1);
 era_compat::ConfluxResistanceScope resistance(true,querySide);
 const auto *descriptor=SpellID(spell).toSpell();
 spells::BattleCast cast(&battle,&caster,spells::Mode::PASSIVE,descriptor);
 cast.setSpellLevel(mastery);cast.setEffectPower(3);cast.setEffectDuration(3);
 bool sideAllowed=true;
 if(massQuery&&spell!=59)sideAllowed=descriptor->isPositive()?target->unitSide()==querySide:target->unitSide()!=querySide;
 bool receptive=sideAllowed&&era_compat::sourceSpellContextAllows(battle,target,descriptor)&&xpTimed184Nature(battle,target,spell);
 if(receptive&&spell==60)
 {
  //5A8673 uses the query-side HERO's actual mastery/cachedpower, not the
  // XPcaster's CURRENT creature power. Kind1 casting itself keeps NULLhero.
  if(target->hasBonus(Selector::source(BonusSource::SPELL_EFFECT,BonusSourceID(SpellID(36)))))receptive=false;
  const auto*hero=battle.battleGetFightingHero(querySide);
  const auto cache=era_compat::sourceInterferencePower(battle,hero);
  const int queryPower=hero?(cache?cache->effective:std::clamp(hero->getPrimSkillLevel(PrimarySkill::SPELL_POWER),1,99)):0;
  const int queryMastery=hero?std::clamp(hero->getSpellSchoolLevel(descriptor),0,3):0;
  constexpr int flat[]={10,10,20,50};
  const int raw=era_bridge::xp184::add(era_bridge::xp184::signed32(std::uint32_t(queryPower)*25u),flat[queryMastery]);
  era_compat::ExperienceAttackCaster thresholdCaster(actor,battle.sideToPlayer(querySide),mastery,hero,true);
  const int corrected=era_bridge::xp184::signed32(static_cast<uint32_t>(thresholdCaster.getSpellBonus(descriptor,raw,target)));
  receptive=receptive&&era_bridge::sourceHypnotizeHealth(target->getCount(),target->getMaxHealth())<=corrected;
 }
 if(receptive)
 {
  const bool negated=era_compat::confluxCatalystNegates(battle,querySide,true);
  const auto *factory=spells::TargetConditionItemFactory::getDefault();spells::TargetCondition condition;
  condition.absolute={factory->createAbsoluteSpell(),factory->createAbsoluteLevel()};
  if(!negated)condition.normal={factory->createElemental(),factory->createNormalLevel(),factory->createNormalSpell()};
  condition.negation={factory->createReceptiveFeature(),factory->createImmunityNegation()};
  auto mechanics=descriptor->battleMechanics(&cast);
  receptive=condition.isReceptive(mechanics.get(),target);
  // Explicit existing-bridge extension: unregistered Goonks keep their native
  // nature/extra target conditions. This is reception, never owner smart-target
  // selection or native heal applicability; primary ignoreSide remains intact.
  if(receptive&&!negated&&StatusAttacks::get().id(target->creatureId().toCreature()->getJsonKey())<0)
  {
   if(spell==60)
   {
    // Do NOT run native HealthValueSpecial again with placeholder power3:
    // the exact query-hero/full-HP threshold was already evaluated above.
    spells::TargetCondition nativeNature;
    for(const auto*name:{"UNDEAD","NON_LIVING","MECHANICAL"})
    {auto item=factory->createConfigurable("core","bonus",name);item->setInverted(true);item->setExclusive(true);nativeNature.normal.push_back(item);}
    auto siege=factory->createConfigurable("core","bonus","SIEGE_WEAPON");siege->setInverted(true);siege->setExclusive(true);nativeNature.absolute.push_back(siege);
    receptive=nativeNature.isReceptive(mechanics.get(),target);
   }
   else receptive=mechanics->isReceptive(target);
  }
 }
 return receptive?statusRawAccuracy(battle,target,true,querySide,positiveQuery):0;
}
// Return the5A8950 integer threshold only. The Root envelope draws once even
// at0/100. Primary ignores physical-side polarity (flag5=1).
inline int queryXpTimed(CGameHandler &handler,const CBattleInfoCallback &battle,
 const CStack *actor,const CStack *target,int spell,int mastery,BattleSide currentSide,BattleSide querySide)
{
 requireXpTimed184Access();
 if(!supportsXpTimed(spell)||!actor||!target||mastery<0||mastery>3
  ||currentSide==BattleSide::NONE||querySide==BattleSide::NONE)throw std::runtime_error("Invalid source timed184 query");
 const int percent=xpTimed184ReceptionPercent(battle,actor,target,spell,mastery,currentSide,querySide);
 (void)handler;return percent;
}
inline std::vector<const CStack*> xpTimed184MassOrder(const CBattleInfoCallback &battle)
{
 std::vector<const CStack*> result;
 for(const auto *stack:battle.battleGetAllStacks())if(stack->sourceMassSlot()>=0&&stack->sourceMassSlot()<=20)result.push_back(stack);
 std::sort(result.begin(),result.end(),[](const CStack*a,const CStack*b)
 {return std::make_pair(static_cast<int>(a->unitSide()),a->sourceMassSlot())<std::make_pair(static_cast<int>(b->unitSide()),b->sourceMassSlot());});
 return result;
}
inline void writeXpTimed184(CGameHandler&handler,const CBattleInfoCallback&battle,
 const battle::Unit&target,const era_compat::XpTimed184Snapshot&old,const era_bridge::xp184::State&state)
{auto packet=era_compat::xpTimed184Packet(battle.getBattle()->getBattleID(),target,old,state);handler.sendAndApply(packet);}
inline bool adoptCanonicalXpTimed184(CGameHandler&handler,const CBattleInfoCallback&battle,
 const CStack*target,int spell,const era_compat::XpTimed184OriginalApplication&proof)
{
 requireXpTimed184Access();auto old=era_compat::readXpTimed184(*target,spell);
 if(old.owned||!old.foreign)return false;
 const auto state=era_compat::canonicalXpTimed184State(spell,old.foreignBonuses,proof,target->hasBonusOfType(BonusType::SIEGE_WEAPON));
 if(!state)return false;
 old.bonuses=old.foreignBonuses;writeXpTimed184(handler,battle,*target,old,*state);return true;
}
inline void castXpTimedSingle(CGameHandler &handler,const CBattleInfoCallback &battle,
 const CStack *actor,const CStack *target,int spell,int power,int mastery,BattleSide currentSide,BattleSide querySide)
{
 requireXpTimed184Access();
 if(!supportsXpTimed(spell)||!actor||!target||!target->alive()||target->isGhost()
  ||currentSide==BattleSide::NONE||querySide==BattleSide::NONE)throw std::runtime_error("Invalid source timed184 cast");
 const auto old=era_compat::readXpTimed184(*target,spell);
 if(old.foreign&&(!xpTimed184Access->preserveNativeCoexistence||!xpTimed184Access->preserveNativeCoexistence(*target,spell,old.foreignBonuses)))throw std::runtime_error("Source timed184 requires explicit canonical innate/native active-effect reconciliation");
 int attack=0,defense=0;
 if(spell==73)
 {
  if(!xpTimed184Access->storedAttack||!xpTimed184Access->storedDefense)throw std::runtime_error("Disease73 requires rawC8/CC readers, not displayed/Frenzy getters");
  attack=xpTimed184Access->storedAttack(*target);defense=xpTimed184Access->storedDefense(*target);
 }
 const auto change=era_bridge::xp184::cast(old.state,spell,power,mastery,attack,defense,target->hasBonusOfType(BonusType::SIEGE_WEAPON));
 if(change.counter)
 {
  if(!xpTimed184Access->removeCanonicalCounter)throw std::runtime_error("Source timed184 canonical counter lifecycle missing");
  xpTimed184Access->removeCanonicalCounter(*target,*change.counter);
 }
 era_compat::ConfluxSideScope current(currentSide,1);
 BattleSpellCast visual;visual.battleID=battle.getBattle()->getBattleID();visual.activeCast=false;
 visual.side=querySide;visual.spellID=SpellID(spell);visual.tile=target->getPosition();visual.affectedCres.insert(target->unitId());visual.casterStack=actor->unitId();visual.castByHero=false;handler.sendAndApply(visual);
 writeXpTimed184(handler,battle,*target,old,change.state);
}
inline void castXpCure(CGameHandler&,const CBattleInfoCallback&,const CStack*,const CStack*,int,int,BattleSide,BattleSide);
inline void castXpTimed(CGameHandler &handler,const CBattleInfoCallback &battle,
 const CStack *actor,const CStack *target,int spell,int power,int mastery,BattleSide currentSide,BattleSide querySide)
{
 requireXpTimed184Access();
 if(spell==37){castXpCure(handler,battle,actor,target,power,mastery,currentSide,querySide);return;}
 if(spell==59)
 {
  if(!target)throw std::runtime_error("Source Berserk59 needs original primary hex");
  const int radius=mastery>=3?2:(mastery==2?1:0);
  std::vector<const CStack*> ordered;
  for(int hex:era_bridge::sourceAreaHexesReverse(target->getPosition().toInt(),radius,true))
  {
   const auto*unit=battle.battleGetStackByPos(BattleHex(hex),true);
   if(unit&&!unit->isGhost()&&unit->alive()&&std::find(ordered.begin(),ordered.end(),unit)==ordered.end())ordered.push_back(unit);
  }
  for(const auto*candidate:ordered)
  {
   const int threshold=xpTimed184ReceptionPercent(battle,actor,candidate,59,mastery,currentSide,currentSide,false,true);
   if(handler.getRandomGenerator().nextInt(1,100)<=threshold)castXpTimedSingle(handler,battle,actor,candidate,59,power,mastery,currentSide,currentSide);
  }
  return;
 }
 if(!era_bridge::xp184::mass(spell,mastery)){castXpTimedSingle(handler,battle,actor,target,spell,power,mastery,currentSide,querySide);return;}
 // Source5A69E0 scans ALL existing physicalside0/1 slots, including dead ones;
 // only Hypnotize skips its compulsory per-slot query/draw altogether.
 for(const auto *candidate:xpTimed184MassOrder(battle))
 {
  if(candidate->isHypnotized())continue;
  const int threshold=xpTimed184ReceptionPercent(battle,actor,candidate,spell,mastery,currentSide,currentSide,false,true);
  if(handler.getRandomGenerator().nextInt(1,100)<=threshold)
   castXpTimedSingle(handler,battle,actor,candidate,spell,power,mastery,currentSide,currentSide);
 }
}
inline bool removeXpTimed(CGameHandler &handler,const CBattleInfoCallback &battle,const battle::Unit&target,int spell)
{
 requireXpTimed184Access();const auto old=era_compat::readXpTimed184(target,spell);
 if(!old.owned||!old.state.removable())return false;
 writeXpTimed184(handler,battle,target,old,era_bridge::xp184::remove(old.state).state);return true;
}
inline bool removeXpTimedCanonicalCounter(CGameHandler&handler,const CBattleInfoCallback&battle,
 const battle::Unit&target,int spell,bool nativeCompatibility=false)
{
 requireXpTimed184Access();
 if(era_bridge::xp184::supports(spell))
 {
  const auto old=era_compat::readXpTimed184(target,spell);
  if(old.owned){removeXpTimed(handler,battle,target,spell);return true;}
 }
 if(spell!=41&&spell!=53&&spell!=59&&spell!=60)return false;
 std::vector<Bonus> removed;
 const auto sourceBonusList230=target.getBonuses(Selector::source(BonusSource::SPELL_EFFECT,BonusSourceID(SpellID(spell))));
 for(const auto&b:*sourceBonusList230)
 {
  if(era_compat::sourceTimedOwnedTag(b->stacking)||b->parameters||b->limiter||b->updater||b->effectRange!=BonusLimitEffect::NO_LIMIT)continue;
  const bool role=(spell==41&&b->type==BonusType::ALWAYS_MAXIMUM_DAMAGE&&b->val>=0&&b->valType==BonusValueType::INDEPENDENT_MAX)
   ||(spell==53&&b->type==BonusType::STACKS_SPEED&&b->val>=0&&b->valType==BonusValueType::ADDITIVE_VALUE)
   ||(spell==59&&b->type==BonusType::ATTACKS_NEAREST_CREATURE)
   ||(spell==60&&b->type==BonusType::HYPNOTIZED&&b->val>=0&&b->val<=3);
  if(!role)continue;
  // Native legacy59 is until-own-attack, while the original source slot is255.
  // Other nonpositive foreign native effects need explicit compatibility proof;
  // typed source duration0/debts were already handled above and remain intact.
  if(b->turnsRemain<=0&&spell!=59&&!nativeCompatibility)continue;
  removed.push_back(*b);
 }
 if(removed.empty())return false;
 SetStackEffect packet;packet.battleID=battle.getBattle()->getBattleID();packet.toRemove.emplace_back(target.unitId(),removed);handler.sendAndApply(packet);return true;
}
inline bool counterXpTimed(CGameHandler&handler,const CBattleInfoCallback&battle,
 const battle::Unit&target,int incomingSpell,int existingSpell)
{
 requireXpTimed184Access();if(!era_bridge::xp184::supports(existingSpell))return false;
 const auto old=era_compat::readXpTimed184(target,existingSpell);if(!old.owned)return false;
 // Handled means the generic native selector must skip all typed projections,
 // even when the original refuses removal (duration0 debt or mutual no-counter).
 if(!era_bridge::xp184::originalMutualCounterIgnored(incomingSpell,existingSpell))removeXpTimed(handler,battle,target,existingSpell);
 return true;
}
inline void roundXpTimed(CGameHandler &handler,const CBattleInfoCallback &battle,const battle::Unit&target,bool tactics)
{
 requireXpTimed184Access();for(int spell:{42,49,50,51,52,54,59,60,61,62,70,73,74})
 {const auto old=era_compat::readXpTimed184(target,spell);if(!old.owned)continue;const auto change=era_bridge::xp184::round(old.state,target.alive(),tactics);if(change.removed||change.state.duration!=old.state.duration)writeXpTimed184(handler,battle,target,old,change.state);}
}
// Generic35/78 and Cure must consume this before their native bonus selector.
// false for nonpositive durations leaves persistent signed Disease debt intact.
inline bool removeXpTimedForDispel(CGameHandler &handler,const CBattleInfoCallback &battle,const battle::Unit&target,int spell,bool helpfulOnly)
{if(!era_bridge::xp184::supports(spell)||(helpfulOnly&&!era_bridge::xp184::positive(spell)))return false;return removeXpTimed(handler,battle,target,spell);}
template<class RemoveOther> void cureXpTimed(CGameHandler &handler,const CBattleInfoCallback &battle,const battle::Unit&target,RemoveOther&&removeOther)
{
 // Invoke after source poison reset/health computation, before wound healing.
 for(int spell:era_bridge::xp184::cureOrder)
 {
  if(era_bridge::xp184::supports(spell))removeXpTimed(handler,battle,target,spell);
  // Continue through the provenance-aware callback for coexisting legacy
  // native core effects, and for45/71/75/61 owned by other source modules.
  removeOther(target,spell);
  if(xpTimed184Access->removeNativeCureCompatibility)xpTimed184Access->removeNativeCureCompatibility(target,spell);
 }
}
inline era_bridge::xp184::AttackFrame captureXpTimedAttackFrame(const battle::Unit&target,bool intrinsicSuppression)
{
 const auto blind=era_compat::readXpTimed184(target,62),paralyze=era_compat::readXpTimed184(target,74);
 return{blind.owned&&blind.state.active(),paralyze.owned&&paralyze.state.active(),intrinsicSuppression,blind.owned?blind.state.magnitude:100};
}
inline void finishXpTimedPrimaryPhysical(CGameHandler&handler,const CBattleInfoCallback&battle,const battle::Unit&primary)
{
 //441C75 and440017 remove59 after the whole primary melee/shot sequence,
 // not each441330 retaliation. Owned effects have no native UNTIL_OWN_ATTACK.
 removeXpTimed(handler,battle,primary,59);
}
inline void wakeXpTimedAfterPhysical(CGameHandler &handler,const CBattleInfoCallback &battle,const battle::Unit&target)
{
 // Source physical wake point, BEFORE post-hit XP casts. No UNTIL_BEING_ATTACKED
 // on owned projections: generic end-of-sequence cleanup must not erase new XP.
 for(int spell:{62,70,74})removeXpTimed(handler,battle,target,spell);
}
inline int queryXpCure(CGameHandler&handler,const CBattleInfoCallback&battle,const CStack*actor,
 const CStack*target,int mastery,BattleSide currentSide,BattleSide querySide)
{
 requireXpTimed184Access();if(!actor||!target||mastery<0||mastery>3)throw std::runtime_error("Invalid source Cure37 query");
 const int threshold=xpTimed184ReceptionPercent(battle,actor,target,37,mastery,currentSide,querySide);
 (void)handler;return threshold;
}
inline void removeXpCureCustomNegative(CGameHandler&handler,const CBattleInfoCallback&battle,const battle::Unit&target)
{
 // Explicit existing-bridge compatibility lane, not an original ERA spell slot.
 // Match native Dispel negative/persistent/adventure rules for IDs>81 only.
 std::vector<Bonus> removed;
 const auto sourceBonusList307=target.getBonuses([](const Bonus*b){return b->source==BonusSource::SPELL_EFFECT;});
 for(const auto&b:*sourceBonusList307)
 {
  const auto id=b->sid.as<SpellID>();if(id.getNum()<=81)continue;
  const auto*spell=id.toEntity(LIBRARY->spells());
  if(spell&&spell->isNegative()&&!spell->isPersistent()&&!spell->isAdventure())removed.push_back(*b);
 }
 if(!removed.empty()){SetStackEffect packet;packet.battleID=battle.getBattle()->getBattleID();packet.toRemove.emplace_back(target.unitId(),removed);handler.sendAndApply(packet);}
}
inline void castXpCureSingle(CGameHandler&handler,const CBattleInfoCallback&battle,
 const CStack*actor,const CStack*target,int power,int mastery,BattleSide currentSide)
{
 requireXpTimed184Access();if(!target||!target->alive()||!xpTimed184Access->removeCanonicalCounter)throw std::runtime_error("Source Cure37 lifecycle unavailable");
 const int flat=mastery>=3?30:(mastery==2?20:10);
 const int amount=era_bridge::xp184::add(era_bridge::xp184::signed32(std::uint32_t(power)*5u),flat);
 if(amount<0)throw std::runtime_error("Source Cure37 negative wrapped heal requires a separately validated health domain");
 std::vector<Bonus> poisonHealth;
 const auto sourceBonusList323=target->getBonuses(Selector::source(BonusSource::SPELL_EFFECT,BonusSourceID(SpellID(71))).And(Selector::type()(BonusType::STACK_HEALTH)));
 for(const auto&b:*sourceBonusList323)
 {
  if(b->valType!=BonusValueType::PERCENT_TO_ALL||!era_bridge::sourcePoisonPercentSupported(-b->val)||!era_compat::sourceStatusUsesProfile(*target))throw std::runtime_error("Source Cure37 cannot reinterpret foreign Poison health arithmetic");
  poisonHealth.push_back(*b);
 }
 //446220 resets4A4 before its negative-slot loop, preserving current wounds
 // through the existing source-profile maximum-health reconciliation.
 if(!poisonHealth.empty()){SetStackEffect clear;clear.battleID=battle.getBattle()->getBattleID();clear.toRemove.emplace_back(target->unitId(),poisonHealth);handler.sendAndApply(clear);}
 cureXpTimed(handler,battle,*target,[&](const battle::Unit&unit,int spell){xpTimed184Access->removeCanonicalCounter(unit,spell);});
 removeXpCureCustomNegative(handler,battle,*target);
 auto state=target->acquire();int64_t heal=amount;const int count=state->getCount();state->heal(heal,EHealLevel::HEAL,EHealPower::PERMANENT);
 if(state->getCount()!=count)throw std::runtime_error("Source Cure37 must never resurrect");
 if(heal>0){BattleUnitsChanged packet;packet.battleID=battle.getBattle()->getBattleID();UnitChanges change(state->unitId(),UnitChanges::EOperation::RESET_STATE);change.healthDelta=heal;state->save(change.data);packet.changedStacks.push_back(change);handler.sendAndApply(packet);}
 BattleSpellCast visual;visual.battleID=battle.getBattle()->getBattleID();visual.activeCast=false;visual.side=currentSide;visual.spellID=SpellID(37);visual.tile=target->getPosition();visual.affectedCres.insert(target->unitId());visual.casterStack=actor?actor->unitId():-1;visual.castByHero=false;handler.sendAndApply(visual);
}
inline void castXpCure(CGameHandler&handler,const CBattleInfoCallback&battle,const CStack*actor,
 const CStack*target,int power,int mastery,BattleSide currentSide,BattleSide querySide)
{
 requireXpTimed184Access();
 if(mastery<3){castXpCureSingle(handler,battle,actor,target,power,mastery,currentSide);return;}
 //5A1B30 scans CURRENT physical side only; each eligibility is FLOAT>0,
 // including sub1% values. It never consumes a mass resistance lottery.
 for(const auto*candidate:xpTimed184MassOrder(battle))
 {
  if(candidate->unitSide()!=currentSide||candidate->isHypnotized())continue;
  if(xpTimed184ReceptionPercent(battle,actor,candidate,37,mastery,currentSide,currentSide,true,true)>0)
   castXpCureSingle(handler,battle,actor,candidate,power,mastery,currentSide);
 }
 (void)querySide;
}

}
