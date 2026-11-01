/* Per-sequence marker semantics from original target+EC; GPL-2.0-or-later. */
#pragma once
#include <cstdint>
#include <map>
#include <optional>
namespace era_bridge
{
class PetrificationPending
{
    struct Marker { uint32_t source; int spell; };
    std::map<uint32_t, Marker> markers;
public:
    static constexpr bool succeeds(int oneToHundred) { return oneToHundred >= 1 && oneToHundred <= 20; }
    void mark(uint32_t target, uint32_t source) { markers[target] = {source, 70}; }
    std::optional<uint32_t> source(uint32_t target) const
    {
        const auto found = markers.find(target);
        return found == markers.end() ? std::nullopt : std::optional<uint32_t>(found->second.source);
    }
    void markSpell(uint32_t target, uint32_t source, int spell) { markers[target] = {source, spell}; }
    int spell(uint32_t target) const { return markers.at(target).spell; }
    void clear() { markers.clear(); }
};
}
