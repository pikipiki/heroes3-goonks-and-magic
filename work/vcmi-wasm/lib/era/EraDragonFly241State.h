/* Private SDK codec: source241 direct78 exact owned spell-effect removal. */
#pragma once
#include "EraDragonFly241Rule.h"
#include "EraXpTimed184State.h"
#include "../CStack.h"
#include "../bonuses/BonusList.h"
#include "../bonuses/BonusParameters.h"
#include "../bonuses/BonusSelector.h"
#include "../spells/CSpellHandler.h"
#include "../networkPacks/SetStackEffect.h"
#include <optional>
#include <string_view>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
inline constexpr std::string_view dragonFly241RemovePrefix=era_bridge::dragonFly241PacketPrefix;
struct DragonFly241SpellKey{int id;const char * key;bool timed;};
// Definition is preserved. A future private BAP filter may suppress ONLY this
// owned native copy after direct78 has run, never banner/artifact/other actors.
inline bool dragonFly241OwnedNativeDispel(const Bonus & bonus,CreatureID nativeActor)
{
 if(bonus.type!=BonusType::SPELL_AFTER_ATTACK||bonus.subtype!=BonusSubtypeID(SpellID(78))
     ||bonus.source!=BonusSource::CREATURE_ABILITY||bonus.sid!=BonusSourceID(nativeActor)
     ||bonus.val!=100||!bonus.parameters||bonus.duration!=BonusDuration::PERMANENT
     ||bonus.valType!=BonusValueType::ADDITIVE_VALUE||bonus.effectRange!=BonusLimitEffect::NO_LIMIT
     ||!bonus.stacking.empty()||bonus.limiter||bonus.propagator||bonus.updater||bonus.propagationUpdater)return false;
 // Current JsonBonus expands JSON[1,0] to[1,0,0] (missing layer→null→0).
 // Old serialized addInfo may retain two values. Treat that one bounded legacy
 // representation as layer0, avoiding the old unchecked vector[2] access.
 try{const auto & p=bonus.parameters->toVector();return p==std::vector<int32_t>{1,0,0}||p==std::vector<int32_t>{1,0};}
 catch(const std::runtime_error &){return false;}
}
inline constexpr std::array<DragonFly241SpellKey,26> dragonFly241SpellKeys{{
 {27,"core:shield",true},{28,"core:airShield",true},{29,"core:fireShield",true},
 {30,"core:protectAir",true},{31,"core:protectFire",true},
 {32,"core:protectWater",true},{33,"core:protectEarth",true},
 {34,"core:antiMagic",true},{36,"core:magicMirror",true},
 {37,"core:cure",false},{38,"core:resurrection",false},{39,"core:animateDead",false},
 {40,"core:sacrifice",false},{41,"core:bless",true},{43,"core:bloodlust",true},
 {44,"core:precision",true},{46,"core:stoneSkin",true},{48,"core:prayer",true},
 {49,"core:mirth",true},{51,"core:fortune",true},{53,"core:haste",true},
 {55,"core:slayer",true},{56,"core:frenzy",true},{58,"core:counterstrike",true},
 {63,"core:teleport",false},{65,"core:clone",false}}};
