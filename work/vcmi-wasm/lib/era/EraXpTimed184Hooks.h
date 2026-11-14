#pragma once
#include "EraXpTimed184Canonical.h"
#include "EraXpTimed184Lifecycle.h"
#include "../spells/ISpellMechanics.h"
#include "../battle/CBattleInfoCallback.h"
#include "../battle/IBattleState.h"
#include "../mapObjects/CGHeroInstance.h"
#include "../entities/hero/CHero.h"
#include <vcmi/ServerCallback.h>
#include <functional>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
// Installed by Root's strict XP43 envelope. No DEFEND enrollment dependency.
struct XpTimed184NativeAccess
{
 bool admitted=false;
 bool allowSorceressForgetfulness=false;
 std::function<bool(const spells::Mechanics&,const battle::Unit&)> originalApplication;
 std::function<int(const battle::Unit&)> storedAttack,storedDefense;
 std::function<bool(const battle::Unit&,int,const std::vector<Bonus>&)> preserveNativeCoexistence;
};
inline thread_local const XpTimed184NativeAccess*xpTimed184NativeAccess=nullptr;
class XpTimed184NativeAccessScope
{
 const XpTimed184NativeAccess*previous;
public:
 explicit XpTimed184NativeAccessScope(const XpTimed184NativeAccess&a):previous(xpTimed184NativeAccess){xpTimed184NativeAccess=&a;}
 ~XpTimed184NativeAccessScope(){xpTimed184NativeAccess=previous;}
 XpTimed184NativeAccessScope(const XpTimed184NativeAccessScope&)=delete;
 XpTimed184NativeAccessScope&operator=(const XpTimed184NativeAccessScope&)=delete;
};
inline bool applyNativeXpTimed184(ServerCallback*server,const spells::Mechanics*m,const battle::Unit&target,
 const std::vector<Bonus>&nativeBuffer,int duration)
{
 const auto*access=xpTimed184NativeAccess;const int spell=m->getSpellIndex();
 if(!access||!access->admitted||!access->originalApplication||!access->originalApplication(*m,target)||!era_bridge::xp184::supports(spell))return false;
 if(spell==61&&!access->allowSorceressForgetfulness&&!readXpTimed184(target,61).owned)return false;
 XpTimed184OriginalApplication proof;proof.originalProviderObserved=true;proof.mastery=m->getEffectLevel();proof.remainingDuration=duration;proof.nativeDuration=duration;
 if(spell==59)proof.remainingDuration=255;
 if(spell==73)
 {
  if(!access->storedAttack||!access->storedDefense)throw std::runtime_error("Source nativeDisease73 raw readers missing");
  proof.rawAttackBefore=access->storedAttack(target);proof.rawDefenseBefore=access->storedDefense(target);
 }
 // Shape validation uses positive duration only to compare the original native
 // descriptor; fresh application below still preserves exact duration0/negative.
 auto shapeProof=proof;shapeProof.remainingDuration=std::max(1,proof.remainingDuration);
 auto shape=canonicalXpTimed184State(spell,nativeBuffer,shapeProof,target.hasBonusOfType(BonusType::SIEGE_WEAPON));
 bool fixedFortune=false;
 if(!shape&&spell==51&&nativeBuffer.size()==1)
 {
  const auto*hero=m->caster->getHeroCaster();const auto key=hero?hero->getHeroType()->getJsonKey():std::string{};
  const auto&b=nativeBuffer.front();
  fixedFortune=(key=="core:melodia"||key=="core:daremyth")&&b.type==BonusType::LUCK&&b.val==3&&b.source==BonusSource::SPELL_EFFECT&&b.sid==BonusSourceID(SpellID(51))&&b.valType==BonusValueType::ADDITIVE_VALUE&&b.effectRange==BonusLimitEffect::NO_LIMIT&&!b.parameters&&!b.limiter&&!b.updater;
 }
 if(!shape&&!fixedFortune)return false; // modified/custom descriptor retains native path
 const auto old=readXpTimed184(target,spell);
 if(old.foreign&&(!access->preserveNativeCoexistence||!access->preserveNativeCoexistence(target,spell,old.foreignBonuses)))throw std::runtime_error("Unreconciled original/native timed state at source application");
 auto change=era_bridge::xp184::cast(old.state,spell,duration,m->getEffectLevel(),proof.rawAttackBefore.value_or(0),proof.rawDefenseBefore.value_or(0),target.hasBonusOfType(BonusType::SIEGE_WEAPON));
 if(change.fresh&&fixedFortune)change.state.magnitude=3; //4E62CA:3-oldMagnitude
 auto packet=xpTimed184Packet(m->battle()->getBattle()->getBattleID(),target,old,change.state);server->apply(packet);return true;
}
inline bool consumeNativeXpTimed184Counter(ServerCallback*server,const spells::Mechanics&m,
 const battle::Unit&target,int existingSpell)
{
 if(!era_bridge::xp184::supports(existingSpell))return false;
 const auto old=readXpTimed184(target,existingSpell);if(!old.owned)return false;
 const bool original=xpTimed184NativeAccess&&xpTimed184NativeAccess->admitted&&xpTimed184NativeAccess->originalApplication&&xpTimed184NativeAccess->originalApplication(m,target);
 if(!original||!era_bridge::xp184::originalMutualCounterIgnored(m.getSpellIndex(),existingSpell))
  if(auto packet=removeXpTimed184Packet(m.battle()->getBattle()->getBattleID(),target,existingSpell))server->apply(*packet);
 return true;
}
inline bool consumeNativeXpTimed184Dispel(ServerCallback*server,const spells::Mechanics&m,
 const battle::Unit&target,int spell,bool positive,bool negative,bool neutral)
{
 if(!era_bridge::xp184::supports(spell))return false;
 const auto old=readXpTimed184(target,spell);if(!old.owned)return false;
 // Caller already selected this bonus via native immunity/polarity/persistence.
 // Typed source removal refuses nonpositive duration without losing its marker.
 const bool selected=era_bridge::xp184::positive(spell)?positive:negative;
 if(selected)if(auto packet=removeXpTimed184Packet(m.battle()->getBattle()->getBattleID(),target,spell))server->apply(*packet);
 (void)neutral;return true;
}
}
VCMI_LIB_NAMESPACE_END
