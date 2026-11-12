/* Original Amethyst HEX_distance / StrikeAllAround_can_reach.
 * Source and shipped amethyst2_4.dll10015BF0..10015CA5 use floor(pixelD²/4096),
 * not graph hex distance. Preserve the anisotropic boundary at radius1.
 */
#pragma once
namespace era_bridge
{
inline constexpr bool sourceSplashRangeOne(int origin,int destination)
{
    if(origin<0 || origin>=187 || destination<0 || destination>=187)
        return false;
    const int originRow=origin/17,destinationRow=destination/17;
    const int dx=44*(origin%17-destination%17)+(originRow%2==0?22:0)-(destinationRow%2==0?22:0);
    const int dy=42*(originRow-destinationRow);
    return ((dx*dx+dy*dy)>>12)<=1;
}
}
