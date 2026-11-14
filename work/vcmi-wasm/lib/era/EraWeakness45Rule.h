/* Original444610/444885/444230/446E40. Battle-local optional source45 state. */
#pragma once
#include <cstdint>
#include <algorithm>
#include <stdexcept>
#include <string_view>
#include <vector>
#include <optional>
namespace era_bridge
{
inline bool weakness45OwnedTag(std::string_view tag)
{return tag=="eraSourceWeakness45:state:v1"||tag=="eraSourceWeakness45:loss:v1"||tag=="eraSourceWeakness45:visible:v1";}
// Additional identity guard, never a replacement for the ordinary native bonus
// selector. Protect both directions: our removals must not erase Goonk bonuses,
// and an unrelated OTHER/ATTACK/0 removal must not erase our serialized state.
inline std::optional<bool> weakness45RemovalIdentity(std::string_view requested,
    const std::vector<std::int32_t> & requestedParameters,int requestedTurns,
    std::string_view candidate,const std::vector<std::int32_t> & candidateParameters,int candidateTurns)
{
    if(!weakness45OwnedTag(requested)&&!weakness45OwnedTag(candidate))return std::nullopt;
    return requested==candidate&&requestedParameters==candidateParameters&&requestedTurns==candidateTurns;
}
inline std::int32_t weakness45Signed(std::uint32_t value)
{return value<0x80000000u?static_cast<std::int32_t>(value):static_cast<std::int32_t>(std::int64_t(value)-0x100000000LL);}
inline std::int32_t weakness45Add(std::int32_t a,std::int32_t b)
{return weakness45Signed(std::uint32_t(a)+std::uint32_t(b));}
inline std::int32_t weakness45Negate(std::int32_t a)
{return weakness45Signed(0u-std::uint32_t(a));}
struct Weakness45State
{
    std::int32_t duration=0;
    int mastery=0;
    std::int32_t magnitude=0;
    // Zero/negative-duration applications are already subtracted from C8 but
    // cannot be removed by444230. A later positive application does not erase it.
    std::int32_t permanentLoss=0;
    std::uint32_t unremovableApplications=0;
    std::int32_t totalLoss()const
    {return weakness45Add(permanentLoss,duration>0?magnitude:0);}
    std::uint32_t sourceApplicationCount()const{return unremovableApplications+(duration>0?1u:0u);}
    bool removalAllowed()const{return duration>0;}
    bool durationScanVisible()const{return duration!=0;}
};
struct Weakness45Change
{
    Weakness45State state;
    std::int32_t attackDelta=0;
    bool newApplication=false,refreshed=false,removed=false;
};
inline std::int32_t weakness45AttackAfterLoss(std::int32_t nativeWithoutOwnedLoss,const Weakness45State & state)
{return weakness45Add(nativeWithoutOwnedLoss,weakness45Negate(state.totalLoss()));}
inline Weakness45Change weakness45Apply(Weakness45State state,std::int32_t storedAttack,
    std::int32_t power,int mastery,std::int32_t descriptorMagnitude)
{
    if(mastery<0||mastery>3||descriptorMagnitude<0)throw std::invalid_argument("Source45 verified mastery/magnitude required");
    if(state.duration>0)
    {
        state.duration=std::max(state.duration,power);state.mastery=std::max(state.mastery,mastery);
        //444694 updates stored mastery but returns before444885 magnitude.
        return{state,0,false,true,false};
    }
    state.duration=power;state.mastery=mastery;
    state.magnitude=std::min(storedAttack,descriptorMagnitude);
    if(power<=0)
    {
        state.permanentLoss=weakness45Add(state.permanentLoss,state.magnitude);
        ++state.unremovableApplications;
    }
    return{state,weakness45Negate(state.magnitude),true,false,false};
}
inline Weakness45Change weakness45Remove(Weakness45State state)
{
    if(state.duration<=0)return{state};
    state.duration=0;return{state,state.magnitude,false,false,true};
}
inline Weakness45Change weakness45Round(Weakness45State state,bool alive,bool tacticsPhase)
{
    if(!alive||tacticsPhase||state.duration<=0)return{state};
    if(state.duration==1)return weakness45Remove(state);
    --state.duration;return{state};
}
// Weakness changes stored base attack C8, not Bloodlust/Precision's separate
// melee/ranged components. Neither application nor refresh removes Bloodlust.
inline int weakness45XpMagnitude(char sourceCode,int sourceId)
{
    if(sourceCode=='J'&&(sourceId==60||sourceId==261))return 6;
    // Reviewed dwelling XP rows p276/p284 use mastery3; pinned SPTRAITS45[3]=6.
    if(sourceCode=='p'&&(sourceId==276||sourceId==284))return 6;
    if(sourceCode=='k'&&sourceId==241)return 3;
    throw std::invalid_argument("Unreviewed source45 XP row");
}
}
