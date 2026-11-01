#pragma once
namespace era_bridge
{
// Source43FCD7 always accepts centerindex6; other six require ALIVEbit4.
inline constexpr bool deathCloudTarget(bool alive, bool isCenter, bool sourceLiving)
{
    return alive && (isCenter || sourceLiving);
}
}
