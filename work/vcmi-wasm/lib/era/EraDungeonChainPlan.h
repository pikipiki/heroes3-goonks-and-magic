/* Original Amethyst Shot type4, source5A6500/5A670A. GPL-2.0-or-later. */
#pragma once
#include <cmath>
#include <cstdint>
#include <limits>
#include <vector>
namespace era_bridge
{
struct DungeonChainCandidate
{
    uint32_t id=0;
    int originalSide=0;
    int x=0,y=0; // Original446380/446350 sprite centres, not hex distance.
};
inline int dungeonChainDistance(const DungeonChainCandidate & a,const DungeonChainCandidate & b)
{
    const int64_t dx=int64_t(a.x)-b.x,dy=int64_t(a.y)-b.y;
    return int(std::sqrt(double(dx*dx+dy*dy)));
}
// 'candidates' is ORIGINAL side0 slots ascending, then side1 slots ascending.
// Accuracy is deliberately evaluated before distance, even for farther targets.
// It must reproduce spell19 accuracy and its mandatory1..100 draw at0/100.
template<class Accuracy>
inline const DungeonChainCandidate * dungeonChainNext(
    const DungeonChainCandidate & previous,const std::vector<DungeonChainCandidate> & candidates,
    const std::vector<uint32_t> & visited,Accuracy && accuracy)
{
    const DungeonChainCandidate * next=nullptr;
    int nearest=std::numeric_limits<int>::max();
    for(const auto & candidate:candidates)
    {
        bool hit=false;for(const auto id:visited)if(id==candidate.id){hit=true;break;}
        if(hit || !accuracy(candidate))continue;
        const int distance=dungeonChainDistance(previous,candidate);
        if(distance<nearest){nearest=distance;next=&candidate;}
    }
    return next;
}
inline int32_t dungeonChainSigned32(uint32_t value)
{return value<0x80000000u?int32_t(value):int32_t(int64_t(value)-0x100000000LL);}
inline int32_t dungeonChainRaw(uint32_t count,uint32_t perCreature)
{return dungeonChainSigned32(count*perCreature);}
inline int32_t dungeonChainAdd(int32_t total,int32_t damage)
{return dungeonChainSigned32(uint32_t(total)+uint32_t(damage));}
inline int64_t dungeonChainHalf(int64_t damage)
{return damage>=0?damage/2:-((-damage+1)/2);} //Win32 SAR rounds negative odd values down.
// Original friendly skip returns into hex scanning with ECX=CombatManager+1.
// The remaining iterations therefore miss all187 hexes: terminate the chain.
inline bool dungeonChainContinues(const DungeonChainCandidate & previous,const DungeonChainCandidate & next)
{return previous.originalSide==next.originalSide;}
// The original second443DB0 pass receives EAX after void LeaveCriticalSection.
// It has no defined ABI value. The documented compatibility policy fixes it0.
inline constexpr int dungeonChainUndefinedSecondPassDamage=0;
}
