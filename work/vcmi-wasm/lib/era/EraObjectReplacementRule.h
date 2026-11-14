/* TUM original day-one replacements; portable ordered execution rules. */
#pragma once
#include <cstdint>
#include <limits>
#include <stdexcept>
#include <string>
#include <vector>

namespace era_bridge
{
struct ReplacementPosition
{
    int x = -1;
    int y = 0;
    int z = 0;
};

inline bool replacementPositionBefore(const ReplacementPosition & a, const ReplacementPosition & b)
{
    if(a.z != b.z) return a.z < b.z;
    if(a.y != b.y) return a.y < b.y;
    return a.x < b.x;
}

struct ObjectReplacementRule
{
    int slot = 0;
    int sourceType = -1;
    int sourceSubtype = -1;
    int nativeSourceType = -1;
    int nativeSourceSubtype = -1;
    int percentage = 0;
    int xOffset = 0;
};

struct ObjectReplacementPlan
{
    std::string sourceKey;
    std::string parameterId;
    int targetType = -1;
    int targetSubtype = -1;
    int nativeTargetType = -1;
    int nativeTargetSubtype = -1;
    bool enabled = false;
    bool allowRandomMap = false;
    int functionMultiplicity = 1;
    std::vector<ObjectReplacementRule> rules;
};

struct ObjectReplacementResult
{
    std::uint64_t draws = 0;
    std::uint64_t replaced = 0;
};

// Adapter preserves coordinate scanning, including later objects created by
// earlier slots. Count is captured once per source type / slot, not per match.
// A failed UN:U leaves its coordinate variables unchanged; RNG is still drawn.
template<typename Adapter>
ObjectReplacementResult runObjectReplacements(const std::vector<ObjectReplacementPlan> & plans,
    Adapter & adapter, bool firstDay, bool randomMap)
{
    ObjectReplacementResult result;
    if(!firstDay) return result;
    for(const auto & plan : plans)
    {
        if(!plan.enabled || (randomMap && !plan.allowRandomMap)) continue;
        for(const auto & rule : plan.rules)
        {
            if(rule.sourceType < 0 || rule.sourceSubtype < 0 || rule.percentage <= 0) continue;
            if(rule.percentage > 100 || plan.functionMultiplicity < 1 || plan.functionMultiplicity > 2)
                throw std::invalid_argument("Invalid original object replacement rule");
            const auto count = adapter.countType(rule.nativeSourceType);
            ReplacementPosition cursor;
            for(std::uint64_t index = 0; index < count; ++index)
            {
                for(int function = 0; function < plan.functionMultiplicity; ++function)
                {
                    const auto next = adapter.findNextType(rule.nativeSourceType, cursor);
                    if(next) cursor = *next;
                    const int roll = adapter.randomInt(0,99);
                    if(roll < 0 || roll > 99) throw std::runtime_error("Invalid original replacement RNG");
                    ++result.draws;
                    if(roll >= rule.percentage) continue;
                    if(!adapter.matches(cursor,rule.nativeSourceType,rule.nativeSourceSubtype)) continue;
                    const auto shiftedX = static_cast<std::int64_t>(cursor.x) + rule.xOffset;
                    if(shiftedX < 0 || shiftedX >= adapter.width()) continue;
                    auto position = cursor;
                    position.x = static_cast<int>(shiftedX);
                    adapter.replace(cursor,position,plan);
                    cursor = position;
                    ++result.replaced;
                }
            }
        }
    }
    return result;
}
}
