/* Source fear predicates and CRT output law; GPL-2.0-or-later. */
#pragma once
#include <stdexcept>
#include <vector>

namespace era_bridge
{
enum class SourceFearRoute { NativeFallback, NoFear, CrtOutput };
struct SourceFearTarget
{
    bool alive;
    int physicalSide;
    bool hypnotized;
    bool nativeNoMoraleEquivalent;
    bool nativeZeroMinimum;
};
struct SourceFearProducer
{
    bool registered;
    bool alive;
    int physicalSide;
    bool canonicalMarkedAura;
    int rank;
    int firstRank;
};
// 464958..464977 inverts only the hypnotized TARGET. Fear2 scans physical
// enemy-side stack storage; an emitter's own hypnosis does not move that slot.
inline SourceFearRoute planSourceFear(const SourceFearTarget & target,
    const std::vector<SourceFearProducer> & producers, bool foreignFearEffect,
    bool registeredAuraEffectPresent = false)
{
    bool optedInBattle = registeredAuraEffectPresent;
    for(const auto & producer : producers)
        optedInBattle |= producer.registered;
    if(!optedInBattle || foreignFearEffect)
        return SourceFearRoute::NativeFallback;
    if(!target.alive || target.nativeNoMoraleEquivalent || target.nativeZeroMinimum)
        return SourceFearRoute::NoFear;
    const int effectiveTargetSide = target.hypnotized ? 1 - target.physicalSide : target.physicalSide;
    for(const auto & producer : producers)
        if(producer.registered && producer.alive && producer.canonicalMarkedAura
            && producer.physicalSide != effectiveTargetSide && producer.rank >= producer.firstRank)
            return SourceFearRoute::CrtOutput;
    return SourceFearRoute::NoFear;
}
inline bool sourceFearFromCrtOutput(int output)
{
    if(output < 0 || output > 32767)
        throw std::invalid_argument("ERA fear requires a CRT output in0..32767");
    return output % 10 == 0;
}
template<class Draw>
bool executeSourceFear(SourceFearRoute route, Draw && draw)
{
    // No seed allocation, random draw or state update when a source gate fails.
    return route == SourceFearRoute::CrtOutput && sourceFearFromCrtOutput(draw());
}
}
