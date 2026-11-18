#pragma once

namespace era_bridge::mithril
{
// Script42 captures36,149,170,171 in this order. Source36 forces149
// before149 is captured; source170 forces it after that capture.
inline constexpr bool displaySnapshot(bool configured149,bool enabled36)
{return configured149||enabled36;}
inline constexpr bool displayLiveOption(bool captured149,bool enabled170)
{return captured149||enabled170;}
inline constexpr int displayPlural(int amount)
{return amount<=1?0:1;}
}