inline bool dragonFly241RemovalRequest(const Bonus & bonus)
{return bonus.stacking.compare(0,dragonFly241RemovePrefix.size(),dragonFly241RemovePrefix)==0;}
inline bool dragonFly241CanonicalShape(const Bonus & bonus)
{
 // Current core timed spell effects have no arbitrary variant/limiter/updater.
 // Reject such foreign modifications rather than serialize parameters through
 // BonusParameters::toJsonNode (currently TODO/null in this SDK).
 return bonus.source==BonusSource::SPELL_EFFECT&&!bonus.parameters&&!bonus.limiter
     &&!bonus.propagator&&!bonus.updater&&!bonus.propagationUpdater
     &&(bonus.duration==BonusDuration::N_TURNS||bonus.duration==BonusDuration::UNTIL_ATTACK);
}
inline bool dragonFly241EffectType(int spell,const Bonus & bonus)
{
 switch(spell)
 {
 case 27:case 28:return bonus.type==BonusType::GENERAL_DAMAGE_REDUCTION;
 case 29:return bonus.type==BonusType::FIRE_SHIELD;
 case 30:case 31:case 32:case 33:return bonus.type==BonusType::SPELL_DAMAGE_REDUCTION;
 case 34:return bonus.type==BonusType::LEVEL_SPELL_IMMUNITY;
 case 36:return bonus.type==BonusType::MAGIC_MIRROR;
 case 41:return bonus.type==BonusType::ALWAYS_MAXIMUM_DAMAGE;
 case 43:case 44:case 46:return bonus.type==BonusType::PRIMARY_SKILL;
 case 48:return bonus.type==BonusType::PRIMARY_SKILL||bonus.type==BonusType::STACKS_SPEED;
 case 49:return bonus.type==BonusType::MORALE;
 case 51:return bonus.type==BonusType::LUCK;
 case 53:return bonus.type==BonusType::STACKS_SPEED;
 case 55:return bonus.type==BonusType::SLAYER;
 case 56:return bonus.type==BonusType::IN_FRENZY;
 case 58:return bonus.type==BonusType::ADDITIONAL_RETALIATION;
 default:return false;
 }
}
// Future optional BattleInfo::removeUnitBonus guard. AND with original selector.
// Packet-only prefix identifies exact removal; candidate bonus is never tagged.
inline std::optional<bool> dragonFly241RemovalIdentity(const Bonus & request,const Bonus & candidate)
{
 if(!dragonFly241RemovalRequest(request))return std::nullopt;
 const auto id=request.sid.as<SpellID>().num;
 const auto slot=std::find_if(dragonFly241SpellKeys.begin(),dragonFly241SpellKeys.end(),
     [id](const auto & entry){return entry.id==id&&entry.timed;});
 if(slot==dragonFly241SpellKeys.end()||request.turnsRemain<=0
     ||!dragonFly241CanonicalShape(request)||!dragonFly241CanonicalShape(candidate)
     ||!dragonFly241EffectType(id,request)||!dragonFly241EffectType(id,candidate))return false;
 return era_bridge::dragonFly241PacketIdentity(request.stacking,request.turnsRemain,candidate.stacking,candidate.turnsRemain).value_or(false)
     &&request.targetSourceType==candidate.targetSourceType
     &&request.bonusOwner==candidate.bonusOwner&&request.hidden==candidate.hidden;
}
struct DragonFly241NativeEffects
{
 std::array<int,81> durations{};
 std::array<std::vector<Bonus>,81> effects;
 std::array<std::optional<XpTimed184Snapshot>,81> typed;
};
inline DragonFly241NativeEffects captureDragonFly241Effects(const CStack & target)
{
 DragonFly241NativeEffects result;
 for(const auto & slot:dragonFly241SpellKeys)
 {
     const auto * spell=SpellID(slot.id).toSpell();
     if(!spell||spell->getJsonKey()!=slot.key)throw std::runtime_error("Source241 core spell identity changed");
     if(slot.id==49||slot.id==51)
     {
         const auto typed=readXpTimed184(target,slot.id);
         if(typed.owned){result.typed[slot.id]=typed;result.durations[slot.id]=typed.state.duration;}
     }
     const auto bonuses=target.getBonuses(Selector::source(BonusSource::SPELL_EFFECT,BonusSourceID(SpellID(slot.id))));
     std::optional<int> duration;
     for(const auto & bonus:*bonuses)
     {
         // OriginalClone65 initializes all81 timed slots to0 (43D313..330),
         // then writes lifetime separately to+2C at5A71BB. Native stores that
         // separate lifetime as NONE/SPELL_EFFECT65. It is NOT source slot65.
         if(slot.id==65&&target.isClone()&&bonus->type==BonusType::NONE&&bonus->val==0
             &&bonus->duration==BonusDuration::N_TURNS&&!bonus->parameters&&!bonus->limiter
             &&!bonus->propagator&&!bonus->updater&&!bonus->propagationUpdater)continue;
         // Zero-duration/permanent custom native effects are outside the source
         // duration projection and remain intact. Negative timed durations are
         // query-visible, but cannot be removed by444230.
         if(bonus->turnsRemain==0||((slot.id==49||slot.id==51)&&xpTimed184Owned(*bonus,slot.id)))continue;
         if(!slot.timed||!dragonFly241CanonicalShape(*bonus)||!dragonFly241EffectType(slot.id,*bonus))
             throw std::runtime_error("Unreviewed source241 positive spell projection");
         const auto local=target.getFirstBonus(CSelector([ptr=bonus.get()](const Bonus * b){return b==ptr;}));
         if(!local)throw std::runtime_error("Inherited source241 spell effect not reconciled");
         if(duration&&*duration!=bonus->turnsRemain)throw std::runtime_error("Ambiguous source241 spell duration");
         duration=bonus->turnsRemain;result.effects[slot.id].push_back(*bonus);
     }
     if(!result.typed[slot.id])result.durations[slot.id]=duration.value_or(0);
 }
 // Custom Goonk spells outside these26 canonical IDs are never selected.
 return result;
}
inline SetStackEffect dragonFly241RemovalPacket(BattleID battle,const CStack & target,
    const DragonFly241NativeEffects & captured,const std::vector<int> & removed)
{
 SetStackEffect packet;packet.battleID=battle;std::vector<Bonus> effects;
 for(int spell:removed)
 {
     if(spell<10||spell>=70||captured.durations[spell]<=0)throw std::runtime_error("Invalid source241 positive removal");
     if(captured.typed[spell])
     {
         const auto & old=*captured.typed[spell];
         auto typed=xpTimed184Packet(battle,target,old,era_bridge::xp184::remove(old.state).state);
         packet.toRemove.insert(packet.toRemove.end(),typed.toRemove.begin(),typed.toRemove.end());
         packet.toAdd.insert(packet.toAdd.end(),typed.toAdd.begin(),typed.toAdd.end());
     }
     for(auto effect:captured.effects[spell])
     {effect.stacking=std::string(dragonFly241RemovePrefix)+effect.stacking;effects.push_back(std::move(effect));}
 }
 if(!effects.empty())packet.toRemove.emplace_back(target.unitId(),std::move(effects));
 return packet;
}
// Future optional BattleInfo::removeUnitBonus prelude, invoked on BOTH sides.
// Preserve58's already available counters this round; CRetaliations resets next
// round. Original444230 clears duration58 only, never current count+454.
inline void dragonFly241BeforeRemoval(CStack & target,const std::vector<Bonus> & requested)
{
 if(std::any_of(requested.begin(),requested.end(),[](const Bonus & bonus)
     {return dragonFly241RemovalRequest(bonus)&&bonus.sid==BonusSourceID(SpellID(58))
         &&bonus.turnsRemain>0&&dragonFly241CanonicalShape(bonus)&&dragonFly241EffectType(58,bonus);}))
     target.counterAttacks.preserveCapacityBeforeSourceDispel();
}
}
VCMI_LIB_NAMESPACE_END
