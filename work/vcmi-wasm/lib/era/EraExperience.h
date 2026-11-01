#pragma once
#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <limits>
#include <stdexcept>

namespace era_bridge
{
struct ExperienceProgression
{
    uint32_t fullRank10;
    uint32_t rank11Extra;
    uint32_t battlePercent;
    float experienceMultiplier;
    float upgradeMultiplier;

    // h3era.exe727b40/727f20, table791e94: last increments are2500/2800.
    static constexpr std::array<uint32_t, 10> increments{{1000,1000,1200,1400,1600,1800,2000,2200,2500,2800}};
    uint64_t maximum() const { return uint64_t(fullRank10) + rank11Extra; }
    uint64_t battleLimit() const { return std::max<uint64_t>(1, uint64_t(fullRank10) * battlePercent / 100); }
    float scale() const { return static_cast<float>(static_cast<double>(fullRank10) / 17500); }
    int rank(uint64_t average) const
    {
        const float divisor = scale();
        if(divisor <= 0.000001)
            return 0;
        float remaining = static_cast<float>((static_cast<double>(average) + 0.00001) / divisor);
        for(size_t i = 0; i < increments.size(); ++i)
        {
            remaining = static_cast<float>(remaining - increments[i]);
            if(remaining < 0)
                return static_cast<int>(i);
        }
        return 10;
    }
    // Useful for presentation; rank() above owns exact source boundary decisions.
    uint64_t threshold(int requestedRank) const
    {
        if(requestedRank <= 0)
            return 0;
        if(requestedRank > 10)
            return maximum();
        uint64_t sum = 0;
        for(int i = 0; i < requestedRank; ++i)
            sum += increments[i];
        return static_cast<uint64_t>((static_cast<double>(sum) + 0.01) * scale());
    }
    uint64_t gain(uint64_t currentAverage, uint64_t requestedPerUnit) const
    {
        if(currentAverage >= maximum())
            return 0;
        // CREXPMOD ExpMult weights army distribution; it is not applied again
        // when consuming an already-distributed per-unit award.
        const double adjusted = static_cast<double>(requestedPerUnit);
        const uint64_t bounded = adjusted >= static_cast<double>(battleLimit())
            ? battleLimit() : static_cast<uint64_t>(adjusted);
        return std::min(maximum() - currentAverage, bounded);
    }
    uint64_t retainOnUpgrade(uint64_t average) const
    {
        return static_cast<uint64_t>(static_cast<double>(average) * upgradeMultiplier);
    }
    uint64_t total(uint64_t average, uint64_t count) const
    {
        if(count && average > std::numeric_limits<uint64_t>::max() / count)
            throw std::overflow_error("ERA experience total overflow");
        return average * count;
    }
};
}
