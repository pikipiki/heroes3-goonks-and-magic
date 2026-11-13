/* Optional generic45 interop. Does not enroll battles or alter native casts. */
#pragma once
#include "EraWeakness45Rule.h"
#include "EraSourceCreatureLevels.h"
namespace era_bridge
{
inline int weakness45NativePeculiarBonus(int nativeTier)
{
 nativeTier=std::max(nativeTier,1);
 return nativeTier<=2?3:nativeTier<=4?2:nativeTier<=6?1:0;
}
struct Weakness45GenericMagnitude
{
 // Already converted/modified native PRIMARY_ATTACK bonus, including custom
 // ADD_VALUE/FIXED_VALUE. Negative bonus means positive source attack loss.
 std::int32_t nativeBonus=0;
 std::string_view targetKey,heroKey;
 int nativeTargetTier=0,casterKind=1;
 bool nativePeculiarApplied=false,nativeFixedValueApplied=false;
};
inline std::int32_t weakness45GenericMagnitude(const Weakness45GenericMagnitude & in)
{
 std::int32_t bonus=in.nativeBonus;
 const bool originalHero=in.heroKey=="core:mirlanda"||in.heroKey=="core:olema";
 // A custom FIXED_VALUE overrides peculiar specialties in native Timed.
 // Preserve that explicit extension. Other/custom heroes retain native rules.
 if(originalHero&&!in.nativeFixedValueApplied)
 {
  const auto sourceId=sourceCreatureIdForLevel(in.targetKey);
  if(sourceId)
  {
   const auto level=sourceInitialCreatureLevel(*sourceId);
   if(!level)throw std::invalid_argument("Disabled/unobserved source level in specialty45");
   const auto desired=sourceSpecialty45Bonus(*level,in.casterKind);
   if(!desired)throw std::invalid_argument("Unproven source specialty45 table index");
   const int old=in.nativePeculiarApplied?weakness45NativePeculiarBonus(in.nativeTargetTier):0;
   bonus=weakness45Add(bonus,old-*desired);
  }
  // Unknown Goonk target keys deliberately keep the exact native specialty.
 }
 return weakness45Negate(bonus);
}
inline Weakness45Change weakness45ApplyGeneric(Weakness45State state,
 std::int32_t storedAttack,std::int32_t duration,int mastery,std::int32_t magnitude)
{
 if(magnitude>=0)return weakness45Apply(state,storedAttack,duration,mastery,magnitude);
 // Explicit native custom extension: a FIXED/ADD_VALUE can turn Weakness into
 // an attack gain. Keep its signed value; original canonical descriptors are
 // always3/6 plus a bounded nonnegative original specialty.
 if(mastery<0||mastery>3)throw std::invalid_argument("Invalid generic45 mastery");
 if(state.duration>0){state.duration=std::max(state.duration,duration);state.mastery=std::max(state.mastery,mastery);return{state,0,false,true,false};}
 state.duration=duration;state.mastery=mastery;state.magnitude=std::min(storedAttack,magnitude);
 if(duration<=0){state.permanentLoss=weakness45Add(state.permanentLoss,state.magnitude);++state.unremovableApplications;}
 return{state,weakness45Negate(state.magnitude),true,false,false};
}
}
