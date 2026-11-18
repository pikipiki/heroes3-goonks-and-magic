#pragma once

namespace era_bridge::map_rules
{
inline constexpr bool removeInitialFortifications(bool enabled,bool preserveAi,bool hasOwner,bool ownerIsHuman)
{return enabled&&(!preserveAi||!hasOwner||ownerIsHuman);}
}
