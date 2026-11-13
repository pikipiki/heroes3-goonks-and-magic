/* Source Third Upgrade Mod.erm1370..1397, initialized-stack flag only. */
#pragma once
namespace era_bridge
{
inline constexpr bool sourceHydraQueenExcludedType(int sourceId)
{
    return sourceId==63 || sourceId==154 || sourceId==159 || sourceId==221
        || sourceId==224 || sourceId==296 || sourceId==325;
}
inline constexpr bool sourceHydraQueenEligible(bool tower,bool doubleWide,bool breath,int sourceId)
{
    return !tower && !doubleWide && !breath && !sourceHydraQueenExcludedType(sourceId);
}
}
